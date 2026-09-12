import { useState } from "react";

function createInitialForm(service) {
  return {
    name: service?.name || "",
    shortCode: service?.shortCode || "",
    description: service?.description || "",
    parts: (service?.parts || []).map((part) => ({
      label: part.label,
      searchTerms: part.searchTerms.join(", "),
    })),
    labor:
      service?.labor?.map((item) => ({
        description: item.description,
        hours: String(item.hours),
        hourlyRate:
          item.hourlyRate === undefined ? "" : String(item.hourlyRate),
      })) || [],
  };
}

function ServiceTemplateForm({ editingService, onCancel, onSave }) {
  const [form, setForm] = useState(() => createInitialForm(editingService));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateTopLevel = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const updateRow = (section, index, field, value) => {
    setForm((current) => ({
      ...current,
      [section]: current[section].map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      ),
    }));
  };

  const removeRow = (section, index) => {
    setForm((current) => ({
      ...current,
      [section]: current[section].filter((_, rowIndex) => rowIndex !== index),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // Search terms are edited as a friendly comma-separated string but sent
      // to the API as the array used by inventory matching.
      await onSave({
        name: form.name,
        shortCode: form.shortCode,
        description: form.description,
        parts: form.parts.map((part) => ({
          label: part.label,
          searchTerms: part.searchTerms
            .split(",")
            .map((term) => term.trim())
            .filter(Boolean),
        })),
        labor: form.labor.map((item) => ({
          description: item.description,
          hours: Number(item.hours),
          hourlyRate:
            item.hourlyRate === "" ? undefined : Number(item.hourlyRate),
        })),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-xl font-semibold text-slate-950">
          {editingService ? "Edit Service Template" : "Add Service Template"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure the parts to find and the default labor shown before a job
          is added to a quote.
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_140px]">
        <label className="text-sm font-medium text-slate-700">
          Service name
          <input
            name="name"
            value={form.name}
            onChange={updateTopLevel}
            placeholder="Oil Change"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Short code
          <input
            name="shortCode"
            value={form.shortCode}
            onChange={updateTopLevel}
            placeholder="OC"
            maxLength="4"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            required
          />
        </label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">
          Description
          <input
            name="description"
            value={form.description}
            onChange={updateTopLevel}
            placeholder="Engine oil, filter, and installation labor"
            className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <section className="mt-6 rounded-xl bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Part requirements</h3>
            <p className="text-xs text-slate-500">
              Matching terms locate an existing inventory item when selected.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                parts: [...current.parts, { label: "", searchTerms: "" }],
              }))
            }
            className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50"
          >
            Add part
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {form.parts.length === 0 ? (
            <p className="text-sm text-slate-500">No parts required.</p>
          ) : (
            form.parts.map((part, index) => (
              <div
                key={`part-${index}`}
                className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_1.5fr_auto]"
              >
                <input
                  value={part.label}
                  onChange={(event) =>
                    updateRow("parts", index, "label", event.target.value)
                  }
                  placeholder="Display label"
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
                <input
                  value={part.searchTerms}
                  onChange={(event) =>
                    updateRow(
                      "parts",
                      index,
                      "searchTerms",
                      event.target.value
                    )
                  }
                  placeholder="oil filter, premium oil filter"
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeRow("parts", index)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-5 rounded-xl bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Labor defaults</h3>
            <p className="text-xs text-slate-500">
              Leave rate blank to use the current shop default. Both values
              remain editable when preparing each quote.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((current) => ({
                ...current,
                labor: [
                  ...current.labor,
                  { description: "", hours: "1", hourlyRate: "" },
                ],
              }))
            }
            className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50"
          >
            Add labor
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {form.labor.length === 0 ? (
            <p className="text-sm text-slate-500">No labor included.</p>
          ) : (
            form.labor.map((item, index) => (
              <div
                key={`labor-${index}`}
                className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[1.5fr_120px_150px_auto]"
              >
                <input
                  value={item.description}
                  onChange={(event) =>
                    updateRow(
                      "labor",
                      index,
                      "description",
                      event.target.value
                    )
                  }
                  placeholder="Labor description"
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
                <input
                  type="number"
                  value={item.hours}
                  onChange={(event) =>
                    updateRow("labor", index, "hours", event.target.value)
                  }
                  min="0.01"
                  step="0.01"
                  aria-label="Default labor hours"
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  required
                />
                <input
                  type="number"
                  value={item.hourlyRate}
                  onChange={(event) =>
                    updateRow(
                      "labor",
                      index,
                      "hourlyRate",
                      event.target.value
                    )
                  }
                  min="0"
                  step="0.01"
                  placeholder="Shop default"
                  aria-label="Default hourly rate"
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => removeRow("labor", index)}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting
            ? "Saving..."
            : editingService
              ? "Update Service"
              : "Add Service"}
        </button>
        {editingService && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-slate-200 px-5 py-2.5 font-semibold text-slate-800 hover:bg-slate-300"
          >
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  );
}

export default ServiceTemplateForm;
