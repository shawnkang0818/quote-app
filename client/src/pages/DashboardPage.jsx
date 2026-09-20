import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import PartsServicesCatalog from "../components/catalog/PartsServicesCatalog";
import UnsavedChangesGuard from "../components/common/UnsavedChangesGuard";
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
import { hasUnsavedQuote } from "../utils/quoteDraft";
import { estimateQuickServicePrice } from "../utils/quickServicePresentation";

function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    registerNewQuoteHandler,
    workspaceSearch,
    setWorkspaceSearch,
  } = useOutletContext();
  const quotePrefill = location.state?.quotePrefill;
  const quoteEdit = location.state?.quoteEdit;
  const initialDraft = quoteEdit || quotePrefill;
  const [catalogTab, setCatalogTab] = useState("all");
  const [initiallyDirty] = useState(() => Boolean(quotePrefill));
  const [showPrefillNotice, setShowPrefillNotice] = useState(() =>
    Boolean(initialDraft)
  );

  const favoriteJobs = useFavoriteJobs();
  const business = useBusinessSettings();
  const partsManager = useParts();
  const quickServices = useQuickServices();
  const serviceSelection = useServiceSelection(
    business.settings.defaultHourlyRate
  );
  const quote = useQuote(
    partsManager.parts,
    business.settings.taxRate,
    quoteEdit,
    initiallyDirty
  );
  const vehicleForm = useVehicle(quote.markDraftChanged, initialDraft);
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

  const hasUnsavedChanges =
    quote.isDirty &&
    hasUnsavedQuote({
      customer: vehicleForm.customer,
      laborItems: quote.laborItems,
      notes: quote.notes,
      quoteItems: quote.quoteItems,
      savedQuoteNumber: quote.savedQuoteNumber,
      vehicle: vehicleForm.vehicle,
    });

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

  const handleNewQuote = () => {
    // Saved quotes are safe to replace. Any later edit clears the saved quote
    // number, so the helper will treat that changed workspace as a draft again.
    if (
      hasUnsavedChanges &&
      !window.confirm("Start a new quote? Unsaved changes will be discarded.")
    ) {
      return;
    }

    // Reset every part of the workspace so the next quote cannot inherit
    // customer, vehicle, service, search, or pricing details from the last one.
    quote.clearQuote();
    vehicleForm.resetCustomerVehicle();
    customerLookup.resetLookup();
    serviceSelection.clearSelection();
    setWorkspaceSearch("");
    setCatalogTab("all");
    setShowPrefillNotice(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    // AppLayout owns the global New Quote button while this page owns the
    // draft state. Re-register after renders so the handler stays current.
    return registerNewQuoteHandler(handleNewQuote);
  });

  useEffect(() => {
    if (!initialDraft) return;

    // The hooks have already captured the navigation snapshot. Remove private
    // quote/customer details from browser history while preserving form state.
    navigate("/", { replace: true, state: null });
  }, [initialDraft, navigate]);

  return (
    <div>
      <UnsavedChangesGuard when={hasUnsavedChanges} />
      {business.settingsError && (
        <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {business.settingsError}
        </p>
      )}

      {showPrefillNotice && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {quote.editingQuoteId
              ? `Editing draft ${quote.quoteNumber}. Review changes before updating.`
              : "Returning customer loaded. Review the details before saving the quote."}
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
          onUpdateItemPrice={quote.updateItemPrice}
          onUpdateLabor={quote.updateLabor}
          quoteItems={quote.quoteItems}
        />

        <QuoteSummary
          errorMessage={quote.quoteError}
          isSaving={quote.isSaving}
          isSaved={Boolean(quote.savedQuoteNumber)}
          isEditing={Boolean(quote.editingQuoteId)}
          laborItems={quote.laborItems}
          onClear={quote.clearQuote}
          onGeneratePDF={() =>
            quote.generatePDF({
              businessSettings: business.settings,
              customer: vehicleForm.customer,
              vehicle: vehicleForm.vehicle,
            })
          }
          onOpenSavedQuote={() =>
            navigate(`/quotes/${quote.savedQuoteId}`, {
              // The creator may review this newly saved snapshot immediately.
              // Returning through Quote History still requires admin access.
              state: { createdQuote: quote.savedQuote },
            })
          }
          onSaveQuote={() =>
            quote.saveQuote({
              customer: vehicleForm.customer,
              vehicle: vehicleForm.vehicle,
            })
          }
          onStartNewQuote={handleNewQuote}
          quoteItems={quote.quoteItems}
          quoteNumber={quote.quoteNumber}
          quoteStatus={quote.quoteStatus}
          saveMessage={quote.saveMessage}
          totals={quote.totals}
          onStatusChange={quote.updateQuoteStatus}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
