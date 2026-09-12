function PartsServicesSearch({
  partCount,
  query,
  serviceCount,
  onChange,
  onClear,
}) {
  const resultCount = partCount + serviceCount;

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <label htmlFor="catalog-search" className="block">
        <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Parts & Services Search
        </span>
        <span className="mt-1 block text-sm text-slate-500">
          Find an inventory part or a common service from one place.
        </span>
      </label>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={onChange}
          placeholder="Search oil, brakes, battery, inspection..."
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {query && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
          >
            Clear Search
          </button>
        )}
      </div>

      {query && (
        <p className="mt-3 text-sm text-slate-600" aria-live="polite">
          {resultCount} result{resultCount === 1 ? "" : "s"}: {serviceCount}{" "}
          service{serviceCount === 1 ? "" : "s"} and {partCount} part
          {partCount === 1 ? "" : "s"}
        </p>
      )}
    </section>
  );
}

export default PartsServicesSearch;
