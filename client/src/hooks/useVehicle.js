import { useState } from "react";
import {
  getVehicleMakes,
  getVehicleModels,
} from "../services/vehiclesService";

const currentYear = new Date().getFullYear();
const years = Array.from(
  { length: currentYear - 1990 + 1 },
  (_, index) => currentYear - index
);

export function useVehicle(onDraftChange) {
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [vehicle, setVehicle] = useState({
    year: "",
    make: "",
    model: "",
    vin: "",
    licensePlate: "",
    mileage: "",
  });
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [vehicleError, setVehicleError] = useState("");

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
