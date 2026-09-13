const SIMPLE_FIELDS = [
  ["year", "Year", "number"],
  ["make", "Make", "text"],
  ["model", "Model", "text"],
  ["licensePlate", "Plate", "text"],
  ["mileage", "Mileage", "number"],
];

// One compact vehicle row mirrors the reference dashboard: primary identity
// fields stay visible and VIN decoding is an inline action, not a separate flow.
function CustomerVehicleEditor({
  index,
  onChange,
  onDecode,
  onRemove,
  status = {},
  vehicle,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">
          Vehicle {index + 1}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-semibold text-red-600 hover:text-red-700"
        >
          Remove
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {SIMPLE_FIELDS.slice(0, 3).map(([name, label, type]) => (
          <label key={name} className="text-xs font-medium text-slate-600">
            {label}
            <input
              name={name}
              type={type}
              min={type === "number" ? "0" : undefined}
              value={vehicle[name]}
              onChange={onChange}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        ))}

        <div className="sm:col-span-2 xl:col-span-2">
          <label
            htmlFor={`customer-vin-${vehicle.localId}`}
            className="text-xs font-medium text-slate-600"
          >
            VIN
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id={`customer-vin-${vehicle.localId}`}
              name="vin"
              type="text"
              maxLength={17}
              value={vehicle.vin}
              onChange={onChange}
              placeholder="17-character VIN"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={onDecode}
              disabled={vehicle.vin.length !== 17 || status.isLoading}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {status.isLoading ? "Decoding..." : "Decode"}
            </button>
          </div>
        </div>

        {SIMPLE_FIELDS.slice(3).map(([name, label, type]) => (
          <label key={name} className="text-xs font-medium text-slate-600">
            {label}
            <input
              name={name}
              type={type}
              min={type === "number" ? "0" : undefined}
              value={vehicle[name]}
              onChange={onChange}
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        ))}
      </div>

      {status.message && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {status.message}
        </p>
      )}
      {status.error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {status.error}
        </p>
      )}
    </div>
  );
}

export default CustomerVehicleEditor;
