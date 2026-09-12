// Route state should contain only the fields needed to start a quote. Keeping
// database IDs and timestamps out prevents the new draft from depending on a
// Customer document's internal shape.
export function createQuotePrefill(customer = {}, vehicle = {}) {
  return {
    customer: {
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
    },
    vehicle: {
      year: vehicle.year || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      vin: vehicle.vin || "",
      licensePlate: vehicle.licensePlate || "",
      mileage: vehicle.mileage ?? "",
    },
  };
}
