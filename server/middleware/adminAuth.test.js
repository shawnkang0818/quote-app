import test from "node:test";
import assert from "node:assert/strict";
import { adminAuth, createAdminSession } from "./adminAuth.js";

test("creates a session only for the configured password", () => {
  process.env.ADMIN_PASSWORD = "test-secret";
  assert.equal(createAdminSession("wrong"), null);
  assert.ok(createAdminSession("test-secret")?.token);
});

test("accepts a valid bearer token", () => {
  process.env.ADMIN_PASSWORD = "test-secret";
  const session = createAdminSession("test-secret");
  let called = false;
  const req = { headers: { authorization: `Bearer ${session.token}` } };
  const res = {
    status() {
      throw new Error("valid token should not be rejected");
    },
  };

  adminAuth(req, res, () => {
    called = true;
  });
  assert.equal(called, true);
});
