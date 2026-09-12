import { useMemo } from "react";
import { filterCatalogItems } from "../../utils/catalogSearch";

function PartsTable({
  errorMessage,
  onAddToQuote,
  parts,
  searchQuery,
}) {
  // Filtering remains client-side for now because the inventory is small.
  // It can move to a paginated API later without changing the table UI.
  const filteredParts = useMemo(
    () => filterCatalogItems(parts, searchQuery),
    [parts, searchQuery]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Parts</h2>
          <p className="mt-1 text-sm text-slate-500">
            Select parts to add them to the current quote.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
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
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No parts available.
        </div>
      ) : filteredParts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <p className="font-medium text-slate-800">No matching parts</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a shorter or different part name.
          </p>
        </div>
      ) : (
        <div>
          <table className="w-full table-fixed text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="w-[52%] rounded-l-xl px-3 py-3 text-left font-semibold">
                  Part
                </th>
                <th className="w-[25%] px-2 py-3 text-right font-semibold">Price</th>
                <th className="w-[23%] rounded-r-xl px-2 py-3 text-right font-semibold">
                  Add
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredParts.map((part) => (
                <tr key={part._id} className="transition hover:bg-slate-50">
                  <td className="px-3 py-3 align-top font-medium text-slate-900">
                    <span className="block break-words">{part.name}</span>
                    <span className={`mt-1 block text-xs ${Number(part.quantity) <= 0 ? "text-red-600" : "text-slate-400"}`}>
                      {Number(part.quantity) <= 0 ? "Out of stock" : `${part.quantity} in stock`}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-right text-slate-600">
                    ${Number(part.price).toFixed(2)}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onAddToQuote(part)}
                      disabled={Number(part.quantity) <= 0}
                      className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                    >
                      Add
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default PartsTable;
