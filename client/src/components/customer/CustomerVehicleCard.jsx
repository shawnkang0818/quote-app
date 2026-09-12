import CustomerLookup from "./CustomerLookup";

function CustomerVehicleCard({
  className = "",
  customer,
  errorMessage,
  makes,
  models,
  customerLookup,
  onCustomerChange,
  onMakeChange,
  onModelChange,
  onYearChange,
  onVehicleDetailChange,
  vehicle,
  years,
}) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Customer & Vehicle
          </h2>
          <p className="mt-1 text-sm text-slate-500">
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
        onSelect={customerLookup.selectCustomer}
        query={customerLookup.query}
        results={customerLookup.results}
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
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
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Year
          </span>
          <select
            value={vehicle.year}
            onChange={onYearChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
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
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
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
      <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700">
          Vehicle identifiers & mileage
        </summary>
        <div className="grid gap-3 border-t border-slate-200 p-4 md:grid-cols-3">
          {[
            ["licensePlate", "License plate", "ABC-1234"],
            ["vin", "VIN", "17-character VIN"],
            ["mileage", "Mileage", "Current mileage"],
          ].map(([name, label, placeholder]) => (
            <label key={name} className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                {label}
              </span>
              <input
                type={name === "mileage" ? "number" : "text"}
                name={name}
                value={vehicle[name]}
                onChange={onVehicleDetailChange}
                min={name === "mileage" ? "0" : undefined}
                placeholder={placeholder}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          ))}
        </div>
      </details>
      {errorMessage && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}
    </section>
  );
}

export default CustomerVehicleCard;
