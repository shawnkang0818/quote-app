import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Part from "./models/Part.js";
import { adminAuth } from "./middleware/adminAuth.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));
  
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/api/parts", async (req, res) => {
  try {
    const parts = await Part.find();
    res.json(parts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/parts", adminAuth, async (req, res) => {
  try {
    const newPart = new Part(req.body);
    const saved = await newPart.save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/parts/:id", adminAuth, async (req, res) => {
  try {
    const updatedPart = await Part.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedPart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/parts/:id", adminAuth, async (req, res) => {
  try {
    await Part.findByIdAndDelete(req.params.id);
    res.json({ message: "Part deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});