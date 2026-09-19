import { useState } from "react";
import CustomItemForm from "./CustomItemForm";
import LaborSection from "./LaborSection";
import QuoteNotes from "./QuoteNotes";

function RemoveButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
      </svg>
    </button>
  );
}

function NotePreview({ label, tone, value }) {
  const tones = {
    customer: "border-blue-100 bg-blue-50/70 text-blue-700",
    technician: "border-amber-200 bg-amber-50/80 text-amber-700",
  };

  return (
    <div className={`rounded-xl border px-3 py-2.5 ${tones[tone]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function QuoteBuilder({
  defaultHourlyRate,
  laborItems,
  notes,
  onAddCustomItem,
  onAddLabor,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onRemove,
  onRemoveLabor,
  onUpdateNote,
  onUpdateLabor,
  quoteItems,
}) {
  const [activePanel, setActivePanel] = useState(null);
  const itemCount = quoteItems.length + laborItems.length;
  const hasNotes = Boolean(
    notes.customerRequest?.trim() || notes.technicianNotes?.trim()
  );

  const togglePanel = (panel) => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Quote Builder</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Review parts, custom items, and labor before saving.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {itemCount} items
        </span>
      </div>

      {itemCount === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
          No quote items selected
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          {/* Preserve readable controls on narrow phones. Only this quote list
              scrolls horizontally instead of forcing the whole page wider. */}
          <div className="min-w-[500px]">
          <div className="grid grid-cols-[minmax(0,1fr)_64px_76px_76px_28px] items-center gap-2 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            <span>Item</span>
            <span className="text-center">Qty/Hrs</span>
            <span className="text-right">Price</span>
            <span className="text-right">Total</span>
            <span className="sr-only">Actions</span>
          </div>

          <div className="divide-y divide-slate-200">
            {quoteItems.map((item) => (
              <article
                key={item._id}
                className="grid grid-cols-[minmax(0,1fr)_64px_76px_76px_28px] items-center gap-2 px-3 py-3"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {item.name}
                  </h3>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      item.isCustom
                        ? "bg-violet-50 text-violet-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {item.isCustom ? "Custom" : "Part"}
                  </span>
                </div>

                <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => onDecreaseQuantity(item._id)}
                    className="h-7 w-5 text-slate-600 hover:bg-slate-50"
                    aria-label={`Decrease ${item.name} quantity`}
                  >
                    −
                  </button>
                  <span className="min-w-5 text-center text-xs font-semibold text-slate-900">
                    {item.quoteQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onIncreaseQuantity(item._id)}
                    className="h-7 w-5 text-slate-600 hover:bg-slate-50"
                    aria-label={`Increase ${item.name} quantity`}
                  >
                    +
                  </button>
                </div>

                <p className="text-right text-xs text-slate-600">
                  ${Number(item.price).toFixed(2)}
                </p>
                <p className="text-right text-xs font-bold text-slate-950">
                  ${(item.price * item.quoteQuantity).toFixed(2)}
                </p>
                <RemoveButton
                  label={`Remove ${item.name}`}
                  onClick={() => onRemove(item._id)}
                />
              </article>
            ))}

            {laborItems.map((item) => (
              <article
                key={item.id || item._id}
                className="grid grid-cols-[minmax(0,1fr)_64px_76px_76px_28px] items-center gap-2 px-3 py-3"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {item.description}
                  </h3>
                  <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Labor
                  </span>
                </div>
                <input
                  type="number"
                  value={item.hours}
                  onChange={(event) =>
                    onUpdateLabor(item.id, { hours: event.target.value })
                  }
                  min="0.1"
                  step="0.01"
                  aria-label={`${item.description} labor hours`}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-center text-xs outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  value={item.hourlyRate}
                  onChange={(event) =>
                    onUpdateLabor(item.id, { hourlyRate: event.target.value })
                  }
                  min="0"
                  step="0.01"
                  aria-label={`${item.description} hourly rate`}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-right text-xs outline-none focus:border-blue-500"
                />
                <p className="text-right text-xs font-bold text-slate-950">
                  ${(Number(item.hours) * Number(item.hourlyRate)).toFixed(2)}
                </p>
                <RemoveButton
                  label={`Remove ${item.description} labor`}
                  onClick={() => onRemoveLabor(item.id)}
                />
              </article>
            ))}
          </div>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => togglePanel("custom")}
          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            activePanel === "custom"
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-700"
          }`}
        >
          + Add Custom Item
        </button>
        <button
          type="button"
          onClick={() => togglePanel("labor")}
          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            activePanel === "labor"
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-700"
          }`}
        >
          + Add Labor
        </button>
        <button
          type="button"
          onClick={() => togglePanel("notes")}
          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
            activePanel === "notes"
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-700"
          }`}
        >
          {hasNotes ? "Edit Notes" : "+ Add Note"}
        </button>
      </div>

      {activePanel === "custom" && (
        <CustomItemForm
          onAdd={onAddCustomItem}
          onCancel={() => setActivePanel(null)}
        />
      )}

      {activePanel === "labor" && (
        <LaborSection
          key={defaultHourlyRate}
          defaultHourlyRate={defaultHourlyRate}
          onAdd={onAddLabor}
          onCancel={() => setActivePanel(null)}
          onComplete={() => setActivePanel(null)}
        />
      )}

      {activePanel === "notes" && (
        <QuoteNotes
          notes={notes}
          onChange={onUpdateNote}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* Notes remain visible as compact context without keeping editors open. */}
      {hasNotes && activePanel !== "notes" && (
        <div className="mt-3 grid gap-2">
          {notes.customerRequest?.trim() && (
            <NotePreview
              label="Customer Request"
              tone="customer"
              value={notes.customerRequest}
            />
          )}
          {notes.technicianNotes?.trim() && (
            <NotePreview
              label="Technician Note"
              tone="technician"
              value={notes.technicianNotes}
            />
          )}
        </div>
      )}
    </section>
  );
}

export default QuoteBuilder;
