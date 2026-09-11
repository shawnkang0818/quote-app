import { useEffect, useState } from "react";
import AdminAccess from "../components/admin/AdminAccess";
import PartForm from "../components/admin/PartForm";
import CustomerVehicleCard from "../components/customer/CustomerVehicleCard";
import PartsTable from "../components/inventory/PartsTable";
import QuoteBuilder from "../components/quote/QuoteBuilder";
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

function DashboardPage() {
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
  const [quoteItems, setQuoteItems] = useState([]);
  const [laborItems, setLaborItems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [savedQuoteNumber, setSavedQuoteNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const currentYear = new Date().getFullYear();
  const [vehicle, setVehicle] = useState({
    year: "",
    make: "",
    model: "",
  });

  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  

  const loadParts = () =>
    getParts()
      .then((data) => setParts(data))
      .catch((error) => {
        console.error(error);
        setInventoryError("Unable to load parts inventory.");
      });

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
      return;
    }
    setLaborItems((items) => [
      ...items,
      { ...labor, id: crypto.randomUUID() },
    ]);
    setQuoteError("");
    setSaveMessage("");
    setSavedQuoteNumber("");
  };

  const removeLabor = (id) => {
    setLaborItems((items) => items.filter((item) => item.id !== id));
    setSaveMessage("");
    setSavedQuoteNumber("");
  };

  const generatePDF = async () => {
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




  //保存当前报价
  const saveQuote = async () => {
    if (quoteItems.length === 0 && laborItems.length === 0) {
      setQuoteError("Add at least one part or labor item.");
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
          quoteItems={quoteItems}
          saveMessage={saveMessage}
          totals={totals}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
