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
import Customer from "./models/Customer.js";
import QuickService from "./models/QuickService.js";
import SupplierPrice from "./models/SupplierPrice.js";
import { DEFAULT_QUICK_SERVICES } from "./data/defaultQuickServices.js";
import {
  calculateQuoteTotals,
  hasPendingPartPrices,
  isValidCustomItem,
  isValidLaborItem,
  normalizeQuoteStatus,
  roundCurrency,
} from "./utils/quoteCalculations.js";
import {
  createBusinessSnapshot,
  normalizeBusinessSettings,
} from "./utils/businessSettings.js";
import {
  findMatchingVehicleIndex,
  normalizeCustomer,
  normalizeCustomerRecord,
  normalizeEmail,
  normalizePhone,
  normalizeVehicle,
} from "./utils/customerRecords.js";
import {
  normalizeQuickService,
  slugifyServiceName,
} from "./utils/quickServices.js";
import { normalizeQuoteNotes } from "./utils/quoteNotes.js";
import {
  normalizeVin,
  normalizeVinDecodeResult,
} from "./utils/vinDecoder.js";
import { normalizePart } from "./utils/parts.js";
import { createRequestRateLimit } from "./middleware/requestRateLimit.js";
import { createDateRangeFilter } from "./utils/queryFilters.js";
import {
  buildSupplierSuggestionQuery,
  buildSupplierPriceQuery,
  buildSupplierPriceImportLookup,
  getSupplierPriceFitmentScore,
  isSupplierPriceVehicleMatch,
  normalizeSupplierPrice,
  normalizeSupplierPriceImport,
  matchSupplierPriceImportRows,
  parseSupplierPricePagination,
  toPublicSupplierSuggestion,
} from "./utils/supplierPrices.js";

dotenv.config();

const app = express();

// Fly Proxy supplies the original client address through one trusted proxy.
// Disabling the framework signature also avoids advertising implementation
// details in every public response.
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Production deployments can provide their own comma-separated frontend
// origins while local development remains available on localhost.
const allowedOrigins = (
  process.env.CLIENT_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
const standardJsonParser = express.json({ limit: "100kb" });
const supplierImportJsonParser = express.json({ limit: "1mb" });

// Regular endpoints retain a small request ceiling. The authenticated CSV
// importer receives a narrowly scoped allowance for its bounded 500-row batch.
app.use((req, res, next) => {
  const parser =
    req.path.startsWith("/api/supplier-prices/import")
      ? supplierImportJsonParser
      : standardJsonParser;
  return parser(req, res, next);
});

// These baseline headers protect both API responses and error messages without
// changing the JSON contract consumed by the React client.
app.use((_req, res, next) => {
  res.set({
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  });
  next();
});

const adminLoginRateLimit = createRequestRateLimit({
  limit: 10,
  windowMs: 15 * 60 * 1000,
  message: "Too many login attempts. Please wait 15 minutes and try again.",
});

const quoteCreationRateLimit = createRequestRateLimit({
  limit: 60,
  windowMs: 60 * 60 * 1000,
  message: "Too many quotes were submitted. Please try again later.",
});

const supplierSuggestionRateLimit = createRequestRateLimit({
  limit: 120,
  windowMs: 15 * 60 * 1000,
  message: "Too many supplier price searches. Please try again later.",
});

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

// Fly health checks can verify both the process and its Atlas connection.
app.get("/api/health", (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  return res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "ok" : "unavailable",
    database: databaseConnected ? "connected" : "disconnected",
  });
});

app.post("/api/admin/login", adminLoginRateLimit, (req, res) => {
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

async function seedQuickServicesIfEmpty() {
  // Seed only a brand-new collection. Deleted defaults stay deleted and
  // edited templates remain fully controlled by the shop.
  if ((await QuickService.countDocuments()) === 0) {
    await QuickService.insertMany(DEFAULT_QUICK_SERVICES);
  }
}

async function createUniqueServiceKey(name) {
  const base = slugifyServiceName(name);
  let key = base;
  let suffix = 2;
  while (await QuickService.exists({ key })) {
    key = `${base}-${suffix}`;
    suffix += 1;
  }
  return key;
}

// Templates are public to the quote workspace; all mutations remain protected.
app.get("/api/quick-services", async (_req, res) => {
  try {
    await seedQuickServicesIfEmpty();
    return res.json(await QuickService.find().sort({ name: 1 }));
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

app.post("/api/quick-services", adminAuth, async (req, res) => {
  let service;
  try {
    service = normalizeQuickService(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    return res.status(201).json(
      await QuickService.create({
        ...service,
        key: await createUniqueServiceKey(service.name),
      })
    );
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

app.put("/api/quick-services/:id", adminAuth, async (req, res) => {
  let service;
  try {
    service = normalizeQuickService(req.body);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const updated = await QuickService.findByIdAndUpdate(
      req.params.id,
      service,
      { returnDocument: "after", runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Service not found" });
    return res.json(updated);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

app.delete("/api/quick-services/:id", adminAuth, async (req, res) => {
  try {
    const deleted = await QuickService.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Service not found" });
    return res.status(204).end();
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
    const saved = await Part.create(normalizePart(req.body));
    res.status(201).json(saved);
  } catch (err) {
    sendDatabaseError(res, err);
  }
});

app.put("/api/parts/:id", adminAuth, async (req, res) => {
  try {
    const updatedPart = await Part.findByIdAndUpdate(
      req.params.id,
      normalizePart(req.body),
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

// Supplier prices are private commercial data. Every endpoint requires an
// admin session until employee accounts and supplier-specific permissions are
// introduced. Search excludes inactive and expired offers by default.
app.get("/api/supplier-prices", adminAuth, async (req, res) => {
  try {
    const query = buildSupplierPriceQuery(req.query);
    const { page, limit } = parseSupplierPricePagination(req.query);
    const [items, total] = await Promise.all([
      SupplierPrice.find(query)
        .sort({ retrievedAt: -1, supplierName: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      SupplierPrice.countDocuments(query),
    ]);

    return res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// Manual entry, future CSV imports, and approved supplier integrations all
// use the same normalized write contract.
app.post("/api/supplier-prices", adminAuth, async (req, res) => {
  try {
    const saved = await SupplierPrice.create(normalizeSupplierPrice(req.body));
    return res.status(201).json(saved);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

async function prepareSupplierPriceImport(items) {
  const rows = normalizeSupplierPriceImport(items);
  const documents = rows.map((row) => new SupplierPrice(row));
  const errors = documents.flatMap((document, index) => {
    const validationError = document.validateSync();
    return validationError
      ? [{ row: index + 2, message: validationError.message }]
      : [];
  });
  if (errors.length > 0) {
    const error = new Error("Import contains invalid supplier prices");
    error.status = 400;
    error.details = errors.slice(0, 25);
    throw error;
  }

  const candidates = await SupplierPrice.find(
    buildSupplierPriceImportLookup(rows)
  ).select("_id supplierName supplierPartNumber vehicle retrievedAt");
  return { rows, matches: matchSupplierPriceImportRows(rows, candidates) };
}

// Preview uses the same fresh database matching as the final import, but never
// writes data. The final endpoint repeats this check to avoid stale decisions.
app.post("/api/supplier-prices/import/preview", adminAuth, async (req, res) => {
  try {
    const { rows, matches } = await prepareSupplierPriceImport(req.body?.items);
    return res.json({
      total: rows.length,
      existing: matches.filter((match) => match.existingId).length,
      matches,
    });
  } catch (error) {
    if (error.details) {
      return res.status(error.status).json({ message: error.message, errors: error.details });
    }
    return sendDatabaseError(res, error);
  }
});

// CSV rows are normalized and fully validated before any document is written.
// This keeps a single bad row from producing a partial, hard-to-audit import.
app.post("/api/supplier-prices/import", adminAuth, async (req, res) => {
  try {
    const strategy = String(req.body?.strategy || "append");
    if (!new Set(["append", "update", "skip"]).has(strategy)) {
      return res.status(400).json({ message: "Unsupported import strategy" });
    }

    const { rows, matches } = await prepareSupplierPriceImport(req.body?.items);
    const operations = [];
    let updated = 0;
    let skipped = 0;

    rows.forEach((row, index) => {
      const existingId = matches[index].existingId;
      if (existingId && strategy === "skip") {
        skipped += 1;
      } else if (existingId && strategy === "update") {
        operations.push({
          updateOne: {
            filter: { _id: existingId },
            update: { $set: row },
            runValidators: true,
          },
        });
        updated += 1;
      } else {
        operations.push({ insertOne: { document: row } });
      }
    });

    if (operations.length > 0) {
      await SupplierPrice.bulkWrite(operations, { ordered: true });
    }
    return res.status(201).json({
      imported: operations.length - updated,
      updated,
      skipped,
    });
  } catch (error) {
    if (error.details) {
      return res.status(error.status).json({ message: error.message, errors: error.details });
    }
    return sendDatabaseError(res, error);
  }
});

app.get("/api/supplier-prices/:id", adminAuth, async (req, res) => {
  try {
    const supplierPrice = await SupplierPrice.findById(req.params.id);
    if (!supplierPrice) {
      return res.status(404).json({ message: "Supplier price not found" });
    }
    return res.json(supplierPrice);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

app.put("/api/supplier-prices/:id", adminAuth, async (req, res) => {
  try {
    const updated = await SupplierPrice.findByIdAndUpdate(
      req.params.id,
      normalizeSupplierPrice(req.body),
      { returnDocument: "after", runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Supplier price not found" });
    }
    return res.json(updated);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// Deleting a quote source is intentionally admin-only. In the future an
// archive action can set active=false when an audit trail is required.
app.delete("/api/supplier-prices/:id", adminAuth, async (req, res) => {
  try {
    const deleted = await SupplierPrice.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Supplier price not found" });
    }
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// Quote creation is available without an admin session, so this endpoint
// exposes only safe selling-price suggestions. Wholesale costs, supplier
// identity, and source URLs never leave the protected supplier-price API.
app.get(
  "/api/supplier-price-suggestions",
  supplierSuggestionRateLimit,
  async (req, res) => {
    try {
      const query = buildSupplierSuggestionQuery(req.query.search);
      const vehicle = {
        year: req.query.year,
        make: req.query.make,
        model: req.query.model,
        engine: req.query.engine,
      };
      const candidates = await SupplierPrice.find(query)
        .sort({ retrievedAt: -1 })
        .limit(50);

      const suggestions = candidates
        .filter((price) => isSupplierPriceVehicleMatch(price.vehicle, vehicle))
        .sort((left, right) => {
          const fitmentDifference =
            getSupplierPriceFitmentScore(right.vehicle) -
            getSupplierPriceFitmentScore(left.vehicle);
          if (fitmentDifference !== 0) return fitmentDifference;
          return new Date(right.retrievedAt) - new Date(left.retrievedAt);
        })
        .slice(0, 5)
        .map(toPublicSupplierSuggestion);

      return res.json({ suggestions });
    } catch (error) {
      return sendDatabaseError(res, error);
    }
  }
);

// Customer records contain private contact and vehicle identifiers, so search
// access is restricted until full employee accounts replace the admin session.
app.get("/api/customers", adminAuth, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const query = {};
    if (search) {
      const escaped = search.replace(/[.*+?^\${}()|[\]\\]/g, "\\$&");
      const regex = { $regex: escaped, $options: "i" };
      const normalizedPhone = normalizePhone(search);
      const normalizedEmail = normalizeEmail(search);
      query.$or = [
        { name: regex },
        { phone: regex },
        { email: regex },
        // Normalized fields make searches work even when the user omits phone
        // punctuation or types an email with different capitalization.
        ...(normalizedPhone
          ? [{ phoneNormalized: { $regex: normalizedPhone } }]
          : []),
        ...(normalizedEmail
          ? [{ emailNormalized: { $regex: escaped, $options: "i" } }]
          : []),
        { "vehicles.vin": regex },
        { "vehicles.licensePlate": regex },
        { "vehicles.make": regex },
        { "vehicles.model": regex },
        { tags: regex },
      ];
    }
    const customers = await Customer.find(query)
      .sort({ lastVisitAt: -1, name: 1 })
      .limit(50);
    return res.json(customers);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

async function findCustomerContactConflict(customer, excludedId) {
  const identities = [];
  if (customer.phoneNormalized) {
    identities.push({ phoneNormalized: customer.phoneNormalized });
  }
  if (customer.emailNormalized) {
    identities.push({ emailNormalized: customer.emailNormalized });
  }

  const query = { $or: identities };
  if (excludedId) query._id = { $ne: excludedId };
  return Customer.findOne(query).select("name");
}

async function findCustomerByContact(customer) {
  const identities = [];
  const phoneNormalized = normalizePhone(customer.phone);
  const emailNormalized = normalizeEmail(customer.email);
  if (phoneNormalized) identities.push({ phoneNormalized });
  if (emailNormalized) identities.push({ emailNormalized });
  return identities.length > 0 ? Customer.findOne({ $or: identities }) : null;
}

async function findCustomerVinConflict(vehicles, excludedId) {
  // VIN is a vehicle identity, not merely descriptive text. Preventing it
  // from appearing on multiple customer records avoids misleading history.
  const vins = (vehicles || [])
    .map((vehicle) => vehicle.vin)
    .filter(Boolean);
  if (vins.length === 0) return null;

  const query = { "vehicles.vin": { $in: vins } };
  if (excludedId) query._id = { $ne: excludedId };
  return Customer.findOne(query).select("name vehicles.vin");
}

async function prepareQuoteCustomerSync(quoteSnapshot, existingQuote) {
  const customer = quoteSnapshot.customer;
  if (!customer?.phone && !customer?.email) return null;

  let matchingCustomer = await findCustomerByContact(customer);
  if (!matchingCustomer && existingQuote?.customerRecordId) {
    const samePhone =
      normalizePhone(customer.phone) &&
      normalizePhone(customer.phone) ===
        normalizePhone(existingQuote.customer?.phone);
    const sameEmail =
      normalizeEmail(customer.email) &&
      normalizeEmail(customer.email) ===
        normalizeEmail(existingQuote.customer?.email);

    // Reuse the linked customer only when at least one durable contact field
    // still identifies the same person; otherwise create/find a new record.
    if (samePhone || sameEmail) {
      matchingCustomer = await Customer.findById(
        existingQuote.customerRecordId
      );
    }
  }

  if (quoteSnapshot.vehicle?.vin) {
    const vinConflict = await findCustomerVinConflict(
      [quoteSnapshot.vehicle],
      matchingCustomer?._id
    );
    if (vinConflict) {
      const error = new Error(
        `This VIN is already assigned to ${vinConflict.name}.`
      );
      error.status = 409;
      throw error;
    }
  }

  return matchingCustomer;
}

async function syncQuoteCustomerRecord(savedQuote, matchingCustomer) {
  const customer = savedQuote.customer;
  if (!customer?.phone && !customer?.email) return;

  // Contact details create or refresh the customer index while the Quote
  // retains its own historical snapshot for documents and auditability.
  const record = matchingCustomer || new Customer();
  record.name = customer.name;
  record.phone = customer.phone;
  record.phoneNormalized = normalizePhone(customer.phone);
  record.email = customer.email;
  record.emailNormalized = normalizeEmail(customer.email);
  record.lastVisitAt = savedQuote.createdAt;
  record.lastQuoteId = savedQuote._id;

  const selectedVehicle = savedQuote.vehicle?.toObject
    ? savedQuote.vehicle.toObject()
    : savedQuote.vehicle;
  if (
    selectedVehicle &&
    (selectedVehicle.year || selectedVehicle.vin || selectedVehicle.licensePlate)
  ) {
    const vehicleIndex = findMatchingVehicleIndex(
      record.vehicles,
      selectedVehicle
    );
    if (vehicleIndex >= 0) {
      Object.assign(record.vehicles[vehicleIndex], selectedVehicle);
    } else {
      record.vehicles.push(selectedVehicle);
    }
  }

  await record.save();
  savedQuote.customerRecordId = record._id;
  await savedQuote.save();
}

async function findCustomerRecordConflict(customer, excludedId) {
  const contactConflict = await findCustomerContactConflict(customer, excludedId);
  if (contactConflict) {
    return `A customer named ${contactConflict.name} already uses this phone or email.`;
  }

  const vinConflict = await findCustomerVinConflict(customer.vehicles, excludedId);
  if (vinConflict) {
    return `This VIN is already assigned to ${vinConflict.name}.`;
  }
  return "";
}

// Administrators may create customer records before the first quote is saved.
app.post("/api/customers", adminAuth, async (req, res) => {
  try {
    const customer = normalizeCustomerRecord(req.body);
    const conflict = await findCustomerRecordConflict(customer);
    if (conflict) {
      return res.status(409).json({ message: conflict });
    }
    return res.status(201).json(await Customer.create(customer));
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// Editing replaces the managed contact and vehicle fields while preserving
// quote-derived visit dates and references stored on the customer document.
app.put("/api/customers/:id", adminAuth, async (req, res) => {
  try {
    const customer = normalizeCustomerRecord(req.body);
    const conflict = await findCustomerRecordConflict(customer, req.params.id);
    if (conflict) {
      return res.status(409).json({ message: conflict });
    }

    const updated = await Customer.findByIdAndUpdate(
      req.params.id,
      { $set: customer },
      { returnDocument: "after", runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Customer not found" });
    return res.json(updated);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// A customer detail response combines the managed record with paginated quote
// history. Older quotes fall back to their saved contact snapshot when they do
// not yet contain customerRecordId.
app.get("/api/customers/:id", adminAuth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      25,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );
    const matches = [{ customerRecordId: customer._id }];
    if (customer.phone) matches.push({ "customer.phone": customer.phone });
    if (customer.email) matches.push({ "customer.email": customer.email });

    const quoteQuery = { $or: matches };
    const [quotes, total] = await Promise.all([
      Quote.find(quoteQuery)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Quote.countDocuments(quoteQuery),
    ]);

    return res.json({
      customer,
      quotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

const PORT = process.env.PORT || 5001;

// Decode a VIN through NHTSA and expose only the fields the quote form needs.
// Keeping this request server-side gives all vehicle lookups consistent
// timeout handling and lets the frontend remain independent of the provider.
app.get("/api/vehicles/decode-vin", async (req, res) => {
  try {
    const vin = normalizeVin(req.query.vin);
    const data = await fetchJsonWithTimeout(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(
        vin
      )}?format=json`
    );
    return res.json(normalizeVinDecodeResult(data, vin));
  } catch (error) {
    const status = error.status || (error.name === "AbortError" ? 504 : 502);
    return res.status(status).json({
      error:
        error.name === "AbortError"
          ? "Vehicle provider timed out"
          : error.message,
    });
  }
});

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

// Build a quote from current inventory and business rules. Both new quotes and
// duplicates use this path, so copied quotes cannot retain outdated prices.
async function buildQuoteSnapshot(payload) {
  const items = Array.isArray(payload.items) ? payload.items : [];
  const laborItems = Array.isArray(payload.laborItems)
    ? payload.laborItems
    : [];
  const status = normalizeQuoteStatus(payload.status);

  if (items.length === 0 && laborItems.length === 0) {
    const error = new Error("A quote needs at least one part or labor item");
    error.status = 400;
    throw error;
  }

  if (!laborItems.every(isValidLaborItem)) {
    const error = new Error(
      "Every labor item needs a description, hours above 0, and a valid hourly rate"
    );
    error.status = 400;
    throw error;
  }

  if (status === "final" && hasPendingPartPrices(items)) {
    const error = new Error(
      "Resolve every price-required part before saving a Final quote"
    );
    error.status = 400;
    throw error;
  }

  // Re-read inventory lines to enforce current price and stock. One-off custom
  // lines are validated separately and never receive an inventory reference.
  const cleanItems = await Promise.all(
    items.map(async (item) => {
      if (item.isCustom === true) {
        if (!isValidCustomItem(item)) {
          const error = new Error(
            "Custom items need a name, non-negative price, and whole-number quantity"
          );
          error.status = 400;
          throw error;
        }
        let supplierReference;
        if (item.source === "supplier") {
          if (!mongoose.isValidObjectId(item.supplierPriceId)) {
            const error = new Error("A valid supplier price reference is required");
            error.status = 400;
            throw error;
          }
          supplierReference = await SupplierPrice.findOne({
            _id: item.supplierPriceId,
            active: true,
            $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
          });
          if (!supplierReference) {
            const error = new Error(
              "The selected supplier price is no longer available"
            );
            error.status = 400;
            throw error;
          }
        }
        return {
          isCustom: true,
          name: item.name.trim(),
          price: roundCurrency(item.price),
          pricePending: item.pricePending === true,
          quoteQuantity: Number(item.quoteQuantity),
          requirementLabel: item.requirementLabel?.trim() || undefined,
          source: item.source || "manual",
          sourceLabel: supplierReference
            ? "Saved supplier price"
            : item.sourceLabel?.trim() || undefined,
          supplierPriceId: supplierReference?._id,
          supplierPartNumber: supplierReference?.supplierPartNumber,
          brand: supplierReference?.brand,
        };
      }

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
        const error = new Error(`Only ${part.quantity} ${part.name} available`);
        error.status = 400;
        throw error;
      }
      return {
        partId: part._id,
        isCustom: false,
        name: part.name,
        price: roundCurrency(part.price),
        quoteQuantity: requestedQuantity,
        source: "inventory",
      };
    })
  );
  const cleanLaborItems = laborItems.map((item) => ({
    description: item.description.trim(),
    hours: Number(item.hours),
    hourlyRate: roundCurrency(item.hourlyRate),
    total: roundCurrency(Number(item.hours) * Number(item.hourlyRate)),
  }));
  const businessSettings = await getBusinessSettings();
  const customer = normalizeCustomer(payload.customer, payload.customerName);
  const vehicle = normalizeVehicle(payload.vehicle);
  const notes = normalizeQuoteNotes(payload.notes);
  const totals = calculateQuoteTotals({
    items: cleanItems,
    laborItems: cleanLaborItems,
    taxRate: businessSettings.taxRate,
  });

  return {
    quoteNumber: `QT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    status,
    customerName: customer.name,
    customer,
    vehicle,
    notes,
    business: createBusinessSnapshot(businessSettings),
    items: cleanItems,
    laborItems: cleanLaborItems,
    partsSubtotal: totals.partsSubtotal,
    laborTotal: totals.laborTotal,
    subtotal: totals.subtotal,
    taxRate: totals.taxRate,
    taxAmount: totals.taxAmount,
    total: totals.grandTotal,
  };
}

// Save an immutable quote snapshot using server-authoritative prices and totals.
app.post("/api/quotes", quoteCreationRateLimit, async (req, res) => {
  try {
    const quoteSnapshot = await buildQuoteSnapshot(req.body);
    // Validate customer/VIN ownership before the quote is committed.
    const matchingCustomer = await prepareQuoteCustomerSync(quoteSnapshot);

    const savedQuote = await Quote.create(quoteSnapshot);

    // A customer-index failure does not invalidate the already-saved Quote.
    try {
      await syncQuoteCustomerRecord(savedQuote, matchingCustomer);
    } catch (customerError) {
      console.error("Customer record sync failed:", customerError.message);
    }
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
    if (["draft", "final"].includes(req.query.status)) {
      // Until the migration is run, a missing status represents a legacy draft.
      query.status =
        req.query.status === "draft" ? { $in: ["draft", null] } : "final";
    }
    const createdAt = createDateRangeFilter(req.query.from, req.query.to);
    if (createdAt) query.createdAt = createdAt;

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

// Draft quotes may be corrected, but every edit is rebuilt through the same
// authoritative inventory, labor, tax, and validation path as a new quote.
app.put("/api/quotes/:id", adminAuth, async (req, res) => {
  try {
    const existingQuote = await Quote.findById(req.params.id);
    if (!existingQuote) {
      return res.status(404).json({ message: "Quote not found" });
    }
    if (existingQuote.status === "final") {
      return res.status(409).json({
        message: "Final quotes cannot be edited. Reopen it as draft first.",
      });
    }

    const rebuiltSnapshot = await buildQuoteSnapshot({
      ...req.body,
      status: "draft",
    });
    const matchingCustomer = await prepareQuoteCustomerSync(
      rebuiltSnapshot,
      existingQuote
    );
    const editableSnapshot = { ...rebuiltSnapshot };
    delete editableSnapshot.quoteNumber;
    delete editableSnapshot.status;

    // A draft edit retains its permanent identity and original creation date.
    // The normal Mongoose save updates only updatedAt.
    existingQuote.set(editableSnapshot);
    existingQuote.status = rebuiltSnapshot.status;
    if (!rebuiltSnapshot.customer?.phone && !rebuiltSnapshot.customer?.email) {
      existingQuote.customerRecordId = undefined;
    }
    await existingQuote.save();

    try {
      await syncQuoteCustomerRecord(existingQuote, matchingCustomer);
    } catch (customerError) {
      console.error("Customer record sync failed:", customerError.message);
    }
    return res.json(existingQuote);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// Lifecycle changes stay separate from content edits so Final records remain
// locked unless an administrator explicitly reopens them.
app.patch("/api/quotes/:id/status", adminAuth, async (req, res) => {
  try {
    if (!["draft", "final"].includes(req.body.status)) {
      return res.status(400).json({ message: "Status must be draft or final" });
    }
    const existingQuote = await Quote.findById(req.params.id);
    if (!existingQuote) return res.status(404).json({ message: "Quote not found" });
    if (
      req.body.status === "final" &&
      hasPendingPartPrices(existingQuote.items)
    ) {
      return res.status(400).json({
        message: "Resolve every price-required part before marking this quote Final",
      });
    }
    existingQuote.status = req.body.status;
    const quote = await existingQuote.save();
    return res.json(quote);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// Duplicating reuses customer selections and labor but refreshes every part
// price, shop setting, tax rate, and stock check before creating a new draft.
app.post("/api/quotes/:id/duplicate", adminAuth, async (req, res) => {
  try {
    const source = await Quote.findById(req.params.id);
    if (!source) return res.status(404).json({ message: "Quote not found" });

    const duplicatePayload = {
      customerName: source.customerName,
      // Preserve the structured contact snapshot when a historical quote is
      // duplicated. Legacy quotes still fall back to customerName.
      customer: source.customer,
      vehicle: source.vehicle,
      notes: source.notes,
      items: source.items.map((item) => ({
        partId: item.partId,
        isCustom: item.isCustom,
        name: item.name,
        price: item.price,
        pricePending: item.pricePending,
        quoteQuantity: item.quoteQuantity,
        requirementLabel: item.requirementLabel,
        source: item.source,
        sourceLabel: item.sourceLabel,
      })),
      laborItems: source.laborItems.map((item) => ({
        description: item.description,
        hours: item.hours,
        hourlyRate: item.hourlyRate,
      })),
    };
    const duplicate = await Quote.create(
      await buildQuoteSnapshot(duplicatePayload)
    );
    return res.status(201).json(duplicate);
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

app.delete("/api/quotes/:id", adminAuth, async (req, res) => {
  try {
    const deleted = await Quote.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Quote not found" });
    return res.status(204).end();
  } catch (error) {
    return sendDatabaseError(res, error);
  }
});

// Unknown API URLs return JSON so the shared frontend API client can display a
// consistent message instead of receiving Express's default HTML response.
app.use("/api", (_req, res) => {
  return res.status(404).json({ message: "API endpoint not found" });
});

let httpServer;

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
  // An explicit public bind works locally and is required behind Fly Proxy.
  httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

async function shutdown(signal) {
  // Fly sends SIGTERM during a deploy. Stop accepting new work, then close the
  // Atlas connection so in-flight requests can finish without abrupt errors.
  console.log(`${signal} received. Shutting down gracefully.`);
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve));
  }
  await mongoose.disconnect();
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    shutdown(signal)
      .then(() => {
        process.exitCode = 0;
      })
      .catch((error) => {
        console.error("Graceful shutdown failed:", error.message);
        process.exitCode = 1;
      });
  });
}

startServer().catch((error) => {
  console.error("Unable to start server:", error.message);
  process.exitCode = 1;
});

export { app };
