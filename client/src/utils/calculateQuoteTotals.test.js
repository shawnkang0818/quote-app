import test from "node:test";
import assert from "node:assert/strict";
import { calculateQuoteTotals } from "./calculateQuoteTotals.js";

test("calculates parts, labor, tax, and grand total consistently", () => {
  const totals = calculateQuoteTotals({
    quoteItems: [{ price: 50, quoteQuantity: 2 }],
    laborItems: [{ hours: 1.5, hourlyRate: 100 }],
  });

  assert.deepEqual(totals, {
    partsSubtotal: 100,
    laborTotal: 150,
    subtotal: 250,
    taxRate: 0.0875,
    taxAmount: 21.88,
    grandTotal: 271.88,
  });
});

test("rounds monetary values to cents", () => {
  const totals = calculateQuoteTotals({
    quoteItems: [{ price: 0.1, quoteQuantity: 3 }],
    taxRate: 0,
  });

  assert.equal(totals.partsSubtotal, 0.3);
  assert.equal(totals.grandTotal, 0.3);
});

test("includes custom lines in the parts and items subtotal", () => {
  const totals = calculateQuoteTotals({
    quoteItems: [
      { price: 50, quoteQuantity: 1 },
      { isCustom: true, price: 12.5, quoteQuantity: 2 },
    ],
    taxRate: 0,
  });

  assert.equal(totals.partsSubtotal, 75);
  assert.equal(totals.grandTotal, 75);
});
