function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function findMatchingPart(parts, requirement) {
  return parts.find((part) => {
    const partName = normalize(part.name);
    return requirement.searchTerms.some((term) =>
      partName.includes(normalize(term))
    );
  });
}

// Builds the next quote state in one operation. This avoids partial updates
// when a service contains multiple parts and keeps stock limits intact.
export function applyQuickService({
  service,
  parts,
  quoteItems,
  laborItems,
  idFactory = () => crypto.randomUUID(),
}) {
  const nextQuoteItems = [...quoteItems];
  const missingParts = [];

  service.parts.forEach((requirement) => {
    const matchedPart = findMatchingPart(parts, requirement);
    const existingIndex = matchedPart
      ? nextQuoteItems.findIndex((item) => item._id === matchedPart._id)
      : -1;
    const existingQuantity =
      existingIndex >= 0 ? nextQuoteItems[existingIndex].quoteQuantity : 0;

    if (
      !matchedPart ||
      Number(matchedPart.quantity) <= existingQuantity
    ) {
      missingParts.push(requirement.label);
      return;
    }

    if (existingIndex >= 0) {
      nextQuoteItems[existingIndex] = {
        ...nextQuoteItems[existingIndex],
        quoteQuantity: existingQuantity + 1,
      };
    } else {
      nextQuoteItems.push({ ...matchedPart, quoteQuantity: 1 });
    }
  });

  const newLaborItems = service.labor.map((labor) => ({
    ...labor,
    id: idFactory(),
  }));

  return {
    laborItems: [...laborItems, ...newLaborItems],
    missingParts,
    quoteItems: nextQuoteItems,
  };
}
