import { useEffect, useMemo, useState } from "react";
import { getQuotes } from "../services/quotesService";

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
  const [customerSearch, setCustomerSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadQuotes() {
      try {
        const data = await getQuotes();

        if (!ignore) {
          setQuotes(data);
          setErrorMessage("");
        }
      } catch (error) {
        console.error(error);

        if (!ignore) {
          setErrorMessage(
            "Unable to load quote history. Make sure the backend is running."
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadQuotes();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredQuotes = useMemo(() => {
    const customerQuery = customerSearch.trim().toLowerCase();
    const vehicleQuery = vehicleSearch.trim().toLowerCase();

    return quotes.filter((quote) => {
      const customer = (quote.customerName || "Walk-in Customer").toLowerCase();
      const vehicle = formatVehicle(quote.vehicle).toLowerCase();

      return (
        customer.includes(customerQuery) && vehicle.includes(vehicleQuery)
      );
    });
  }, [customerSearch, quotes, vehicleSearch]);

  const hasFilters = customerSearch || vehicleSearch;

  const clearFilters = () => {
    setCustomerSearch("");
    setVehicleSearch("");
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

          {!isLoading && !errorMessage && (
            <p className="text-sm font-medium text-slate-500">
              Showing {filteredQuotes.length} of {quotes.length}
            </p>
          )}
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Search customer
            </span>
            <input
              type="search"
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
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
              onChange={(event) => setVehicleSearch(event.target.value)}
              placeholder="Year, make, or model"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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

      {!isLoading && !errorMessage && filteredQuotes.length === 0 && (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            {quotes.length === 0 ? "No saved quotes yet" : "No quotes found"}
          </h2>
          <p className="mt-2 text-slate-500">
            {quotes.length === 0
              ? "Save a quote from the Create Quote page and it will appear here."
              : "Try a different customer or vehicle search."}
          </p>
        </section>
      )}

      {!isLoading && !errorMessage && filteredQuotes.length > 0 && (
        <section className="grid gap-4 xl:grid-cols-2">
          {filteredQuotes.map((quote) => {
            const vehicle = formatVehicle(quote.vehicle);

            return (
              <article
                key={quote._id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
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

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <p className="mb-3 text-sm font-semibold text-slate-700">
                    {quote.items.length} quote item
                    {quote.items.length === 1 ? "" : "s"}
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
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default QuoteHistoryPage;
