const DEFAULT_VALIDITY_DAYS = 30;

function validDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

// An unsaved browser preview is always a draft, even when the user plans to
// save it as Final. A permanent quote number is required for a final document.
export function createQuoteDocumentMeta({
  quoteDate,
  quoteStatus = "draft",
  quoteValidityDays = DEFAULT_VALIDITY_DAYS,
  savedQuoteNumber = "",
  timestamp = Date.now(),
} = {}) {
  const issuedDate = validDate(quoteDate);
  const validityDays = Number(quoteValidityDays);
  const safeValidityDays =
    Number.isFinite(validityDays) && validityDays > 0
      ? validityDays
      : DEFAULT_VALIDITY_DAYS;
  const validUntil = new Date(issuedDate);
  validUntil.setDate(validUntil.getDate() + safeValidityDays);

  const isFinal = Boolean(savedQuoteNumber) && quoteStatus === "final";

  return {
    isDraft: !isFinal,
    issuedDate,
    quoteNumber: savedQuoteNumber || `DRAFT-${timestamp}`,
    statusLabel: isFinal ? "FINAL" : "DRAFT",
    validUntil,
  };
}
