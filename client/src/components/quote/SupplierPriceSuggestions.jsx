import { useState } from "react";
import { getSupplierPriceSuggestions } from "../../services/supplierPricesService";

const AVAILABILITY_LABELS = {
  in_stock: "In stock",
  low_stock: "Low stock",
  special_order: "Special order",
  unknown: "Availability unknown",
};

function formatMoney(value, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(value);
}

function SupplierPriceSuggestions({ item, onApply, vehicle }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const findSuggestions = async () => {
    if (isOpen && hasSearched) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    setIsLoading(true);
    try {
      const data = await getSupplierPriceSuggestions({
        search: item.requirementLabel || item.name,
        vehicle,
      });
      setSuggestions(data.suggestions || []);
      setHasSearched(true);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "Unable to load supplier prices.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-t border-amber-100 bg-amber-50/40 px-3 py-2.5">
      <button
        type="button"
        onClick={findSuggestions}
        className="text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline"
      >
        {isOpen ? "Hide supplier suggestions" : "Find supplier price"}
      </button>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {isLoading && <p className="text-xs text-slate-500">Checking saved supplier prices…</p>}
          {errorMessage && <p className="text-xs text-red-700">{errorMessage}</p>}
          {!isLoading && !errorMessage && hasSearched && suggestions.length === 0 && (
            <p className="text-xs text-slate-500">
              No matching active price was found for this part and vehicle.
            </p>
          )}
          {suggestions.map((suggestion) => {
            const fitment = [
              suggestion.vehicle?.year,
              suggestion.vehicle?.make,
              suggestion.vehicle?.model,
              suggestion.vehicle?.engine,
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <div
                key={suggestion.id}
                className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-white p-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {[suggestion.brand, suggestion.partName].filter(Boolean).join(" ")}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {suggestion.supplierPartNumber} • {AVAILABILITY_LABELS[suggestion.availability] || "Unknown"}
                    {suggestion.quantityAvailable !== null && suggestion.quantityAvailable !== undefined
                      ? ` (${suggestion.quantityAvailable})`
                      : ""}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {fitment || "Universal fitment"} • Updated {new Date(suggestion.retrievedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onApply(suggestion)}
                  className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Use {formatMoney(suggestion.listPrice, suggestion.currency)}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SupplierPriceSuggestions;
