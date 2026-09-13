import test from "node:test";
import assert from "node:assert/strict";
import { normalizePart } from "./parts.js";

test("normalizes inventory metadata and numeric fields", () => {
  assert.deepEqual(
    normalizePart({
      name: "  Oil Filter ",
      partNumber: " PH4967 ",
      brand: " Fram ",
      category: " Filters ",
      price: "12.99",
      quantity: "8",
      lowStockThreshold: "3",
      ignored: "not persisted",
    }),
    {
      name: "Oil Filter",
      partNumber: "PH4967",
      brand: "Fram",
      category: "Filters",
      price: 12.99,
      quantity: 8,
      lowStockThreshold: 3,
    }
  );
});

test("supplies the default low-stock threshold for legacy forms", () => {
  assert.equal(normalizePart({}).lowStockThreshold, 5);
  assert.equal(normalizePart({ lowStockThreshold: "" }).lowStockThreshold, 5);
});
