import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_QUOTE_NOTE_LENGTH,
  normalizeQuoteNotes,
} from "./quoteNotes.js";

test("normalizes customer and technician quote notes", () => {
  assert.deepEqual(
    normalizeQuoteNotes({
      customerRequest: "  Check brake noise  ",
      technicianNotes: "  Inspect front rotors  ",
    }),
    {
      customerRequest: "Check brake noise",
      technicianNotes: "Inspect front rotors",
    }
  );
});

test("rejects oversized quote notes", () => {
  assert.throws(
    () =>
      normalizeQuoteNotes({
        technicianNotes: "x".repeat(MAX_QUOTE_NOTE_LENGTH + 1),
      }),
    /1000 characters or fewer/
  );
});
