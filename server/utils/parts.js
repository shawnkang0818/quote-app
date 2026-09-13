const DEFAULT_LOW_STOCK_THRESHOLD = 5;

function cleanText(value) {
  return String(value || "").trim();
}

// Keep the inventory write boundary explicit so clients cannot persist
// unrelated fields by adding properties to the request body.
export function normalizePart(payload = {}) {
  const thresholdMissing =
    payload.lowStockThreshold === undefined ||
    payload.lowStockThreshold === null ||
    payload.lowStockThreshold === "";

  return {
    name: cleanText(payload.name),
    partNumber: cleanText(payload.partNumber),
    brand: cleanText(payload.brand),
    category: cleanText(payload.category),
    price: Number(payload.price),
    quantity: Number(payload.quantity),
    lowStockThreshold: thresholdMissing
      ? DEFAULT_LOW_STOCK_THRESHOLD
      : Number(payload.lowStockThreshold),
  };
}

export { DEFAULT_LOW_STOCK_THRESHOLD };
