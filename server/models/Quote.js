import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema(
  {
    customerName: String,
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
        name: String,
        price: Number,
        quoteQuantity: Number,
      },
    ],
    total: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Quote", quoteSchema);