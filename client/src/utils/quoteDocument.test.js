import test from "node:test";
import assert from "node:assert/strict";
import { createQuoteDocumentMeta } from "./quoteDocument.js";

test("keeps unsaved PDF previews in draft status", () => {
  const meta = createQuoteDocumentMeta({
    quoteStatus: "final",
    timestamp: 12345,
  });

  assert.equal(meta.isDraft, true);
  assert.equal(meta.statusLabel, "DRAFT");
  assert.equal(meta.quoteNumber, "DRAFT-12345");
});

test("marks a saved final quote and calculates its validity date", () => {
  const meta = createQuoteDocumentMeta({
    quoteDate: "2026-09-13T12:00:00.000Z",
    quoteStatus: "final",
    quoteValidityDays: 14,
    savedQuoteNumber: "QT-1001",
  });

  assert.equal(meta.isDraft, false);
  assert.equal(meta.statusLabel, "FINAL");
  assert.equal(meta.quoteNumber, "QT-1001");
  assert.equal(meta.validUntil.toISOString(), "2026-09-27T12:00:00.000Z");
});
