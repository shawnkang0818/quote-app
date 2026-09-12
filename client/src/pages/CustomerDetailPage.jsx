import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminAccess from "../components/admin/AdminAccess";
import { getStoredAdminToken, loginAdmin } from "../services/authService";
import { getCustomerDetail } from "../services/customersService";
import { createQuotePrefill } from "../utils/customerPrefill";

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

function vehicleName(vehicle) {
  return [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
}

function CustomerDetailPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [adminToken, setAdminToken] = useState(getStoredAdminToken);
  const [adminPassword, setAdminPassword] = useState("");
  const [detail, setDetail] = useState(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!adminToken) return undefined;
    let ignore = false;

    getCustomerDetail(customerId, page, adminToken)
      .then((data) => {
        if (!ignore) {
          setDetail(data);
          setErrorMessage("");
        }
      })
      .catch((error) => {
        if (ignore) return;
        if (error.status === 401) {
          sessionStorage.removeItem("adminToken");
          setAdminToken("");
        }
        setErrorMessage(error.message);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [adminToken, customerId, page]);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const session = await loginAdmin(adminPassword);
      sessionStorage.setItem("adminToken", session.token);
      setIsLoading(true);
      setAdminToken(session.token);
      setAdminPassword("");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // Route state prefills the dashboard without exposing private customer data
  // in a shareable URL or duplicating customer-to-draft mapping logic.
  const startQuote = (customer, vehicle) => {
    navigate("/", {
      state: { quotePrefill: createQuotePrefill(customer, vehicle) },
    });
  };

  const changePage = (nextPage) => {
    setIsLoading(true);
    setPage(nextPage);
  };

  if (!adminToken) {
    return (
      <AdminAccess
        adminPassword={adminPassword}
        description="Customer history contains private contact and vehicle information."
        errorMessage={errorMessage}
        onPasswordChange={(event) => setAdminPassword(event.target.value)}
        onSubmit={handleLogin}
      />
    );
  }

  if (isLoading && !detail) {
    return <p className="text-slate-500">Loading customer history...</p>;
  }

  if (errorMessage && !detail) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p>{errorMessage}</p>
        <Link to="/customers" className="mt-3 inline-block font-semibold underline">
          Return to Customers
        </Link>
      </section>
    );
  }

  if (!detail) return null;
  const { customer, quotes, pagination } = detail;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/customers" className="text-sm font-semibold text-blue-600">
            ← Customers
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{customer.name}</h1>
          <p className="mt-1 text-slate-500">
            {[customer.phone, customer.email].filter(Boolean).join(" • ")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => startQuote(customer)}
          className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          + New quote
        </button>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Vehicles</h2>
            <p className="mt-1 text-sm text-slate-500">
              Choose a saved vehicle to start a prefilled quote.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {customer.vehicles.length}
          </span>
        </div>

        {customer.vehicles.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
            No vehicles saved for this customer.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {customer.vehicles.map((vehicle) => (
              <article key={vehicle._id} className="rounded-xl bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-900">
                      {vehicleName(vehicle) || "Vehicle details unavailable"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {[
                        vehicle.licensePlate && `Plate: ${vehicle.licensePlate}`,
                        vehicle.vin && `VIN: ${vehicle.vin}`,
                        vehicle.mileage != null &&
                          `Mileage: ${Number(vehicle.mileage).toLocaleString()}`,
                      ].filter(Boolean).join(" • ") || "No identifiers saved"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startQuote(customer, vehicle)}
                    className="shrink-0 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    Start quote
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Quote History</h2>
            <p className="mt-1 text-sm text-slate-500">
              {pagination.total} saved quote{pagination.total === 1 ? "" : "s"}
            </p>
          </div>
          {customer.lastVisitAt && (
            <p className="text-sm text-slate-500">
              Last visit: {new Date(customer.lastVisitAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {quotes.length === 0 ? (
          <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
            This customer does not have any saved quotes yet.
          </p>
        ) : (
          <div className="mt-5 divide-y divide-slate-200">
            {quotes.map((quote) => (
              <article key={quote._id} className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link to={`/quotes/${quote._id}`} className="font-bold text-blue-700 hover:underline">
                    {quote.quoteNumber || "Legacy quote"}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(quote.createdAt).toLocaleString()} • {vehicleName(quote.vehicle) || "No vehicle"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${quote.status === "final" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {quote.status === "final" ? "Final" : "Draft"}
                  </span>
                  <strong className="text-slate-950">{money(quote.total)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
            <button type="button" disabled={page <= 1 || isLoading} onClick={() => changePage(page - 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40">
              Previous
            </button>
            <span className="text-sm text-slate-500">Page {pagination.page} of {pagination.pages}</span>
            <button type="button" disabled={page >= pagination.pages || isLoading} onClick={() => changePage(page + 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40">
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default CustomerDetailPage;
