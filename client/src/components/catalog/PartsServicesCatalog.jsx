import { useMemo } from "react";
import { filterCatalogItems } from "../../utils/catalogSearch";
import ServiceConfigurator from "../services/ServiceConfigurator";

const tabs = [
  { id: "all", label: "All" },
  { id: "parts", label: "Parts" },
  { id: "services", label: "Services" },
];

function PartsServicesCatalog({
  activeTab,
  errorMessage,
  laborDraft,
  onAddPart,
  onApplyService,
  onCancelService,
  onQueryChange,
  onSelectService,
  onTabChange,
  onUpdateLabor,
  parts,
  query,
  selectedService,
  services,
}) {
  const filteredParts = useMemo(
    () => filterCatalogItems(parts, query),
    [parts, query]
  );
  const filteredServices = useMemo(
    () => filterCatalogItems(services, query),
    [query, services]
  );
  const showParts = activeTab === "all" || activeTab === "parts";
  const showServices = activeTab === "all" || activeTab === "services";
  const resultCount =
    (showParts ? filteredParts.length : 0) +
    (showServices ? filteredServices.length : 0);

  return (
    <section
      id="parts-services-catalog"
      className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          Parts & Services
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Search the complete shop catalog.
        </p>
      </div>

      <label htmlFor="catalog-search" className="sr-only">
        Search parts and services
      </label>
      <input
        id="catalog-search"
        type="search"
        value={query}
        onChange={onQueryChange}
        placeholder="Search oil, brakes, battery..."
        className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      {/* One search and one set of tabs replace the previous duplicate lists. */}
      <div className="mt-3 flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`border-b-2 px-3 py-2 text-xs font-semibold transition ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {selectedService && (
        <div className="mt-4">
          <ServiceConfigurator
            laborDraft={laborDraft}
            onApply={onApplyService}
            onCancel={onCancelService}
            onUpdateLabor={onUpdateLabor}
            service={selectedService}
          />
        </div>
      )}

      {errorMessage && (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="mt-3 max-h-[620px] space-y-1 overflow-y-auto pr-1">
        {showServices &&
          filteredServices.map((service) => (
            <button
              key={`service-${service.id}`}
              type="button"
              onClick={() => onSelectService(service)}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-blue-50"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {service.name}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Service · {service.parts.length} part requirement
                  {service.parts.length === 1 ? "" : "s"}
                </span>
              </span>
              <span className="shrink-0 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700">
                Configure
              </span>
            </button>
          ))}

        {showParts &&
          filteredParts.map((part) => {
            const outOfStock = Number(part.quantity) <= 0;

            return (
              <div
                key={`part-${part._id}`}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {part.name}
                  </p>
                  <p
                    className={`mt-0.5 text-xs ${
                      outOfStock ? "text-red-600" : "text-slate-500"
                    }`}
                  >
                    Part · {outOfStock ? "Out of stock" : `${part.quantity} in stock`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    ${Number(part.price).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    onClick={() => onAddPart(part)}
                    disabled={outOfStock}
                    className="mt-1 text-xs font-semibold text-blue-700 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    + Add
                  </button>
                </div>
              </div>
            );
          })}

        {resultCount === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <p className="font-medium text-slate-800">No matching results</p>
            <p className="mt-1 text-xs text-slate-500">
              Try a shorter or different search.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default PartsServicesCatalog;
