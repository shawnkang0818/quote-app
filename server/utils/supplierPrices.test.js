import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSupplierSuggestionQuery,
  buildSupplierPriceQuery,
  getSupplierPriceFitmentScore,
  isSupplierPriceVehicleMatch,
  normalizeSupplierPrice,
  normalizeSupplierPriceImport,
  parseSupplierPricePagination,
  toPublicSupplierSuggestion,
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

test("normalizes a bounded CSV import and enforces its source type", () => {
  const rows = normalizeSupplierPriceImport([
    {
      supplierName: "Metro Supply",
      supplierPartNumber: "AF-100",
      partName: "Air Filter",
      cost: "10.50",
      sourceType: "api",
    },
  ]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].cost, 10.5);
  assert.equal(rows[0].sourceType, "csv");
});

test("rejects empty and oversized supplier price imports", () => {
  assert.throws(() => normalizeSupplierPriceImport([]), /at least one/);
  assert.throws(
    () => normalizeSupplierPriceImport(Array.from({ length: 501 }, () => ({}))),
    /cannot exceed 500/
  );
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

test("builds an active and unexpired public suggestion query", () => {
  const query = buildSupplierSuggestionQuery(
    "Air Filter",
    new Date("2026-09-20T12:00:00Z")
  );
  assert.equal(query.active, true);
  assert.deepEqual(query.availability, { $nin: ["out_of_stock"] });
  assert.equal(query.$and[1].$or[0].partName.$regex, "Air Filter");
});

test("matches universal or exact vehicle fitment and scores specificity", () => {
  const vehicle = { year: "2020", make: "Toyota", model: "Camry" };
  assert.equal(isSupplierPriceVehicleMatch({}, vehicle), true);
  assert.equal(
    isSupplierPriceVehicleMatch(
      { year: "2020", make: "toyota", model: "CAMRY" },
      vehicle
    ),
    true
  );
  assert.equal(
    isSupplierPriceVehicleMatch({ make: "Honda" }, vehicle),
    false
  );
  assert.equal(
    getSupplierPriceFitmentScore({ year: "2020", make: "Toyota", model: "Camry" }),
    3
  );
});

test("removes supplier cost and identity from public suggestions", () => {
  const suggestion = toPublicSupplierSuggestion({
    _id: "price-1",
    supplierName: "Private Supplier",
    sourceUrl: "https://supplier.example/item",
    cost: 10,
    partName: "Air Filter",
    supplierPartNumber: "AF-1",
    brand: "Example",
    category: "Filters",
    listPrice: 24.99,
    currency: "USD",
    availability: "in_stock",
    quantityAvailable: 5,
    vehicle: {},
    retrievedAt: new Date("2026-09-20T12:00:00Z"),
  });

  assert.equal(suggestion.listPrice, 24.99);
  assert.equal(Object.hasOwn(suggestion, "cost"), false);
  assert.equal(Object.hasOwn(suggestion, "supplierName"), false);
  assert.equal(Object.hasOwn(suggestion, "sourceUrl"), false);
});
