import test from "node:test";
import assert from "node:assert/strict";
import { createQuotePrefill } from "./customerPrefill.js";

test("creates a clean customer and vehicle draft", () => {
  assert.deepEqual(
    createQuotePrefill(
      {
        _id: "customer-id",
        name: "Jane Doe",
        phone: "310-555-0100",
        email: "jane@example.com",
      },
      {
        _id: "vehicle-id",
        year: "2022",
        make: "Toyota",
        model: "Camry",
        vin: "VIN123",
        licensePlate: "8ABC123",
        mileage: 42000,
      }
    ),
    {
      customer: {
        name: "Jane Doe",
        phone: "310-555-0100",
        email: "jane@example.com",
      },
      vehicle: {
        year: "2022",
        make: "Toyota",
        model: "Camry",
        vin: "VIN123",
        licensePlate: "8ABC123",
        mileage: 42000,
      },
    }
  );
});

test("supplies blank optional fields for a customer-only selection", () => {
  const prefill = createQuotePrefill({ name: "Walk-in" });
  assert.equal(prefill.customer.name, "Walk-in");
  assert.equal(prefill.vehicle.year, "");
  assert.equal(prefill.vehicle.mileage, "");
});
