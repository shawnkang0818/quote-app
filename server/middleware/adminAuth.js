export const adminAuth = (req, res, next) => {
  const adminPassword = req.headers["x-admin-password"];

  if (!adminPassword) {
    return res.status(401).json({ message: "Admin password is required" });
  }

  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ message: "Invalid admin password" });
  }

  next();
};