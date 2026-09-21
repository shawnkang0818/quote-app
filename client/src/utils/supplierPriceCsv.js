export const SUPPLIER_PRICE_CSV_HEADERS = [
  "supplierName",
  "supplierPartNumber",
  "brand",
  "partName",
  "category",
  "cost",
  "listPrice",
  "currency",
  "availability",
  "quantityAvailable",
  "year",
  "make",
  "model",
  "engine",
  "sourceUrl",
  "retrievedAt",
  "expiresAt",
  "requiresConfirmation",
  "active",
];

const REQUIRED_HEADERS = [
  "supplierName",
  "supplierPartNumber",
  "partName",
  "cost",
];
const AVAILABILITY_VALUES = new Set([
  "in_stock",
  "low_stock",
  "out_of_stock",
  "special_order",
  "unknown",
]);
const CURRENCIES = new Set(["USD", "CAD"]);

// This small parser supports commas, quoted cells, escaped quotes, and line
// breaks inside quoted values without adding a large dependency to the client.
export function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error("CSV contains an unclosed quoted value");
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function parseBoolean(value, defaultValue) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return defaultValue;
  if (["true", "yes", "1"].includes(normalized)) return true;
  if (["false", "no", "0"].includes(normalized)) return false;
  return null;
}

function parseOptionalNumber(value) {
  return value === undefined || value === null || value === ""
    ? null
    : Number(value);
}

function mapRow(headers, values) {
  return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
}

function validateAndMapRow(record, rowNumber) {
  const errors = [];
  REQUIRED_HEADERS.forEach((header) => {
    if (!record[header]) errors.push(`${header} is required`);
  });

  const cost = Number(record.cost);
  const listPrice = parseOptionalNumber(record.listPrice);
  const quantityAvailable = parseOptionalNumber(record.quantityAvailable);
  const currency = (record.currency || "USD").toUpperCase();
  const availability = record.availability || "unknown";
  const requiresConfirmation = parseBoolean(record.requiresConfirmation, true);
  const active = parseBoolean(record.active, true);

  if (record.cost && (!Number.isFinite(cost) || cost < 0)) errors.push("cost must be zero or greater");
  if (listPrice !== null && (!Number.isFinite(listPrice) || listPrice < 0)) errors.push("listPrice must be zero or greater");
  if (quantityAvailable !== null && (!Number.isInteger(quantityAvailable) || quantityAvailable < 0)) errors.push("quantityAvailable must be a whole number");
  if (!CURRENCIES.has(currency)) errors.push("currency must be USD or CAD");
  if (!AVAILABILITY_VALUES.has(availability)) errors.push("availability is not supported");
  if (requiresConfirmation === null) errors.push("requiresConfirmation must be true or false");
  if (active === null) errors.push("active must be true or false");
  ["retrievedAt", "expiresAt"].forEach((field) => {
    if (record[field] && Number.isNaN(new Date(record[field]).getTime())) {
      errors.push(`${field} is not a valid date`);
    }
  });

  return {
    rowNumber,
    errors,
    item: {
      supplierName: record.supplierName,
      supplierPartNumber: record.supplierPartNumber,
      brand: record.brand,
      partName: record.partName,
      category: record.category,
      cost,
      listPrice,
      currency,
      availability,
      quantityAvailable,
      vehicle: {
        year: record.year,
        make: record.make,
        model: record.model,
        engine: record.engine,
      },
      sourceUrl: record.sourceUrl,
      retrievedAt: record.retrievedAt || undefined,
      expiresAt: record.expiresAt || null,
      requiresConfirmation,
      active,
    },
  };
}

export function parseSupplierPriceCsv(text) {
  const rows = parseCsvRows(String(text || "").replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("CSV must include a header and at least one data row");
  if (rows.length - 1 > 500) throw new Error("CSV cannot contain more than 500 data rows");

  const headers = rows[0];
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missingHeaders.length) {
    throw new Error(`Missing required column(s): ${missingHeaders.join(", ")}`);
  }

  const preview = rows.slice(1).map((values, index) =>
    validateAndMapRow(mapRow(headers, values), index + 2)
  );
  const seenIdentities = new Map();
  preview.forEach((row) => {
    const identity = [
      row.item.supplierName,
      row.item.supplierPartNumber,
      row.item.vehicle.year,
      row.item.vehicle.make,
      row.item.vehicle.model,
      row.item.vehicle.engine,
    ]
      .map((value) => String(value || "").trim().toLowerCase())
      .join("|");
    if (seenIdentities.has(identity)) {
      row.errors.push(`duplicates CSV row ${seenIdentities.get(identity)}`);
    } else {
      seenIdentities.set(identity, row.rowNumber);
    }
  });
  return preview;
}

export function createSupplierPriceCsvTemplate() {
  const example = [
    "Example Auto Supply",
    "PH4967",
    "Fram",
    "Oil Filter",
    "Filters",
    "8.49",
    "12.99",
    "USD",
    "in_stock",
    "10",
    "2020",
    "Toyota",
    "Camry",
    "2.5L",
    "",
    new Date().toISOString(),
    "",
    "true",
    "true",
  ];
  return `${SUPPLIER_PRICE_CSV_HEADERS.join(",")}\n${example.join(",")}\n`;
}
