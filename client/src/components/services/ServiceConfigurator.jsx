function ServiceConfigurator({
  laborDraft,
  onApply,
  onCancel,
  onUpdateLabor,
  service,
}) {
  if (!service) return null;

  const handleSubmit = (event) => {
    event.preventDefault();

    // Form fields stay editable strings, then become numbers at the quote boundary.
    onApply({
      ...service,
      labor: laborDraft.map((labor) => ({
        ...labor,
        hours: Number(labor.hours),
        hourlyRate: Number(labor.hourlyRate),
      })),
    });
    onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-blue-200 bg-blue-50/70 p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Configure service
          </p>
          <h3 className="mt-1 font-semibold text-slate-950">{service.name}</h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-white hover:text-slate-800"
        >
          Cancel
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {laborDraft.map((labor, index) => (
          <div key={`${service.id}-${index}`}>
            <p className="text-sm font-medium text-slate-700">
              {labor.description}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs font-medium text-slate-600">
                Hours
                <input
                  type="number"
                  value={labor.hours}
                  onChange={(event) =>
                    onUpdateLabor(index, "hours", event.target.value)
                  }
                  min="0.1"
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Rate / hour
                <input
                  type="number"
                  value={labor.hourlyRate}
                  onChange={(event) =>
                    onUpdateLabor(index, "hourlyRate", event.target.value)
                  }
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="mt-3 w-full rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Add service to quote
      </button>
    </form>
  );
}

export default ServiceConfigurator;
