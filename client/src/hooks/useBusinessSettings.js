import { useEffect, useState } from "react";
import { getBusinessSettings } from "../services/settingsService";

// These values keep the quote workspace usable during the brief initial load
// and also provide a safe presentation fallback for legacy quote records.
export const DEFAULT_BUSINESS_SETTINGS = {
  companyName: "Auto Parts Quote System",
  address: "Brooklyn, NY",
  phone: "(555) 123-4567",
  email: "sales@example.com",
  taxRate: 0.0875,
  defaultHourlyRate: 100,
  quoteValidityDays: 30,
  quoteNotes:
    "Thank you for your business. Prices are subject to change without notice.",
};

export function useBusinessSettings() {
  const [settings, setSettings] = useState(DEFAULT_BUSINESS_SETTINGS);
  const [settingsError, setSettingsError] = useState("");
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    getBusinessSettings()
      .then((data) => {
        if (!ignore) {
          setSettings({ ...DEFAULT_BUSINESS_SETTINGS, ...data });
          setSettingsError("");
        }
      })
      .catch((error) => {
        console.error(error);
        if (!ignore) {
          setSettingsError(
            "Business settings could not be loaded. Default values are in use."
          );
        }
      })
      .finally(() => {
        if (!ignore) setIsSettingsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { isSettingsLoading, settings, settingsError };
}
