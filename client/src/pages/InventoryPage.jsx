import { useEffect, useState } from "react";
import AdminAccess from "../components/admin/AdminAccess";
import PartForm from "../components/admin/PartForm";
import InventoryTable from "../components/inventory/InventoryTable";
import { useParts } from "../hooks/useParts";
import {
  getStoredAdminToken,
  loginAdmin,
  logoutAdmin,
  verifyAdminSession,
} from "../services/authService";

function InventoryPage() {
  const [adminToken, setAdminToken] = useState(getStoredAdminToken);
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [search, setSearch] = useState("");
  const partsManager = useParts(adminToken);

  useEffect(() => {
    if (!adminToken) return;

    // Inventory mutations are protected on the server. Verifying the shared
    // session here prevents an expired tab from showing unusable edit tools.
    verifyAdminSession(adminToken).catch(() => {
      sessionStorage.removeItem("adminToken");
      setAdminToken("");
      setAuthError("Your admin session expired. Please sign in again.");
    });
  }, [adminToken]);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const session = await loginAdmin(adminPassword);
      sessionStorage.setItem("adminToken", session.token);
      setAdminToken(session.token);
      setAdminPassword("");
      setAuthError("");
    } catch (error) {
      setAuthError(error.message || "Incorrect admin password");
    }
  };

  const handleLogout = async () => {
    if (adminToken) logoutAdmin(adminToken).catch(() => {});
    sessionStorage.removeItem("adminToken");
    setAdminToken("");
    setAdminPassword("");
    setAuthError("");
    partsManager.resetForm();
  };

  const handleDelete = async (part) => {
    // Deletion is permanent, so require a deliberate confirmation containing
    // the exact part name before calling the protected API.
    const confirmed = window.confirm(
      `Delete "${part.name}" from inventory? This cannot be undone.`
    );
    if (confirmed) await partsManager.removePart(part._id);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Parts Inventory
          </h1>
          <p className="mt-2 text-slate-500">
            Add parts, update pricing and stock, or remove retired items.
          </p>
        </div>
        {adminToken && (
          <button
            type="button"
            onClick={handleLogout}
            className="self-start rounded-xl bg-slate-800 px-4 py-2.5 font-medium text-white transition hover:bg-slate-900 sm:self-auto"
          >
            Exit Admin Mode
          </button>
        )}
      </header>

      {!adminToken ? (
        <AdminAccess
          adminPassword={adminPassword}
          description="Enter the administrator password to manage prices and stock."
          errorMessage={authError}
          onPasswordChange={(event) => setAdminPassword(event.target.value)}
          onSubmit={handleLogin}
        />
      ) : (
        <div className="space-y-6">
          {partsManager.inventoryError && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {partsManager.inventoryError}
            </p>
          )}

          <PartForm
            editingPartId={partsManager.editingPartId}
            errorMessage=""
            formData={partsManager.formData}
            onCancel={partsManager.resetForm}
            onChange={partsManager.handleFormChange}
            onSubmit={partsManager.savePart}
          />

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">
              Search inventory
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, part number, brand, or category"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </section>

          <InventoryTable
            errorMessage=""
            onDelete={handleDelete}
            onEdit={partsManager.beginEdit}
            parts={partsManager.parts}
            searchQuery={search}
          />
        </div>
      )}
    </div>
  );
}

export default InventoryPage;
