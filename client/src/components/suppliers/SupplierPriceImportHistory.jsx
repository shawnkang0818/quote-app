const STRATEGY_LABELS = {
  update: "Update existing",
  append: "Keep history",
  skip: "Skip existing",
};

function SupplierPriceImportHistory({
  history,
  isLoading,
  pagination,
  onPageChange,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Import History</h2>
          <p className="mt-1 text-sm text-slate-500">
            Audit successful CSV imports and review how each row was handled.
          </p>
        </div>
        <span className="text-sm text-slate-500">
          {pagination.total} import(s)
        </span>
      </div>

      {isLoading ? (
        <p className="mt-5 text-sm text-slate-500">Loading import history…</p>
      ) : history.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No CSV imports have been completed yet.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {history.map((record) => (
            <details key={record._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{record.fileName}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(record.createdAt).toLocaleString()} • {STRATEGY_LABELS[record.strategy] || record.strategy}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">{record.imported} added</span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700">{record.updated} updated</span>
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-slate-700">{record.skipped} skipped</span>
                  </div>
                </div>
              </summary>

              <div className="mt-4 max-h-72 overflow-auto border-t border-slate-200 pt-3">
                <table className="min-w-[700px] w-full text-left text-sm">
                  <thead className="text-xs uppercase text-slate-500">
                    <tr><th className="px-2 py-2">Row</th><th className="px-2 py-2">Part</th><th className="px-2 py-2">Supplier</th><th className="px-2 py-2">Vehicle</th><th className="px-2 py-2">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {record.rows.map((row) => (
                      <tr key={`${record._id}-${row.rowNumber}`}>
                        <td className="px-2 py-2">{row.rowNumber}</td>
                        <td className="px-2 py-2"><p className="font-medium text-slate-900">{row.partName}</p><p className="text-xs text-slate-500">{row.supplierPartNumber}</p></td>
                        <td className="px-2 py-2">{row.supplierName}</td>
                        <td className="px-2 py-2 text-slate-600">{[row.vehicle?.year, row.vehicle?.make, row.vehicle?.model, row.vehicle?.engine].filter(Boolean).join(" ") || "Universal"}</td>
                        <td className="px-2 py-2 font-medium capitalize">{row.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-4 flex justify-center gap-3">
          <button type="button" disabled={pagination.page <= 1 || isLoading} onClick={() => onPageChange(pagination.page - 1)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium disabled:opacity-40">Previous</button>
          <span className="self-center text-sm text-slate-500">Page {pagination.page} of {pagination.pages}</span>
          <button type="button" disabled={pagination.page >= pagination.pages || isLoading} onClick={() => onPageChange(pagination.page + 1)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium disabled:opacity-40">Next</button>
        </div>
      )}
    </section>
  );
}

export default SupplierPriceImportHistory;
