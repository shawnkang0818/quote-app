function QuickServices({
  errorMessage,
  favoriteServiceIds,
  isLoading,
  message,
  onSelectService,
  onToggleFavorite,
  selectedService,
  services,
}) {
  return (
    <section className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            Fast workflow
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">
            Quick Services
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Select a common job, then customize it in the catalog.
        </p>
      </div>

      {errorMessage ? (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : isLoading ? (
        <p className="mt-3 text-sm text-slate-500">Loading services...</p>
      ) : (
        <div className="mt-2.5 grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {services.map((service) => {
            const isFavorite = favoriteServiceIds.includes(service.id);
            const isSelected = selectedService?.id === service.id;

            return (
              <div
                key={service.id}
                className={`relative rounded-xl border transition ${
                  isSelected
                    ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectService(service)}
                  className="flex w-full items-center gap-2 p-2.5 pr-8 text-left"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-bold text-white">
                    {service.shortCode}
                  </span>
                  <span className="min-w-0 truncate text-sm font-semibold text-slate-900">
                    {service.name}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(service.id)}
                  aria-label={`${isFavorite ? "Remove" : "Add"} ${
                    service.name
                  } ${isFavorite ? "from" : "to"} favorites`}
                  className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg transition ${
                    isFavorite
                      ? "bg-amber-100 text-amber-600"
                      : "text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                  }`}
                >
                  {isFavorite ? "★" : "☆"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {message && (
        <p
          className={`mt-3 rounded-xl px-4 py-2.5 text-sm ${
            message.type === "warning"
              ? "bg-amber-50 text-amber-800"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}

export default QuickServices;
