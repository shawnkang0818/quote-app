// These templates seed a new database once. After the first load, the shop's
// administrators own the records and may edit or delete them from the UI.
export const DEFAULT_QUICK_SERVICES = [
  {
    key: "oil-change",
    name: "Oil Change",
    shortCode: "OC",
    description: "Engine oil, filter, and installation labor",
    parts: [
      {
        label: "Engine oil",
        searchTerms: ["engine oil", "motor oil", "synthetic oil"],
      },
      { label: "Oil filter", searchTerms: ["oil filter"] },
    ],
    labor: [{ description: "Oil change service", hours: 0.5 }],
  },
  {
    key: "front-brakes",
    name: "Front Brake Service",
    shortCode: "FB",
    description: "Front brake pads and replacement labor",
    parts: [
      {
        label: "Brake pads",
        searchTerms: ["front brake pad", "brake pad"],
      },
    ],
    labor: [{ description: "Front brake pad replacement", hours: 1.5 }],
  },
  {
    key: "tire-rotation",
    name: "Tire Rotation",
    shortCode: "TR",
    description: "Rotate and inspect four tires",
    parts: [],
    labor: [{ description: "Tire rotation", hours: 0.5 }],
  },
  {
    key: "battery",
    name: "Battery Replacement",
    shortCode: "BR",
    description: "Battery and installation labor",
    parts: [{ label: "Battery", searchTerms: ["battery"] }],
    labor: [{ description: "Battery replacement", hours: 0.5 }],
  },
  {
    key: "inspection",
    name: "Vehicle Inspection",
    shortCode: "VI",
    description: "General safety and maintenance inspection",
    parts: [],
    labor: [{ description: "Vehicle inspection", hours: 1 }],
  },
  {
    key: "air-filter",
    name: "Air Filter",
    shortCode: "AF",
    description: "Engine air filter and installation labor",
    parts: [
      {
        label: "Air filter",
        searchTerms: ["engine air filter", "air filter"],
      },
    ],
    labor: [{ description: "Air filter replacement", hours: 0.3 }],
  },
];
