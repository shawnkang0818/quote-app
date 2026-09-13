import LaborSection from "./LaborSection";
import QuoteNotes from "./QuoteNotes";

function QuoteBuilder({
  defaultHourlyRate,
  laborItems,
  notes,
  onAddLabor,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onRemove,
  onRemoveLabor,
  onUpdateNote,
  onUpdateLabor,
  quoteItems,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Quote Builder
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Review parts and labor before saving.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {quoteItems.length + laborItems.length} items
        </span>
      </div>

      {quoteItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          No parts selected
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Item</span>
            <span>Qty</span>
            <span className="w-20 text-right">Total</span>
          </div>
          <div className="divide-y divide-slate-200">
            {quoteItems.map((item) => (
              <article
                key={item._id}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-3"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {item.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Part · ${Number(item.price).toFixed(2)} each
                  </p>
                  <button
                    type="button"
                    onClick={() => onRemove(item._id)}
                    className="mt-1 text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => onDecreaseQuantity(item._id)}
                    className="h-8 w-8 text-slate-600 hover:bg-slate-50"
                    aria-label={`Decrease ${item.name} quantity`}
                  >
                    −
                  </button>
                  <span className="min-w-7 text-center text-sm font-semibold text-slate-900">
                    {item.quoteQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onIncreaseQuantity(item._id)}
                    className="h-8 w-8 text-slate-600 hover:bg-slate-50"
                    aria-label={`Increase ${item.name} quantity`}
                  >
                    +
                  </button>
                </div>

                <p className="w-20 text-right text-sm font-bold text-slate-950">
                  ${(item.price * item.quoteQuantity).toFixed(2)}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* Labor stays independently editable while sharing the same quote column. */}
      <LaborSection
        key={defaultHourlyRate}
        defaultHourlyRate={defaultHourlyRate}
        laborItems={laborItems}
        onAdd={onAddLabor}
        onRemove={onRemoveLabor}
        onUpdate={onUpdateLabor}
      />

      <QuoteNotes notes={notes} onChange={onUpdateNote} />
    </section>
  );
}

export default QuoteBuilder;
