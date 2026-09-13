import { useState } from "react";

function createEmptyLabor(defaultHourlyRate) {
  return {
    description: "",
    hours: "",
    hourlyRate: String(defaultHourlyRate),
  };
}

function LaborSection({ defaultHourlyRate, onAdd }) {
  const [labor, setLabor] = useState(() => createEmptyLabor(defaultHourlyRate));

  const handleSubmit = (event) => {
    event.preventDefault();
    const wasAdded = onAdd({
      description: labor.description.trim(),
      hours: Number(labor.hours),
      hourlyRate: Number(labor.hourlyRate),
    });
    // Keep invalid input visible so the user can correct it.
    if (wasAdded !== false) {
      setLabor(createEmptyLabor(defaultHourlyRate));
    }
  };

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <h3 className="font-semibold text-slate-950">Add Labor</h3>
      <form onSubmit={handleSubmit} className="mt-3 grid gap-2">
        <input
          type="text"
          value={labor.description}
          onChange={(event) =>
            setLabor((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          placeholder="Service, for example Oil change"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          required
        />
        <div className="grid grid-cols-2 gap-2">
          {/* Allow common shop values such as 0.25, 0.3, and 1.25 hours. */}
          <input
            type="number"
            value={labor.hours}
            onChange={(event) =>
              setLabor((current) => ({ ...current, hours: event.target.value }))
            }
            min="0.1"
            step="0.01"
            placeholder="Hours"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
          <input
            type="number"
            value={labor.hourlyRate}
            onChange={(event) =>
              setLabor((current) => ({
                ...current,
                hourlyRate: event.target.value,
              }))
            }
            min="0"
            step="0.01"
            placeholder="Rate / hour"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>
        <button
          type="submit"
          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          Add labor
        </button>
      </form>

    </div>
  );
}

export default LaborSection;
