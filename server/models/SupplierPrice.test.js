import test from "node:test";
import assert from "node:assert/strict";
import SupplierPrice from "./SupplierPrice.js";

test("accepts a valid time-stamped supplier offer", async () => {
  const offer = new SupplierPrice({
    supplierName: "Example Supplier",
    supplierPartNumber: "PH4967",
    brand: "Fram",
    partName: "Oil Filter",
    category: "Filters",
    cost: 8.49,
    listPrice: 12.99,
    availability: "in_stock",
    quantityAvailable: 12,
    vehicle: { year: "2020", make: "Toyota", model: "Camry" },
    sourceType: "manual",
  });

  await assert.doesNotReject(offer.validate());
});

test("rejects negative prices and fractional available quantities", async () => {
  const offer = new SupplierPrice({
    supplierName: "Example Supplier",
    supplierPartNumber: "PAD-1",
    partName: "Brake Pads",
    cost: -1,
    quantityAvailable: 2.5,
  });

  await assert.rejects(offer.validate(), (error) => {
    return Boolean(error.errors.cost && error.errors.quantityAvailable);
  });
});
