import mongoose from "mongoose";

// Each successful CSV operation creates a compact audit record. Row summaries
// contain identifying metadata and the chosen action, but no wholesale cost.
const supplierPriceImportSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    strategy: {
      type: String,
      enum: ["append", "update", "skip"],
      required: true,
    },
    totalRows: { type: Number, required: true, min: 1, max: 500 },
    imported: { type: Number, required: true, min: 0 },
    updated: { type: Number, required: true, min: 0 },
    skipped: { type: Number, required: true, min: 0 },
    rows: [
      {
        rowNumber: { type: Number, required: true, min: 2 },
        supplierName: { type: String, required: true, maxlength: 120 },
        supplierPartNumber: { type: String, required: true, maxlength: 120 },
        partName: { type: String, required: true, maxlength: 160 },
        vehicle: {
          year: { type: String, maxlength: 4, default: "" },
          make: { type: String, maxlength: 80, default: "" },
          model: { type: String, maxlength: 100, default: "" },
          engine: { type: String, maxlength: 120, default: "" },
        },
        action: {
          type: String,
          enum: ["imported", "updated", "skipped"],
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

supplierPriceImportSchema.index({ createdAt: -1 });

export default mongoose.model("SupplierPriceImport", supplierPriceImportSchema);
