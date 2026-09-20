import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSupplierPriceQuery,
  normalizeSupplierPrice,
  parseSupplierPricePagination,
} from "./supplierPrices.js";

test("normalizes a supplier offer while dropping unknown fields", () => {
  const offer = normalizeSupplierPrice({
    supplierName: " Example Supplier ",
    supplierPartNumber: " PH4967 ",
    brand: " Fram ",
    partName: " Oil Filter ",
    cost: "8.49",
    listPrice: "12.99",
    quantityAvailable: "4",
    currency: "usd",
    availability: "in_stock",
    vehicle: { year: "2020", make: " Toyota ", model: " Camry " },
    ignored: "not persisted",
  });

  assert.equal(offer.supplierName, "Example Supplier");
  assert.equal(offer.cost, 8.49);
  assert.equal(offer.listPrice, 12.99);
  assert.equal(offer.quantityAvailable, 4);
  assert.equal(offer.currency, "USD");
  assert.deepEqual(offer.vehicle, {
    year: "2020",
    make: "Toyota",
    model: "Camry",
    engine: "",
  });
  assert.equal(offer.requiresConfirmation, true);
  assert.equal(Object.hasOwn(offer, "ignored"), false);
});

test("rejects an expiration before the supplier price was retrieved", () => {
  assert.throws(
    () =>
      normalizeSupplierPrice({
        retrievedAt: "2026-09-20T12:00:00Z",
        expiresAt: "2026-09-19T12:00:00Z",
      }),
    /expiration must be after retrieval/
  );
});

test("builds an active, unexpired vehicle and part search", () => {
  const now = new Date("2026-09-20T12:00:00Z");
  const query = buildSupplierPriceQuery(
    { search: "PH.4967", year: "2020", make: "Toyota" },
    now
  );

  assert.equal(query.active, true);
  assert.equal(query["vehicle.year"], "2020");
  assert.deepEqual(query["vehicle.make"], {
    $regex: "^Toyota$",
    $options: "i",
  });
  assert.equal(query.$or[0].partName.$regex, "PH\\.4967");
  assert.deepEqual(query.$and, [
    { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
  ]);
});

test("matches supplier and vehicle names without depending on capitalization", () => {
  const query = buildSupplierPriceQuery({
    supplier: "example auto supply",
    make: "toyota",
    model: "camry",
  });

  assert.deepEqual(query.supplierName, {
    $regex: "^example auto supply$",
    $options: "i",
  });
  assert.equal(query["vehicle.make"].$options, "i");
  assert.equal(query["vehicle.model"].$regex, "^camry$");
});

test("bounds supplier price pagination", () => {
  assert.deepEqual(parseSupplierPricePagination({ page: "0", limit: "999" }), {
    page: 1,
    limit: 100,
  });
});
