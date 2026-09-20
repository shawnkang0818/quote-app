import mongoose from "mongoose";

// SupplierPrice stores a time-stamped supplier offer, not shop inventory.
// Keeping these records separate prevents an external price update from
// silently changing the selling price or stock count used by the shop.
const supplierPriceSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    supplierPartNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    partName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    listPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    currency: {
      type: String,
      enum: ["USD", "CAD"],
      default: "USD",
    },
    availability: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock", "special_order", "unknown"],
      default: "unknown",
    },
    quantityAvailable: {
      type: Number,
      min: 0,
      default: null,
      validate: {
        validator: (value) => value === null || Number.isInteger(value),
        message: "Available quantity must be a whole number",
      },
    },
    vehicle: {
      year: { type: String, trim: true, maxlength: 4, default: "" },
      make: { type: String, trim: true, maxlength: 80, default: "" },
      model: { type: String, trim: true, maxlength: 100, default: "" },
      engine: { type: String, trim: true, maxlength: 120, default: "" },
    },
    sourceType: {
      type: String,
      enum: ["manual", "csv", "api"],
      default: "manual",
    },
    sourceUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    retrievedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    requiresConfirmation: {
      type: Boolean,
      default: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// These indexes support the main workflow: search by part, supplier, or the
// selected vehicle and prefer the freshest active offer.
supplierPriceSchema.index({ supplierName: 1, supplierPartNumber: 1, retrievedAt: -1 });
supplierPriceSchema.index({ partName: 1, brand: 1, retrievedAt: -1 });
supplierPriceSchema.index({
  "vehicle.year": 1,
  "vehicle.make": 1,
  "vehicle.model": 1,
  active: 1,
});

export default mongoose.model("SupplierPrice", supplierPriceSchema);
