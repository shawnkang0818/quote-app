import { apiRequest } from "./apiClient";

function adminHeaders(adminToken, includeContentType = false) {
  return {
    ...(includeContentType ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${adminToken}`,
  };
}

export function getSupplierPrices(filters, adminToken) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) {
      params.set(key, value);
    }
  });
  return apiRequest(`/supplier-prices?${params.toString()}`, {
    headers: adminHeaders(adminToken),
  });
}

export function createSupplierPrice(payload, adminToken) {
  return apiRequest("/supplier-prices", {
    method: "POST",
    headers: adminHeaders(adminToken, true),
    body: JSON.stringify(payload),
  });
}

export function updateSupplierPrice(id, payload, adminToken) {
  return apiRequest(`/supplier-prices/${id}`, {
    method: "PUT",
    headers: adminHeaders(adminToken, true),
    body: JSON.stringify(payload),
  });
}
