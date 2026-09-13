import { useEffect } from "react";
import { useBlocker } from "react-router-dom";

function UnsavedChangesGuard({ when }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    const warnBeforeUnload = (event) => {
      if (!when) return;

      // Browsers display their own standard wording for refresh, close, and
      // external navigation prompts; assigning returnValue enables it.
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [when]);

  if (blocker.state !== "blocked") return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
          Unsaved changes
        </p>
        <h2
          id="unsaved-changes-title"
          className="mt-2 text-xl font-bold text-slate-950"
        >
          Leave this quote?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Customer, vehicle, parts, labor, or note changes will be lost if you
          leave before saving.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => blocker.reset()}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Stay on Quote
          </button>
          <button
            type="button"
            onClick={() => blocker.proceed()}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Leave Without Saving
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnsavedChangesGuard;
