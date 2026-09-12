import test from "node:test";
import assert from "node:assert/strict";
import {
  findMatchingVehicleIndex,
  normalizeCustomer,
  normalizeCustomerRecord,
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

test("normalizes an editable customer record and removes duplicate vehicles", () => {
  assert.deepEqual(
    normalizeCustomerRecord({
      name: " Jane Doe ",
      phone: "(310) 555-0100",
      email: " JANE@EXAMPLE.COM ",
      vehicles: [
        { year: "2022", make: "Toyota", model: "Camry", vin: "abc" },
        { year: "2023", make: "Toyota", model: "RAV4", vin: "ABC" },
      ],
    }),
    {
      name: "Jane Doe",
      phone: "(310) 555-0100",
      phoneNormalized: "3105550100",
      email: "jane@example.com",
      emailNormalized: "jane@example.com",
      vehicles: [
        {
          year: "2023",
          make: "Toyota",
          model: "RAV4",
          vin: "ABC",
          licensePlate: "",
          mileage: undefined,
        },
      ],
    }
  );
});

test("requires customer identity for a managed record", () => {
  assert.throws(() => normalizeCustomerRecord({ name: "" }), {
    message: "Customer name is required",
  });
  assert.throws(() => normalizeCustomerRecord({ name: "Walk-in" }), {
    message: "Enter a phone number or email address",
  });
});
