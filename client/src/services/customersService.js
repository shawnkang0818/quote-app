import { apiRequest } from "./apiClient";

export function getCustomers(search, token) {
  const query = new URLSearchParams();
  if (search.trim()) query.set("search", search.trim());
  return apiRequest(`/customers?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createCustomer(customer, token) {
  return apiRequest("/customers", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customer),
  });
}

export function updateCustomer(customerId, customer, token) {
  return apiRequest(`/customers/${customerId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customer),
  });
}
