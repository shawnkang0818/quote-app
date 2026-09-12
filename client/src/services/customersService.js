import { apiRequest } from "./apiClient";

export function getCustomers(search, token) {
  const query = new URLSearchParams();
  if (search.trim()) query.set("search", search.trim());
  return apiRequest(`/customers?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
