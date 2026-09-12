import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema(
  {
    quoteNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      sparse: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: "Walk-in Customer",
    },
    vehicle: {
      year: String,
      make: String,
      model: String,
    },
    items: [
      {
        partId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Part",
        },
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        quoteQuantity: { type: Number, required: true, min: 1 },
      },
    ],
    laborItems: [
      {
        description: { type: String, required: true, trim: true },
        // A labor line must represent actual work; zero-hour rows are invalid.
        hours: { type: Number, required: true, min: 0.1 },
        hourlyRate: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
      },
    ],
    partsSubtotal: { type: Number, required: true, min: 0 },
    laborTotal: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, min: 0 },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Quote", quoteSchema);
