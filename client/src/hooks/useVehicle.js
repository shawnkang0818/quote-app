import { useEffect, useState } from "react";
import {
  getVehicleMakes,
  getVehicleModels,
} from "../services/vehiclesService";

const currentYear = new Date().getFullYear();
const years = Array.from(
  { length: currentYear - 1990 + 1 },
  (_, index) => currentYear - index
);

export function useVehicle(onDraftChange, quotePrefill) {
  // Capture navigation data once. Clearing the route notification later must
  // not erase a customer that has already been loaded into the draft.
  const [initialValues] = useState(() => ({
    customer: {
      name: quotePrefill?.customer?.name || "",
      phone: quotePrefill?.customer?.phone || "",
      email: quotePrefill?.customer?.email || "",
    },
    vehicle: {
      year: quotePrefill?.vehicle?.year || "",
      make: quotePrefill?.vehicle?.make || "",
      model: quotePrefill?.vehicle?.model || "",
      vin: quotePrefill?.vehicle?.vin || "",
      licensePlate: quotePrefill?.vehicle?.licensePlate || "",
      mileage: quotePrefill?.vehicle?.mileage ?? "",
    },
  }));
  const [customer, setCustomer] = useState(initialValues.customer);
  const [vehicle, setVehicle] = useState(initialValues.vehicle);
  // Include the selected values immediately so controlled selects remain
  // readable while the complete NHTSA option lists load in the background.
  const [makes, setMakes] = useState(() =>
    initialValues.vehicle.make ? [{ make: initialValues.vehicle.make }] : []
  );
  const [models, setModels] = useState(() =>
    initialValues.vehicle.model ? [{ model: initialValues.vehicle.model }] : []
  );
  const [vehicleError, setVehicleError] = useState("");

  useEffect(() => {
    const { year, make, model } = initialValues.vehicle;
    if (!year) return undefined;
    let ignore = false;

    // Prefilled selects still receive their full lists, allowing the employee
    // to correct the make or model without starting the vehicle form over.
    getVehicleMakes(year)
      .then((makeOptions) => {
        if (ignore) return;
        const includesSelected = makeOptions.some(
          (option) => option.make === make
        );
        setMakes(
          make && !includesSelected
            ? [{ make }, ...makeOptions]
            : makeOptions
        );
      })
      .catch((error) => {
        if (!ignore) {
          setVehicleError(error.message || "Unable to load vehicle makes.");
        }
      });

    if (make) {
      getVehicleModels(year, make)
        .then((modelOptions) => {
          if (ignore) return;
          const includesSelected = modelOptions.some(
            (option) => option.model === model
          );
          setModels(
            model && !includesSelected
              ? [{ model }, ...modelOptions]
              : modelOptions
          );
        })
        .catch((error) => {
          if (!ignore) {
            setVehicleError(error.message || "Unable to load vehicle models.");
          }
        });
    }

    return () => {
      ignore = true;
    };
  }, [initialValues]);

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;
    setCustomer((current) => ({ ...current, [name]: value }));
    onDraftChange();
  };

  const handleVehicleDetailChange = (event) => {
    const { name, value } = event.target;
    setVehicle((current) => ({ ...current, [name]: value }));
    onDraftChange();
  };

  // Vehicle dropdowns are dependent: a new year invalidates both make and
  // model, while a new make invalidates only the previously selected model.
  const handleYearChange = async (event) => {
    const selectedYear = event.target.value;

    setVehicle((current) => ({
      ...current,
      year: selectedYear,
      make: "",
      model: "",
    }));
    setMakes([]);
    setModels([]);
    onDraftChange();

    if (!selectedYear) return;

    try {
      setMakes(await getVehicleMakes(selectedYear));
      setVehicleError("");
    } catch (error) {
      console.error(error);
      setVehicleError(error.message || "Unable to load vehicle makes.");
    }
  };

  const handleMakeChange = async (event) => {
    const selectedMake = event.target.value;

    setVehicle((current) => ({
      ...current,
      make: selectedMake,
      model: "",
    }));
    setModels([]);
    onDraftChange();

    if (!selectedMake) return;

    try {
      setModels(await getVehicleModels(vehicle.year, selectedMake));
      setVehicleError("");
    } catch (error) {
      console.error(error);
      setVehicleError(error.message || "Unable to load vehicle models.");
    }
  };

  const handleModelChange = (event) => {
    setVehicle((current) => ({ ...current, model: event.target.value }));
    onDraftChange();
  };

  return {
    customer,
    customerName: customer.name,
    handleCustomerChange,
    handleMakeChange,
    handleModelChange,
    handleYearChange,
    handleVehicleDetailChange,
    makes,
    models,
    vehicle,
    vehicleError,
    years,
  };
}
