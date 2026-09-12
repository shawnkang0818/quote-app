import { useState } from "react";
import { createQuote } from "../services/quotesService";
import { applyQuickService } from "../utils/applyQuickService";
import { calculateQuoteTotals } from "../utils/calculateQuoteTotals";

function isValidLaborItem(item) {
  const hours = Number(item.hours);
  const hourlyRate = Number(item.hourlyRate);

  return (
    Boolean(item.description?.trim()) &&
    Number.isFinite(hours) &&
    hours > 0 &&
    Number.isFinite(hourlyRate) &&
    hourlyRate >= 0
  );
}

export function useQuote(parts, taxRate) {
  const [quoteItems, setQuoteItems] = useState([]);
  const [laborItems, setLaborItems] = useState([]);
  const [quoteError, setQuoteError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [savedQuoteNumber, setSavedQuoteNumber] = useState("");
  const [quickServiceMessage, setQuickServiceMessage] = useState(null);

  const totals = calculateQuoteTotals({ quoteItems, laborItems, taxRate });

  // Any draft change makes the previous saved marker obsolete and allows the
  // updated quote to be saved as a new record.
  const markDraftChanged = () => {
    setSaveMessage("");
    setSavedQuoteNumber("");
  };

  const addPart = (part) => {
    if (Number(part.quantity) <= 0) {
      setQuoteError(`${part.name} is out of stock.`);
      return;
    }

    const existing = quoteItems.find((item) => item._id === part._id);
    if (existing?.quoteQuantity >= Number(part.quantity)) {
      setQuoteError(`Only ${part.quantity} ${part.name} available.`);
      return;
    }

    setQuoteItems((currentItems) => {
      if (existing) {
        return currentItems.map((item) =>
          item._id === part._id
            ? { ...item, quoteQuantity: item.quoteQuantity + 1 }
            : item
        );
      }

      return [...currentItems, { ...part, quoteQuantity: 1 }];
    });
    setQuoteError("");
    markDraftChanged();
  };

  const removePart = (id) => {
    setQuoteItems((items) => items.filter((item) => item._id !== id));
    markDraftChanged();
  };

  const increaseQuantity = (id) => {
    const selectedItem = quoteItems.find((item) => item._id === id);
    if (
      selectedItem &&
      selectedItem.quoteQuantity >= Number(selectedItem.quantity)
    ) {
      setQuoteError(
        `Only ${selectedItem.quantity} ${selectedItem.name} available.`
      );
      return;
    }

    setQuoteItems((items) =>
      items.map((item) =>
        item._id === id
          ? { ...item, quoteQuantity: item.quoteQuantity + 1 }
          : item
      )
    );
    setQuoteError("");
    markDraftChanged();
  };

  const decreaseQuantity = (id) => {
    setQuoteItems((items) =>
      items.map((item) =>
        item._id === id && item.quoteQuantity > 1
          ? { ...item, quoteQuantity: item.quoteQuantity - 1 }
          : item
      )
    );
    markDraftChanged();
  };

  const addLabor = (labor) => {
    if (!isValidLaborItem(labor)) {
      setQuoteError("Enter a labor description, hours, and a valid rate.");
      return false;
    }

    setLaborItems((items) => [
      ...items,
      { ...labor, id: crypto.randomUUID() },
    ]);
    setQuoteError("");
    markDraftChanged();
    return true;
  };

  // Labor inputs remain strings while being edited so fields may temporarily
  // be blank; validation converts and checks them before export or save.
  const updateLabor = (id, changes) => {
    setLaborItems((items) =>
      items.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
    setQuoteError("");
    markDraftChanged();
  };

  const removeLabor = (id) => {
    setLaborItems((items) => items.filter((item) => item.id !== id));
    markDraftChanged();
  };

  const applyService = (service) => {
    const result = applyQuickService({
      service,
      parts,
      quoteItems,
      laborItems,
    });

    setQuoteItems(result.quoteItems);
    setLaborItems(result.laborItems);
    setQuoteError("");
    markDraftChanged();

    setQuickServiceMessage(
      result.missingParts.length > 0
        ? {
            type: "warning",
            text: `${service.name} labor was added. Missing or unavailable inventory: ${result.missingParts.join(
              ", "
            )}.`,
          }
        : {
            type: "success",
            text: `${service.name} was added to the current quote.`,
          }
    );
  };

  const clearQuote = () => {
    setQuoteItems([]);
    setLaborItems([]);
    setQuoteError("");
    setQuickServiceMessage(null);
    markDraftChanged();
  };

  const generatePDF = async ({ businessSettings, customerName, vehicle }) => {
    if (!laborItems.every(isValidLaborItem)) {
      setQuoteError("Every labor item needs hours above 0 and a valid rate.");
      return;
    }

    try {
      // PDF dependencies are loaded only on demand to keep initial startup fast.
      const { generateQuotePDF } = await import("../utils/generateQuotePDF");
      generateQuotePDF({
        customerName,
        businessSettings,
        laborItems,
        quoteItems,
        quoteNumber: savedQuoteNumber,
        vehicle,
        taxRate,
      });
      setQuoteError("");
    } catch (error) {
      console.error(error);
      setQuoteError(error.message || "Unable to generate PDF.");
    }
  };

  const saveQuote = async ({ customerName, vehicle }) => {
    if (quoteItems.length === 0 && laborItems.length === 0) {
      setQuoteError("Add at least one part or labor item.");
      return;
    }

    if (!laborItems.every(isValidLaborItem)) {
      setQuoteError("Every labor item needs hours above 0 and a valid rate.");
      return;
    }

    setIsSaving(true);
    try {
      // The server re-reads inventory and calculates authoritative totals;
      // these values describe the requested quote rather than trusting the UI.
      const savedQuote = await createQuote({
        customerName: customerName || "Walk-in Customer",
        vehicle,
        items: quoteItems.map((item) => ({
          partId: item._id,
          name: item.name,
          price: item.price,
          quoteQuantity: item.quoteQuantity,
        })),
        laborItems: laborItems.map(({ description, hours, hourlyRate }) => ({
          description,
          hours,
          hourlyRate,
        })),
      });

      setQuoteError("");
      setSaveMessage(`Quote ${savedQuote.quoteNumber} saved successfully.`);
      setSavedQuoteNumber(savedQuote.quoteNumber);
    } catch (error) {
      console.error(error);
      setQuoteError(error.message || "Unable to save quote.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    addLabor,
    addPart,
    applyService,
    clearQuote,
    decreaseQuantity,
    generatePDF,
    increaseQuantity,
    isSaving,
    laborItems,
    markDraftChanged,
    quickServiceMessage,
    quoteError,
    quoteItems,
    removeLabor,
    removePart,
    saveMessage,
    saveQuote,
    savedQuoteNumber,
    totals,
    updateLabor,
  };
}
