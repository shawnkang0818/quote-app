const AVAILABILITY_VALUES = new Set([
  "in_stock",
  "low_stock",
  "out_of_stock",
  "special_order",
  "unknown",
]);
const SOURCE_TYPES = new Set(["manual", "csv", "api"]);
const CURRENCIES = new Set(["USD", "CAD"]);

function cleanText(value) {
  return String(value || "").trim();
}

function optionalNumber(value) {
  return value === undefined || value === null || value === ""
    ? null
    : Number(value);
}

function optionalDate(value) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error("Supplier price contains an invalid date");
    error.status = 400;
    throw error;
  }
  return date;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function caseInsensitiveExact(value) {
  return { $regex: `^${escapeRegex(value)}$`, $options: "i" };
}

// Normalize the request at the API boundary so unknown client fields never
// become supplier data and every import method produces the same document.
export function normalizeSupplierPrice(payload = {}) {
  const availability = cleanText(payload.availability) || "unknown";
  const sourceType = cleanText(payload.sourceType) || "manual";
  const currency = cleanText(payload.currency).toUpperCase() || "USD";

  if (!AVAILABILITY_VALUES.has(availability)) {
    const error = new Error("Unsupported supplier availability value");
    error.status = 400;
    throw error;
  }
  if (!SOURCE_TYPES.has(sourceType)) {
    const error = new Error("Unsupported supplier source type");
    error.status = 400;
    throw error;
  }
  if (!CURRENCIES.has(currency)) {
    const error = new Error("Unsupported supplier price currency");
    error.status = 400;
    throw error;
  }

  const retrievedAt = optionalDate(payload.retrievedAt) || new Date();
  const expiresAt = optionalDate(payload.expiresAt);
  if (expiresAt && expiresAt <= retrievedAt) {
    const error = new Error("Supplier price expiration must be after retrieval");
    error.status = 400;
    throw error;
  }

  return {
    supplierName: cleanText(payload.supplierName),
    supplierPartNumber: cleanText(payload.supplierPartNumber),
    brand: cleanText(payload.brand),
    partName: cleanText(payload.partName),
    category: cleanText(payload.category),
    cost: Number(payload.cost),
    listPrice: optionalNumber(payload.listPrice),
    currency,
    availability,
    quantityAvailable: optionalNumber(payload.quantityAvailable),
    vehicle: {
      year: cleanText(payload.vehicle?.year),
      make: cleanText(payload.vehicle?.make),
      model: cleanText(payload.vehicle?.model),
      engine: cleanText(payload.vehicle?.engine),
    },
    sourceType,
    sourceUrl: cleanText(payload.sourceUrl),
    retrievedAt,
    expiresAt,
    // Supplier data is advisory by default. Only an explicit false from an
    // approved workflow can mark the amount as ready for direct use.
    requiresConfirmation: payload.requiresConfirmation !== false,
    active: payload.active !== false,
  };
}

// Build a bounded filter for the internal search endpoint. Regex terms are
// escaped so punctuation in a part number cannot alter the database query.
export function buildSupplierPriceQuery(params = {}, now = new Date()) {
  const query = {};
  const search = cleanText(params.search);
  if (search) {
    const regex = { $regex: escapeRegex(search), $options: "i" };
    query.$or = [
      { partName: regex },
      { supplierPartNumber: regex },
      { brand: regex },
      { category: regex },
    ];
  }

  if (cleanText(params.supplier)) {
    query.supplierName = caseInsensitiveExact(cleanText(params.supplier));
  }
  if (cleanText(params.year)) query["vehicle.year"] = cleanText(params.year);
  if (cleanText(params.make)) {
    query["vehicle.make"] = caseInsensitiveExact(cleanText(params.make));
  }
  if (cleanText(params.model)) {
    query["vehicle.model"] = caseInsensitiveExact(cleanText(params.model));
  }
  if (AVAILABILITY_VALUES.has(cleanText(params.availability))) {
    query.availability = cleanText(params.availability);
  }

  if (params.includeInactive !== "true") query.active = true;
  if (params.includeExpired !== "true") {
    query.$and = [
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
    ];
  }
  return query;
}

export function parseSupplierPricePagination(params = {}) {
  const page = Math.max(1, Number.parseInt(params.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(params.limit, 10) || 25));
  return { page, limit };
}
