import { apiRequest } from "./apiClient";

function getAdminHeaders(adminToken, includeContentType = false) {
  return {
    ...(includeContentType ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${adminToken}`,
  };
}

export function getParts() {
  return apiRequest("/parts");
}

export function createPart(part, adminToken) {
  return apiRequest("/parts", {
    method: "POST",
    headers: getAdminHeaders(adminToken, true),
    body: JSON.stringify(part),
  });
}

export function updatePart(id, part, adminToken) {
  return apiRequest(`/parts/${id}`, {
    method: "PUT",
    headers: getAdminHeaders(adminToken, true),
    body: JSON.stringify(part),
  });
}

export function deletePart(id, adminToken) {
  return apiRequest(`/parts/${id}`, {
    method: "DELETE",
    headers: getAdminHeaders(adminToken),
  });
}
