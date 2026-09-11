import test from "node:test";
import assert from "node:assert/strict";
import { calculateQuoteTotals } from "./quoteCalculations.js";

test("server recalculates the authoritative quote total", () => {
  const totals = calculateQuoteTotals({
    items: [{ price: 25, quoteQuantity: 2 }],
    laborItems: [{ hours: 2, hourlyRate: 80 }],
  });

  assert.equal(totals.partsSubtotal, 50);
  assert.equal(totals.laborTotal, 160);
  assert.equal(totals.taxAmount, 18.38);
  assert.equal(totals.grandTotal, 228.38);
});
