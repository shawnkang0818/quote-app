import { useEffect, useState } from "react";
import {
  decodeVin,
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
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [vinMessage, setVinMessage] = useState("");

  // Load a returning customer directly inside the dashboard. The selected
  // values appear immediately while complete NHTSA lists load for corrections.
  const loadCustomerVehicle = async (savedCustomer = {}, savedVehicle = {}) => {
    const nextCustomer = {
      name: savedCustomer.name || "",
      phone: savedCustomer.phone || "",
      email: savedCustomer.email || "",
    };
    const nextVehicle = {
      year: savedVehicle.year || "",
      make: savedVehicle.make || "",
      model: savedVehicle.model || "",
      vin: savedVehicle.vin || "",
      licensePlate: savedVehicle.licensePlate || "",
      mileage: savedVehicle.mileage ?? "",
    };

    setCustomer(nextCustomer);
    setVehicle(nextVehicle);
    setMakes(nextVehicle.make ? [{ make: nextVehicle.make }] : []);
    setModels(nextVehicle.model ? [{ model: nextVehicle.model }] : []);
    setVehicleError("");
    onDraftChange();

    if (!nextVehicle.year) return;

    try {
      const makeOptions = await getVehicleMakes(nextVehicle.year);
      setMakes(
        nextVehicle.make &&
          !makeOptions.some((option) => option.make === nextVehicle.make)
          ? [{ make: nextVehicle.make }, ...makeOptions]
          : makeOptions
      );

      if (nextVehicle.make) {
        const modelOptions = await getVehicleModels(
          nextVehicle.year,
          nextVehicle.make
        );
        setModels(
          nextVehicle.model &&
            !modelOptions.some((option) => option.model === nextVehicle.model)
            ? [{ model: nextVehicle.model }, ...modelOptions]
            : modelOptions
        );
      }
    } catch (error) {
      console.error(error);
      setVehicleError(
        error.message || "Customer loaded, but vehicle options are unavailable."
      );
    }
  };

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
    // VIN input is normalized as the employee types, while the other vehicle
    // identifiers retain their original formatting.
    const nextValue =
      name === "vin"
        ? value.toUpperCase().replace(/\s/g, "").slice(0, 17)
        : value;
    setVehicle((current) => ({ ...current, [name]: nextValue }));
    if (name === "vin") {
      setVinMessage("");
      setVehicleError("");
    }
    onDraftChange();
  };

  const handleVinDecode = async () => {
    setIsDecodingVin(true);
    setVehicleError("");
    setVinMessage("");

    try {
      const decoded = await decodeVin(vehicle.vin);
      const nextVehicle = {
        ...vehicle,
        vin: decoded.vin,
        year: decoded.year,
        make: decoded.make,
        model: decoded.model,
      };

      // Show decoded values immediately; complete option lists load afterward
      // so every field can still be corrected manually.
      setVehicle(nextVehicle);
      setMakes(decoded.make ? [{ make: decoded.make }] : []);
      setModels(decoded.model ? [{ model: decoded.model }] : []);
      setVinMessage(
        decoded.warning ||
          `Decoded ${[decoded.year, decoded.make, decoded.model]
            .filter(Boolean)
            .join(" ")}.`
      );
      onDraftChange();

      if (decoded.year) {
        const makeOptions = await getVehicleMakes(decoded.year);
        setMakes(
          decoded.make &&
            !makeOptions.some((option) => option.make === decoded.make)
            ? [{ make: decoded.make }, ...makeOptions]
            : makeOptions
        );

        if (decoded.make) {
          const modelOptions = await getVehicleModels(decoded.year, decoded.make);
          setModels(
            decoded.model &&
              !modelOptions.some((option) => option.model === decoded.model)
              ? [{ model: decoded.model }, ...modelOptions]
              : modelOptions
          );
        }
      }
    } catch (error) {
      console.error(error);
      setVehicleError(error.message || "Unable to decode this VIN.");
    } finally {
      setIsDecodingVin(false);
    }
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

  const resetCustomerVehicle = () => {
    setCustomer({ name: "", phone: "", email: "" });
    setVehicle({
      year: "",
      make: "",
      model: "",
      vin: "",
      licensePlate: "",
      mileage: "",
    });
    setMakes([]);
    setModels([]);
    setVehicleError("");
    setVinMessage("");
  };

  return {
    customer,
    customerName: customer.name,
    handleCustomerChange,
    handleVinDecode,
    handleMakeChange,
    handleModelChange,
    handleYearChange,
    handleVehicleDetailChange,
    makes,
    models,
    resetCustomerVehicle,
    isDecodingVin,
    loadCustomerVehicle,
    vehicle,
    vehicleError,
    vinMessage,
    // A decoded classic vehicle may predate the normal 1990 quick-select
    // range. Include its year so the controlled select can still display it.
    years:
      vehicle.year && !years.some((year) => String(year) === vehicle.year)
        ? [vehicle.year, ...years]
        : years,
  };
}
