import { useRef, useState } from "react";
import {
  createSupplierPriceCsvTemplate,
  parseSupplierPriceCsv,
} from "../../utils/supplierPriceCsv";

const MAX_FILE_BYTES = 1024 * 1024;

function downloadTemplate() {
  const blob = new Blob([createSupplierPriceCsvTemplate()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "supplier-prices-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function SupplierPriceCsvImport({ isImporting, onImport, onPreview }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState([]);
  const [databasePreview, setDatabasePreview] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [strategy, setStrategy] = useState("update");
  const [errorMessage, setErrorMessage] = useState("");
  const invalidRows = preview.filter((row) => row.errors.length > 0);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    setPreview([]);
    setDatabasePreview(null);
    setErrorMessage("");
    setFileName(file?.name || "");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrorMessage("Choose a CSV file.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrorMessage("CSV file cannot exceed 1 MB.");
      return;
    }
    try {
      const parsed = parseSupplierPriceCsv(await file.text());
      setPreview(parsed);
      if (parsed.every((row) => row.errors.length === 0)) {
        setIsChecking(true);
        const result = await onPreview(parsed.map((row) => row.item));
        setDatabasePreview(result);
      }
    } catch (error) {
      setErrorMessage(error.message || "Unable to read this CSV file.");
    } finally {
      setIsChecking(false);
    }
  };

  const reset = () => {
    setFileName("");
    setPreview([]);
    setDatabasePreview(null);
    setErrorMessage("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const confirmImport = async () => {
    const succeeded = await onImport(
      preview.map((row) => row.item),
      strategy,
      fileName
    );
    if (succeeded) reset();
  };

  const existingIndexes = new Set(
    databasePreview?.matches
      ?.filter((match) => match.existingId)
      .map((match) => match.index) || []
  );
  const importCount =
    strategy === "skip"
      ? preview.length - existingIndexes.size
      : preview.length;

  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Import supplier prices from CSV</h2>
            <p className="mt-1 text-sm text-slate-500">Preview and validate up to 500 prices before anything is saved.</p>
          </div>
          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">Open importer</span>
        </div>
      </summary>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={downloadTemplate} className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Download CSV Template</button>
          <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Choose CSV File
            <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="sr-only" />
          </label>
          {fileName && <span className="self-center text-sm text-slate-500">{fileName}</span>}
        </div>

        {errorMessage && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}

        {isChecking && (
          <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Checking the database for existing prices…
          </p>
        )}

        {preview.length > 0 && (
          <div className="mt-5">
            {databasePreview && (
              <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-950">
                  {databasePreview.existing} of {databasePreview.total} row(s) already exist
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  Existing means the supplier, supplier part number, and complete vehicle fitment match.
                </p>
                <fieldset className="mt-3 grid gap-2 md:grid-cols-3">
                  {[
                    ["update", "Update existing (recommended)", "Refresh the latest matching record and add new ones."],
                    ["append", "Keep price history", "Add every row as a new time-stamped record."],
                    ["skip", "Skip existing", "Only add rows that have no current match."],
                  ].map(([value, label, description]) => (
                    <label key={value} className={`cursor-pointer rounded-xl border p-3 ${strategy === value ? "border-blue-500 bg-white" : "border-blue-200"}`}>
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <input type="radio" name="importStrategy" value={value} checked={strategy === value} onChange={(event) => setStrategy(event.target.value)} />
                        {label}
                      </span>
                      <span className="mt-1 block pl-5 text-xs text-slate-600">{description}</span>
                    </label>
                  ))}
                </fieldset>
              </div>
            )}

            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <p className="font-medium text-slate-700">
                {preview.length} row(s) ready for review • {invalidRows.length} invalid
                {databasePreview ? ` • ${databasePreview.existing} existing` : ""}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={reset} className="rounded-lg bg-slate-100 px-3 py-2 font-medium text-slate-700">Cancel</button>
                <button type="button" disabled={invalidRows.length > 0 || !databasePreview || isChecking || isImporting || importCount === 0} onClick={confirmImport} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                  {isImporting ? "Importing…" : `Import ${importCount} Price(s)`}
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
              <table className="min-w-[800px] w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Part</th><th className="px-3 py-2">Supplier</th><th className="px-3 py-2">Cost</th><th className="px-3 py-2">Selling</th><th className="px-3 py-2">Validation</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {preview.slice(0, 100).map((row, index) => (
                    <tr key={row.rowNumber} className={row.errors.length ? "bg-red-50" : "bg-white"}>
                      <td className="px-3 py-2">{row.rowNumber}</td>
                      <td className="px-3 py-2"><p className="font-medium">{row.item.partName || "—"}</p><p className="text-xs text-slate-500">{row.item.supplierPartNumber || "—"}</p></td>
                      <td className="px-3 py-2">{row.item.supplierName || "—"}</td>
                      <td className="px-3 py-2">{Number.isFinite(row.item.cost) ? row.item.cost.toFixed(2) : "—"}</td>
                      <td className="px-3 py-2">{row.item.listPrice === null ? "—" : row.item.listPrice.toFixed(2)}</td>
                      <td className={`px-3 py-2 text-xs ${row.errors.length ? "text-red-700" : existingIndexes.has(index) ? "font-medium text-amber-700" : "font-medium text-emerald-700"}`}>
                        {row.errors.length ? row.errors.join("; ") : existingIndexes.has(index) ? "Existing match" : databasePreview ? "New price" : "Checking…"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.length > 100 && <p className="mt-2 text-xs text-slate-500">Showing the first 100 rows. All {preview.length} rows will be imported.</p>}
          </div>
        )}
      </div>
    </details>
  );
}

export default SupplierPriceCsvImport;
