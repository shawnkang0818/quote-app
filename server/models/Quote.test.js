import test from "node:test";
import assert from "node:assert/strict";
import Quote from "./Quote.js";

function createValidQuote(overrides = {}) {
  return new Quote({
    quoteNumber: "QT-TEST-1000",
    items: [],
    laborItems: [],
    partsSubtotal: 0,
    laborTotal: 0,
    subtotal: 0,
    taxRate: 0.0875,
    taxAmount: 0,
    total: 0,
    ...overrides,
  });
}

test("new quotes default to draft status", () => {
  assert.equal(createValidQuote().status, "draft");
});

test("quote status accepts only draft or final", () => {
  const quote = createValidQuote({ status: "pending" });
  const validationError = quote.validateSync();

  assert.ok(validationError.errors.status);
});

test("stores custom quote lines without an inventory reference", () => {
  const quote = createValidQuote({
    items: [
      {
        isCustom: true,
        name: "Shop supplies",
        price: 12.5,
        quoteQuantity: 1,
      },
    ],
    partsSubtotal: 12.5,
    subtotal: 12.5,
    total: 13.59,
  });

  assert.equal(quote.validateSync(), undefined);
  assert.equal(quote.items[0].partId, undefined);
  assert.equal(quote.items[0].isCustom, true);
});
