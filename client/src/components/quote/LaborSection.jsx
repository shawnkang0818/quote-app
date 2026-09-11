import { useState } from "react";

const EMPTY_LABOR = {
  description: "",
  hours: "",
  hourlyRate: "",
};

function LaborSection({ laborItems, onAdd, onRemove }) {
  const [labor, setLabor] = useState(EMPTY_LABOR);

  const handleSubmit = (event) => {
    event.preventDefault();
    onAdd({
      description: labor.description.trim(),
      hours: Number(labor.hours),
      hourlyRate: Number(labor.hourlyRate),
    });
    setLabor(EMPTY_LABOR);
  };

  return (
    <div className="mt-6 border-t border-slate-200 pt-5">
      <h3 className="font-semibold text-slate-950">Labor</h3>
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
          <input
            type="number"
            value={labor.hours}
            onChange={(event) =>
              setLabor((current) => ({ ...current, hours: event.target.value }))
            }
            min="0.1"
            step="0.1"
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

      {laborItems.length > 0 && (
        <div className="mt-3 space-y-2">
          {laborItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-slate-800">{item.description}</p>
                <p className="text-slate-500">
                  {item.hours} hr × ${Number(item.hourlyRate).toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="font-medium text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LaborSection;
