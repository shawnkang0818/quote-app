import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import PartsServicesCatalog from "../components/catalog/PartsServicesCatalog";
import CustomerVehicleCard from "../components/customer/CustomerVehicleCard";
import QuoteBuilder from "../components/quote/QuoteBuilder";
import QuoteSummary from "../components/quote/QuoteSummary";
import FavoriteJobs from "../components/services/FavoriteJobs";
import QuickServices from "../components/services/QuickServices";
import { useFavoriteJobs } from "../hooks/useFavoriteJobs";
import { useBusinessSettings } from "../hooks/useBusinessSettings";
import { useCustomerLookup } from "../hooks/useCustomerLookup";
import { useParts } from "../hooks/useParts";
import { useQuote } from "../hooks/useQuote";
import { useQuickServices } from "../hooks/useQuickServices";
import { useServiceSelection } from "../hooks/useServiceSelection";
import { useVehicle } from "../hooks/useVehicle";
import { estimateQuickServicePrice } from "../utils/quickServicePresentation";

function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { workspaceSearch, setWorkspaceSearch } = useOutletContext();
  const quotePrefill = location.state?.quotePrefill;
  const [catalogTab, setCatalogTab] = useState("all");
  const [showPrefillNotice, setShowPrefillNotice] = useState(() =>
    Boolean(quotePrefill)
  );

  const favoriteJobs = useFavoriteJobs();
  const business = useBusinessSettings();
  const partsManager = useParts();
  const quickServices = useQuickServices();
  const serviceSelection = useServiceSelection(
    business.settings.defaultHourlyRate
  );
  const quote = useQuote(partsManager.parts, business.settings.taxRate);
  const vehicleForm = useVehicle(quote.markDraftChanged, quotePrefill);
  const customerLookup = useCustomerLookup(vehicleForm.loadCustomerVehicle);

  // Present a useful starting price without persisting a second price source.
  // Every preview is recalculated from live inventory and labor settings.
  const presentedServices = useMemo(
    () =>
      quickServices.services.map((service) => ({
        ...service,
        estimate: estimateQuickServicePrice(
          service,
          partsManager.parts,
          business.settings.defaultHourlyRate
        ),
      })),
    [
      business.settings.defaultHourlyRate,
      partsManager.parts,
      quickServices.services,
    ]
  );

  const favoriteServices = presentedServices.filter((service) =>
    favoriteJobs.favoriteServiceIds.includes(service.id)
  );

  const selectService = (service, shouldScroll = true) => {
    serviceSelection.selectService(service);
    setCatalogTab("services");

    if (shouldScroll) {
      // Quick and favorite buttons lead directly to the shared configurator.
      requestAnimationFrame(() =>
        document
          .getElementById("parts-services-catalog")
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    }
  };

  useEffect(() => {
    if (!quotePrefill) return;

    // useVehicle has already captured the selected record. Remove its private
    // details from browser history while keeping the visible form populated.
    navigate("/", { replace: true, state: null });
  }, [navigate, quotePrefill]);

  return (
    <div>
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

      {/* Customer context and favorite jobs are the two fastest entry points. */}
      <div className="mb-3 grid items-stretch gap-3 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
        <CustomerVehicleCard
          customer={vehicleForm.customer}
          customerLookup={customerLookup}
          errorMessage={vehicleForm.vehicleError}
          isDecodingVin={vehicleForm.isDecodingVin}
          makes={vehicleForm.makes}
          models={vehicleForm.models}
          onCustomerChange={vehicleForm.handleCustomerChange}
          onMakeChange={vehicleForm.handleMakeChange}
          onModelChange={vehicleForm.handleModelChange}
          onYearChange={vehicleForm.handleYearChange}
          onVehicleDetailChange={vehicleForm.handleVehicleDetailChange}
          onDecodeVin={vehicleForm.handleVinDecode}
          vehicle={vehicleForm.vehicle}
          vinMessage={vehicleForm.vinMessage}
          years={vehicleForm.years}
        />
        <FavoriteJobs
          services={favoriteServices}
          onSelect={selectService}
        />
      </div>

      <QuickServices
        errorMessage={quickServices.errorMessage}
        favoriteServiceIds={favoriteJobs.favoriteServiceIds}
        isLoading={quickServices.isLoading}
        message={quote.quickServiceMessage}
        onSelectService={selectService}
        onToggleFavorite={favoriteJobs.toggleFavorite}
        selectedService={serviceSelection.selectedService}
        services={presentedServices}
      />

      {/* The workbench mirrors the shop flow: find, build, then confirm totals. */}
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(210px,0.85fr)_minmax(330px,1.3fr)_minmax(210px,0.72fr)]">
        <div className="min-w-0">
          <PartsServicesCatalog
            activeTab={catalogTab}
            errorMessage={partsManager.inventoryError}
            laborDraft={serviceSelection.laborDraft}
            onAddPart={quote.addPart}
            onApplyService={quote.applyService}
            onCancelService={serviceSelection.clearSelection}
            onQueryChange={(event) => setWorkspaceSearch(event.target.value)}
            onSelectService={(service) => selectService(service, false)}
            onTabChange={setCatalogTab}
            onUpdateLabor={serviceSelection.updateLaborDraft}
            parts={partsManager.parts}
            query={workspaceSearch}
            selectedService={serviceSelection.selectedService}
            // Reuse presentation data so catalog prices match Quick Services.
            services={presentedServices}
          />
        </div>

        <QuoteBuilder
          defaultHourlyRate={business.settings.defaultHourlyRate}
          laborItems={quote.laborItems}
          notes={quote.notes}
          onAddCustomItem={quote.addCustomItem}
          onAddLabor={quote.addLabor}
          onDecreaseQuantity={quote.decreaseQuantity}
          onIncreaseQuantity={quote.increaseQuantity}
          onRemove={quote.removePart}
          onRemoveLabor={quote.removeLabor}
          onUpdateNote={quote.updateNote}
          onUpdateLabor={quote.updateLabor}
          quoteItems={quote.quoteItems}
        />

        <QuoteSummary
          errorMessage={quote.quoteError}
          isSaving={quote.isSaving}
          isSaved={Boolean(quote.savedQuoteNumber)}
          laborItems={quote.laborItems}
          onClear={quote.clearQuote}
          onGeneratePDF={() =>
            quote.generatePDF({
              businessSettings: business.settings,
              customer: vehicleForm.customer,
              vehicle: vehicleForm.vehicle,
            })
          }
          onSaveQuote={() =>
            quote.saveQuote({
              customer: vehicleForm.customer,
              vehicle: vehicleForm.vehicle,
            })
          }
          quoteItems={quote.quoteItems}
          saveMessage={quote.saveMessage}
          totals={quote.totals}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
