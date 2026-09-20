import { useEffect, useState } from "react";

const EMPTY_FORM = {
  supplierName: "",
  supplierPartNumber: "",
  brand: "",
  partName: "",
  category: "",
  cost: "",
  listPrice: "",
  currency: "USD",
  availability: "unknown",
  quantityAvailable: "",
  year: "",
  make: "",
  model: "",
  engine: "",
  sourceType: "manual",
  sourceUrl: "",
  expiresAt: "",
  requiresConfirmation: true,
  active: true,
};

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function mapPriceToForm(price) {
  if (!price) return EMPTY_FORM;
  return {
    supplierName: price.supplierName || "",
    supplierPartNumber: price.supplierPartNumber || "",
    brand: price.brand || "",
    partName: price.partName || "",
    category: price.category || "",
    cost: price.cost ?? "",
    listPrice: price.listPrice ?? "",
    currency: price.currency || "USD",
    availability: price.availability || "unknown",
    quantityAvailable: price.quantityAvailable ?? "",
    year: price.vehicle?.year || "",
    make: price.vehicle?.make || "",
    model: price.vehicle?.model || "",
    engine: price.vehicle?.engine || "",
    sourceType: price.sourceType || "manual",
    sourceUrl: price.sourceUrl || "",
    expiresAt: toLocalDateTime(price.expiresAt),
    requiresConfirmation: price.requiresConfirmation !== false,
    active: price.active !== false,
  };
}

function SupplierPriceForm({ editingPrice, onCancel, onSave }) {
  const [form, setForm] = useState(() => mapPriceToForm(editingPrice));

  useEffect(() => {
    setForm(mapPriceToForm(editingPrice));
  }, [editingPrice]);

  const updateField = (event) => {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      supplierName: form.supplierName,
      supplierPartNumber: form.supplierPartNumber,
      brand: form.brand,
      partName: form.partName,
      category: form.category,
      cost: Number(form.cost),
      listPrice: form.listPrice === "" ? null : Number(form.listPrice),
      currency: form.currency,
      availability: form.availability,
      quantityAvailable:
        form.quantityAvailable === "" ? null : Number(form.quantityAvailable),
      vehicle: {
        year: form.year,
        make: form.make,
        model: form.model,
        engine: form.engine,
      },
      sourceType: form.sourceType,
      sourceUrl: form.sourceUrl,
      expiresAt: form.expiresAt
        ? new Date(form.expiresAt).toISOString()
        : null,
      requiresConfirmation: form.requiresConfirmation,
      active: form.active,
    });
  };

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            {editingPrice ? "Edit supplier price" : "Add supplier price"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Store supplier cost as a reference; employees still confirm the selling price.
          </p>
        </div>
        {editingPrice && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm font-medium text-slate-700">
          Supplier *
          <input name="supplierName" required value={form.supplierName} onChange={updateField} className={inputClass} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Supplier part number *
          <input name="supplierPartNumber" required value={form.supplierPartNumber} onChange={updateField} className={inputClass} />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          Part name *
          <input name="partName" required value={form.partName} onChange={updateField} className={inputClass} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Brand
          <input name="brand" value={form.brand} onChange={updateField} className={inputClass} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Category
          <input name="category" value={form.category} onChange={updateField} className={inputClass} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Supplier cost *
          <input name="cost" type="number" min="0" step="0.01" required value={form.cost} onChange={updateField} className={inputClass} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Suggested selling price
          <input name="listPrice" type="number" min="0" step="0.01" value={form.listPrice} onChange={updateField} className={inputClass} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Availability
          <select name="availability" value={form.availability} onChange={updateField} className={inputClass}>
            <option value="unknown">Unknown</option>
            <option value="in_stock">In stock</option>
            <option value="low_stock">Low stock</option>
            <option value="out_of_stock">Out of stock</option>
            <option value="special_order">Special order</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Available quantity
          <input name="quantityAvailable" type="number" min="0" step="1" value={form.quantityAvailable} onChange={updateField} className={inputClass} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Currency
          <select name="currency" value={form.currency} onChange={updateField} className={inputClass}>
            <option value="USD">USD</option>
            <option value="CAD">CAD</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Source
          <select name="sourceType" value={form.sourceType} onChange={updateField} className={inputClass}>
            <option value="manual">Manual</option>
            <option value="csv">CSV import</option>
            <option value="api">Approved API</option>
          </select>
        </label>
      </div>

      <details className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">
          Vehicle fitment and source details
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["year", "Year"],
            ["make", "Make"],
            ["model", "Model"],
            ["engine", "Engine"],
          ].map(([name, label]) => (
            <label key={name} className="text-sm font-medium text-slate-700">
              {label}
              <input name={name} value={form[name]} onChange={updateField} className={inputClass} />
            </label>
          ))}
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Source URL
            <input name="sourceUrl" type="url" value={form.sourceUrl} onChange={updateField} className={inputClass} />
          </label>
          <label className="text-sm font-medium text-slate-700 sm:col-span-2">
            Expires at
            <input name="expiresAt" type="datetime-local" value={form.expiresAt} onChange={updateField} className={inputClass} />
          </label>
        </div>
      </details>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input name="requiresConfirmation" type="checkbox" checked={form.requiresConfirmation} onChange={updateField} className="h-4 w-4 rounded border-slate-300" />
          Require employee confirmation before use
        </label>
        <button type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700">
          {editingPrice ? "Save Changes" : "Add Supplier Price"}
        </button>
      </div>
    </form>
  );
}

export default SupplierPriceForm;
