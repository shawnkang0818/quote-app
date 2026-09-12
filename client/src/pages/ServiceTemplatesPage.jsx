import { useEffect, useState } from "react";
import AdminAccess from "../components/admin/AdminAccess";
import ServiceTemplateForm from "../components/services/ServiceTemplateForm";
import {
  getStoredAdminToken,
  loginAdmin,
  logoutAdmin,
  verifyAdminSession,
} from "../services/authService";
import {
  createQuickService,
  deleteQuickService,
  getQuickServices,
  updateQuickService,
} from "../services/quickServicesService";

function ServiceTemplatesPage() {
  const [adminToken, setAdminToken] = useState(getStoredAdminToken);
  const [adminPassword, setAdminPassword] = useState("");
  const [services, setServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [formVersion, setFormVersion] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadServices = async () => {
    setServices(await getQuickServices());
  };

  useEffect(() => {
    let ignore = false;
    getQuickServices()
      .then((data) => {
        if (!ignore) setServices(data);
      })
      .catch((error) => {
        if (!ignore) setErrorMessage(error.message);
      });

    if (adminToken) {
      verifyAdminSession(adminToken).catch(() => {
        if (!ignore) {
          sessionStorage.removeItem("adminToken");
          setAdminToken("");
          setErrorMessage("Your admin session expired. Please sign in again.");
        }
      });
    }
    return () => {
      ignore = true;
    };
  }, [adminToken]);

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

  const resetEditor = () => {
    setEditingService(null);
    setFormVersion((version) => version + 1);
  };

  const handleSave = async (payload) => {
    try {
      if (editingService) {
        await updateQuickService(editingService._id, payload, adminToken);
        setSuccessMessage("Service template updated.");
      } else {
        await createQuickService(payload, adminToken);
        setSuccessMessage("Service template added.");
      }
      setErrorMessage("");
      resetEditor();
      await loadServices();
    } catch (error) {
      setErrorMessage(error.message || "Unable to save service template.");
    }
  };

  const handleDelete = async (service) => {
    const confirmed = window.confirm(
      `Delete "${service.name}"? It will no longer appear on Create Quote.`
    );
    if (!confirmed) return;

    try {
      await deleteQuickService(service._id, adminToken);
      if (editingService?._id === service._id) resetEditor();
      setSuccessMessage("Service template deleted.");
      setErrorMessage("");
      await loadServices();
    } catch (error) {
      setErrorMessage(error.message || "Unable to delete service template.");
    }
  };

  const handleLogout = async () => {
    if (adminToken) logoutAdmin(adminToken).catch(() => {});
    sessionStorage.removeItem("adminToken");
    setAdminToken("");
    resetEditor();
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Service Templates
          </h1>
          <p className="mt-2 text-slate-500">
            Manage the common jobs employees can add to a quote in seconds.
          </p>
        </div>
        {adminToken && (
          <button
            type="button"
            onClick={handleLogout}
            className="self-start rounded-xl bg-slate-800 px-4 py-2.5 font-medium text-white hover:bg-slate-900 sm:self-auto"
          >
            Exit Admin Mode
          </button>
        )}
      </header>

      {!adminToken ? (
        <AdminAccess
          adminPassword={adminPassword}
          description="Enter the administrator password to manage quick service templates."
          errorMessage={errorMessage}
          onPasswordChange={(event) => setAdminPassword(event.target.value)}
          onSubmit={handleLogin}
        />
      ) : (
        <div className="space-y-6">
          {errorMessage && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </p>
          )}

          <ServiceTemplateForm
            key={`${editingService?._id || "new"}-${formVersion}`}
            editingService={editingService}
            onCancel={resetEditor}
            onSave={handleSave}
          />

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Current Templates
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Changes appear on Create Quote after the page is refreshed.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                {services.length} services
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {services.map((service) => (
                <article
                  key={service._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                        {service.shortCode}
                      </span>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {service.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {service.description || "No description"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingService(service);
                          setSuccessMessage("");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(service)}
                        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {service.parts.length} part requirement(s) • {service.labor.length} labor item(s)
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ServiceTemplatesPage;
