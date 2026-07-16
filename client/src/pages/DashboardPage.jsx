import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import CustomerVehicleCard from "../components/customer/CustomerVehicleCard";
import PartsTable from "../components/inventory/PartsTable";
import QuoteBuilder from "../components/quote/QuoteBuilder";
import { createQuote } from "../services/quotesService";

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
    console.log("Vehicle when generating PDF: ", vehicle);

    if (quoteItems.length === 0) {
      setErrorMessage("No items in quote.");
      return;
    }

    const doc = new jsPDF();

    const quoteNumber = `QT-${Date.now()}`;
    const today = new Date().toLocaleDateString();

    const companyName = "Auto Parts Quote System";
    const companyAddress = "Brooklyn, NY";
    const companyContact = "Phone: (555) 123-4567 | Email: sales@example.com";

    const displayCustomerName = customerName || "Walk-in Customer";

    const subtotal = quoteItems.reduce(
      (sum, item) => sum + item.price * item.quoteQuantity,
      0
    );

    const taxRate = 0.0875;
    const taxAmount = subtotal * taxRate;
    const grandTotal = subtotal + taxAmount;

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(companyName, 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(companyAddress, 14, 27);
    doc.text(companyContact, 14, 33);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Quotation", 150, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Quote No: ${quoteNumber}`, 150, 28);
    doc.text(`Date: ${today}`, 150, 34);

    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 14, 48);
    const vehicleText = [
        vehicle.year,
        vehicle.make,
        vehicle.model,
      ]
        .filter(Boolean)
        .join(" ");

      console.log("Vehicle when generating PDF:", vehicle);
      console.log("Vehicle text:", vehicleText);

    doc.setFont("helvetica", "normal");
    doc.text(customerName || "Walk-in Customer", 14, 54);

    doc.setFont("helvetica", "bold");
    doc.text("Vehicle:", 14, 62);

    doc.setFont("helvetica", "normal");
    doc.text(vehicleText, 14, 68);

    doc.setFont("helvetica", "normal");
    doc.text(displayCustomerName, 14, 54);

    const tableBody = quoteItems.map((item, index) => [
      index + 1,
      item.name,
      `$${item.price.toFixed(2)}`,
      item.quoteQuantity,
      `$${(item.price * item.quoteQuantity).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 76,
      head: [["#", "Part Name", "Unit Price", "Qty", "Line Total"]],
      body: tableBody,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [41, 128, 185]
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 12 },
        2: { halign: "right" },
        3: { halign: "center", cellWidth: 18 },
        4: { halign: "right" }
      }
    });

    const finalY = doc.lastAutoTable.finalY || 80;

    doc.setFont("helvetica", "normal");
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY + 12);
    doc.text(`Tax: $${taxAmount.toFixed(2)}`, 140, finalY + 20);

    doc.setFont("helvetica", "bold");
    doc.text(`Total: $${grandTotal.toFixed(2)}`, 140, finalY + 30);

    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 14, finalY + 20);
    doc.setFont("helvetica", "normal");
    doc.text(
      "Thank you for your business. Prices are subject to change without notice.",
      14,
      finalY + 28
    );

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9);
    doc.text("Generated by Auto Parts Quote System", 14, pageHeight - 10);

    doc.save(`${quoteNumber}.pdf`);
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
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Admin Access</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter the administrator password to manage inventory.
          </p>

          <form
            onSubmit={handleAdminLogin}
            className="mt-5 flex flex-col gap-3 md:flex-row"
          >
            <input
              type="password"
              placeholder="Enter admin password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
            >
              Enter Admin Mode
            </button>
          </form>

          {errorMessage && (
            <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
          )}
        </section>
      )}

      {isAdmin && (
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">
            {editingPartId ? "Edit Part" : "Add New Part"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-5 grid gap-4 md:grid-cols-4"
          >
            <input
              type="text"
              name="name"
              placeholder="Part Name"
              value={formData.name}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
            <input
              type="number"
              name="quantity"
              placeholder="Quantity"
              value={formData.quantity}
              onChange={handleChange}
              className="rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              required
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
            >
              {editingPartId ? "Update Part" : "Add Part"}
            </button>
          </form>

          {editingPartId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="mt-4 rounded-xl bg-slate-200 px-4 py-2.5 font-medium text-slate-800 transition hover:bg-slate-300"
            >
              Cancel Edit
            </button>
          )}

          {errorMessage && (
            <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
          )}
        </section>
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
