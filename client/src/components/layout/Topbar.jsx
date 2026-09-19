import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const pageTitles = {
  "/": "Create Quote",
  "/quotes": "Quote History",
  "/customers": "Customers",
  "/inventory": "Inventory",
  "/services": "Quick Services",
  "/settings": "Settings",
};

function Topbar({ onNewQuote, onSearchChange, search }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchInput = useRef(null);
  const isDashboard = location.pathname === "/";
  const title = location.pathname.startsWith("/quotes/")
    ? "Quote Details"
    : location.pathname.startsWith("/customers/")
      ? "Customer Details"
      : pageTitles[location.pathname] ?? "Garage Quote";

  useEffect(() => {
    const focusSearch = (event) => {
      if (isDashboard && (event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        searchInput.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, [isDashboard]);

  const handleNewQuote = () => {
    // A mounted Dashboard handles confirmation and reset itself. From every
    // other page, navigating home creates a fresh quote workspace.
    if (!onNewQuote()) navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 px-3 sm:px-4 lg:px-5">
        <div className={isDashboard ? "hidden xl:block" : "block"}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Service workspace
          </p>
          <p className="font-semibold text-slate-900">{title}</p>
        </div>

        {isDashboard && (
          <label className="relative min-w-0 flex-1 xl:max-w-xl">
            <span className="sr-only">Search parts and services</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>
            <input
              ref={searchInput}
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search parts and services..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-14 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
              ⌘K
            </span>
          </label>
        )}

        {/* The primary shortcut is available from every page in the app. */}
        <button
          type="button"
          onClick={handleNewQuote}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <span className="sm:hidden">+ Quote</span>
          <span className="hidden sm:inline">+ New Quote</span>
        </button>
      </div>
    </header>
  );
}

export default Topbar;
