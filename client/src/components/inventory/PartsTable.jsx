function PartsTable({
  isAdmin,
  onAddToQuote,
  onDelete,
  onEdit,
  parts,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Parts Inventory
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select parts to add them to the current quote.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
          {parts.length} parts
        </span>
      </div>

      {parts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No parts available.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="rounded-l-xl px-4 py-3 text-left font-semibold">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-semibold">Price</th>
                <th className="px-4 py-3 text-left font-semibold">Stock</th>
                <th className="px-4 py-3 text-left font-semibold">Quote</th>
                {isAdmin && (
                  <th className="rounded-r-xl px-4 py-3 text-left font-semibold">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {parts.map((part) => (
                <tr key={part._id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {part.name}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    ${Number(part.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{part.quantity}</td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => onAddToQuote(part)}
                      className="rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white transition hover:bg-emerald-700"
                    >
                      Add
                    </button>
                  </td>

                  {isAdmin && (
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
                          onClick={() => onDelete(part._id)}
                          className="rounded-lg bg-red-600 px-3 py-2 font-medium text-white transition hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
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
