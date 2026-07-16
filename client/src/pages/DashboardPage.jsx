import { useEffect, useState } from "react";
import AdminAccess from "../components/admin/AdminAccess";
import PartForm from "../components/admin/PartForm";
import CustomerVehicleCard from "../components/customer/CustomerVehicleCard";
import PartsTable from "../components/inventory/PartsTable";
import QuoteBuilder from "../components/quote/QuoteBuilder";
import { createQuote } from "../services/quotesService";
import { generateQuotePDF } from "../utils/generateQuotePDF";

function DashboardPage() {
  const [parts, setParts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
  });
  const [isAdmin, setIsAdmin] = useState(
    () => localStorage.getItem("isAdmin") === "true"
  );
  const [adminPassword, setAdminPassword] = useState(
    () => localStorage.getItem("adminPassword") || ""
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [editingPartId, setEditingPartId] = useState(null);
  const [quoteItems, setQuoteItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const currentYear = new Date().getFullYear();
  const [vehicle, setVehicle] = useState({
    year: "",
    make: "",
    model: "",
  });

  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  

  const fetchParts = () => {
    fetch("http://localhost:5001/api/parts")
      .then((res) => res.json())
      .then((data) => setParts(data))
      .catch((err) => console.error(err));
  };

  const addToQuote = (part) => {
    setQuoteItems((prevItems) => {
      const existing = prevItems.find((item) => item._id === part._id);

      if (existing) {
        return prevItems.map((item) =>
          item._id === part._id
            ? { ...item, quoteQuantity: item.quoteQuantity + 1 }
            : item
        );
      }

      return [...prevItems, { ...part, quoteQuantity: 1 }];
    });
  };

  const total = quoteItems.reduce(
    (sum, item) => sum + item.price * item.quoteQuantity,
    0
  );

  const removeFromQuote = (id) => {
    setQuoteItems((prevItems) => prevItems.filter((item) => item._id !== id));
  };

  const increaseQuantity = (id) => {
    setQuoteItems(items =>
      items.map(item =>
        item._id === id
          ? { ...item, quoteQuantity: item.quoteQuantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (id) => {
    setQuoteItems(items =>
      items.map(item =>
        item._id === id && item.quoteQuantity > 1
          ? { ...item, quoteQuantity: item.quoteQuantity - 1 }
          : item
      )
    );
  };

  const generatePDF = () => {
    try {
      generateQuotePDF({ customerName, quoteItems, vehicle });
      setErrorMessage("");
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message || "Unable to generate PDF.");
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();

    if (adminPassword === "admin123") {
      setIsAdmin(true);
      setErrorMessage("");
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("adminPassword", adminPassword);
    } else {
      setErrorMessage("Incorrect admin password");
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setAdminPassword("");
    setEditingPartId(null);
    setFormData({
      name: "",
      price: "",
      quantity: "",
    });
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminPassword");
  };

  const handleEdit = (part) => {
    setEditingPartId(part._id);
    setFormData({
      name: part.name,
      price: part.price,
      quantity: part.quantity,
    });
    setErrorMessage("");
  };

  const handleDelete = (id) => {
    fetch(`http://localhost:5001/api/parts/${id}`, {
      method: "DELETE",
      headers: {
        "x-admin-password": adminPassword,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to delete part");
        }
        return res.json();
      })
      .then(() => {
        fetchParts();
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Unable to delete part.");
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const url = editingPartId
      ? `http://localhost:5001/api/parts/${editingPartId}`
      : "http://localhost:5001/api/parts";

    const method = editingPartId ? "PUT" : "POST";

    fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({
        name: formData.name,
        price: Number(formData.price),
        quantity: Number(formData.quantity),
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to save part");
        }
        return res.json();
      })
      .then(() => {
        setFormData({
          name: "",
          price: "",
          quantity: "",
        });
        setEditingPartId(null);
        setErrorMessage("");
        fetchParts();
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Unable to save part. Admin authorization failed.");
      });
  };

  const handleCancelEdit = () => {
    setEditingPartId(null);
    setFormData({
      name: "",
      price: "",
      quantity: "",
    });
    setErrorMessage("");
  };

  const handleYearChange = (e) => {
    const selectedYear = e.target.value;

    setVehicle({
      year: selectedYear,
      make: "",
      model: "",
    });

    setModels([]);

    if (!selectedYear) {
      setMakes([]);
      return;
    }

    fetch(`http://localhost:5001/api/vehicles/makes?year=${selectedYear}`)
      .then((res) => res.json())
      .then((data) => setMakes(data))
      .catch((err) => console.error(err));
  };
  
  const handleMakeChange = (e) => {
    const selectedMake = e.target.value;

    setVehicle({
      ...vehicle,
      make: selectedMake,
      model: "",
    });

    if (!selectedMake) {
      setModels([]);
      return;
    }

    fetch(
      `http://localhost:5001/api/vehicles/models?year=${vehicle.year}&make=${selectedMake}`
    )
      .then((res) => res.json())
      .then((data) => setModels(data))
      .catch((err) => console.error(err));
  };
  
  const handleModelChange = (e) => {
    setVehicle({
      ...vehicle,
      model: e.target.value,
    });
  };




  //保存当前报价
  const saveQuote = async () => {
    if (quoteItems.length === 0) {
      setErrorMessage("No items in quote.");
      return;
    }

    try {
      await createQuote({
        customerName: customerName || "Walk-in Customer",
        vehicle,
        items: quoteItems.map((item) => ({
          partId: item._id,
          name: item.name,
          price: item.price,
          quoteQuantity: item.quoteQuantity,
        })),
        total,
      });

      setErrorMessage("");
    } catch (err) {
      console.error(err);
      setErrorMessage("Unable to save quote.");
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

      {!isAdmin && (
        <AdminAccess
          adminPassword={adminPassword}
          errorMessage={errorMessage}
          onPasswordChange={(event) =>
            setAdminPassword(event.target.value)
          }
          onSubmit={handleAdminLogin}
        />
      )}

      {isAdmin && (
        <PartForm
          editingPartId={editingPartId}
          errorMessage={errorMessage}
          formData={formData}
          onCancel={handleCancelEdit}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      )}

      <CustomerVehicleCard
        customerName={customerName}
        makes={makes}
        models={models}
        onCustomerChange={(event) => setCustomerName(event.target.value)}
        onMakeChange={handleMakeChange}
        onModelChange={handleModelChange}
        onYearChange={handleYearChange}
        vehicle={vehicle}
        years={years}
      />

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,1fr)]">
        <PartsTable
          isAdmin={isAdmin}
          onAddToQuote={addToQuote}
          onDelete={handleDelete}
          onEdit={handleEdit}
          parts={parts}
        />

        <QuoteBuilder
          errorMessage={errorMessage}
          onClear={() => setQuoteItems([])}
          onDecreaseQuantity={decreaseQuantity}
          onGeneratePDF={generatePDF}
          onIncreaseQuantity={increaseQuantity}
          onRemove={removeFromQuote}
          onSaveQuote={saveQuote}
          quoteItems={quoteItems}
          total={total}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
