import assert from "node:assert/strict";
import test from "node:test";
import { createRequestRateLimit } from "./requestRateLimit.js";

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    set(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("blocks requests after the configured limit", () => {
  const limiter = createRequestRateLimit({ limit: 2, windowMs: 60_000 });
  const req = { ip: "127.0.0.1" };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const res = createResponse();
    let continued = false;
    limiter(req, res, () => {
      continued = true;
    });
    assert.equal(continued, true);
  }

  const blocked = createResponse();
  limiter(req, blocked, () => assert.fail("request should be blocked"));
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.headers["Retry-After"], "60");
});

test("starts a fresh window after the previous window expires", () => {
  let currentTime = 1_000;
  const limiter = createRequestRateLimit({
    limit: 1,
    windowMs: 500,
    now: () => currentTime,
  });
  const req = { ip: "shop-user" };

  limiter(req, createResponse(), () => {});
  currentTime = 1_501;

  let continued = false;
  limiter(req, createResponse(), () => {
    continued = true;
  });
  assert.equal(continued, true);
});
