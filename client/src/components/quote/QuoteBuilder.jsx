function QuoteBuilder({
  errorMessage,
  onClear,
  onDecreaseQuantity,
  onGeneratePDF,
  onIncreaseQuantity,
  onRemove,
  onSaveQuote,
  quoteItems,
  total,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:sticky xl:top-6">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-950">Quote Builder</h2>
        <p className="mt-1 text-sm text-slate-500">
          Review items and adjust quantities before saving.
        </p>
      </div>

      {quoteItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          No items selected
        </div>
      ) : (
        <div className="space-y-3">
          {quoteItems.map((item) => (
            <article
              key={item._id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    ${Number(item.price).toFixed(2)} each
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRemove(item._id)}
                  className="rounded-lg bg-red-50 px-2.5 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                >
                  Remove
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDecreaseQuantity(item._id)}
                    className="h-9 w-9 rounded-lg bg-slate-200 font-semibold text-slate-700 transition hover:bg-slate-300"
                    aria-label={`Decrease ${item.name} quantity`}
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center font-semibold text-slate-900">
                    {item.quoteQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onIncreaseQuantity(item._id)}
                    className="h-9 w-9 rounded-lg bg-slate-200 font-semibold text-slate-700 transition hover:bg-slate-300"
                    aria-label={`Increase ${item.name} quantity`}
                  >
                    +
                  </button>
                </div>

                <p className="font-bold text-slate-950">
                  ${(item.price * item.quoteQuantity).toFixed(2)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-6 border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between text-lg font-bold text-slate-950">
          <span>Parts total</span>
          <span>${Number(total).toFixed(2)}</span>
        </div>
      </div>

      {errorMessage && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <button
          type="button"
          onClick={onGeneratePDF}
          className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
        >
          Generate PDF
        </button>
        <button
          type="button"
          onClick={onSaveQuote}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-700"
        >
          Save Quote
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={quoteItems.length === 0}
          className="rounded-xl bg-slate-200 px-4 py-2.5 font-medium text-slate-800 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 xl:col-span-1 2xl:col-span-2"
        >
          Clear Quote
        </button>
      </div>
    </section>
  );
}

export default QuoteBuilder;
