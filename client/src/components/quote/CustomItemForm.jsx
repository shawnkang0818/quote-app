import { useState } from "react";

const EMPTY_CUSTOM_ITEM = {
  name: "",
  price: "",
  quoteQuantity: "1",
};

function CustomItemForm({ onAdd, onCancel }) {
  const [item, setItem] = useState(EMPTY_CUSTOM_ITEM);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setItem((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (onAdd(item) !== false) onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Custom item</p>
          <p className="text-xs text-slate-500">Add a one-off material or shop fee.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          Cancel
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_72px_96px]">
        <input
          type="text"
          name="name"
          value={item.name}
          onChange={handleChange}
          maxLength="160"
          placeholder="Item or fee description"
          aria-label="Custom item description"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          required
        />
        <input
          type="number"
          name="quoteQuantity"
          value={item.quoteQuantity}
          onChange={handleChange}
          min="1"
          max="999"
          step="1"
          aria-label="Custom item quantity"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          required
        />
        <input
          type="number"
          name="price"
          value={item.price}
          onChange={handleChange}
          min="0"
          step="0.01"
          placeholder="Price"
          aria-label="Custom item unit price"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          required
        />
      </div>

      <button
        type="submit"
        className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Add custom item
      </button>
    </form>
  );
}

export default CustomItemForm;
