import { apiRequest } from "./apiClient";

function adminHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getQuotes(filters = {}, token) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) {
      query.set(key, value);
    }
  });
  return apiRequest(`/quotes?${query.toString()}`, {
    headers: adminHeaders(token),
  });
}

export async function createQuote(quote) {
  return apiRequest("/quotes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(quote),
  });
}

export async function getQuote(id, token) {
  return apiRequest(`/quotes/${encodeURIComponent(id)}`, {
    headers: adminHeaders(token),
  });
}
