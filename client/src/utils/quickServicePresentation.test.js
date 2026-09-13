import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateQuickServicePrice,
  getQuickServiceTheme,
} from "./quickServicePresentation.js";

test("estimates a service from matching inventory and labor defaults", () => {
  const estimate = estimateQuickServicePrice(
    {
      parts: [{ searchTerms: ["oil filter"] }],
      labor: [{ hours: 0.5 }],
    },
    [{ name: "Premium Oil Filter", price: 14.99 }],
    100
  );

  assert.deepEqual(estimate, { amount: 64.99, missingPartCount: 0 });
});

test("reports missing parts while retaining known labor cost", () => {
  const estimate = estimateQuickServicePrice(
    {
      parts: [{ searchTerms: ["battery"] }],
      labor: [{ hours: 0.5, hourlyRate: 120 }],
    },
    [],
    100
  );

  assert.deepEqual(estimate, { amount: 60, missingPartCount: 1 });
});

test("assigns a stable visual theme from the service identity", () => {
  assert.equal(getQuickServiceTheme({ key: "front-brakes" }).icon, "brake");
  assert.equal(getQuickServiceTheme({ name: "Custom Tune Up" }).icon, "service");
});
