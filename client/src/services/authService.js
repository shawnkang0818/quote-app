import { apiRequest } from "./apiClient";

export function loginAdmin(password) {
  return apiRequest("/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}

export function logoutAdmin(token) {
  return apiRequest("/admin/session", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function verifyAdminSession(token) {
  return apiRequest("/admin/session", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getStoredAdminToken() {
  return sessionStorage.getItem("adminToken") || "";
}
