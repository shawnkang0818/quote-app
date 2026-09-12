import { useEffect, useState } from "react";
import { getQuickServices } from "../services/quickServicesService";

export function useQuickServices() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    getQuickServices()
      .then((data) => {
        if (!ignore) {
          setServices(data);
          setErrorMessage("");
        }
      })
      .catch((error) => {
        if (!ignore) {
          setErrorMessage(error.message || "Unable to load quick services.");
        }
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { errorMessage, isLoading, services };
}
