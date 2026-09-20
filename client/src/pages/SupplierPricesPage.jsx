import { useCallback, useEffect, useState } from "react";
import AdminAccess from "../components/admin/AdminAccess";
import SupplierPriceForm from "../components/suppliers/SupplierPriceForm";
import SupplierPriceTable from "../components/suppliers/SupplierPriceTable";
import {
  getStoredAdminToken,
  loginAdmin,
  logoutAdmin,
  verifyAdminSession,
} from "../services/authService";
import {
  createSupplierPrice,
  getSupplierPrices,
  updateSupplierPrice,
} from "../services/supplierPricesService";

const EMPTY_FILTERS = {
  search: "",
  supplier: "",
  year: "",
  make: "",
  model: "",
  availability: "",
  includeInactive: "false",
};

function SupplierPricesPage() {
  const [adminToken, setAdminToken] = useState(getStoredAdminToken);
  const [adminPassword, setAdminPassword] = useState("");
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [editingPrice, setEditingPrice] = useState(null);
  const [formVersion, setFormVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadPrices = useCallback(
    async (page = 1) => {
      if (!adminToken) return;
      setIsLoading(true);
      try {
        const data = await getSupplierPrices(
          { ...filters, page, limit: 25 },
          adminToken
        );
        setItems(data.items);
        setPagination(data.pagination);
        setErrorMessage("");
      } catch (error) {
        if (error.status === 401) {
          sessionStorage.removeItem("adminToken");
          setAdminToken("");
          setErrorMessage("Your admin session expired. Please sign in again.");
        } else {
          setErrorMessage(error.message || "Unable to load supplier prices.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [adminToken, filters]
  );

  useEffect(() => {
    if (!adminToken) return;
    let ignore = false;

    verifyAdminSession(adminToken)
      .then(() => {
        if (!ignore) loadPrices(1);
      })
      .catch(() => {
        if (!ignore) {
          sessionStorage.removeItem("adminToken");
          setAdminToken("");
          setErrorMessage("Your admin session expired. Please sign in again.");
        }
      });
    return () => {
      ignore = true;
    };
  }, [adminToken, loadPrices]);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const session = await loginAdmin(adminPassword);
      sessionStorage.setItem("adminToken", session.token);
      setAdminToken(session.token);
      setAdminPassword("");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "Incorrect admin password");
    }
  };

  const handleLogout = async () => {
    if (adminToken) logoutAdmin(adminToken).catch(() => {});
    sessionStorage.removeItem("adminToken");
    setAdminToken("");
    setItems([]);
    setEditingPrice(null);
    setSuccessMessage("");
  };

  const handleSave = async (payload) => {
    try {
      if (editingPrice) {
        await updateSupplierPrice(editingPrice._id, payload, adminToken);
        setSuccessMessage("Supplier price updated.");
      } else {
        await createSupplierPrice(payload, adminToken);
        setSuccessMessage("Supplier price added.");
        // The editor remains in create mode, so changing a key explicitly
        // resets its local form state after a successful insertion.
        setFormVersion((version) => version + 1);
      }
      setEditingPrice(null);
      setErrorMessage("");
      await loadPrices(editingPrice ? pagination.page : 1);
    } catch (error) {
      setErrorMessage(error.message || "Unable to save supplier price.");
    }
  };

  const handleToggleActive = async (price) => {
    try {
      await updateSupplierPrice(
        price._id,
        { ...price, active: !price.active },
        adminToken
      );
      setSuccessMessage(price.active ? "Supplier price deactivated." : "Supplier price restored.");
      setErrorMessage("");
      await loadPrices(pagination.page);
    } catch (error) {
      setErrorMessage(error.message || "Unable to update supplier price.");
    }
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setFilters(draftFilters);
    setSuccessMessage("");
  };

  const resetFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Administration</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Supplier Prices</h1>
          <p className="mt-2 text-slate-500">Maintain time-stamped supplier costs without changing shop inventory automatically.</p>
        </div>
        {adminToken && (
          <button type="button" onClick={handleLogout} className="self-start rounded-xl bg-slate-800 px-4 py-2.5 font-medium text-white hover:bg-slate-900 sm:self-auto">
            Exit Admin Mode
          </button>
        )}
      </header>

      {!adminToken ? (
        <AdminAccess
          adminPassword={adminPassword}
          description="Enter the administrator password to view supplier costs and pricing sources."
          errorMessage={errorMessage}
          onPasswordChange={(event) => setAdminPassword(event.target.value)}
          onSubmit={handleLogin}
        />
      ) : (
        <div className="space-y-6">
          {errorMessage && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}
          {successMessage && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>}

          <SupplierPriceForm
            key={`${editingPrice?._id || "new"}-${formVersion}`}
            editingPrice={editingPrice}
            onCancel={() => setEditingPrice(null)}
            onSave={handleSave}
          />

          <form onSubmit={applyFilters} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <input type="search" value={draftFilters.search} onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Part name or number" className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm lg:col-span-2" />
              <input value={draftFilters.supplier} onChange={(event) => setDraftFilters((current) => ({ ...current, supplier: event.target.value }))} placeholder="Supplier" className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              <input value={draftFilters.year} onChange={(event) => setDraftFilters((current) => ({ ...current, year: event.target.value }))} placeholder="Year" className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              <input value={draftFilters.make} onChange={(event) => setDraftFilters((current) => ({ ...current, make: event.target.value }))} placeholder="Make" className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              <input value={draftFilters.model} onChange={(event) => setDraftFilters((current) => ({ ...current, model: event.target.value }))} placeholder="Model" className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
              <select value={draftFilters.availability} onChange={(event) => setDraftFilters((current) => ({ ...current, availability: event.target.value }))} className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm">
                <option value="">All availability</option>
                <option value="in_stock">In stock</option>
                <option value="low_stock">Low stock</option>
                <option value="out_of_stock">Out of stock</option>
                <option value="special_order">Special order</option>
                <option value="unknown">Unknown</option>
              </select>
              <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700 lg:col-span-2">
                <input type="checkbox" checked={draftFilters.includeInactive === "true"} onChange={(event) => setDraftFilters((current) => ({ ...current, includeInactive: event.target.checked ? "true" : "false" }))} />
                Include inactive prices
              </label>
              <div className="flex gap-2 lg:col-span-3 lg:justify-end">
                <button type="button" onClick={resetFilters} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200">Reset</button>
                <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Search</button>
              </div>
            </div>
          </form>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{pagination.total} supplier price record(s)</span>
            <span>Page {pagination.page} of {pagination.pages}</span>
          </div>

          <SupplierPriceTable
            items={items}
            isLoading={isLoading}
            onEdit={(price) => {
              setEditingPrice(price);
              setSuccessMessage("");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onToggleActive={handleToggleActive}
          />

          {pagination.pages > 1 && (
            <div className="flex justify-center gap-3">
              <button type="button" disabled={pagination.page <= 1 || isLoading} onClick={() => loadPrices(pagination.page - 1)} className="rounded-xl bg-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-40">Previous</button>
              <button type="button" disabled={pagination.page >= pagination.pages || isLoading} onClick={() => loadPrices(pagination.page + 1)} className="rounded-xl bg-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SupplierPricesPage;
