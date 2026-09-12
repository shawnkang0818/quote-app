import { apiRequest } from "./apiClient";

export function getBusinessSettings() {
  return apiRequest("/settings");
}

export function updateBusinessSettings(settings, token) {
  return apiRequest("/settings", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });
}
