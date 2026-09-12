import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Part from "./models/Part.js";
import BusinessSettings, {
  getBusinessSettings,
} from "./models/BusinessSettings.js";
import {
  adminAuth,
  createAdminSession,
  revokeAdminSession,
} from "./middleware/adminAuth.js";
import Quote from "./models/Quote.js";
import {
  calculateQuoteTotals,
  isValidLaborItem,
  roundCurrency,
} from "./utils/quoteCalculations.js";
import {
  createBusinessSnapshot,
  normalizeBusinessSettings,
} from "./utils/businessSettings.js";

dotenv.config();

const app = express();

// Production deployments can provide their own comma-separated frontend
// origins while local development remains available on localhost.
const allowedOrigins = (
  process.env.CLIENT_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "100kb" }));

function sendDatabaseError(res, error) {
  // Validation and malformed IDs are client errors; unexpected database
  // failures remain server errors without duplicating this mapping per route.
  const status = error?.status ||
    (error?.name === "ValidationError" || error?.name === "CastError" ? 400 : 500);
  return res.status(status).json({ error: error.message });
}

async function fetchJsonWithTimeout(url, timeoutMs = 10000) {
  // NHTSA is an external dependency. Abort slow requests so our API can return
  // a useful timeout instead of leaving the frontend request open indefinitely.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Vehicle provider returned ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}
  
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.post("/api/admin/login", (req, res) => {
  try {
    const session = createAdminSession(req.body?.password);
    if (!session) {
      return res.status(401).json({ message: "Invalid admin password" });
    }
    return res.json(session);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/session", adminAuth, (req, res) => {
  revokeAdminSession(req.headers.authorization.slice(7));
  res.status(204).end();
});

app.get("/api/admin/session", adminAuth, (_req, res) => {
  res.json({ authenticated: true });
});

// Reading presentation settings is public because the quote workspace needs
// them before an administrator signs in. Updating them remains admin-only.
app.get("/api/settings", async (_req, res) => {
  try {
    return res.json(await getBusinessSettings());
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

app.put("/api/settings", adminAuth, async (req, res) => {
  try {
    const normalized = normalizeBusinessSettings(req.body);
    const settings = await BusinessSettings.findOneAndUpdate(
      { key: "primary" },
      { $set: normalized, $setOnInsert: { key: "primary" } },
      {
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );
    return res.json(settings);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

app.get("/api/parts", async (req, res) => {
  try {
    const parts = await Part.find().sort({ name: 1 });
    res.json(parts);
  } catch (err) {
    sendDatabaseError(res, err);
  }
});

app.post("/api/parts", adminAuth, async (req, res) => {
  try {
    const saved = await Part.create({
      name: req.body.name,
      price: req.body.price,
      quantity: req.body.quantity,
    });
    res.status(201).json(saved);
  } catch (err) {
    sendDatabaseError(res, err);
  }
});

app.put("/api/parts/:id", adminAuth, async (req, res) => {
  try {
    const updatedPart = await Part.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name, price: req.body.price, quantity: req.body.quantity },
      { new: true, runValidators: true }
    );
    if (!updatedPart) {
      return res.status(404).json({ message: "Part not found" });
    }
    return res.json(updatedPart);
  } catch (err) {
    return sendDatabaseError(res, err);
  }
});

app.delete("/api/parts/:id", adminAuth, async (req, res) => {
  try {
    const deletedPart = await Part.findByIdAndDelete(req.params.id);
    if (!deletedPart) {
      return res.status(404).json({ message: "Part not found" });
    }
    return res.json({ message: "Part deleted successfully" });
  } catch (err) {
    return sendDatabaseError(res, err);
  }
});

const PORT = process.env.PORT || 5001;

// Proxy vehicle makes through our server so provider details and timeout
// behavior stay out of the React application.
app.get("/api/vehicles/makes", async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json({ message: "Year is required" });
    }

    const data = await fetchJsonWithTimeout(
      `https://api.nhtsa.gov/products/vehicle/makes?modelYear=${year}&issueType=r`
    );
    return res.json(data.results || []);
  } catch (err) {
    return res.status(err.name === "AbortError" ? 504 : 502).json({
      error: err.name === "AbortError" ? "Vehicle provider timed out" : err.message,
    });
  }
});

// Models depend on both selected year and make; URL encoding also supports
// manufacturers whose names contain spaces or punctuation.
app.get("/api/vehicles/models", async (req, res) => {
  try {
    const { year, make } = req.query;

    if (!year || !make) {
      return res.status(400).json({ message: "Year and make are required" });
    }

    const data = await fetchJsonWithTimeout(
      `https://api.nhtsa.gov/products/vehicle/models?modelYear=${encodeURIComponent(
        year
      )}&make=${encodeURIComponent(make)}&issueType=r`
    );
    return res.json(data.results || []);
  } catch (err) {
    return res.status(err.name === "AbortError" ? 504 : 502).json({
      error: err.name === "AbortError" ? "Vehicle provider timed out" : err.message,
    });
  }
});

// Save an immutable quote snapshot using current inventory data. Client-sent
// part names, prices, totals, and tax are never treated as authoritative.
app.post("/api/quotes", async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const laborItems = Array.isArray(req.body.laborItems)
      ? req.body.laborItems
      : [];

    if (items.length === 0 && laborItems.length === 0) {
      return res
        .status(400)
        .json({ message: "A quote needs at least one part or labor item" });
    }

    if (!laborItems.every(isValidLaborItem)) {
      return res.status(400).json({
        message:
          "Every labor item needs a description, hours above 0, and a valid hourly rate",
      });
    }

    // Re-read every selected part to enforce current price, identity, and
    // available stock even if a caller bypasses or modifies the frontend.
    const cleanItems = await Promise.all(
      items.map(async (item) => {
        const part = await Part.findById(item.partId);
        const requestedQuantity = Number(item.quoteQuantity);
        if (!part) {
          const error = new Error("A selected part no longer exists");
          error.status = 400;
          throw error;
        }
        if (
          !Number.isInteger(requestedQuantity) ||
          requestedQuantity < 1 ||
          requestedQuantity > part.quantity
        ) {
          const error = new Error(
            `Only ${part.quantity} ${part.name} available`
          );
          error.status = 400;
          throw error;
        }
        return {
          partId: part._id,
          name: part.name,
          price: roundCurrency(part.price),
          quoteQuantity: requestedQuantity,
        };
      })
    );
    const cleanLaborItems = laborItems.map((item) => ({
      description: item.description.trim(),
      hours: Number(item.hours),
      hourlyRate: roundCurrency(item.hourlyRate),
      total: roundCurrency(Number(item.hours) * Number(item.hourlyRate)),
    }));
    // Current business rules are authoritative for newly saved quotes.
    const businessSettings = await getBusinessSettings();
    const totals = calculateQuoteTotals({
      items: cleanItems,
      laborItems: cleanLaborItems,
      taxRate: businessSettings.taxRate,
    });
    const quoteNumber = `QT-${Date.now()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const savedQuote = await Quote.create({
      quoteNumber,
      customerName: req.body.customerName || "Walk-in Customer",
      vehicle: req.body.vehicle,
      business: createBusinessSnapshot(businessSettings),
      items: cleanItems,
      laborItems: cleanLaborItems,
      partsSubtotal: totals.partsSubtotal,
      laborTotal: totals.laborTotal,
      subtotal: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      total: totals.grandTotal,
    });
    return res.status(201).json(savedQuote);
  } catch (err) {
    return sendDatabaseError(res, err);
  }
});

// Quote history is restricted because it contains customer information. All
// filtering and pagination happen in MongoDB instead of loading every record.
app.get("/api/quotes", adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );
    const query = {};

    if (req.query.quoteNumber) {
      // Escape user input before using it as a regular expression so symbols
      // are searched literally instead of changing the query pattern.
      query.quoteNumber = {
        $regex: String(req.query.quoteNumber).replace(
          /[.*+?^\${}()|[\]\\]/g,
          "\\$&"
        ),
        $options: "i",
      };
    }
    if (req.query.customer) {
      query.customerName = {
        $regex: String(req.query.customer).replace(/[.*+?^\${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }
    if (req.query.vehicle) {
      const vehicleRegex = {
        $regex: String(req.query.vehicle).replace(/[.*+?^\${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
      query.$or = [
        { "vehicle.year": vehicleRegex },
        { "vehicle.make": vehicleRegex },
        { "vehicle.model": vehicleRegex },
      ];
    }
    if (req.query.from || req.query.to) {
      query.createdAt = {};
      if (req.query.from) {
        query.createdAt.$gte = new Date(`${req.query.from}T00:00:00.000Z`);
      }
      if (req.query.to) {
        query.createdAt.$lte = new Date(`${req.query.to}T23:59:59.999Z`);
      }
    }

    // Fetch the page and its total count together to reduce response time.
    // The hard limit above prevents oversized history responses.
    const [quotes, total] = await Promise.all([
      Quote.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Quote.countDocuments(query),
    ]);
    return res.json({
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    return sendDatabaseError(res, err);
  }
});

app.get("/api/quotes/:id", adminAuth, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }
    return res.json(quote);
  } catch (err) {
    return sendDatabaseError(res, err);
  }
});

async function startServer() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }
  // Begin listening only after MongoDB is reachable; otherwise the API would
  // appear healthy while every database-backed request fails.
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log("MongoDB connected");
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Unable to start server:", error.message);
  process.exitCode = 1;
});

export { app };
