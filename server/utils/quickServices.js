export function slugifyServiceName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "service";
}

export function normalizeQuickService(payload = {}) {
  const name = String(payload.name || "").trim();
  const shortCode = String(payload.shortCode || "").trim().toUpperCase();
  const parts = (Array.isArray(payload.parts) ? payload.parts : [])
    .map((part) => ({
      label: String(part.label || "").trim(),
      searchTerms: (Array.isArray(part.searchTerms) ? part.searchTerms : [])
        .map((term) => String(term).trim())
        .filter(Boolean),
    }))
    .filter((part) => part.label || part.searchTerms.length > 0);
  const labor = (Array.isArray(payload.labor) ? payload.labor : [])
    .map((item) => {
      const hourlyRate =
        item.hourlyRate === "" || item.hourlyRate == null
          ? undefined
          : Number(item.hourlyRate);
      return {
        description: String(item.description || "").trim(),
        hours: Number(item.hours),
        ...(hourlyRate === undefined ? {} : { hourlyRate }),
      };
    })
    .filter((item) => item.description || Number.isFinite(item.hours));

  const invalidPart = parts.some(
    (part) => !part.label || part.searchTerms.length === 0
  );
  const invalidLabor = labor.some(
    (item) =>
      !item.description ||
      !Number.isFinite(item.hours) ||
      item.hours <= 0 ||
      (item.hourlyRate !== undefined &&
        (!Number.isFinite(item.hourlyRate) || item.hourlyRate < 0))
  );

  if (!name || !shortCode) {
    throw new Error("Service name and short code are required");
  }
  if (shortCode.length > 4) {
    throw new Error("Short code must be 4 characters or fewer");
  }
  if (parts.length === 0 && labor.length === 0) {
    throw new Error("Add at least one part requirement or labor item");
  }
  if (invalidPart) {
    throw new Error("Every part requirement needs a label and search terms");
  }
  if (invalidLabor) {
    throw new Error("Every labor item needs valid hours and an optional rate");
  }

  return {
    name,
    shortCode,
    description: String(payload.description || "").trim(),
    parts,
    labor,
  };
}
