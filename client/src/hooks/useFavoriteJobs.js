import { useEffect, useState } from "react";

const STORAGE_KEY = "favoriteQuickServiceIds";
const DEFAULT_FAVORITE_IDS = ["oil-change", "front-brakes", "tire-rotation"];

function readStoredFavorites() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return DEFAULT_FAVORITE_IDS;

    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : DEFAULT_FAVORITE_IDS;
  } catch {
    // A malformed or unavailable browser value should not block the dashboard.
    return DEFAULT_FAVORITE_IDS;
  }
}

export function useFavoriteJobs() {
  const [favoriteServiceIds, setFavoriteServiceIds] = useState(
    readStoredFavorites
  );

  // Favorites belong to this workstation for now. They can move to a user or
  // shop settings API when the application receives full account management.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteServiceIds));
    } catch {
      // The feature still works for the current session if storage is blocked.
    }
  }, [favoriteServiceIds]);

  const toggleFavorite = (serviceId) => {
    setFavoriteServiceIds((currentIds) =>
      currentIds.includes(serviceId)
        ? currentIds.filter((id) => id !== serviceId)
        : [...currentIds, serviceId]
    );
  };

  return { favoriteServiceIds, toggleFavorite };
}
