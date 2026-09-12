function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

export function matchesCatalogSearch(item, query) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;

  // Service templates contain useful search terms inside their parts and
  // labor definitions, while inventory records currently use only name.
  const searchableValues = [
    item.name,
    item.description,
    item.shortCode,
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
