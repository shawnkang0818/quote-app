function CustomerVehicleCard({
  customerName,
  makes,
  models,
  onCustomerChange,
  onMakeChange,
  onModelChange,
  onYearChange,
  vehicle,
  years,
}) {
  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-950">
          Customer & Vehicle
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add the customer and vehicle details for this quotation.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">
            Customer name
          </span>
          <input
            type="text"
            placeholder="Walk-in Customer"
            value={customerName}
            onChange={onCustomerChange}
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
    </section>
  );
}

export default CustomerVehicleCard;
