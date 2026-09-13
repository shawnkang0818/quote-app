function PartForm({
  editingPartId,
  errorMessage,
  formData,
  onCancel,
  onChange,
  onSubmit,
}) {
  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-950">
        {editingPartId ? "Edit Part" : "Add New Part"}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Pricing and stock are required. Catalog metadata can be added gradually.
      </p>

      <form onSubmit={onSubmit} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Part name
          <input
            type="text"
            name="name"
            placeholder="Full Synthetic Oil 0W-20"
            value={formData.name}
            onChange={onChange}
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Part number / SKU
          <input
            type="text"
            name="partNumber"
            placeholder="PH4967"
            value={formData.partNumber}
            onChange={onChange}
            maxLength="80"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Brand
          <input
            type="text"
            name="brand"
            placeholder="Fram"
            value={formData.brand}
            onChange={onChange}
            maxLength="80"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Category
          <input
            type="text"
            name="category"
            list="part-categories"
            placeholder="Filters"
            value={formData.category}
            onChange={onChange}
            maxLength="80"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <datalist id="part-categories">
            <option value="Brakes" />
            <option value="Electrical" />
            <option value="Filters" />
            <option value="Fluids" />
            <option value="Tires" />
            <option value="Engine" />
            <option value="Other" />
          </datalist>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Selling price
          <input
            type="number"
            name="price"
            placeholder="0.00"
            value={formData.price}
            onChange={onChange}
            min="0"
            step="0.01"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Quantity in stock
          <input
            type="number"
            name="quantity"
            placeholder="0"
            value={formData.quantity}
            onChange={onChange}
            min="0"
            step="1"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Low-stock warning at
          <input
            type="number"
            name="lowStockThreshold"
            value={formData.lowStockThreshold}
            onChange={onChange}
            min="0"
            step="1"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>

        <button
          type="submit"
          className="self-end rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          {editingPartId ? "Update Part" : "Add Part"}
        </button>
      </form>

      {editingPartId && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 rounded-xl bg-slate-200 px-4 py-2.5 font-medium text-slate-800 transition hover:bg-slate-300"
        >
          Cancel Edit
        </button>
      )}

      {errorMessage && (
        <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
      )}
    </section>
  );
}

export default PartForm;
