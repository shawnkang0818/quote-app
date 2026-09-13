const MAX_NOTE_LENGTH = 1000;

function NoteField({ label, name, onChange, placeholder, value }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
        {label}
        <span className="text-xs font-normal text-slate-400">
          {value.length}/{MAX_NOTE_LENGTH}
        </span>
      </span>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={MAX_NOTE_LENGTH}
        rows="3"
        className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function QuoteNotes({ notes, onChange, onClose }) {
  return (
    <section className="mt-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
        <h3 className="text-sm font-semibold text-slate-950">Quote Notes</h3>
        <p className="mt-1 text-xs text-slate-500">
          Record the customer concern separately from the technician's findings.
        </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-xs font-semibold text-blue-700 hover:text-blue-800"
        >
          Done
        </button>
      </div>

      <div className="mt-4 grid gap-4">
        <NoteField
          label="Customer Request"
          name="customerRequest"
          onChange={onChange}
          placeholder="For example: Customer reports brake noise at low speed."
          value={notes.customerRequest}
        />
        <NoteField
          label="Technician Notes"
          name="technicianNotes"
          onChange={onChange}
          placeholder="For example: Inspect front rotors before replacing pads."
          value={notes.technicianNotes}
        />
      </div>
    </section>
  );
}

export default QuoteNotes;
