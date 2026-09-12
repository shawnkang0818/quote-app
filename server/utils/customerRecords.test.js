import test from "node:test";
import assert from "node:assert/strict";
import {
  findMatchingVehicleIndex,
  normalizeCustomer,
  normalizePhone,
  normalizeVehicle,
} from "./customerRecords.js";

test("normalizes customer contact fields", () => {
  assert.equal(normalizePhone("(310) 555-0123"), "3105550123");
  assert.deepEqual(
    normalizeCustomer({ name: " Jane ", email: " JANE@EXAMPLE.COM " }),
    { name: "Jane", phone: "", email: "jane@example.com" }
  );
});

test("normalizes vehicle identity and mileage", () => {
  assert.deepEqual(
    normalizeVehicle({ vin: "abc123", licensePlate: "7xyz", mileage: "45000" }),
    {
      year: "",
      make: "",
      model: "",
      vin: "ABC123",
      licensePlate: "7XYZ",
      mileage: 45000,
    }
  );
});

test("matches returning vehicles by VIN before descriptive fields", () => {
  const index = findMatchingVehicleIndex(
    [{ vin: "VIN-1", year: "2020", make: "TOYOTA", model: "CAMRY" }],
    { vin: "VIN-1", year: "2021", make: "TOYOTA", model: "RAV4" }
  );
  assert.equal(index, 0);
});
