export function createQuoteEditState(quote) {
  return {
    quoteItems: (quote?.items || []).map((item) => ({
      ...item,
      // Inventory controls identify a row by Part ID. Custom lines have no
      // Part ID, so their saved quote-line ID remains their local identity.
      _id: item.isCustom ? item._id : item.partId?._id || item.partId,
    })),
    laborItems: (quote?.laborItems || []).map((item) => ({
      ...item,
      id: item._id || crypto.randomUUID(),
    })),
    notes: {
      customerRequest: quote?.notes?.customerRequest || "",
      technicianNotes: quote?.notes?.technicianNotes || "",
    },
  };
}
