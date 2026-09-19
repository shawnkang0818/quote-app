import assert from "node:assert/strict";
import test from "node:test";
import { createDateRangeFilter } from "./queryFilters.js";

test("creates an inclusive UTC date range", () => {
  const range = createDateRangeFilter("2026-09-01", "2026-09-13");
  assert.equal(range.$gte.toISOString(), "2026-09-01T00:00:00.000Z");
  assert.equal(range.$lte.toISOString(), "2026-09-13T23:59:59.999Z");
});

test("allows either date boundary to be omitted", () => {
  assert.deepEqual(createDateRangeFilter("2026-09-01", ""), {
    $gte: new Date("2026-09-01T00:00:00.000Z"),
  });
  assert.deepEqual(createDateRangeFilter("", "2026-09-13"), {
    $lte: new Date("2026-09-13T23:59:59.999Z"),
  });
});

test("rejects invalid and reversed calendar dates", () => {
  assert.throws(() => createDateRangeFilter("09/01/2026", "2026-09-13"), {
    message: "Dates must use YYYY-MM-DD format",
    status: 400,
  });
  assert.throws(
    () => createDateRangeFilter("2026-02-30", ""),
    /valid calendar date/
  );
  assert.throws(
    () => createDateRangeFilter("2026-09-14", "2026-09-13"),
    /cannot be later/
  );
});
