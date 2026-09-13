import { useEffect, useState } from "react";
import { getStoredAdminToken } from "../services/authService";
import { createQuote, updateQuote } from "../services/quotesService";
import { applyQuickService } from "../utils/applyQuickService";
import { calculateQuoteTotals } from "../utils/calculateQuoteTotals";
import { createQuoteEditState } from "../utils/quoteEdit";

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

export function useQuote(parts, taxRate, quoteEdit, initiallyDirty = false) {
  const [initialEditState] = useState(() => createQuoteEditState(quoteEdit));
  const [quoteItems, setQuoteItems] = useState(() =>
    initialEditState.quoteItems
  );
  const [laborItems, setLaborItems] = useState(initialEditState.laborItems);
  const [quoteError, setQuoteError] = useState("");
  const [isDirty, setIsDirty] = useState(initiallyDirty);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [savedQuote, setSavedQuote] = useState(null);
  const [savedQuoteId, setSavedQuoteId] = useState("");
  const [savedQuoteNumber, setSavedQuoteNumber] = useState("");
  const [editingQuoteId, setEditingQuoteId] = useState(quoteEdit?._id || "");
  const [editingQuoteNumber, setEditingQuoteNumber] = useState(
    quoteEdit?.quoteNumber || ""
  );
  const [quoteStatus, setQuoteStatus] = useState(
    quoteEdit?.status === "final" ? "final" : "draft"
  );
  const [quickServiceMessage, setQuickServiceMessage] = useState(null);
  const [notes, setNotes] = useState(initialEditState.notes);

  const totals = calculateQuoteTotals({ quoteItems, laborItems, taxRate });

  useEffect(() => {
    if (!editingQuoteId || parts.length === 0) return;

    // Refresh editable inventory rows with current stock and price. The server
    // performs the same check at save time, so the UI and final result agree.
    setQuoteItems((items) =>
      items.map((item) => {
        if (item.isCustom) return item;
        const currentPart = parts.find((part) => part._id === item._id);
        return currentPart
          ? { ...item, ...currentPart, quoteQuantity: item.quoteQuantity }
          : item;
      })
    );
  }, [editingQuoteId, parts]);

  // Any draft change makes the previous saved marker obsolete and allows the
  // updated quote to be saved as a new record.
  const markDraftChanged = () => {
    setIsDirty(true);
    setSaveMessage("");
    setSavedQuote(null);
    setSavedQuoteId("");
    setSavedQuoteNumber("");
  };

  const updateQuoteStatus = (status) => {
    if (!["draft", "final"].includes(status)) return;
    setQuoteStatus(status);
    markDraftChanged();
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

  const addCustomItem = ({ name, price, quoteQuantity }) => {
    const cleanName = name.trim();
    const numericPrice = Number(price);
    const numericQuantity = Number(quoteQuantity);

    if (
      !cleanName ||
      cleanName.length > 160 ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      !Number.isInteger(numericQuantity) ||
      numericQuantity < 1 ||
      numericQuantity > 999
    ) {
      setQuoteError(
        "Enter a custom item name, valid price, and whole-number quantity."
      );
      return false;
    }

    // A local ID lets custom rows use the same editing controls as inventory
    // parts without pretending to have a MongoDB inventory reference.
    setQuoteItems((items) => [
      ...items,
      {
        _id: crypto.randomUUID(),
        isCustom: true,
        name: cleanName,
        price: numericPrice,
        quoteQuantity: numericQuantity,
      },
    ]);
    setQuoteError("");
    markDraftChanged();
    return true;
  };

  const removePart = (id) => {
    setQuoteItems((items) => items.filter((item) => item._id !== id));
    markDraftChanged();
  };

  const increaseQuantity = (id) => {
    const selectedItem = quoteItems.find((item) => item._id === id);
    if (
      selectedItem &&
      !selectedItem.isCustom &&
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

  const updateNote = (event) => {
    const { name, value } = event.target;
    setNotes((current) => ({ ...current, [name]: value }));
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
    setNotes({ customerRequest: "", technicianNotes: "" });
    setQuoteStatus("draft");
    setEditingQuoteId("");
    setEditingQuoteNumber("");
    setSaveMessage("");
    setSavedQuote(null);
    setSavedQuoteId("");
    setSavedQuoteNumber("");
    setIsDirty(false);
  };

  const generatePDF = async ({ businessSettings, customer, vehicle }) => {
    if (!laborItems.every(isValidLaborItem)) {
      setQuoteError("Every labor item needs hours above 0 and a valid rate.");
      return;
    }

    try {
      // PDF dependencies are loaded only on demand to keep initial startup fast.
      const { generateQuotePDF } = await import("../utils/generateQuotePDF");
      generateQuotePDF({
        customer,
        customerName: customer.name,
        businessSettings,
        laborItems,
        notes,
        quoteItems,
        quoteNumber: savedQuoteNumber,
        quoteStatus,
        vehicle,
        taxRate,
      });
      setQuoteError("");
    } catch (error) {
      console.error(error);
      setQuoteError(error.message || "Unable to generate PDF.");
    }
  };

  const saveQuote = async ({ customer, vehicle }) => {
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
      // The server re-reads inventory, validates custom lines, and calculates
      // authoritative totals rather than trusting browser calculations.
      const payload = {
        customer,
        customerName: customer.name || "Walk-in Customer",
        vehicle,
        items: quoteItems.map((item) => ({
          partId: item.isCustom ? undefined : item._id,
          isCustom: item.isCustom === true,
          name: item.name,
          price: item.price,
          quoteQuantity: item.quoteQuantity,
        })),
        laborItems: laborItems.map(({ description, hours, hourlyRate }) => ({
          description,
          hours,
          hourlyRate,
        })),
        notes,
        status: quoteStatus,
      };
      const adminToken = editingQuoteId ? getStoredAdminToken() : "";
      if (editingQuoteId && !adminToken) {
        throw new Error("Your admin session expired. Open Quote History again.");
      }
      const savedQuote = editingQuoteId
        ? await updateQuote(editingQuoteId, payload, adminToken)
        : await createQuote(payload);

      setQuoteError("");
      setSaveMessage(
        `Quote ${savedQuote.quoteNumber} ${
          editingQuoteId ? "updated" : "saved"
        } successfully.`
      );
      // Keep the permanent database ID so the success state can open the
      // exact saved record without searching Quote History first.
      setSavedQuote(savedQuote);
      setSavedQuoteId(savedQuote._id);
      setSavedQuoteNumber(savedQuote.quoteNumber);
      setIsDirty(false);
    } catch (error) {
      console.error(error);
      setQuoteError(error.message || "Unable to save quote.");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    addCustomItem,
    addLabor,
    addPart,
    applyService,
    clearQuote,
    decreaseQuantity,
    editingQuoteId,
    generatePDF,
    increaseQuantity,
    isDirty,
    isSaving,
    laborItems,
    markDraftChanged,
    notes,
    quickServiceMessage,
    quoteError,
    quoteItems,
    quoteNumber: savedQuoteNumber || editingQuoteNumber,
    quoteStatus,
    removeLabor,
    removePart,
    saveMessage,
    saveQuote,
    savedQuote,
    savedQuoteId,
    savedQuoteNumber,
    totals,
    updateNote,
    updateLabor,
    updateQuoteStatus,
  };
}
