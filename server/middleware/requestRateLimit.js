// A lightweight in-memory limiter is sufficient for the single Fly Machine
// planned for this MVP. A shared store can replace it when the app scales to
// multiple servers or introduces full employee accounts.
export function createRequestRateLimit({
  limit,
  windowMs,
  message = "Too many requests. Please try again later.",
  now = Date.now,
}) {
  const clients = new Map();

  return function requestRateLimit(req, res, next) {
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const currentTime = now();
    const existing = clients.get(key);
    const entry =
      !existing || existing.resetAt <= currentTime
        ? { count: 0, resetAt: currentTime + windowMs }
        : existing;

    entry.count += 1;
    clients.set(key, entry);

    if (entry.count > limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((entry.resetAt - currentTime) / 1000)
      );
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ message });
    }

    return next();
  };
}
