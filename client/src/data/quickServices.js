// Quick-service templates describe common shop jobs without duplicating
// inventory data. Each part matcher looks up a real Part from MongoDB before
// it is added, so saved quotes always contain a valid inventory part ID.
export const QUICK_SERVICES = [
  {
    id: "oil-change",
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
    labor: [
      { description: "Oil change service", hours: 0.5, hourlyRate: 100 },
    ],
  },
  {
    id: "front-brakes",
    name: "Front Brake Service",
    shortCode: "FB",
    description: "Front brake pads and replacement labor",
    parts: [
      {
        label: "Brake pads",
        searchTerms: ["front brake pad", "brake pad"],
      },
    ],
    labor: [
      {
        description: "Front brake pad replacement",
        hours: 1.5,
        hourlyRate: 120,
      },
    ],
  },
  {
    id: "tire-rotation",
    name: "Tire Rotation",
    shortCode: "TR",
    description: "Rotate and inspect four tires",
    parts: [],
    labor: [
      { description: "Tire rotation", hours: 0.5, hourlyRate: 100 },
    ],
  },
  {
    id: "battery",
    name: "Battery Replacement",
    shortCode: "BR",
    description: "Battery and installation labor",
    parts: [{ label: "Battery", searchTerms: ["battery"] }],
    labor: [
      { description: "Battery replacement", hours: 0.5, hourlyRate: 100 },
    ],
  },
  {
    id: "inspection",
    name: "Vehicle Inspection",
    shortCode: "VI",
    description: "General safety and maintenance inspection",
    parts: [],
    labor: [
      { description: "Vehicle inspection", hours: 1, hourlyRate: 100 },
    ],
  },
  {
    id: "air-filter",
    name: "Air Filter",
    shortCode: "AF",
    description: "Engine air filter and installation labor",
    parts: [
      {
        label: "Air filter",
        searchTerms: ["engine air filter", "air filter"],
      },
    ],
    labor: [
      { description: "Air filter replacement", hours: 0.3, hourlyRate: 100 },
    ],
  },
];
