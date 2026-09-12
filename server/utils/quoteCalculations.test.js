import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateQuoteTotals,
  isValidLaborItem,
} from "./quoteCalculations.js";

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

test("validates editable labor hours and hourly rate", () => {
  assert.equal(
    isValidLaborItem({ description: "Brake service", hours: 1.5, hourlyRate: 125 }),
    true
  );
  assert.equal(
    isValidLaborItem({ description: "Brake service", hours: 0, hourlyRate: 125 }),
    false
  );
  assert.equal(
    isValidLaborItem({ description: "Brake service", hours: 1, hourlyRate: -1 }),
    false
  );
});
