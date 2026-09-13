import { useMemo, useState } from "react";
import { filterCatalogItems } from "../../utils/catalogSearch";
import {
  formatQuickServiceEstimate,
  getQuickServiceTheme,
} from "../../utils/quickServicePresentation";
import ServiceConfigurator from "../services/ServiceConfigurator";
import ServiceIcon from "../services/ServiceIcon";

const tabs = [
  { id: "all", label: "All Items" },
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
  const [availableOnly, setAvailableOnly] = useState(false);

  const searchedParts = useMemo(
    () => filterCatalogItems(parts, query),
    [parts, query]
  );
  const searchedServices = useMemo(
    () => filterCatalogItems(services, query),
    [query, services]
  );
  const filteredParts = availableOnly
    ? searchedParts.filter((part) => Number(part.quantity) > 0)
    : searchedParts;
  const filteredServices = availableOnly
    ? searchedServices.filter(
        (service) => Number(service.estimate?.missingPartCount || 0) === 0
      )
    : searchedServices;
  const showParts = activeTab === "all" || activeTab === "parts";
  const showServices = activeTab === "all" || activeTab === "services";
  const resultCount =
    (showParts ? filteredParts.length : 0) +
    (showServices ? filteredServices.length : 0);

  return (
    <section
      id="parts-services-catalog"
      className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Search Parts & Services
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Add inventory or configure a shop service.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
          {resultCount} results
        </span>
      </div>

      <label htmlFor="catalog-search" className="sr-only">
        Search parts and services
      </label>
      <div className="mt-4 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            id="catalog-search"
            type="search"
            value={query}
            onChange={onQueryChange}
            placeholder="Search catalog..."
            className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="button"
          aria-pressed={availableOnly}
          onClick={() => setAvailableOnly((current) => !current)}
          title="Show only currently available items"
          className={`inline-flex h-[42px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
            availableOnly
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M4 5h16l-6 7v5l-4 2v-7z" />
          </svg>
          <span className="hidden xl:inline">Available</span>
        </button>
      </div>

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

      <div className="mt-3 max-h-[600px] space-y-1 overflow-y-auto pr-1">
        {showServices &&
          filteredServices.map((service) => {
            const theme = getQuickServiceTheme(service);

            return (
              <button
                key={`service-${service.id}`}
                type="button"
                onClick={() => onSelectService(service)}
                className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 text-left transition hover:border-blue-100 hover:bg-blue-50/70"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${theme.soft} ${theme.accent}`}
                >
                  <ServiceIcon name={theme.icon} className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {service.name}
                  </span>
                  {service.estimate && (
                    <span className="mt-0.5 block text-[10px] font-medium leading-tight text-slate-500">
                      {formatQuickServiceEstimate(service.estimate)}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-blue-700 group-hover:text-blue-800">
                  Configure
                </span>
              </button>
            );
          })}

        {showParts &&
          filteredParts.map((part) => {
            const outOfStock = Number(part.quantity) <= 0;
            const lowStock =
              !outOfStock &&
              Number(part.quantity) <= Number(part.lowStockThreshold ?? 5);
            const theme = getQuickServiceTheme(part);
            const reference = part.partNumber || part.sku || "Inventory part";

            return (
              <div
                key={`part-${part._id}`}
                className="flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition hover:border-slate-200 hover:bg-slate-50"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${theme.soft} ${theme.accent}`}
                >
                  <ServiceIcon name={theme.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {part.name}
                  </p>
                  <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px]">
                    <span className="truncate text-slate-500">
                      {[part.brand, reference].filter(Boolean).join(" · ")}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span
                      className={`shrink-0 font-medium ${
                        outOfStock
                          ? "text-red-600"
                          : lowStock
                            ? "text-amber-600"
                            : "text-emerald-700"
                      }`}
                    >
                      {outOfStock
                        ? "Out of stock"
                        : lowStock
                          ? `${part.quantity} left`
                          : `${part.quantity} in stock`}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    ${Number(part.price).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    onClick={() => onAddPart(part)}
                    disabled={outOfStock}
                    className="mt-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-slate-400"
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
