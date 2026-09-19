import test from "node:test";
import assert from "node:assert/strict";
import Part from "./Part.js";

test("accepts optional inventory metadata and a whole-number stock threshold", async () => {
  const part = new Part({
    name: "Oil Filter",
    partNumber: "PH4967",
    brand: "Fram",
    category: "Filters",
    price: 12.99,
    quantity: 8,
    lowStockThreshold: 3,
  });

  await assert.doesNotReject(part.validate());
});

test("rejects negative or fractional low-stock thresholds", async () => {
  const negative = new Part({
    name: "Battery",
    price: 99,
    quantity: 2,
    lowStockThreshold: -1,
  });
  const fractional = new Part({
    name: "Brake Pad",
    price: 80,
    quantity: 4,
    lowStockThreshold: 2.5,
  });

  await assert.rejects(
    negative.validate(),
    (error) => Boolean(error.errors.lowStockThreshold)
  );
  await assert.rejects(
    fractional.validate(),
    (error) => Boolean(error.errors.lowStockThreshold)
  );
});
