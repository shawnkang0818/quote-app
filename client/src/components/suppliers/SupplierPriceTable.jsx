const AVAILABILITY_LABELS = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  special_order: "Special order",
  unknown: "Unknown",
};

function formatMoney(value, currency) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(value);
}

function SupplierPriceTable({ items, isLoading, onEdit, onToggleActive }) {
  if (isLoading) {
    return <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">Loading supplier prices…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="font-semibold text-slate-900">No supplier prices found</h2>
        <p className="mt-2 text-sm text-slate-500">Add a price above or change the current search filters.</p>
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-[1000px] w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Part</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3 text-right">Cost</th>
              <th className="px-4 py-3 text-right">Suggested</th>
              <th className="px-4 py-3">Availability</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const vehicle = [item.vehicle?.year, item.vehicle?.make, item.vehicle?.model]
                .filter(Boolean)
                .join(" ");
              return (
                <tr key={item._id} className={item.active ? "hover:bg-slate-50" : "bg-slate-50 opacity-65"}>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{item.partName}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.brand || "No brand"} • {item.supplierPartNumber}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{item.supplierName}</td>
                  <td className="px-4 py-4 text-slate-600">{vehicle || "Universal / unspecified"}</td>
                  <td className="px-4 py-4 text-right font-medium">{formatMoney(item.cost, item.currency)}</td>
                  <td className="px-4 py-4 text-right">{formatMoney(item.listPrice, item.currency)}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {AVAILABILITY_LABELS[item.availability] || "Unknown"}
                      {item.quantityAvailable !== null && item.quantityAvailable !== undefined
                        ? ` (${item.quantityAvailable})`
                        : ""}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500">
                    {new Date(item.retrievedAt).toLocaleString()}
                    {item.requiresConfirmation && <p className="mt-1 font-medium text-amber-700">Confirmation required</p>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => onEdit(item)} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600">Edit</button>
                      <button type="button" onClick={() => onToggleActive(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold text-white ${item.active ? "bg-slate-700 hover:bg-slate-800" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                        {item.active ? "Deactivate" : "Restore"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default SupplierPriceTable;
