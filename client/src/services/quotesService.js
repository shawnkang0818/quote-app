const API_BASE_URL = "http://localhost:5001/api";

async function parseResponse(response) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Request failed");
  }

  return response.json();
}

export async function getQuotes() {
  const response = await fetch(`${API_BASE_URL}/quotes`);
  return parseResponse(response);
}

export async function createQuote(quote) {
  const response = await fetch(`${API_BASE_URL}/quotes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(quote),
  });

  return parseResponse(response);
}
