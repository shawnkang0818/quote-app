import mongoose from "mongoose";
import { DEFAULT_BUSINESS_SETTINGS } from "../utils/businessSettings.js";

const businessSettingsSchema = new mongoose.Schema(
  {
    // The application currently supports one shop. A fixed unique key makes
    // this a singleton while leaving room for multi-shop support later.
    key: { type: String, default: "primary", unique: true, immutable: true },
    companyName: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    taxRate: { type: Number, required: true, min: 0, max: 1 },
    defaultHourlyRate: { type: Number, required: true, min: 0 },
    quoteValidityDays: { type: Number, required: true, min: 1, max: 365 },
    quoteNotes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export async function getBusinessSettings() {
  // setDefaultsOnInsert creates the initial record automatically on first use.
  return mongoose.model("BusinessSettings").findOneAndUpdate(
    { key: "primary" },
    { $setOnInsert: { key: "primary", ...DEFAULT_BUSINESS_SETTINGS } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  );
}

export default mongoose.model("BusinessSettings", businessSettingsSchema);
