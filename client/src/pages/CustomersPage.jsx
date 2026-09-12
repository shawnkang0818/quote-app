import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminAccess from "../components/admin/AdminAccess";
import CustomerForm from "../components/customer/CustomerForm";
import { getStoredAdminToken, loginAdmin } from "../services/authService";
import {
  createCustomer,
  getCustomers,
  updateCustomer,
} from "../services/customersService";
import { createQuotePrefill } from "../utils/customerPrefill";

function vehicleName(vehicle) {
  return [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");
}

function CustomersPage() {
  const navigate = useNavigate();
  const [adminToken, setAdminToken] = useState(getStoredAdminToken);
  const [adminPassword, setAdminPassword] = useState("");
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [customerFormError, setCustomerFormError] = useState("");
  const [editingCustomer, setEditingCustomer] = useState(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounced server search supports customer name, contact information, VIN,
  // plate, make, and model without downloading the complete customer database.
  useEffect(() => {
    if (!adminToken) return undefined;
    let ignore = false;

    const timer = setTimeout(() => {
      // Loading begins only when the debounced request starts. This avoids an
      // unnecessary render for searches that are replaced within 300 ms.
      setIsLoading(true);
      getCustomers(search, adminToken)
        .then((data) => {
          if (!ignore) {
            setCustomers(data);
            setErrorMessage("");
          }
        })
        .catch((error) => {
          if (!ignore) {
            if (error.status === 401) {
              sessionStorage.removeItem("adminToken");
              setAdminToken("");
            }
            setErrorMessage(error.message);
          }
        })
        .finally(() => {
          if (!ignore) setIsLoading(false);
        });
    }, 300);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [adminToken, refreshKey, search]);

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const session = await loginAdmin(adminPassword);
      sessionStorage.setItem("adminToken", session.token);
      setAdminToken(session.token);
      setAdminPassword("");
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  // React Router carries the selected record to the dashboard without placing
  // private customer information in the URL.
  const startQuote = (customer, vehicle) => {
    navigate("/", {
      state: { quotePrefill: createQuotePrefill(customer, vehicle) },
    });
  };

  const saveCustomer = async (customerData) => {
    setIsSavingCustomer(true);
    try {
      if (editingCustomer?._id) {
        await updateCustomer(editingCustomer._id, customerData, adminToken);
      } else {
        await createCustomer(customerData, adminToken);
      }
      setEditingCustomer(undefined);
      setErrorMessage("");
      setCustomerFormError("");
      setRefreshKey((current) => current + 1);
    } catch (error) {
      if (error.status === 401) {
        sessionStorage.removeItem("adminToken");
        setAdminToken("");
      }
      setCustomerFormError(error.message || "Unable to save customer.");
    } finally {
      setIsSavingCustomer(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Customers
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Customer Records
          </h1>
          <p className="mt-2 text-slate-500">
            Find returning customers by name, contact, VIN, plate, or vehicle.
          </p>
        </div>
        {adminToken && editingCustomer === undefined && (
          <button
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setCustomerFormError("");
            }}
            className="rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
          >
            + Add customer
          </button>
        )}
      </header>

      {!adminToken ? (
        <AdminAccess
          adminPassword={adminPassword}
          description="Customer records contain private contact and vehicle information."
          errorMessage={errorMessage}
          onPasswordChange={(event) => setAdminPassword(event.target.value)}
          onSubmit={handleLogin}
        />
      ) : (
        <>
          {editingCustomer !== undefined && (
            <CustomerForm
              key={editingCustomer?._id || "new-customer"}
              customer={editingCustomer}
              errorMessage={customerFormError}
              isSaving={isSavingCustomer}
              onCancel={() => {
                setEditingCustomer(undefined);
                setCustomerFormError("");
              }}
              onSave={saveCustomer}
            />
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-medium text-slate-700">
              Search customer records
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, phone, email, VIN, plate, make, or model"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </section>

          {errorMessage && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-red-700">
              {errorMessage}
            </p>
          )}
          {isLoading ? (
            <p className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm">
              Loading customers...
            </p>
          ) : customers.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              No customer records found. A record is created when a quote with
              a phone number or email address is saved.
            </p>
          ) : (
            <section className="grid gap-4 xl:grid-cols-2">
              {customers.map((customer) => (
                <article
                  key={customer._id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-950">
                        {customer.name}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {[customer.phone, customer.email]
                          .filter(Boolean)
                          .join(" • ") || "No contact information"}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <p className="text-xs text-slate-500">
                        Last visit: {customer.lastVisitAt
                          ? new Date(customer.lastVisitAt).toLocaleDateString()
                          : "Unknown"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCustomer(customer);
                            setCustomerFormError("");
                          }}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => startQuote(customer)}
                          className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                        >
                          Use customer only
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {customer.vehicles.length === 0 ? (
                      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        No saved vehicles for this customer.
                      </p>
                    ) : (
                      customer.vehicles.map((vehicle) => (
                        <div
                          key={vehicle._id}
                          className="flex flex-col gap-3 rounded-xl bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">
                              {vehicleName(vehicle) ||
                                "Vehicle details unavailable"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {[
                                vehicle.licensePlate &&
                                  `Plate: ${vehicle.licensePlate}`,
                                vehicle.vin && `VIN: ${vehicle.vin}`,
                                vehicle.mileage != null &&
                                  `Mileage: ${Number(
                                    vehicle.mileage
                                  ).toLocaleString()}`,
                              ]
                                .filter(Boolean)
                                .join(" • ") || "No identifiers saved"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => startQuote(customer, vehicle)}
                            className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                          >
                            Use for new quote
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default CustomersPage;
