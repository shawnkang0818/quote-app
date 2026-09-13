import test from "node:test";
import assert from "node:assert/strict";
import { hasUnsavedQuote } from "./quoteDraft.js";

test("detects unsaved customer, vehicle, item, labor, and note data", () => {
  assert.equal(hasUnsavedQuote({ customer: { name: "Maya Chen" } }), true);
  assert.equal(hasUnsavedQuote({ vehicle: { year: "2022" } }), true);
  assert.equal(hasUnsavedQuote({ quoteItems: [{ name: "Oil Filter" }] }), true);
  assert.equal(hasUnsavedQuote({ laborItems: [{ description: "Labor" }] }), true);
  assert.equal(hasUnsavedQuote({ notes: { technicianNotes: "Inspect" } }), true);
});

test("treats an empty or already-saved snapshot as safe to replace", () => {
  assert.equal(hasUnsavedQuote({}), false);
  assert.equal(
    hasUnsavedQuote({
      quoteItems: [{ name: "Oil Filter" }],
      savedQuoteNumber: "QT-1001",
    }),
    false
  );
});
