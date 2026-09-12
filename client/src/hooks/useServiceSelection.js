import { useState } from "react";

function createLaborDraft(service, defaultHourlyRate) {
  return service.labor.map((labor) => ({
    ...labor,
    // Templates may override the shop default; otherwise use Business Settings.
    hourlyRate: labor.hourlyRate ?? defaultHourlyRate,
  }));
}

// Share one service configuration draft between Favorite Jobs and Quick Services.
export function useServiceSelection(defaultHourlyRate) {
  const [selectedService, setSelectedService] = useState(null);
  const [laborDraft, setLaborDraft] = useState([]);

  const selectService = (service) => {
    setSelectedService(service);
    setLaborDraft(createLaborDraft(service, defaultHourlyRate));
  };

  const updateLaborDraft = (index, field, value) => {
    setLaborDraft((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const clearSelection = () => {
    setSelectedService(null);
    setLaborDraft([]);
  };

  return {
    clearSelection,
    laborDraft,
    selectedService,
    selectService,
    updateLaborDraft,
  };
}
