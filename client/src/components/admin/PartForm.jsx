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

      <form onSubmit={onSubmit} className="mt-5 grid gap-4 md:grid-cols-4">
        <input
          type="text"
          name="name"
          placeholder="Part Name"
          value={formData.name}
          onChange={onChange}
          className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          required
        />
        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={onChange}
          min="0"
          step="0.01"
          className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          required
        />
        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={onChange}
          min="0"
          step="1"
          className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          required
        />
        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
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
