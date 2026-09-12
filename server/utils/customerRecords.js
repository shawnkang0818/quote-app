export function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function normalizeCustomer(customer = {}, fallbackName = "") {
  return {
    name: String(customer.name || fallbackName || "Walk-in Customer").trim(),
    phone: String(customer.phone || "").trim(),
    email: normalizeEmail(customer.email),
  };
}

export function normalizeVehicle(vehicle = {}) {
  const mileage = Number(vehicle.mileage);
  return {
    year: String(vehicle.year || "").trim(),
    make: String(vehicle.make || "").trim(),
    model: String(vehicle.model || "").trim(),
    vin: String(vehicle.vin || "").trim().toUpperCase(),
    licensePlate: String(vehicle.licensePlate || "").trim().toUpperCase(),
    mileage: Number.isFinite(mileage) && mileage >= 0 ? mileage : undefined,
  };
}

// VIN and plate are strongest identifiers. Older vehicles without either use
// their Year/Make/Model combination to avoid adding the same car repeatedly.
export function findMatchingVehicleIndex(vehicles, candidate) {
  return vehicles.findIndex((vehicle) => {
    if (candidate.vin && vehicle.vin === candidate.vin) return true;
    if (
      candidate.licensePlate &&
      vehicle.licensePlate === candidate.licensePlate
    ) {
      return true;
    }
    return (
      candidate.year &&
      candidate.make &&
      candidate.model &&
      vehicle.year === candidate.year &&
      vehicle.make === candidate.make &&
      vehicle.model === candidate.model
    );
  });
}
