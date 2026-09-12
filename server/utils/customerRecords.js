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

// Customer-management writes use stricter rules than quote snapshots: a saved
// record needs a real name and at least one stable contact method for matching.
export function normalizeCustomerRecord(customer = {}) {
  const name = String(customer.name || "").trim();
  const phone = String(customer.phone || "").trim();
  const email = normalizeEmail(customer.email);
  const notes = String(customer.notes || "").trim();

  if (!name) {
    const error = new Error("Customer name is required");
    error.status = 400;
    throw error;
  }
  if (!phone && !email) {
    const error = new Error("Enter a phone number or email address");
    error.status = 400;
    throw error;
  }
  if (notes.length > 2000) {
    const error = new Error("Customer notes must be 2000 characters or fewer");
    error.status = 400;
    throw error;
  }

  const tagValues = Array.isArray(customer.tags)
    ? customer.tags
    : String(customer.tags || "").split(",");
  const tags = [];
  const tagKeys = new Set();
  for (const value of tagValues) {
    const tag = String(value || "").trim();
    if (!tag) continue;
    if (tag.length > 30) {
      const error = new Error("Each customer tag must be 30 characters or fewer");
      error.status = 400;
      throw error;
    }
    const key = tag.toLowerCase();
    if (!tagKeys.has(key)) {
      tagKeys.add(key);
      tags.push(tag);
    }
  }
  if (tags.length > 12) {
    const error = new Error("A customer can have up to 12 tags");
    error.status = 400;
    throw error;
  }

  const vehicles = [];
  for (const rawVehicle of Array.isArray(customer.vehicles)
    ? customer.vehicles
    : []) {
    const vehicle = normalizeVehicle(rawVehicle);
    const hasIdentity = Boolean(
      vehicle.year ||
        vehicle.make ||
        vehicle.model ||
        vehicle.vin ||
        vehicle.licensePlate
    );
    if (!hasIdentity) continue;

    // Repeated VIN, plate, or Year/Make/Model rows collapse into one record.
    const existingIndex = findMatchingVehicleIndex(vehicles, vehicle);
    if (existingIndex >= 0) {
      vehicles[existingIndex] = { ...vehicles[existingIndex], ...vehicle };
    } else {
      vehicles.push(vehicle);
    }
  }

  return {
    name,
    phone,
    phoneNormalized: normalizePhone(phone),
    email,
    emailNormalized: email,
    notes,
    tags,
    vehicles,
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
