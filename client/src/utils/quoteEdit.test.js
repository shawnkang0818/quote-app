import assert from "node:assert/strict";
import test from "node:test";
import { createQuoteEditState } from "./quoteEdit.js";

test("maps saved inventory and custom lines into editable builder rows", () => {
  const draft = createQuoteEditState({
    items: [
      {
        _id: "quote-line-1",
        partId: "part-1",
        isCustom: false,
        name: "Oil Filter",
        quoteQuantity: 1,
      },
      {
        _id: "custom-line-1",
        isCustom: true,
        name: "Shop supplies",
        quoteQuantity: 1,
      },
    ],
  });

  assert.equal(draft.quoteItems[0]._id, "part-1");
  assert.equal(draft.quoteItems[1]._id, "custom-line-1");
});

test("preserves editable labor values and quote notes", () => {
  const draft = createQuoteEditState({
    laborItems: [
      {
        _id: "labor-line-1",
        description: "Brake service",
        hours: 1.5,
        hourlyRate: 120,
      },
    ],
    notes: {
      customerRequest: "Inspect front brakes",
      technicianNotes: "Measure rotors",
    },
  });

  assert.equal(draft.laborItems[0].id, "labor-line-1");
  assert.equal(draft.laborItems[0].hours, 1.5);
  assert.equal(draft.laborItems[0].hourlyRate, 120);
  assert.deepEqual(draft.notes, {
    customerRequest: "Inspect front brakes",
    technicianNotes: "Measure rotors",
  });
});
