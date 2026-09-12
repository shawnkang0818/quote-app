import { useEffect, useState } from "react";
import AdminAccess from "../components/admin/AdminAccess";
import {
  getStoredAdminToken,
  loginAdmin,
  verifyAdminSession,
} from "../services/authService";
import {
  getBusinessSettings,
  updateBusinessSettings,
} from "../services/settingsService";

function toForm(settings) {
  return {
    companyName: settings.companyName || "",
    address: settings.address || "",
    phone: settings.phone || "",
    email: settings.email || "",
    taxPercent: String(Number(settings.taxRate || 0) * 100),
    defaultHourlyRate: String(settings.defaultHourlyRate ?? ""),
    quoteValidityDays: String(settings.quoteValidityDays ?? 30),
    quoteNotes: settings.quoteNotes || "",
  };
}

function SettingsPage() {
  const [adminToken, setAdminToken] = useState(getStoredAdminToken);
  const [adminPassword, setAdminPassword] = useState("");
  const [form, setForm] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load the current public presentation settings, then independently verify
  // whether this tab is allowed to edit them.
  useEffect(() => {
    let ignore = false;

    getBusinessSettings()
      .then((settings) => {
        if (!ignore) setForm(toForm(settings));
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSuccessMessage("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      // The UI uses a familiar percentage while the API stores a decimal rate.
      const saved = await updateBusinessSettings(
        {
          companyName: form.companyName,
          address: form.address,
          phone: form.phone,
          email: form.email,
          taxRate: Number(form.taxPercent) / 100,
          defaultHourlyRate: Number(form.defaultHourlyRate),
          quoteValidityDays: Number(form.quoteValidityDays),
          quoteNotes: form.quoteNotes,
        },
        adminToken
      );
      setForm(toForm(saved));
      setErrorMessage("");
      setSuccessMessage("Business settings saved successfully.");
    } catch (error) {
      if (error.status === 401) {
        sessionStorage.removeItem("adminToken");
        setAdminToken("");
      }
      setErrorMessage(error.message || "Unable to save business settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Business Settings
        </h1>
        <p className="mt-2 text-slate-500">
          Control the shop identity, quote defaults, tax, and PDF terms.
        </p>
      </header>

      {!adminToken ? (
        <AdminAccess
          adminPassword={adminPassword}
          description="Enter the administrator password to edit business and quotation defaults."
          errorMessage={errorMessage}
          onPasswordChange={(event) => setAdminPassword(event.target.value)}
          onSubmit={handleLogin}
        />
      ) : !form ? (
        <p className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm">
          Loading business settings...
        </p>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Shop identity
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              These details appear at the top of generated quotations.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Company name
                <input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Address
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Phone
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Quote defaults
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              New quotes use these values; every saved quote keeps its own copy.
            </p>

            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                Tax rate (%)
                <input
                  type="number"
                  name="taxPercent"
                  value={form.taxPercent}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.001"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Default hourly rate ($)
                <input
                  type="number"
                  name="defaultHourlyRate"
                  value={form.defaultHourlyRate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Quote valid for (days)
                <input
                  type="number"
                  name="quoteValidityDays"
                  value={form.quoteValidityDays}
                  onChange={handleChange}
                  min="1"
                  max="365"
                  step="1"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  required
                />
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-3">
                Quote notes and terms
                <textarea
                  name="quoteNotes"
                  value={form.quoteNotes}
                  onChange={handleChange}
                  rows="4"
                  className="mt-1 w-full resize-y rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>
          </section>

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

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default SettingsPage;
