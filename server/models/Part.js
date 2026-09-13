import mongoose from "mongoose";

const partSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
  },
  partNumber: {
    type: String,
    trim: true,
    maxlength: 80,
    default: "",
  },
  brand: {
    type: String,
    trim: true,
    maxlength: 80,
    default: "",
  },
  category: {
    type: String,
    trim: true,
    maxlength: 80,
    default: "",
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: "Quantity must be a whole number",
    },
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: "Low-stock threshold must be a whole number",
    },
  },
}, { timestamps: true });

export default mongoose.model("Part", partSchema);
