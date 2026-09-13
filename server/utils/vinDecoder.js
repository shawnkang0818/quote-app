const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/;

export function normalizeVin(value) {
  // VINs are always 17 characters and never contain I, O, or Q because those
  // letters are easily confused with numbers on vehicle documents.
  const vin = String(value || "").trim().toUpperCase();
  if (!VIN_PATTERN.test(vin)) {
    const error = new Error(
      "Enter a valid 17-character VIN without the letters I, O, or Q"
    );
    error.status = 400;
    throw error;
  }
  return vin;
}

export function normalizeVinDecodeResult(data, vin) {
  // DecodeVinValues returns one wide object. Keep only the fields used by the
  // quote workflow so provider-specific response details stay on the server.
  const result = data?.Results?.[0] || {};
  const decoded = {
    vin,
    year: String(result.ModelYear || "").trim(),
    make: String(result.Make || "").trim(),
    model: String(result.Model || "").trim(),
    vehicleType: String(result.VehicleType || "").trim(),
    warning: "",
  };

  if (!decoded.year && !decoded.make && !decoded.model) {
    const error = new Error(
      String(result.ErrorText || "VIN could not be decoded").trim()
    );
    error.status = 422;
    throw error;
  }

  if (String(result.ErrorCode || "0") !== "0") {
    decoded.warning = String(result.ErrorText || "VIN decoded with a warning").trim();
  }

  return decoded;
}
