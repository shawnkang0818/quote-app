function QuickServices({ message, onApply, services }) {
  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Fast workflow
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">
          Quick Services
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add common parts and labor to the current quote with one click.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <button
            key={service.id}
            type="button"
            onClick={() => onApply(service)}
            className="group flex items-start gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white group-hover:bg-blue-600">
              {service.shortCode}
            </span>
            <span>
              <span className="block font-semibold text-slate-900">
                {service.name}
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                {service.description}
              </span>
            </span>
          </button>
        ))}
      </div>

      {message && (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
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
