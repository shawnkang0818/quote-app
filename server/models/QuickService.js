import mongoose from "mongoose";

const partRequirementSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    searchTerms: {
      type: [{ type: String, trim: true }],
      validate: {
        validator: (terms) => terms.length > 0,
        message: "Each part requirement needs at least one search term",
      },
    },
  },
  { _id: false }
);

const laborTemplateSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    hours: { type: Number, required: true, min: 0.01 },
    // An omitted rate means “use the current Business Settings rate.”
    hourlyRate: { type: Number, min: 0 },
  },
  { _id: false }
);

const quickServiceSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    shortCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 4,
    },
    description: { type: String, trim: true, default: "" },
    parts: { type: [partRequirementSchema], default: [] },
    labor: { type: [laborTemplateSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("QuickService", quickServiceSchema);
