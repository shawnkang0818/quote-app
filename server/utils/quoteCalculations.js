export const DEFAULT_TAX_RATE = 0.0875;

export function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

// Validate labor separately from total calculation so the API can return a
// clear client error before attempting to save an invalid quote.
export function isValidLaborItem(item) {
  const hours = Number(item.hours);
  const hourlyRate = Number(item.hourlyRate);

  return (
    Boolean(item.description?.trim()) &&
    Number.isFinite(hours) &&
    hours > 0 &&
    Number.isFinite(hourlyRate) &&
    hourlyRate >= 0
  );
}

// Custom lines are intentionally separate from inventory-backed parts. They
// support one-off materials or fees while keeping quantities predictable.
export function isValidCustomItem(item) {
  const quantity = Number(item.quoteQuantity);
  const price = Number(item.price);

  return (
    item.isCustom === true &&
    Boolean(item.name?.trim()) &&
    item.name.trim().length <= 160 &&
    Number.isInteger(quantity) &&
    quantity >= 1 &&
    quantity <= 999 &&
    Number.isFinite(price) &&
    price >= 0
  );
}

export function calculateQuoteTotals({
  items = [],
  laborItems = [],
  taxRate = DEFAULT_TAX_RATE,
}) {
  const partsSubtotal = roundCurrency(
    items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quoteQuantity),
      0
    )
  );
  const laborTotal = roundCurrency(
    laborItems.reduce(
      (sum, item) => sum + Number(item.hours) * Number(item.hourlyRate),
      0
    )
  );
  const subtotal = roundCurrency(partsSubtotal + laborTotal);
  const taxAmount = roundCurrency(subtotal * Number(taxRate));
  const grandTotal = roundCurrency(subtotal + taxAmount);

  return {
    partsSubtotal,
    laborTotal,
    subtotal,
    taxRate: Number(taxRate),
    taxAmount,
    grandTotal,
  };
}
