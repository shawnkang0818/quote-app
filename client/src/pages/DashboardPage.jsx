import { useEffect, useState } from "react";
import AdminAccess from "../components/admin/AdminAccess";
import PartForm from "../components/admin/PartForm";
import CustomerVehicleCard from "../components/customer/CustomerVehicleCard";
import PartsTable from "../components/inventory/PartsTable";
import QuoteBuilder from "../components/quote/QuoteBuilder";
import QuickServices from "../components/services/QuickServices";
import { QUICK_SERVICES } from "../data/quickServices";
import {
  createPart,
  deletePart,
  getParts,
  updatePart,
} from "../services/partsService";
import { createQuote } from "../services/quotesService";
import {
  getVehicleMakes,
  getVehicleModels,
} from "../services/vehiclesService";
import { calculateQuoteTotals } from "../utils/calculateQuoteTotals";
import {
  getStoredAdminToken,
  loginAdmin,
  logoutAdmin,
  verifyAdminSession,
} from "../services/authService";
import { applyQuickService } from "../utils/applyQuickService";
import { useFavoriteJobs } from "../hooks/useFavoriteJobs";

// Shared validation protects both saved quotes and generated PDFs from
// incomplete labor edits.
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

function DashboardPage() {
  const { favoriteServiceIds, toggleFavorite } = useFavoriteJobs();

  // Inventory administration state is kept separate from quote-building state
  // so an admin edit cannot accidentally alter the active customer quote.
  const [parts, setParts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
  });
  const [adminToken, setAdminToken] = useState(getStoredAdminToken);
  const [isAdmin, setIsAdmin] = useState(() => Boolean(getStoredAdminToken()));
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [inventoryError, setInventoryError] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [vehicleError, setVehicleError] = useState("");
  const [editingPartId, setEditingPartId] = useState(null);

  // The active quote contains inventory parts and independent labor lines.
  // savedQuoteNumber also prevents accidentally saving the same draft twice.
  const [quoteItems, setQuoteItems] = useState([]);
  const [laborItems, setLaborItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [savedQuoteNumber, setSavedQuoteNumber] = useState("");
  const [quickServiceMessage, setQuickServiceMessage] = useState(null);

  // Customer and vehicle selections are stored with each saved quote.
  const [customerName, setCustomerName] = useState("");
  const currentYear = new Date().getFullYear();
  const [vehicle, setVehicle] = useState({
    year: "",
    make: "",
    model: "",
  });

  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);

  // Load the current inventory once when the dashboard opens.
  const loadParts = () =>
    getParts()
      .then((data) => setParts(data))
      .catch((error) => {
        console.error(error);
        setInventoryError("Unable to load parts inventory.");
      });

  // Manual part additions enforce the available stock shown in inventory.
  const addToQuote = (part) => {
    if (Number(part.quantity) <= 0) {
      setQuoteError(`${part.name} is out of stock.`);
      return;
    }

    const existing = quoteItems.find((item) => item._id === part._id);
    if (existing?.quoteQuantity >= Number(part.quantity)) {
      setQuoteError(`Only ${part.quantity} ${part.name} available.`);
      return;
    }

    setQuoteItems((prevItems) => {
      if (existing) {
        return prevItems.map((item) =>
          item._id === part._id
            ? { ...item, quoteQuantity: item.quoteQuantity + 1 }
            : item
        );
      }

      return [...prevItems, { ...part, quoteQuantity: 1 }];
    });
    setQuoteError("");
    setSaveMessage("");
    setSavedQuoteNumber("");
  };

  const totals = calculateQuoteTotals({ quoteItems, laborItems });

  // Any quote change clears the saved marker, making the updated draft
  // eligible to be saved again as a new quote.
  const removeFromQuote = (id) => {
    setQuoteItems((prevItems) => prevItems.filter((item) => item._id !== id));
    setSaveMessage("");
    setSavedQuoteNumber("");
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
    setSaveMessage("");
    setSavedQuoteNumber("");
  };

  const decreaseQuantity = (id) => {
    setQuoteItems(items =>
      items.map(item =>
        item._id === id && item.quoteQuantity > 1
          ? { ...item, quoteQuantity: item.quoteQuantity - 1 }
          : item
      )
    );
    setSaveMessage("");
    setSavedQuoteNumber("");
  };

  const addLabor = (labor) => {
    if (!labor.description || labor.hours <= 0 || labor.hourlyRate < 0) {
      setQuoteError("Enter a labor description, hours, and a valid rate.");
      return false;
    }
    setLaborItems((items) => [
      ...items,
      { ...labor, id: crypto.randomUUID() },
    ]);
    setQuoteError("");
    setSaveMessage("");
    setSavedQuoteNumber("");
    return true;
  };

  // Labor values remain editable after being added. Keeping the raw input
  // string allows a field to be temporarily blank while the user types.
  const updateLabor = (id, changes) => {
    setLaborItems((items) =>
      items.map((item) => (item.id === id ? { ...item, ...changes } : item))
    );
    setQuoteError("");
    setSaveMessage("");
    setSavedQuoteNumber("");
  };

  const removeLabor = (id) => {
    setLaborItems((items) => items.filter((item) => item.id !== id));
    setSaveMessage("");
    setSavedQuoteNumber("");
  };

  // Apply a common service as one atomic state update. Missing inventory parts
  // are reported to the user while the labor portion is still added.
  const handleQuickService = (service) => {
    const result = applyQuickService({
      service,
      parts,
      quoteItems,
      laborItems,
    });

    setQuoteItems(result.quoteItems);
    setLaborItems(result.laborItems);
    setQuoteError("");
    setSaveMessage("");
    setSavedQuoteNumber("");

    if (result.missingParts.length > 0) {
      setQuickServiceMessage({
        type: "warning",
        text: `${service.name} labor was added. Missing or unavailable inventory: ${result.missingParts.join(
          ", "
        )}.`,
      });
    } else {
      setQuickServiceMessage({
        type: "success",
        text: `${service.name} was added to the current quote.`,
      });
    }
  };

  // PDF code is loaded only when requested, keeping the initial app bundle
  // smaller and the dashboard faster to open.
  const generatePDF = async () => {
    if (!laborItems.every(isValidLaborItem)) {
      setQuoteError("Every labor item needs hours above 0 and a valid rate.");
      return;
    }

    try {
      const { generateQuotePDF } = await import("../utils/generateQuotePDF");
      generateQuotePDF({
        customerName,
        laborItems,
        quoteItems,
        quoteNumber: savedQuoteNumber,
        vehicle,
      });
      setQuoteError("");
    } catch (error) {
      console.error(error);
      setQuoteError(error.message || "Unable to generate PDF.");
    }
  };

  useEffect(() => {
    loadParts();
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminPassword");
  }, []);

  useEffect(() => {
    if (!adminToken) return;
    verifyAdminSession(adminToken).catch(() => {
      sessionStorage.removeItem("adminToken");
      setAdminToken("");
      setIsAdmin(false);
      setAdminError("Your admin session expired. Please sign in again.");
    });
  }, [adminToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // The backend verifies the password and returns a temporary session token;
  // the password itself is never saved in browser storage.
  const handleAdminLogin = async (e) => {
    e.preventDefault();

    try {
      const session = await loginAdmin(adminPassword);
      setIsAdmin(true);
      setAdminToken(session.token);
      setAdminPassword("");
      setAdminError("");
      sessionStorage.setItem("adminToken", session.token);
    } catch (error) {
      console.error(error);
      setAdminError(error.message || "Incorrect admin password");
    }
  };

  const handleAdminLogout = async () => {
    if (adminToken) {
      logoutAdmin(adminToken).catch(() => {});
    }
    setIsAdmin(false);
    setAdminToken("");
    setAdminPassword("");
    setEditingPartId(null);
    setFormData({
      name: "",
      price: "",
      quantity: "",
    });
    sessionStorage.removeItem("adminToken");
  };

  const handleEdit = (part) => {
    setEditingPartId(part._id);
    setFormData({
      name: part.name,
      price: part.price,
      quantity: part.quantity,
    });
    setInventoryError("");
  };

  const handleDelete = async (id) => {
    try {
      await deletePart(id, adminToken);
      setInventoryError("");
      await loadParts();
    } catch (error) {
      console.error(error);
      setInventoryError(error.message || "Unable to delete part.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const partData = {
      name: formData.name,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
    };

    try {
      if (editingPartId) {
        await updatePart(editingPartId, partData, adminToken);
      } else {
        await createPart(partData, adminToken);
      }

      setFormData({ name: "", price: "", quantity: "" });
      setEditingPartId(null);
      setInventoryError("");
      await loadParts();
    } catch (error) {
      console.error(error);
      setInventoryError(error.message || "Unable to save part.");
    }
  };

  const handleCancelEdit = () => {
    setEditingPartId(null);
    setFormData({
      name: "",
      price: "",
      quantity: "",
    });
    setInventoryError("");
  };

  // Vehicle dropdowns are dependent: changing Year clears Make and Model,
  // while changing Make clears Model before requesting fresh API results.
  const handleYearChange = async (e) => {
    const selectedYear = e.target.value;

    setVehicle({
      year: selectedYear,
      make: "",
      model: "",
    });
    setSaveMessage("");
    setSavedQuoteNumber("");

    setMakes([]);
    setModels([]);

    if (!selectedYear) {
      return;
    }

    try {
      const data = await getVehicleMakes(selectedYear);
      setMakes(data);
      setVehicleError("");
    } catch (error) {
      console.error(error);
      setVehicleError(error.message || "Unable to load vehicle makes.");
    }
  };
  const handleMakeChange = async (e) => {
    const selectedMake = e.target.value;

    setVehicle({
      ...vehicle,
      make: selectedMake,
      model: "",
    });
    setSaveMessage("");
    setSavedQuoteNumber("");

    if (!selectedMake) {
      setModels([]);
      return;
    }

    try {
      const data = await getVehicleModels(vehicle.year, selectedMake);
      setModels(data);
      setVehicleError("");
    } catch (error) {
      console.error(error);
      setVehicleError(error.message || "Unable to load vehicle models.");
    }
  };
  const handleModelChange = (e) => {
    setVehicle({
      ...vehicle,
      model: e.target.value,
    });
    setSaveMessage("");
    setSavedQuoteNumber("");
  };

  // Save sends raw quote inputs; the server independently validates inventory
  // and calculates the authoritative parts, labor, tax, and grand totals.
  const saveQuote = async () => {
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
    } catch (err) {
      console.error(err);
      setQuoteError(err.message || "Unable to save quote.");
    } finally {
      setIsSaving(false);
    }
  };

  const years = Array.from(
    { length: currentYear - 1990 + 1 },
    (_, index) => currentYear - index
  );
  return (
    <div>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Create Quote
          </h1>
          <p className="mt-2 text-slate-500">
            Select a customer, vehicle, and parts for a new quotation.
          </p>
        </div>

        {isAdmin ? (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              Admin Mode
            </span>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="rounded-xl bg-slate-800 px-4 py-2.5 font-medium text-white transition hover:bg-slate-900"
            >
              Exit Admin Mode
            </button>
          </div>
        ) : (
          <span className="self-start rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-600 sm:self-auto">
            View Mode
          </span>
        )}
      </header>

      <CustomerVehicleCard
        customerName={customerName}
        errorMessage={vehicleError}
        makes={makes}
        models={models}
        onCustomerChange={(event) => {
          setCustomerName(event.target.value);
          setSaveMessage("");
          setSavedQuoteNumber("");
        }}
        onMakeChange={handleMakeChange}
        onModelChange={handleModelChange}
        onYearChange={handleYearChange}
        vehicle={vehicle}
        years={years}
      />

      <QuickServices
        favoriteServiceIds={favoriteServiceIds}
        message={quickServiceMessage}
        onApply={handleQuickService}
        onToggleFavorite={toggleFavorite}
        services={QUICK_SERVICES}
      />

      {!isAdmin && (
        <AdminAccess
          adminPassword={adminPassword}
          errorMessage={adminError}
          onPasswordChange={(event) =>
            setAdminPassword(event.target.value)
          }
          onSubmit={handleAdminLogin}
        />
      )}

      {isAdmin && (
        <PartForm
          editingPartId={editingPartId}
          errorMessage={inventoryError}
          formData={formData}
          onCancel={handleCancelEdit}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      )}

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
        <PartsTable
          errorMessage={inventoryError}
          isAdmin={isAdmin}
          onAddToQuote={addToQuote}
          onDelete={handleDelete}
          onEdit={handleEdit}
          parts={parts}
        />

        <QuoteBuilder
          errorMessage={quoteError}
          isSaving={isSaving}
          isSaved={Boolean(savedQuoteNumber)}
          laborItems={laborItems}
          onAddLabor={addLabor}
          onClear={() => {
            setQuoteItems([]);
            setLaborItems([]);
            setQuoteError("");
            setSaveMessage("");
            setSavedQuoteNumber("");
          }}
          onDecreaseQuantity={decreaseQuantity}
          onGeneratePDF={generatePDF}
          onIncreaseQuantity={increaseQuantity}
          onRemove={removeFromQuote}
          onRemoveLabor={removeLabor}
          onSaveQuote={saveQuote}
          onUpdateLabor={updateLabor}
          quoteItems={quoteItems}
          saveMessage={saveMessage}
          totals={totals}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
