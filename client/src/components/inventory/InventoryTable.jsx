import { useMemo } from "react";
import { filterCatalogItems } from "../../utils/catalogSearch";

function getStockState(part) {
  const quantity = Number(part.quantity);
  const threshold = Number(part.lowStockThreshold ?? 5);

  if (quantity <= 0) return { label: "Out of stock", tone: "empty" };
  if (quantity <= threshold) {
    return { label: `${quantity} · Low`, tone: "low" };
  }
  return { label: `${quantity} in stock`, tone: "ready" };
}

function stockClasses(tone) {
  if (tone === "empty") return "bg-red-100 text-red-700";
  if (tone === "low") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function InventoryTable({ errorMessage, onDelete, onEdit, parts, searchQuery }) {
  // Inventory filtering remains local while the catalog is small. The page
  // can later switch to server pagination without changing its CRUD workflow.
  const filteredParts = useMemo(
    () => filterCatalogItems(parts, searchQuery),
    [parts, searchQuery]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Inventory Catalog
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Maintain current selling prices and available stock.
          </p>
        </div>
        <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600 sm:self-auto">
          {searchQuery
            ? `${filteredParts.length} of ${parts.length} parts`
            : `${parts.length} parts`}
        </span>
      </div>

      {errorMessage && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {parts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No parts available. Use the form above to add the first part.
        </p>
      ) : filteredParts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No inventory items match this name, part number, brand, or category.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="rounded-l-xl px-4 py-3 text-left font-semibold">
                  Part details
                </th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-left font-semibold">Price</th>
                <th className="px-4 py-3 text-left font-semibold">Stock</th>
                <th className="px-4 py-3 text-left font-semibold">Updated</th>
                <th className="rounded-r-xl px-4 py-3 text-left font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredParts.map((part) => {
                const stock = getStockState(part);
                const metadata = [part.brand, part.partNumber]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <tr key={part._id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <p className="font-medium text-slate-900">{part.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {metadata || "No brand or part number"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {part.category || "Uncategorized"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    ${Number(part.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stockClasses(
                        stock.tone
                      )}`}
                    >
                      {stock.label}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-500">
                    {part.updatedAt
                      ? new Date(part.updatedAt).toLocaleDateString()
                      : "Unknown"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(part)}
                        className="rounded-lg bg-amber-500 px-3 py-2 font-medium text-white transition hover:bg-amber-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(part)}
                        className="rounded-lg bg-red-600 px-3 py-2 font-medium text-white transition hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default InventoryTable;
