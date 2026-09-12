import test from "node:test";
import assert from "node:assert/strict";
import {
  createBusinessSnapshot,
  normalizeBusinessSettings,
} from "./businessSettings.js";

test("normalizes editable business settings", () => {
  const settings = normalizeBusinessSettings({
    companyName: "  Shawn's Garage  ",
    address: "  Los Angeles, CA ",
    phone: "555-0100",
    email: "shop@example.com",
    taxRate: "0.095",
    defaultHourlyRate: "135",
    quoteValidityDays: "14",
    quoteNotes: "Valid for fourteen days.",
  });

  assert.equal(settings.companyName, "Shawn's Garage");
  assert.equal(settings.taxRate, 0.095);
  assert.equal(settings.defaultHourlyRate, 135);
  assert.equal(settings.quoteValidityDays, 14);
});

test("rejects tax rates outside the supported range", () => {
  assert.throws(
    () =>
      normalizeBusinessSettings({
        companyName: "Garage",
        taxRate: 1.5,
        defaultHourlyRate: 100,
        quoteValidityDays: 30,
      }),
    /Tax rate/
  );
});

test("creates an immutable quote-facing business snapshot", () => {
  const snapshot = createBusinessSnapshot({
    companyName: "Garage",
    address: "CA",
    phone: "555",
    email: "hello@example.com",
    quoteValidityDays: 30,
    quoteNotes: "Thank you",
    defaultHourlyRate: 125,
    taxRate: 0.1,
  });

  assert.deepEqual(Object.keys(snapshot), [
    "companyName",
    "address",
    "phone",
    "email",
    "quoteValidityDays",
    "quoteNotes",
  ]);
});
