const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";

// All frontend services share timeout and error handling through this helper,
// which keeps individual feature services focused on endpoint details.
export async function apiRequest(path, options = {}) {
  const controller = new AbortController();
  // Stop requests that would otherwise leave the interface waiting forever
  // when the backend or an upstream provider is unavailable.
  const timeout = setTimeout(() => controller.abort(), 12000);
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: options.signal || controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw new Error("Unable to reach the server.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    // Normalize the backend response into an Error while preserving the HTTP
    // status so pages can distinguish an expired session from other failures.
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.error || data.message || "Request failed");
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}
