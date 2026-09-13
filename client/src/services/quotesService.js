import { apiRequest } from "./apiClient";

function adminHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getQuotes(filters = {}, token) {
  const query = new URLSearchParams();

  // Omit empty filters so the API can distinguish an unfiltered history query
  // from a request that intentionally supplies a search value.
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
  // Creating a quote remains available in normal shop mode; reading stored
  // customer history is the restricted operation and requires an admin token.
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

export async function updateQuoteStatus(id, status, token) {
  return apiRequest(`/quotes/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: {
      ...adminHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

export async function updateQuote(id, quote, token) {
  // Full quote edits are admin-only and the server accepts them only while the
  // stored record is still a draft.
  return apiRequest(`/quotes/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      ...adminHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(quote),
  });
}

export async function duplicateQuote(id, token) {
  return apiRequest(`/quotes/${encodeURIComponent(id)}/duplicate`, {
    method: "POST",
    headers: adminHeaders(token),
  });
}

export async function deleteQuote(id, token) {
  return apiRequest(`/quotes/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: adminHeaders(token),
  });
}
