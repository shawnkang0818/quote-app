import mongoose from "mongoose";

const quoteSchema = new mongoose.Schema(
  {
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