export const DEFAULT_TAX_RATE = 0.0875;

export function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateQuoteTotals({ items = [], laborItems = [], taxRate = DEFAULT_TAX_RATE }) {
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

  return { partsSubtotal, laborTotal, subtotal, taxRate: Number(taxRate), taxAmount, grandTotal };
}
