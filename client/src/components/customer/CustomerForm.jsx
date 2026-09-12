import { useState } from "react";

const EMPTY_VEHICLE = {
  year: "",
  make: "",
  model: "",
  vin: "",
  licensePlate: "",
  mileage: "",
};

function editableVehicle(vehicle = {}) {
  return {
    ...EMPTY_VEHICLE,
    ...vehicle,
    localId: vehicle._id || crypto.randomUUID(),
  };
}

// This form owns temporary editing state so incomplete vehicle rows never
// affect the customer list until the administrator explicitly saves them.
function CustomerForm({ customer, errorMessage, isSaving, onCancel, onSave }) {
  const [formData, setFormData] = useState(() => ({
    name: customer?.name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    vehicles: (customer?.vehicles || []).map(editableVehicle),
  }));

  const updateCustomer = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const updateVehicle = (localId, event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      vehicles: current.vehicles.map((vehicle) =>
        vehicle.localId === localId ? { ...vehicle, [name]: value } : vehicle
      ),
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    onSave({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      // Send only business fields; local React keys and Mongo IDs remain local.
      vehicles: formData.vehicles.map((vehicle) => ({
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        vin: vehicle.vin,
        licensePlate: vehicle.licensePlate,
        mileage: vehicle.mileage,
      })),
    });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            {customer ? "Edit record" : "New record"}
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            {customer ? `Update ${customer.name}` : "Add Customer"}
          </h2>
        </div>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
          Cancel
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {[
          ["name", "Customer name", "text", "Jane Doe"],
          ["phone", "Phone", "tel", "(555) 123-4567"],
          ["email", "Email", "email", "jane@example.com"],
        ].map(([name, label, type, placeholder]) => (
          <label key={name} className="block text-sm font-medium text-slate-700">
            {label}
            <input
              name={name}
              type={type}
              value={formData[name]}
              onChange={updateCustomer}
              placeholder={placeholder}
              required={name === "name"}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        ))}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Vehicles</h3>
            <p className="text-xs text-slate-500">Add every vehicle this customer may return with.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setFormData((current) => ({
                ...current,
                vehicles: [...current.vehicles, editableVehicle()],
              }))
            }
            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            + Add vehicle
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {formData.vehicles.map((vehicle, index) => (
            <div key={vehicle.localId} className="rounded-xl bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Vehicle {index + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((current) => ({
                      ...current,
                      vehicles: current.vehicles.filter(
                        (item) => item.localId !== vehicle.localId
                      ),
                    }))
                  }
                  className="text-xs font-semibold text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                {[
                  ["year", "Year", "number"],
                  ["make", "Make", "text"],
                  ["model", "Model", "text"],
                  ["vin", "VIN", "text"],
                  ["licensePlate", "Plate", "text"],
                  ["mileage", "Mileage", "number"],
                ].map(([name, label, type]) => (
                  <label key={name} className="text-xs font-medium text-slate-600">
                    {label}
                    <input
                      name={name}
                      type={type}
                      min={type === "number" ? "0" : undefined}
                      value={vehicle[name]}
                      onChange={(event) => updateVehicle(vehicle.localId, event)}
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
      >
        {isSaving ? "Saving..." : customer ? "Save changes" : "Create customer"}
      </button>
      {errorMessage && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

export default CustomerForm;
