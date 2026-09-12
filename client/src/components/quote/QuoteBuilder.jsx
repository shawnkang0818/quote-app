import LaborSection from "./LaborSection";

function QuoteBuilder({
  defaultHourlyRate,
  laborItems,
  onAddLabor,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onRemove,
  onRemoveLabor,
  onUpdateLabor,
  quoteItems,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Quote Builder
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review parts and labor before saving.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {quoteItems.length + laborItems.length} items
        </span>
      </div>

      {quoteItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          No items selected
        </div>
      ) : (
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {quoteItems.map((item) => (
            <article
              key={item._id}
              className="p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    ${Number(item.price).toFixed(2)} each
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRemove(item._id)}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Remove
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between gap-4">
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

      <LaborSection
        key={defaultHourlyRate}
        defaultHourlyRate={defaultHourlyRate}
        laborItems={laborItems}
        onAdd={onAddLabor}
        onRemove={onRemoveLabor}
        onUpdate={onUpdateLabor}
      />
    </section>
  );
}

export default QuoteBuilder;
