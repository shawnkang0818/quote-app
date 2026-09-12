import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getQuotes } from "../services/quotesService";
import { getStoredAdminToken, loginAdmin } from "../services/authService";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

function formatVehicle(vehicle) {
  return [vehicle?.year, vehicle?.make, vehicle?.model]
    .filter(Boolean)
    .join(" ");
}

function QuoteHistoryPage() {
  const [quotes, setQuotes] = useState([]);
  const [quoteNumberSearch, setQuoteNumberSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusSearch, setStatusSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const [adminToken, setAdminToken] = useState(getStoredAdminToken);
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // History filtering is performed by the server because the complete quote
  // collection may be much larger than the ten records shown on this page.
  useEffect(() => {
    let ignore = false;

    if (!adminToken) {
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);

    // Delay requests briefly while the user types so a search does not send
    // a new database query for every individual keystroke.
    const timer = setTimeout(async () => {
      try {
        const data = await getQuotes(
          {
            customer: customerSearch.trim(),
            quoteNumber: quoteNumberSearch.trim(),
            vehicle: vehicleSearch.trim(),
            from: dateFrom,
            to: dateTo,
            status: statusSearch,
            page,
            limit: 10,
          },
          adminToken
        );

        // A newer search may finish before an older one. Ignore the older
        // response after this effect has been cleaned up.
        if (!ignore) {
          setQuotes(data.quotes);
          setPagination(data.pagination);
          setErrorMessage("");
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          // Remove an expired session immediately so restricted customer data
          // is hidden until the administrator signs in again.
          if (error.status === 401) {
            sessionStorage.removeItem("adminToken");
            setAdminToken("");
            setErrorMessage("Your admin session expired. Please sign in again.");
          } else {
            setErrorMessage(error.message || "Unable to load quote history.");
          }
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [
    adminToken,
    customerSearch,
    dateFrom,
    dateTo,
    page,
    quoteNumberSearch,
    statusSearch,
    vehicleSearch,
  ]);

  const hasFilters =
    quoteNumberSearch ||
    customerSearch ||
    vehicleSearch ||
    statusSearch ||
    dateFrom ||
    dateTo;

  const clearFilters = () => {
    setCustomerSearch("");
    setQuoteNumberSearch("");
    setVehicleSearch("");
    setDateFrom("");
    setDateTo("");
    setStatusSearch("");
    setPage(1);
  };

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const session = await loginAdmin(adminPassword);
      sessionStorage.setItem("adminToken", session.token);
      setAdminToken(session.token);
      setAdminPassword("");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Quotes
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Quote History</h1>
            <p className="mt-2 text-slate-500">
              Search and review previously saved customer quotations.
            </p>
          </div>

          {adminToken && !isLoading && !errorMessage && (
            <p className="text-sm font-medium text-slate-500">
              Showing {quotes.length} of {pagination.total}
            </p>
          )}
        </div>
      </header>

      {!adminToken && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Admin access required
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Quote history contains customer information and is restricted.
          </p>
          <form onSubmit={handleAdminLogin} className="mt-4 flex max-w-xl gap-3">
            <input
              type="password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              placeholder="Admin password"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
            >
              {isLoading ? "Checking..." : "Unlock history"}
            </button>
          </form>
          {errorMessage && (
            <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
          )}
        </section>
      )}

      {adminToken && (
        <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Quote number
            </span>
            <input
              type="search"
              value={quoteNumberSearch}
              onChange={(event) => {
                setQuoteNumberSearch(event.target.value);
                setPage(1);
              }}
              placeholder="QT-..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Quote status
            </span>
            <select
              value={statusSearch}
              onChange={(event) => {
                setStatusSearch(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="final">Final</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Search customer
            </span>
            <input
              type="search"
              value={customerSearch}
              onChange={(event) => {
                setCustomerSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Name, for example John Smith"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Search vehicle
            </span>
            <input
              type="search"
              value={vehicleSearch}
              onChange={(event) => {
                setVehicleSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Year, make, or model"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              From date
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              To date
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Clear search filters
          </button>
        )}
      </section>

      {isLoading && (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Loading quote history...
        </section>
      )}

      {!isLoading && errorMessage && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {errorMessage}
        </section>
      )}

      {!isLoading && !errorMessage && quotes.length === 0 && (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {pagination.total === 0 && !hasFilters
              ? "No saved quotes yet"
              : "No quotes found"}
          </h2>
          <p className="mt-2 text-slate-500">
            {pagination.total === 0 && !hasFilters
              ? "Save a quote from the Create Quote page and it will appear here."
              : "Try a different customer or vehicle search."}
          </p>
        </section>
      )}

      {!isLoading && !errorMessage && quotes.length > 0 && (
        <section className="grid gap-4 xl:grid-cols-2">
          {quotes.map((quote) => {
            const vehicle = formatVehicle(quote.vehicle);

            return (
              <article
                key={quote._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        {quote.quoteNumber || "Legacy quote"}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          (quote.status || "draft") === "final"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {(quote.status || "draft") === "final" ? "Final" : "Draft"}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-950">
                      {quote.customerName || "Walk-in Customer"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(quote.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <p className="text-lg font-bold text-slate-950">
                    {formatCurrency(quote.total)}
                  </p>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Vehicle
                  </p>
                  <p className="mt-1 font-medium text-slate-800">
                    {vehicle || "Vehicle not specified"}
                  </p>
                </div>

                {quote.notes?.customerRequest && (
                  <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                      Customer request
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-700">
                      {quote.notes.customerRequest}
                    </p>
                  </div>
                )}

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="mb-3 text-sm font-semibold text-slate-700">
                    {quote.items.length + (quote.laborItems?.length || 0)} quote item
                    {quote.items.length + (quote.laborItems?.length || 0) === 1
                      ? ""
                      : "s"}
                  </p>

                  <div className="space-y-2">
                    {quote.items.map((item) => (
                      <div
                        key={item._id || `${quote._id}-${item.name}`}
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <span className="text-slate-600">
                          {item.name} × {item.quoteQuantity}
                        </span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(item.price * item.quoteQuantity)}
                        </span>
                      </div>
                    ))}
                    {(quote.laborItems || []).map((item) => (
                      <div
                        key={item._id || `${quote._id}-${item.description}`}
                        className="flex items-center justify-between gap-4 text-sm"
                      >
                        <span className="text-slate-600">
                          Labor: {item.description} × {item.hours} hr
                        </span>
                        <span className="font-medium text-slate-900">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Link
                    to={`/quotes/${quote._id}`}
                    className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Open quote details →
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {!isLoading && !errorMessage && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(pagination.totalPages, current + 1))
            }
            disabled={page >= pagination.totalPages}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-medium disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default QuoteHistoryPage;
