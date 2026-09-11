import { randomBytes, timingSafeEqual } from "node:crypto";

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const sessions = new Map();

function passwordsMatch(provided, expected) {
  const providedBuffer = Buffer.from(String(provided || ""));
  const expectedBuffer = Buffer.from(String(expected || ""));

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export function createAdminSession(password) {
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD is not configured");
  }
  if (!passwordsMatch(password, process.env.ADMIN_PASSWORD)) return null;

  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  sessions.set(token, expiresAt);
  return { token, expiresAt };
}

export function revokeAdminSession(token) {
  sessions.delete(token);
}

export function adminAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  const expiresAt = sessions.get(token);

  if (!token || !expiresAt || expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ message: "Admin session is missing or expired" });
  }

  next();
}
