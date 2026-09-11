import { apiRequest } from "./apiClient";

export function getVehicleMakes(year) {
  return apiRequest(`/vehicles/makes?year=${encodeURIComponent(year)}`);
}

export function getVehicleModels(year, make) {
  return apiRequest(
    `/vehicles/models?year=${encodeURIComponent(year)}&make=${encodeURIComponent(
      make
    )}`
  );
}
