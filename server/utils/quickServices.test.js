import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeQuickService,
  slugifyServiceName,
} from "./quickServices.js";

test("normalizes a configurable service template", () => {
  assert.deepEqual(
    normalizeQuickService({
      name: " Oil Change ",
      shortCode: "oc",
      parts: [{ label: "Oil", searchTerms: [" motor oil ", ""] }],
      labor: [{ description: "Install", hours: "0.5", hourlyRate: "" }],
    }),
    {
      name: "Oil Change",
      shortCode: "OC",
      description: "",
      parts: [{ label: "Oil", searchTerms: ["motor oil"] }],
      labor: [{ description: "Install", hours: 0.5 }],
    }
  );
});

test("rejects a template without billable content", () => {
  assert.throws(
    () => normalizeQuickService({ name: "Empty", shortCode: "E" }),
    /at least one part requirement or labor item/
  );
});

test("creates stable URL-safe service keys", () => {
  assert.equal(slugifyServiceName("Front Brake Service"), "front-brake-service");
});
