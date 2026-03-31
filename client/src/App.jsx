import { useEffect, useState } from "react";

function App() {
  const [parts, setParts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchParts = () => {
    fetch("http://localhost:5001/api/parts")
      .then((res) => res.json())
      .then((data) => setParts(data))
      .catch((err) => console.error(err));
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

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch("http://localhost:5001/api/parts", {
      method: "POST",
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
          throw new Error("Failed to add part");
        }
        return res.json();
      })
      .then(() => {
        setFormData({
          name: "",
          price: "",
          quantity: "",
        });
        fetchParts();
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Unable to add part. Admin authorization failed.");
      });
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setAdminPassword("");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminPassword");
  };

  useEffect(() => {
    const savedAdminStatus = localStorage.getItem("isAdmin");
    const savedAdminPassword = localStorage.getItem("adminPassword");

    if (savedAdminStatus === "true" && savedAdminPassword) {
      setIsAdmin(true);
      setAdminPassword(savedAdminPassword);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Parts Management</h1>

          {isAdmin ? (
            <button
              onClick={handleAdminLogout}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
            >
              Exit Admin Mode
            </button>
          ) : (
            <span className="text-sm text-gray-500">View Mode</span>
          )}
        </div>

        {!isAdmin && (
          <div className="bg-white shadow-md rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Admin Access</h2>

            <form
              onSubmit={handleAdminLogin}
              className="flex flex-col md:flex-row gap-4"
            >
              <input
                type="password"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="border rounded-lg px-4 py-2 flex-1"
              />

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
              >
                Enter Admin Mode
              </button>
            </form>

            {errorMessage && (
              <p className="text-red-500 mt-3 text-sm">{errorMessage}</p>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="bg-white shadow-md rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Part</h2>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <input
                type="text"
                name="name"
                placeholder="Part Name"
                value={formData.name}
                onChange={handleChange}
                className="border rounded-lg px-4 py-2"
                required
              />

              <input
                type="number"
                name="price"
                placeholder="Price"
                value={formData.price}
                onChange={handleChange}
                className="border rounded-lg px-4 py-2"
                required
              />

              <input
                type="number"
                name="quantity"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="border rounded-lg px-4 py-2"
                required
              />

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2"
              >
                Add Part
              </button>
            </form>
          </div>
        )}

        <div className="bg-white shadow-md rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Parts List</h2>

          <table className="table-auto border border-gray-300 w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2 text-left">Name</th>
                <th className="border px-4 py-2 text-left">Price</th>
                <th className="border px-4 py-2 text-left">Quantity</th>
              </tr>
            </thead>

            <tbody>
              {parts.map((part) => (
                <tr key={part._id}>
                  <td className="border px-4 py-2">{part.name}</td>
                  <td className="border px-4 py-2">${part.price}</td>
                  <td className="border px-4 py-2">{part.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;