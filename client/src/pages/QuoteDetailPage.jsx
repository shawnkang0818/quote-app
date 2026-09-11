import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getStoredAdminToken } from "../services/authService";
import { getQuote } from "../services/quotesService";

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

function QuoteDetailPage() {
  const { quoteId } = useParams();
  const adminToken = getStoredAdminToken();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!adminToken) return;

    getQuote(quoteId, adminToken)
      .then(setQuote)
      .catch((requestError) => setError(requestError.message));
  }, [adminToken, quoteId]);

  if (!adminToken) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <p>Admin access is required. Unlock Quote History first.</p>
        <Link to="/quotes" className="mt-3 inline-block font-semibold underline">
          Go to Quote History
        </Link>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p>{error}</p>
        <Link to="/quotes" className="mt-3 inline-block font-semibold underline">
          Return to Quote History
        </Link>
      </section>
    );
  }

  if (!quote) {
    return <p className="text-slate-500">Loading quote...</p>;
  }

  const vehicle = [
    quote.vehicle?.year,
    quote.vehicle?.make,
    quote.vehicle?.model,
  ]
    .filter(Boolean)
    .join(" ");
  const partsSubtotal =
    quote.partsSubtotal ??
    quote.items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quoteQuantity),
      0
    );
  const laborTotal =
    quote.laborTotal ??
    (quote.laborItems || []).reduce(
      (sum, item) => sum + Number(item.hours) * Number(item.hourlyRate),
      0
    );

  const handleGeneratePDF = async () => {
    const { generateQuotePDF } = await import("../utils/generateQuotePDF");
    generateQuotePDF({
      customerName: quote.customerName,
      laborItems: quote.laborItems || [],
      quoteItems: quote.items,
      quoteNumber: quote.quoteNumber,
      vehicle: quote.vehicle,
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/quotes" className="text-sm font-semibold text-blue-600">
            ← Quote History
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            {quote.quoteNumber || "Legacy quote"}
          </h1>
          <p className="mt-1 text-slate-500">
            {new Date(quote.createdAt).toLocaleString()}
          </p>
        </div>
        <button
          type="button"
          onClick={handleGeneratePDF}
          className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          Generate PDF
        </button>
      </header>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Customer</p>
          <p className="mt-1 font-semibold text-slate-900">{quote.customerName}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Vehicle</p>
          <p className="mt-1 font-semibold text-slate-900">
            {vehicle || "Not specified"}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-950">Quote items</h2>
        <div className="mt-4 divide-y divide-slate-200">
          {quote.items.map((item) => (
            <div key={item._id} className="flex justify-between py-3">
              <span>{item.name} × {item.quoteQuantity}</span>
              <span className="font-semibold">
                {money(item.price * item.quoteQuantity)}
              </span>
            </div>
          ))}
          {(quote.laborItems || []).map((item) => (
            <div key={item._id} className="flex justify-between py-3">
              <span>Labor: {item.description} × {item.hours} hr</span>
              <span className="font-semibold">{money(item.total)}</span>
            </div>
          ))}
        </div>
        <div className="ml-auto mt-5 max-w-sm space-y-2 border-t border-slate-200 pt-4 text-sm">
          <div className="flex justify-between"><span>Parts</span><span>{money(partsSubtotal)}</span></div>
          <div className="flex justify-between"><span>Labor</span><span>{money(laborTotal)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{money(quote.taxAmount)}</span></div>
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{money(quote.total)}</span></div>
        </div>
      </section>
    </div>
  );
}

export default QuoteDetailPage;
