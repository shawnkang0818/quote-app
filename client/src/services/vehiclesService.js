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

// VIN decoding is proxied by our backend so provider errors and response
// normalization remain consistent with the other vehicle lookups.
export function decodeVin(vin) {
  return apiRequest(`/vehicles/decode-vin?vin=${encodeURIComponent(vin)}`);
}
