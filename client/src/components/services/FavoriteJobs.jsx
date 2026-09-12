function FavoriteJobs({ services, onSelect }) {
  return (
    <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
      <div>
        <p className="text-sm font-semibold text-amber-800">★ Favorite Jobs</p>
        <p className="mt-1 text-xs text-amber-700">
          Open the services this shop uses most often.
        </p>
      </div>

      {services.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-amber-300 bg-white/70 px-4 py-3 text-sm text-amber-800">
          No favorites yet. Use the stars below to pin common jobs here.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-amber-400 hover:bg-amber-100"
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
