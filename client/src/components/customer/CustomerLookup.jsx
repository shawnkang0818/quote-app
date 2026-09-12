import { Link } from "react-router-dom";

function vehicleLabel(vehicle) {
  return [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");
}

// Returning-customer search is intentionally compact. Selecting a result
// fills the editable form below, where staff can still correct current details.
function CustomerLookup({
  errorMessage,
  hasAccess,
  isLoading,
  onQueryChange,
  onSelect,
  query,
  results,
}) {
  if (!hasAccess) {
    return (
      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-slate-600">
          Unlock an admin session to search saved customers and vehicles.
        </span>
        <Link
          to="/customers"
          className="shrink-0 font-semibold text-blue-700 hover:text-blue-800"
        >
          Open Customers →
        </Link>
      </div>
    );
  }

  return (
    <div className="relative mb-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">
          Find returning customer
        </span>
        <input
          type="search"
          value={query}
          onChange={onQueryChange}
          placeholder="Search name, phone, email, tag, VIN, plate, or vehicle"
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
      </label>

      {errorMessage && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
      {isLoading && (
        <p className="mt-2 text-sm text-slate-500">Searching customers...</p>
      )}

      {query.trim().length >= 2 && !isLoading && results.length === 0 && !errorMessage && (
        <p className="mt-2 text-sm text-slate-500">
          No saved customer matches this search. Continue with the new-customer
          fields below.
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-2 max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {results.slice(0, 8).map((customer) => (
            <article key={customer._id} className="rounded-lg bg-slate-50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {customer.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {[customer.phone, customer.email].filter(Boolean).join(" • ") ||
                      "No contact information"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(customer)}
                  className="shrink-0 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                >
                  Use customer
                </button>
              </div>

              {customer.vehicles?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-200 pt-2">
                  {customer.vehicles.map((vehicle) => (
                    <button
                      key={vehicle._id}
                      type="button"
                      onClick={() => onSelect(customer, vehicle)}
                      className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800 transition hover:bg-blue-200"
                    >
                      {vehicleLabel(vehicle) || "Saved vehicle"}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomerLookup;
