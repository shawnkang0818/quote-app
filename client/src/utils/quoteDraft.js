function hasValue(value) {
  return String(value ?? "").trim().length > 0;
}

// Once a quote has a saved number, its current snapshot is safe to replace.
// Any later edit clears that number through markDraftChanged and becomes dirty.
export function hasUnsavedQuote({
  customer = {},
  laborItems = [],
  notes = {},
  quoteItems = [],
  savedQuoteNumber = "",
  vehicle = {},
}) {
  if (savedQuoteNumber) return false;

  return (
    quoteItems.length > 0 ||
    laborItems.length > 0 ||
    Object.values(customer).some(hasValue) ||
    Object.values(vehicle).some(hasValue) ||
    Object.values(notes).some(hasValue)
  );
}
