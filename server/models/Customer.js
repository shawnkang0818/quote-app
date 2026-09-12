import mongoose from "mongoose";

const customerVehicleSchema = new mongoose.Schema(
  {
    year: String,
    make: String,
    model: String,
    vin: String,
    licensePlate: String,
    mileage: { type: Number, min: 0 },
  },
  { timestamps: true }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    phone: { type: String, trim: true, default: "" },
    phoneNormalized: { type: String, default: "", index: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    emailNormalized: { type: String, default: "", index: true },
    vehicles: { type: [customerVehicleSchema], default: [] },
    lastVisitAt: Date,
    lastQuoteId: { type: mongoose.Schema.Types.ObjectId, ref: "Quote" },
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
