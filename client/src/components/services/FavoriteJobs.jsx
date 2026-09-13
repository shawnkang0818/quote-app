function FavoriteJobs({ services, onSelect }) {
  return (
    <section className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
          Fast access
        </p>
        <h2 className="mt-0.5 text-lg font-semibold text-slate-950">
          ★ Favorite Jobs
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Start from the shop's most-used templates.
        </p>
      </div>

      {services.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-800">
          No favorites yet. Use the stars below to pin common jobs here.
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-800 transition hover:border-amber-300 hover:bg-amber-50"
            >
              {service.name}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default FavoriteJobs;
