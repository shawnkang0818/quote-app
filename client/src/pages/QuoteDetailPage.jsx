import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getStoredAdminToken } from "../services/authService";
import {
  deleteQuote,
  duplicateQuote,
  getQuote,
  updateQuoteStatus,
} from "../services/quotesService";

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

function QuoteDetailPage() {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const adminToken = getStoredAdminToken();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  // Quote details contain customer information, so this page does not issue
  // a request unless an admin session already exists in the current tab.
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
  // Older quotes may predate the stored summary fields. Recalculate only the
  // missing values so legacy records remain readable after the migration.
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
    // jsPDF is relatively large, so load it only when a user requests a PDF.
    const { generateQuotePDF } = await import("../utils/generateQuotePDF");
    generateQuotePDF({
      businessSettings: quote.business,
      customer: quote.customer,
      customerName: quote.customerName,
      laborItems: quote.laborItems || [],
      quoteItems: quote.items,
      quoteNumber: quote.quoteNumber,
      quoteDate: quote.createdAt,
      taxRate: quote.taxRate,
      vehicle: quote.vehicle,
    });
  };

  const handleStatusChange = async () => {
    const nextStatus = (quote.status || "draft") === "final" ? "draft" : "final";
    setIsWorking(true);
    try {
      const updated = await updateQuoteStatus(quoteId, nextStatus, adminToken);
      setQuote(updated);
      setActionError("");
      setActionMessage(
        nextStatus === "final" ? "Quote marked as final." : "Quote reopened as draft."
      );
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setIsWorking(false);
    }
  };

  const handleDuplicate = async () => {
    setIsWorking(true);
    try {
      // The backend revalidates stock and current prices before creating the copy.
      const duplicate = await duplicateQuote(quoteId, adminToken);
      navigate(`/quotes/${duplicate._id}`);
    } catch (requestError) {
      setActionError(requestError.message);
      setIsWorking(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete ${quote.quoteNumber || "this quote"}? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsWorking(true);
    try {
      await deleteQuote(quoteId, adminToken);
      navigate("/quotes");
    } catch (requestError) {
      setActionError(requestError.message);
      setIsWorking(false);
    }
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
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleGeneratePDF}
            className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
          >
            Generate PDF
          </button>
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={isWorking}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Duplicate as Draft
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Quote status
          </p>
          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              (quote.status || "draft") === "final"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {(quote.status || "draft") === "final" ? "Final" : "Draft"}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleStatusChange}
            disabled={isWorking}
            className="rounded-xl bg-slate-800 px-4 py-2.5 font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {(quote.status || "draft") === "final"
              ? "Reopen as Draft"
              : "Mark as Final"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isWorking}
            className="rounded-xl bg-red-50 px-4 py-2.5 font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            Delete Quote
          </button>
        </div>
      </section>

      {actionMessage && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {actionMessage}
        </p>
      )}

      {actionError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Customer</p>
          <p className="mt-1 font-semibold text-slate-900">{quote.customerName}</p>
          {(quote.customer?.phone || quote.customer?.email) && (
            <p className="mt-1 text-sm text-slate-500">
              {[quote.customer.phone, quote.customer.email]
                .filter(Boolean)
                .join(" • ")}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Vehicle</p>
          <p className="mt-1 font-semibold text-slate-900">
            {vehicle || "Not specified"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {[
              quote.vehicle?.licensePlate &&
                `Plate: ${quote.vehicle.licensePlate}`,
              quote.vehicle?.vin && `VIN: ${quote.vehicle.vin}`,
              quote.vehicle?.mileage != null &&
                `Mileage: ${Number(quote.vehicle.mileage).toLocaleString()}`,
            ]
              .filter(Boolean)
              .join(" • ") || "No additional vehicle identifiers"}
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
