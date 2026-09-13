import { useState } from "react";
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
  onEdit,
  onNew,
  onSelect,
  onVehicleChange,
  query,
  results,
  selectedCustomer,
  selectedVehicleId,
}) {
  const [isChangingCustomer, setIsChangingCustomer] = useState(false);

  const chooseCustomer = (customer, vehicle) => {
    setIsChangingCustomer(false);
    onSelect(customer, vehicle);
  };

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
      {selectedCustomer && !isChangingCustomer ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(190px,0.9fr)_auto] md:items-end">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                Customer
              </p>
              <p className="truncate text-sm font-bold text-slate-950">
                {selectedCustomer.name}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {[selectedCustomer.phone, selectedCustomer.email]
                  .filter(Boolean)
                  .join(" • ") || "No contact information"}
              </p>
            </div>

            <label className="block text-xs font-semibold text-slate-600">
              Saved vehicle
              <select
                value={selectedVehicleId}
                onChange={(event) => onVehicleChange(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Customer only</option>
                {(selectedCustomer.vehicles || []).map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicleLabel(vehicle) || "Saved vehicle"}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-wrap gap-2 md:justify-end">
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Edit details
              </button>
              <button
                type="button"
                onClick={() => setIsChangingCustomer(true)}
                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
              >
                Change
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-blue-100 pt-2 text-xs text-slate-500">
            <span>
              Last visit: {selectedCustomer.lastVisitAt
                ? new Date(selectedCustomer.lastVisitAt).toLocaleDateString()
                : "Unknown"}
            </span>
            <Link
              to={`/customers/${selectedCustomer._id}`}
              className="font-semibold text-blue-700 hover:text-blue-800"
            >
              Open customer record →
            </Link>
            <button
              type="button"
              onClick={onNew}
              className="font-semibold text-blue-700 hover:text-blue-800"
            >
              + New customer
            </button>
          </div>
        </div>
      ) : (
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-700">
            Find returning customer
          </span>
          <div className="flex gap-2">
            <input
              type="search"
              value={query}
              onChange={onQueryChange}
              autoFocus={isChangingCustomer}
              placeholder="Search name, phone, email, VIN, plate, or vehicle"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {isChangingCustomer && (
              <button
                type="button"
                onClick={() => setIsChangingCustomer(false)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </label>
      )}

      {errorMessage && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
      {isLoading && (
        <p className="mt-2 text-sm text-slate-500">Searching customers...</p>
      )}

      {(!selectedCustomer || isChangingCustomer) &&
        query.trim().length >= 2 &&
        !isLoading &&
        results.length === 0 &&
        !errorMessage && (
        <p className="mt-2 text-sm text-slate-500">
          No saved customer matches this search. Continue with the new-customer
          fields below.
        </p>
      )}

      {(!selectedCustomer || isChangingCustomer) && results.length > 0 && (
        <div className="absolute left-0 right-0 z-20 mt-2 max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
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
                  onClick={() => chooseCustomer(customer)}
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
                      onClick={() => chooseCustomer(customer, vehicle)}
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
