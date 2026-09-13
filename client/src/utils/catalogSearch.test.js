import test from "node:test";
import assert from "node:assert/strict";
import { filterCatalogItems, matchesCatalogSearch } from "./catalogSearch.js";

const service = {
  name: "Front Brake Service",
  shortCode: "FB",
  description: "Front brake replacement",
  parts: [{ label: "Brake pads", searchTerms: ["front brake pad"] }],
  labor: [{ description: "Brake installation" }],
};

test("matches service names, codes, parts, and labor descriptions", () => {
  assert.equal(matchesCatalogSearch(service, "front brake"), true);
  assert.equal(matchesCatalogSearch(service, "FB"), true);
  assert.equal(matchesCatalogSearch(service, "brake pads"), true);
  assert.equal(matchesCatalogSearch(service, "installation"), true);
});

test("matches inventory names without case sensitivity", () => {
  const parts = [
    { name: "Premium Oil Filter" },
    { name: "Cabin Air Filter" },
  ];

  assert.deepEqual(filterCatalogItems(parts, " OIL "), [parts[0]]);
});

test("matches optional inventory metadata", () => {
  const part = {
    name: "Premium Filter",
    partNumber: "PH4967",
    brand: "Fram",
    category: "Engine",
  };

  assert.equal(matchesCatalogSearch(part, "ph4967"), true);
  assert.equal(matchesCatalogSearch(part, "FRAM"), true);
  assert.equal(matchesCatalogSearch(part, "engine"), true);
});

test("returns every item for an empty search", () => {
  const items = [{ name: "Battery" }, { name: "Oil Filter" }];
  assert.deepEqual(filterCatalogItems(items, ""), items);
});
