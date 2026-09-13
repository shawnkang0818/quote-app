import { useEffect, useState } from "react";
import { getStoredAdminToken } from "../services/authService";
import { getCustomers } from "../services/customersService";

const MIN_SEARCH_LENGTH = 2;

// Search stays separate from the customer form so the dashboard does not own
// request timing, private-record access, or stale-response protection.
export function useCustomerLookup(onSelectCustomer) {
  const [adminToken, setAdminToken] = useState(getStoredAdminToken);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  useEffect(() => {
    const cleanQuery = query.trim();
    if (!adminToken || cleanQuery.length < MIN_SEARCH_LENGTH) {
      return undefined;
    }

    let ignore = false;
    const timer = setTimeout(() => {
      setIsLoading(true);
      getCustomers(cleanQuery, adminToken)
        .then((customers) => {
          if (!ignore) {
            setResults(customers);
            setErrorMessage("");
          }
        })
        .catch((error) => {
          if (!ignore) {
            if (error.status === 401) {
              // Expired sessions fall back to the protected-state prompt
              // instead of repeatedly sending a token the server rejected.
              sessionStorage.removeItem("adminToken");
              setAdminToken("");
            }
            setResults([]);
            setErrorMessage(error.message || "Unable to search customers.");
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
  }, [adminToken, query]);

  const updateQuery = (value) => {
    setQuery(value);
    if (value.trim().length < MIN_SEARCH_LENGTH) {
      // Clear old matches immediately when the user shortens the query.
      setResults([]);
      setIsLoading(false);
      setErrorMessage("");
    }
  };

  const selectCustomer = (customer, vehicle) => {
    onSelectCustomer(customer, vehicle);
    setSelectedCustomer(customer);
    setSelectedVehicleId(vehicle?._id || "");
    setQuery("");
    setResults([]);
    setErrorMessage("");
  };

  const selectVehicle = (vehicleId) => {
    if (!selectedCustomer) return;
    const vehicle = selectedCustomer.vehicles?.find(
      (item) => String(item._id) === String(vehicleId)
    );
    setSelectedVehicleId(vehicle?._id || "");
    onSelectCustomer(selectedCustomer, vehicle || {});
  };

  const startNewCustomer = () => {
    // Starting fresh clears only customer context. Existing quote items remain
    // intact so staff can correct whom a draft belongs to without rebuilding it.
    setSelectedCustomer(null);
    setSelectedVehicleId("");
    setQuery("");
    setResults([]);
    setErrorMessage("");
    onSelectCustomer({}, {});
  };

  const resetLookup = () => {
    setSelectedCustomer(null);
    setSelectedVehicleId("");
    setQuery("");
    setResults([]);
    setErrorMessage("");
  };

  return {
    errorMessage,
    hasAccess: Boolean(adminToken),
    isLoading,
    query,
    results,
    resetLookup,
    selectedCustomer,
    selectedVehicleId,
    selectCustomer,
    selectVehicle,
    startNewCustomer,
    updateQuery,
  };
}
