import test from "node:test";
import assert from "node:assert/strict";
import {
  createSupplierPriceCsvTemplate,
  parseSupplierPriceCsv,
} from "./supplierPriceCsv.js";

test("parses a supplier price CSV into a preview payload", () => {
  const preview = parseSupplierPriceCsv(createSupplierPriceCsvTemplate());
  assert.equal(preview.length, 1);
  assert.equal(preview[0].errors.length, 0);
  assert.equal(preview[0].item.supplierName, "Example Auto Supply");
  assert.equal(preview[0].item.cost, 8.49);
  assert.equal(preview[0].item.vehicle.model, "Camry");
});

test("supports quoted commas and reports invalid values by row", () => {
  const csv = [
    "supplierName,supplierPartNumber,partName,cost,currency,availability",
    '"Supply, Inc.",AF-1,Air Filter,-2,EUR,available',
  ].join("\n");
  const [preview] = parseSupplierPriceCsv(csv);
  assert.equal(preview.item.supplierName, "Supply, Inc.");
  assert.equal(preview.rowNumber, 2);
  assert.equal(preview.errors.length, 3);
});

test("rejects files without required columns", () => {
  assert.throws(
    () => parseSupplierPriceCsv("partName,cost\nFilter,10"),
    /Missing required column/
  );
});
