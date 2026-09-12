import { useEffect, useState } from "react";
import AdminAccess from "../components/admin/AdminAccess";
import PartForm from "../components/admin/PartForm";
import CustomerVehicleCard from "../components/customer/CustomerVehicleCard";
import PartsTable from "../components/inventory/PartsTable";
import QuoteBuilder from "../components/quote/QuoteBuilder";
import PartsServicesSearch from "../components/search/PartsServicesSearch";
import QuickServices from "../components/services/QuickServices";
import { QUICK_SERVICES } from "../data/quickServices";
import { useFavoriteJobs } from "../hooks/useFavoriteJobs";
import { useBusinessSettings } from "../hooks/useBusinessSettings";
import { useParts } from "../hooks/useParts";
import { useQuote } from "../hooks/useQuote";
import { useVehicle } from "../hooks/useVehicle";
import {
  getStoredAdminToken,
  loginAdmin,
  logoutAdmin,
  verifyAdminSession,
} from "../services/authService";
import { filterCatalogItems } from "../utils/catalogSearch";

function DashboardPage() {
  // Authentication stays at page level because it controls both inventory
  // administration and the visual mode shown in the dashboard header.
  const [adminToken, setAdminToken] = useState(getStoredAdminToken);
  const [isAdmin, setIsAdmin] = useState(() => Boolean(getStoredAdminToken()));
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");

  const favoriteJobs = useFavoriteJobs();
  const business = useBusinessSettings();
  const partsManager = useParts(adminToken);
  const quote = useQuote(partsManager.parts, business.settings.taxRate);
  const vehicleForm = useVehicle(quote.markDraftChanged);

  const matchingPartCount = filterCatalogItems(
    partsManager.parts,
    catalogSearch
  ).length;
  const matchingServiceCount = filterCatalogItems(
    QUICK_SERVICES,
    catalogSearch
  ).length;

  useEffect(() => {
    // Remove credentials left by the earlier prototype. Current sessions use
    // only the temporary token stored in sessionStorage.
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminPassword");
  }, []);

  useEffect(() => {
    if (!adminToken) return;

    verifyAdminSession(adminToken).catch(() => {
      sessionStorage.removeItem("adminToken");
      setAdminToken("");
      setIsAdmin(false);
      setAdminError("Your admin session expired. Please sign in again.");
    });
  }, [adminToken]);

  const handleAdminLogin = async (event) => {
    event.preventDefault();

    try {
      const session = await loginAdmin(adminPassword);
      sessionStorage.setItem("adminToken", session.token);
      setAdminToken(session.token);
      setIsAdmin(true);
      setAdminPassword("");
      setAdminError("");
    } catch (error) {
      console.error(error);
      setAdminError(error.message || "Incorrect admin password");
    }
  };

  const handleAdminLogout = async () => {
    if (adminToken) {
      logoutAdmin(adminToken).catch(() => {});
    }

    sessionStorage.removeItem("adminToken");
    setAdminToken("");
    setIsAdmin(false);
    setAdminPassword("");
    setAdminError("");
    partsManager.resetForm();
  };

  return (
    <div>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

        {isAdmin ? (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              Admin Mode
            </span>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="rounded-xl bg-slate-800 px-4 py-2.5 font-medium text-white transition hover:bg-slate-900"
            >
              Exit Admin Mode
            </button>
          </div>
        ) : (
          <span className="self-start rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-600 sm:self-auto">
            View Mode
          </span>
        )}
      </header>

      {business.settingsError && (
        <p className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {business.settingsError}
        </p>
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
        favoriteServiceIds={favoriteJobs.favoriteServiceIds}
        message={quote.quickServiceMessage}
        onApply={quote.applyService}
        onToggleFavorite={favoriteJobs.toggleFavorite}
        searchQuery={catalogSearch}
        services={QUICK_SERVICES}
      />

      {!isAdmin && (
        <AdminAccess
          adminPassword={adminPassword}
          errorMessage={adminError}
          onPasswordChange={(event) => setAdminPassword(event.target.value)}
          onSubmit={handleAdminLogin}
        />
      )}

      {isAdmin && (
        <PartForm
          editingPartId={partsManager.editingPartId}
          errorMessage={partsManager.inventoryError}
          formData={partsManager.formData}
          onCancel={partsManager.resetForm}
          onChange={partsManager.handleFormChange}
          onSubmit={partsManager.savePart}
        />
      )}

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
        <PartsTable
          errorMessage={partsManager.inventoryError}
          isAdmin={isAdmin}
          onAddToQuote={quote.addPart}
          onDelete={partsManager.removePart}
          onEdit={partsManager.beginEdit}
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
