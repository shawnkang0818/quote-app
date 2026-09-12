import { useState } from "react";
import FavoriteJobs from "./FavoriteJobs";
import { filterCatalogItems } from "../../utils/catalogSearch";

function createLaborDraft(service, defaultHourlyRate) {
  return service.labor.map((labor) => ({
    ...labor,
    // A template may override the shop default in the future; otherwise every
    // quick job starts with the rate maintained in Business Settings.
    hourlyRate: labor.hourlyRate ?? defaultHourlyRate,
  }));
}

function QuickServices({
  favoriteServiceIds,
  defaultHourlyRate,
  errorMessage,
  isLoading,
  message,
  onApply,
  onToggleFavorite,
  searchQuery,
  services,
}) {
  const [selectedService, setSelectedService] = useState(null);
  const [laborDraft, setLaborDraft] = useState([]);
  const favoriteServices = services.filter((service) =>
    favoriteServiceIds.includes(service.id)
  );
  const filteredServices = filterCatalogItems(services, searchQuery);

  // Selecting a template opens its editable defaults instead of immediately
  // changing the active quote.
  const handleSelect = (service) => {
    setSelectedService(service);
    setLaborDraft(createLaborDraft(service, defaultHourlyRate));
  };

  const updateLaborDraft = (index, field, value) => {
    setLaborDraft((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleApply = (event) => {
    event.preventDefault();

    // Convert form strings into numbers only when the service is applied.
    onApply({
      ...selectedService,
      labor: laborDraft.map((labor) => ({
        ...labor,
        hours: Number(labor.hours),
        hourlyRate: Number(labor.hourlyRate),
      })),
    });
    setSelectedService(null);
    setLaborDraft([]);
  };

  return (
    <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Fast workflow
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-950">
            Quick Services
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          Choose a job, adjust labor, and add it to the quote.
        </p>
      </div>

      <FavoriteJobs services={favoriteServices} onSelect={handleSelect} />

      {errorMessage ? (
        <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : isLoading ? (
        <p className="mt-5 rounded-xl bg-slate-50 p-6 text-center text-slate-500">
          Loading quick services...
        </p>
      ) : filteredServices.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="font-medium text-slate-800">No matching services</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a shorter or different search.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6">
          {filteredServices.map((service) => {
            const isFavorite = favoriteServiceIds.includes(service.id);

            return (
              <article
                key={service.id}
                className={`relative flex rounded-xl border transition hover:border-blue-300 hover:bg-blue-50 ${
                  selectedService?.id === service.id
                    ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                    : "border-slate-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(service)}
                  className="group flex min-w-0 flex-1 items-start gap-3 p-3 pr-10 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white group-hover:bg-blue-600">
                    {service.shortCode}
                  </span>
                  <span>
                    <span className="block font-semibold text-slate-900">
                      {service.name}
                    </span>
                    <span className="mt-1 block text-xs leading-4 text-slate-500 2xl:hidden">
                      {service.description}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleFavorite(service.id)}
                  aria-label={`${isFavorite ? "Remove" : "Add"} ${
                    service.name
                  } ${isFavorite ? "from" : "to"} favorites`}
                  title={`${isFavorite ? "Remove from" : "Add to"} favorites`}
                  className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-lg transition ${
                    isFavorite
                      ? "bg-amber-100 text-amber-600 hover:bg-amber-200"
                      : "bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-600"
                  }`}
                >
                  {isFavorite ? "★" : "☆"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      {selectedService && (
        <form
          onSubmit={handleApply}
          className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/60 p-5"
        >
          <p className="text-sm font-semibold text-blue-700">
            Configure service
          </p>
          <h3 className="mt-1 font-semibold text-slate-950">
            {selectedService.name}
          </h3>

          <div className="mt-4 space-y-4">
            {laborDraft.map((labor, index) => (
              <div
                key={`${selectedService.id}-${index}`}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <p className="font-medium text-slate-800">
                  {labor.description}
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium text-slate-600">
                    Labor Hours
                    {/* Accept quarter-hour and decimal labor entries such as 1.25. */}
                    <input
                      type="number"
                      value={labor.hours}
                      onChange={(event) =>
                        updateLaborDraft(index, "hours", event.target.value)
                      }
                      min="0.1"
                      step="0.01"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-600">
                    Hourly Rate ($)
                    <input
                      type="number"
                      value={labor.hourlyRate}
                      onChange={(event) =>
                        updateLaborDraft(
                          index,
                          "hourlyRate",
                          event.target.value
                        )
                      }
                      min="0"
                      step="0.01"
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Add service to quote
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedService(null);
                setLaborDraft([]);
              }}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

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
