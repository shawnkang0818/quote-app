export const DEFAULT_BUSINESS_SETTINGS = Object.freeze({
  companyName: "Auto Parts Quote System",
  address: "Brooklyn, NY",
  phone: "(555) 123-4567",
  email: "sales@example.com",
  taxRate: 0.0875,
  defaultHourlyRate: 100,
  quoteValidityDays: 30,
  quoteNotes:
    "Thank you for your business. Prices are subject to change without notice.",
});

function numberWithin(value, { field, min, max }) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    const error = new Error(`${field} must be between ${min} and ${max}`);
    error.status = 400;
    throw error;
  }
  return number;
}

// Accept only the editable settings fields and normalize numeric values before
// they reach Mongoose. This also prevents clients from changing the singleton key.
export function normalizeBusinessSettings(input = {}) {
  const companyName = String(input.companyName || "").trim();
  if (!companyName) {
    const error = new Error("Company name is required");
    error.status = 400;
    throw error;
  }

  return {
    companyName,
    address: String(input.address || "").trim(),
    phone: String(input.phone || "").trim(),
    email: String(input.email || "").trim(),
    taxRate: numberWithin(input.taxRate, {
      field: "Tax rate",
      min: 0,
      max: 1,
    }),
    defaultHourlyRate: numberWithin(input.defaultHourlyRate, {
      field: "Default hourly rate",
      min: 0,
      max: 10000,
    }),
    quoteValidityDays: Math.round(
      numberWithin(input.quoteValidityDays, {
        field: "Quote validity days",
        min: 1,
        max: 365,
      })
    ),
    quoteNotes: String(input.quoteNotes || "").trim(),
  };
}

// Saved quotes keep a business-information snapshot so later Settings changes
// do not rewrite the identity or terms shown on an older quotation.
export function createBusinessSnapshot(settings) {
  return {
    companyName: settings.companyName,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    quoteValidityDays: settings.quoteValidityDays,
    quoteNotes: settings.quoteNotes,
  };
}
