import test from "node:test";
import assert from "node:assert/strict";
import { normalizeVin, normalizeVinDecodeResult } from "./vinDecoder.js";

test("normalizes a valid VIN to uppercase", () => {
  assert.equal(normalizeVin("1g1zf575x9f255262"), "1G1ZF575X9F255262");
});

test("rejects an incomplete VIN and forbidden letters", () => {
  assert.throws(() => normalizeVin("SHORT"), { status: 400 });
  assert.throws(() => normalizeVin("1G1ZF575X9F25526I"), { status: 400 });
});

test("extracts the vehicle fields used by the quote form", () => {
  assert.deepEqual(
    normalizeVinDecodeResult(
      {
        Results: [
          {
            ErrorCode: "0",
            ModelYear: "2009",
            Make: "CHEVROLET",
            Model: "Malibu",
            VehicleType: "PASSENGER CAR",
          },
        ],
      },
      "1G1ZF575X9F255262"
    ),
    {
      vin: "1G1ZF575X9F255262",
      year: "2009",
      make: "CHEVROLET",
      model: "Malibu",
      vehicleType: "PASSENGER CAR",
      warning: "",
    }
  );
});

test("rejects provider results without usable vehicle identity", () => {
  assert.throws(
    () =>
      normalizeVinDecodeResult(
        { Results: [{ ErrorCode: "1", ErrorText: "Invalid VIN" }] },
        "1G1ZF575X9F255262"
      ),
    { message: "Invalid VIN", status: 422 }
  );
});
