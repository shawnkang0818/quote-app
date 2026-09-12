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
    status: {
      type: String,
      enum: ["draft", "final"],
      default: "draft",
      index: true,
    },
    customerName: {
      type: String,
      trim: true,
      default: "Walk-in Customer",
    },
    customer: {
      name: String,
      phone: String,
      email: String,
    },
    // New quotes keep a durable link to the managed customer record. Contact
    // snapshots above remain unchanged for historical accuracy.
    customerRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      index: true,
    },
    vehicle: {
      year: String,
      make: String,
      model: String,
      vin: String,
      licensePlate: String,
      mileage: Number,
    },
    notes: {
      customerRequest: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },
      technicianNotes: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },
    },
    // Company details are copied at save time so historical PDFs remain
    // unchanged even when the shop later edits its Business Settings.
    business: {
      companyName: String,
      address: String,
      phone: String,
      email: String,
      quoteValidityDays: Number,
      quoteNotes: String,
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
