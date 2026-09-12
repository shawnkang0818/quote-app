import { apiRequest } from "./apiClient";

function withAdmin(token, includeContentType = false) {
  return {
    ...(includeContentType ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
  };
}

// The UI keeps using the stable service key as `id`, so existing workstation
// favorites continue working after templates move from source code to MongoDB.
function mapService(service) {
  return { ...service, id: service.key };
}

export async function getQuickServices() {
  return (await apiRequest("/quick-services")).map(mapService);
}

export async function createQuickService(service, token) {
  return mapService(
    await apiRequest("/quick-services", {
      method: "POST",
      headers: withAdmin(token, true),
      body: JSON.stringify(service),
    })
  );
}

export async function updateQuickService(id, service, token) {
  return mapService(
    await apiRequest(`/quick-services/${id}`, {
      method: "PUT",
      headers: withAdmin(token, true),
      body: JSON.stringify(service),
    })
  );
}

export function deleteQuickService(id, token) {
  return apiRequest(`/quick-services/${id}`, {
    method: "DELETE",
    headers: withAdmin(token),
  });
}
