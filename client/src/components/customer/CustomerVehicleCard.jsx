import { useState } from "react";
import CustomerLookup from "./CustomerLookup";

function CustomerVehicleCard({
  className = "",
  customer,
  errorMessage,
  isDecodingVin,
  makes,
  models,
  customerLookup,
  onCustomerChange,
  onMakeChange,
  onModelChange,
  onYearChange,
  onVehicleDetailChange,
  onDecodeVin,
  vehicle,
  vinMessage,
  years,
}) {
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const hasSelectedCustomer = Boolean(customerLookup.selectedCustomer);

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Customer & Vehicle
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Identify the customer and vehicle before building the quote.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-400">
          Contact and vehicle details
        </span>
      </div>

      <CustomerLookup
        errorMessage={customerLookup.errorMessage}
        hasAccess={customerLookup.hasAccess}
        isLoading={customerLookup.isLoading}
        onQueryChange={(event) =>
          customerLookup.updateQuery(event.target.value)
        }
        onEdit={() => setIsEditingDetails(true)}
        onNew={() => {
          customerLookup.startNewCustomer();
          setIsEditingDetails(true);
        }}
        onSelect={(selectedCustomer, selectedVehicle) => {
          setIsEditingDetails(false);
          customerLookup.selectCustomer(selectedCustomer, selectedVehicle);
        }}
        onVehicleChange={customerLookup.selectVehicle}
        query={customerLookup.query}
        results={customerLookup.results}
        selectedCustomer={customerLookup.selectedCustomer}
        selectedVehicleId={customerLookup.selectedVehicleId}
      />

      {hasSelectedCustomer && !isEditingDetails && (
        <div className="grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 sm:grid-cols-2 md:grid-cols-4">
          <span className="truncate">
            <strong className="text-slate-800">Vehicle:</strong>{" "}
            {[vehicle.year, vehicle.make, vehicle.model]
              .filter(Boolean)
              .join(" ") || "Not selected"}
          </span>
          <span className="truncate">
            <strong className="text-slate-800">VIN:</strong>{" "}
            {vehicle.vin || "—"}
          </span>
          <span className="truncate">
            <strong className="text-slate-800">Plate:</strong>{" "}
            {vehicle.licensePlate || "—"}
          </span>
          <span className="truncate">
            <strong className="text-slate-800">Mileage:</strong>{" "}
            {vehicle.mileage ? Number(vehicle.mileage).toLocaleString() : "—"}
          </span>
        </div>
      )}

      {(!hasSelectedCustomer || isEditingDetails) && (
      <>
      {hasSelectedCustomer && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span>Editing details for this quote only.</span>
          <button
            type="button"
            onClick={() => setIsEditingDetails(false)}
            className="font-semibold hover:text-amber-950"
          >
            Collapse
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Customer name
          </span>
          <input
            type="text"
            name="name"
            placeholder="Walk-in Customer"
            value={customer.name}
            onChange={onCustomerChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Phone</span>
          <input
            type="tel"
            name="phone"
            value={customer.phone}
            onChange={onCustomerChange}
            placeholder="(555) 123-4567"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            name="email"
            value={customer.email}
            onChange={onCustomerChange}
            placeholder="customer@example.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Year
          </span>
          <select
            value={vehicle.year}
            onChange={onYearChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select Year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Make
          </span>
          <select
            value={vehicle.make}
            onChange={onMakeChange}
            disabled={!vehicle.year}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">Select Make</option>
            {makes.map((make, index) => (
              <option key={`${make.make}-${index}`} value={make.make}>
                {make.make}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Model
          </span>
          <select
            value={vehicle.model}
            onChange={onModelChange}
            disabled={!vehicle.make}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <option value="">Select Model</option>
            {models.map((model, index) => (
              <option key={`${model.model}-${index}`} value={model.model}>
                {model.model}
              </option>
            ))}
          </select>
        </label>

      </div>

      {/* Less frequently used identifiers stay available without dominating the form. */}
      <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50">
        <summary className="cursor-pointer px-3 py-2.5 text-xs font-semibold text-slate-700">
          Vehicle identifiers & mileage
        </summary>
        <div className="grid gap-3 border-t border-slate-200 p-4 md:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              License plate
            </span>
            <input
              type="text"
              name="licensePlate"
              value={vehicle.licensePlate}
              onChange={onVehicleDetailChange}
              placeholder="ABC-1234"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              VIN
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                name="vin"
                aria-label="VIN"
                value={vehicle.vin}
                onChange={onVehicleDetailChange}
                maxLength={17}
                placeholder="17-character VIN"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-mono text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={onDecodeVin}
                disabled={vehicle.vin.length !== 17 || isDecodingVin}
                className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isDecodingVin ? "Decoding..." : "Decode"}
              </button>
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Mileage
            </span>
            <input
              type="number"
              name="mileage"
              value={vehicle.mileage}
              onChange={onVehicleDetailChange}
              min="0"
              placeholder="Current mileage"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>
        {vinMessage && (
          <p className="border-t border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {vinMessage}
          </p>
        )}
      </details>
      </>
      )}
      {errorMessage && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}
    </section>
  );
}

export default CustomerVehicleCard;
