function QuoteSummary({
  errorMessage,
  isEditing,
  isSaving,
  isSaved,
  laborItems,
  onClear,
  onGeneratePDF,
  onOpenSavedQuote,
  onSaveQuote,
  onStartNewQuote,
  onStatusChange,
  quoteItems,
  quoteNumber,
  quoteStatus,
  saveMessage,
  totals,
}) {
  const hasQuoteContent = quoteItems.length > 0 || laborItems.length > 0;

  return (
    <aside className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
      <div className="border-b border-slate-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
          Current quote
        </p>
        <h2 className="mt-1 text-lg font-semibold text-slate-950">Summary</h2>
      </div>

      {/* Keep totals in one predictable place so the builder can focus on editing. */}
      <dl className="space-y-3 py-5 text-sm">
        <div className="flex items-center justify-between text-slate-600">
          <dt>Parts & custom</dt>
          <dd className="font-medium text-slate-900">
            ${totals.partsSubtotal.toFixed(2)}
          </dd>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <dt>Labor total</dt>
          <dd className="font-medium text-slate-900">
            ${totals.laborTotal.toFixed(2)}
          </dd>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-slate-600">
          <dt>Subtotal</dt>
          <dd className="font-medium text-slate-900">
            ${(totals.partsSubtotal + totals.laborTotal).toFixed(2)}
          </dd>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <dt>Tax ({(totals.taxRate * 100).toFixed(3)}%)</dt>
          <dd className="font-medium text-slate-900">
            ${totals.taxAmount.toFixed(2)}
          </dd>
        </div>
      </dl>

      <div className="flex items-end justify-between border-y border-slate-200 py-4">
        <span className="font-semibold text-slate-800">Grand total</span>
        <span className="text-2xl font-bold tracking-tight text-slate-950">
          ${totals.grandTotal.toFixed(2)}
        </span>
      </div>

      {errorMessage && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {saveMessage && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-sm font-medium text-emerald-800">{saveMessage}</p>

          {/* Make the next shop action obvious after a successful save. */}
          <div className="mt-3 grid gap-2">
            <button
              type="button"
              onClick={onOpenSavedQuote}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Open Saved Quote
            </button>
            <button
              type="button"
              onClick={onStartNewQuote}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
            >
              Start New Quote
            </button>
          </div>
        </div>
      )}

      {/* Primary business actions stay visible in the sticky summary column. */}
      <div className="mt-5 grid gap-3">
        <button
          type="button"
          onClick={onSaveQuote}
          disabled={isSaving || isSaved || !hasQuoteContent}
          className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? isEditing
              ? "Updating..."
              : "Saving..."
            : isSaved
              ? isEditing
                ? "Quote updated"
                : "Quote saved"
              : isEditing
                ? "Update Draft"
                : "Save Quote"}
        </button>
        <button
          type="button"
          onClick={onGeneratePDF}
          disabled={!hasQuoteContent}
          className="rounded-xl border border-blue-300 bg-white px-4 py-3 font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Generate PDF
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={!hasQuoteContent}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear current quote
        </button>
      </div>

      {/* Mirror a paper quote's identity and lifecycle at a glance. */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            Quote number
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-800">
            {quoteNumber || "Assigned after save"}
          </p>
        </div>
        <label className="shrink-0">
          <span className="sr-only">Quote status</span>
          <select
            value={quoteStatus}
            onChange={(event) => onStatusChange(event.target.value)}
            disabled={isSaved}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none transition disabled:cursor-not-allowed ${
              quoteStatus === "final"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            <option value="draft">Draft</option>
            <option value="final">Final</option>
          </select>
        </label>
      </div>
    </aside>
  );
}

export default QuoteSummary;
