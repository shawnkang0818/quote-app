function PartsServicesSearch({
  partCount,
  query,
  serviceCount,
  onChange,
  onClear,
}) {
  const resultCount = partCount + serviceCount;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label htmlFor="catalog-search" className="block">
        <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Parts & Services Search
        </span>
        <span className="mt-1 block text-sm text-slate-500">
          Find an inventory part or a common service from one place.
        </span>
      </label>

      <div className="mt-3 flex flex-col gap-2">
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={onChange}
          placeholder="Search oil, brakes, battery, inspection..."
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        {query && (
          <button
            type="button"
            onClick={onClear}
            className="self-start rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
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
