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

// Quick-service prices are previews only. They use current inventory prices
// and editable labor defaults; the Quote Summary remains authoritative.
export function estimateQuickServicePrice(service, parts, defaultHourlyRate) {
  let missingPartCount = 0;
  const partsTotal = (service.parts || []).reduce((total, requirement) => {
    const matchedPart = findMatchingPart(parts, requirement);
    if (!matchedPart) {
      missingPartCount += 1;
      return total;
    }
    return total + Number(matchedPart.price || 0);
  }, 0);
  const laborTotal = (service.labor || []).reduce(
    (total, labor) =>
      total +
      Number(labor.hours || 0) *
        Number(labor.hourlyRate ?? defaultHourlyRate ?? 0),
    0
  );

  return {
    amount: Math.round((partsTotal + laborTotal + Number.EPSILON) * 100) / 100,
    missingPartCount,
  };
}

const THEMES = {
  oil: { icon: "oil", accent: "text-amber-500", soft: "bg-amber-50" },
  brake: { icon: "brake", accent: "text-red-500", soft: "bg-red-50" },
  tire: { icon: "tire", accent: "text-slate-800", soft: "bg-slate-100" },
  battery: {
    icon: "battery",
    accent: "text-emerald-600",
    soft: "bg-emerald-50",
  },
  inspection: {
    icon: "inspection",
    accent: "text-blue-600",
    soft: "bg-blue-50",
  },
  air: { icon: "air", accent: "text-cyan-600", soft: "bg-cyan-50" },
  default: {
    icon: "service",
    accent: "text-violet-600",
    soft: "bg-violet-50",
  },
};

export function getQuickServiceTheme(service) {
  const identity = normalize(`${service.key || service.id} ${service.name}`);
  const themeKey = Object.keys(THEMES).find(
    (key) => key !== "default" && identity.includes(key)
  );
  return THEMES[themeKey] || THEMES.default;
}
