import test from "node:test";
import assert from "node:assert/strict";
import { applyQuickService } from "./applyQuickService.js";

const service = {
  parts: [{ label: "Oil filter", searchTerms: ["oil filter"] }],
  labor: [{ description: "Oil change", hours: 0.5, hourlyRate: 100 }],
};

test("adds matching inventory parts and labor", () => {
  const result = applyQuickService({
    service,
    parts: [{ _id: "part-1", name: "Premium Oil Filter", quantity: 2, price: 15 }],
    quoteItems: [],
    laborItems: [],
    idFactory: () => "labor-1",
  });

  assert.equal(result.quoteItems[0].quoteQuantity, 1);
  assert.equal(result.laborItems[0].id, "labor-1");
  assert.deepEqual(result.missingParts, []);
});

test("reports a missing part but still adds service labor", () => {
  const result = applyQuickService({
    service,
    parts: [],
    quoteItems: [],
    laborItems: [],
    idFactory: () => "labor-1",
  });

  assert.equal(result.quoteItems.length, 0);
  assert.equal(result.laborItems.length, 1);
  assert.deepEqual(result.missingParts, ["Oil filter"]);
});

test("does not exceed available stock", () => {
  const part = { _id: "part-1", name: "Oil Filter", quantity: 1, price: 15 };
  const result = applyQuickService({
    service,
    parts: [part],
    quoteItems: [{ ...part, quoteQuantity: 1 }],
    laborItems: [],
    idFactory: () => "labor-1",
  });

  assert.equal(result.quoteItems[0].quoteQuantity, 1);
  assert.deepEqual(result.missingParts, ["Oil filter"]);
});

test("keeps customized labor hours and hourly rate", () => {
  const customizedService = {
    ...service,
    parts: [],
    labor: [
      { description: "Oil change", hours: 1.25, hourlyRate: 145 },
    ],
  };

  const result = applyQuickService({
    service: customizedService,
    parts: [],
    quoteItems: [],
    laborItems: [],
    idFactory: () => "labor-custom",
  });

  assert.equal(result.laborItems[0].hours, 1.25);
  assert.equal(result.laborItems[0].hourlyRate, 145);
});
