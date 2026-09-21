import test from "node:test";
import assert from "node:assert/strict";
import SupplierPriceImport from "./SupplierPriceImport.js";

test("accepts a bounded supplier import audit record", async () => {
  const record = new SupplierPriceImport({
    fileName: "supplier-prices.csv",
    strategy: "update",
    totalRows: 1,
    imported: 0,
    updated: 1,
    skipped: 0,
    rows: [
      {
        rowNumber: 2,
        supplierName: "Metro Supply",
        supplierPartNumber: "AF-1",
        partName: "Air Filter",
        vehicle: { year: "2020", make: "Toyota", model: "Camry" },
        action: "updated",
      },
    ],
  });
  await assert.doesNotReject(() => record.validate());
});

test("rejects an unsupported import strategy", async () => {
  const record = new SupplierPriceImport({
    fileName: "prices.csv",
    strategy: "overwrite-all",
    totalRows: 1,
    imported: 1,
    updated: 0,
    skipped: 0,
  });
  await assert.rejects(() => record.validate(), /strategy/);
});
