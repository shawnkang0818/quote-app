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

      // Keep the required part visible instead of silently producing a
      // labor-only quote. A zero-valued pending row is safe in a Draft, but
      // must receive an explicit selling price before PDF or Final output.
      const pendingIndex = nextQuoteItems.findIndex(
        (item) =>
          item.pricePending === true &&
          normalize(item.requirementLabel) === normalize(requirement.label)
      );
      if (pendingIndex >= 0) {
        nextQuoteItems[pendingIndex] = {
          ...nextQuoteItems[pendingIndex],
          quoteQuantity: nextQuoteItems[pendingIndex].quoteQuantity + 1,
        };
      } else {
        nextQuoteItems.push({
          _id: idFactory(),
          isCustom: true,
          name: requirement.label,
          price: 0,
          pricePending: true,
          quoteQuantity: 1,
          requirementLabel: requirement.label,
          source: "quick-service",
          sourceLabel: service.name,
        });
      }
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
