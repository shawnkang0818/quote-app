import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomerVehicleCard from "../components/customer/CustomerVehicleCard";
import PartsTable from "../components/inventory/PartsTable";
import QuoteBuilder from "../components/quote/QuoteBuilder";
import PartsServicesSearch from "../components/search/PartsServicesSearch";
import QuickServices from "../components/services/QuickServices";
import { useFavoriteJobs } from "../hooks/useFavoriteJobs";
import { useBusinessSettings } from "../hooks/useBusinessSettings";
import { useParts } from "../hooks/useParts";
import { useQuote } from "../hooks/useQuote";
import { useQuickServices } from "../hooks/useQuickServices";
import { useVehicle } from "../hooks/useVehicle";
import { filterCatalogItems } from "../utils/catalogSearch";

function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const quotePrefill = location.state?.quotePrefill;
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showPrefillNotice, setShowPrefillNotice] = useState(() =>
    Boolean(quotePrefill)
  );

  const favoriteJobs = useFavoriteJobs();
  const business = useBusinessSettings();
  const partsManager = useParts();
  const quickServices = useQuickServices();
  const quote = useQuote(partsManager.parts, business.settings.taxRate);
  const vehicleForm = useVehicle(quote.markDraftChanged, quotePrefill);

  const matchingPartCount = filterCatalogItems(
    partsManager.parts,
    catalogSearch
  ).length;
  const matchingServiceCount = filterCatalogItems(
    quickServices.services,
    catalogSearch
  ).length;

  useEffect(() => {
    if (!quotePrefill) return;

    // useVehicle has already captured the selected record. Remove its private
    // details from browser history while keeping the visible form populated.
    navigate("/", { replace: true, state: null });
  }, [navigate, quotePrefill]);

  return (
    <div>
      <header className="mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Create Quote
          </h1>
          <p className="mt-2 text-slate-500">
            Select a customer, vehicle, and parts for a new quotation.
          </p>
        </div>

      </header>

      {business.settingsError && (
        <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {business.settingsError}
        </p>
      )}

      {showPrefillNotice && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Returning customer loaded. Review the details before saving the
            quote.
          </span>
          <button
            type="button"
            onClick={() => setShowPrefillNotice(false)}
            className="self-start font-semibold text-emerald-900 hover:underline sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      <CustomerVehicleCard
        customer={vehicleForm.customer}
        errorMessage={vehicleForm.vehicleError}
        makes={vehicleForm.makes}
        models={vehicleForm.models}
        onCustomerChange={vehicleForm.handleCustomerChange}
        onMakeChange={vehicleForm.handleMakeChange}
        onModelChange={vehicleForm.handleModelChange}
        onYearChange={vehicleForm.handleYearChange}
        onVehicleDetailChange={vehicleForm.handleVehicleDetailChange}
        vehicle={vehicleForm.vehicle}
        years={vehicleForm.years}
      />

      <PartsServicesSearch
        partCount={matchingPartCount}
        query={catalogSearch}
        serviceCount={matchingServiceCount}
        onChange={(event) => setCatalogSearch(event.target.value)}
        onClear={() => setCatalogSearch("")}
      />

      <QuickServices
        defaultHourlyRate={business.settings.defaultHourlyRate}
        errorMessage={quickServices.errorMessage}
        favoriteServiceIds={favoriteJobs.favoriteServiceIds}
        isLoading={quickServices.isLoading}
        message={quote.quickServiceMessage}
        onApply={quote.applyService}
        onToggleFavorite={favoriteJobs.toggleFavorite}
        searchQuery={catalogSearch}
        services={quickServices.services}
      />

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
        <PartsTable
          errorMessage={partsManager.inventoryError}
          onAddToQuote={quote.addPart}
          parts={partsManager.parts}
          searchQuery={catalogSearch}
        />

        <QuoteBuilder
          defaultHourlyRate={business.settings.defaultHourlyRate}
          errorMessage={quote.quoteError}
          isSaving={quote.isSaving}
          isSaved={Boolean(quote.savedQuoteNumber)}
          laborItems={quote.laborItems}
          onAddLabor={quote.addLabor}
          onClear={quote.clearQuote}
          onDecreaseQuantity={quote.decreaseQuantity}
          onGeneratePDF={() =>
            quote.generatePDF({
              businessSettings: business.settings,
              customer: vehicleForm.customer,
              vehicle: vehicleForm.vehicle,
            })
          }
          onIncreaseQuantity={quote.increaseQuantity}
          onRemove={quote.removePart}
          onRemoveLabor={quote.removeLabor}
          onSaveQuote={() =>
            quote.saveQuote({
              customer: vehicleForm.customer,
              vehicle: vehicleForm.vehicle,
            })
          }
          onUpdateLabor={quote.updateLabor}
          quoteItems={quote.quoteItems}
          saveMessage={quote.saveMessage}
          totals={quote.totals}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
