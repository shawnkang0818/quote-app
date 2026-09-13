function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function matchesCatalogSearch(item, query) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;

  // Optional inventory metadata is included now so adding SKU, brand, and
  // category fields later will not require another search implementation.
  const searchableValues = [
    item.name,
    item.description,
    item.shortCode,
    item.partNumber,
    item.sku,
    item.brand,
    item.category,
    ...(item.parts || []).flatMap((part) => [
      part.label,
      ...(part.searchTerms || []),
    ]),
    ...(item.labor || []).map((labor) => labor.description),
  ];

  return searchableValues.some((value) =>
    normalize(value).includes(normalizedQuery)
  );
}

export function filterCatalogItems(items, query) {
  return items.filter((item) => matchesCatalogSearch(item, query));
}
