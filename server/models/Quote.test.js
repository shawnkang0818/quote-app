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

test("quote status accepts only draft or final", async () => {
  const quote = createValidQuote({ status: "pending" });
  await assert.rejects(
    quote.validate(),
    (error) => Boolean(error.errors.status)
  );
});

test("stores custom quote lines without an inventory reference", async () => {
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

  await assert.doesNotReject(quote.validate());
  assert.equal(quote.items[0].partId, undefined);
  assert.equal(quote.items[0].isCustom, true);
});

test("stores unresolved Quick Service parts in a working draft", async () => {
  const quote = createValidQuote({
    items: [
      {
        isCustom: true,
        name: "Cabin air filter",
        price: 0,
        pricePending: true,
        quoteQuantity: 1,
        source: "quick-service",
      },
    ],
  });

  await assert.doesNotReject(quote.validate());
  assert.equal(quote.items[0].pricePending, true);
  assert.equal(quote.items[0].source, "quick-service");
});
