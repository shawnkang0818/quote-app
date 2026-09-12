import { Link, useLocation } from "react-router-dom";

const pageTitles = {
  "/": "Create Quote",
  "/quotes": "Quote History",
  "/customers": "Customers",
  "/inventory": "Inventory",
  "/services": "Quick Services",
  "/settings": "Settings",
};

function Topbar() {
  const location = useLocation();
  const title = location.pathname.startsWith("/quotes/")
    ? "Quote Details"
    : pageTitles[location.pathname] ?? "Garage Quote";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Service workspace
          </p>
          <p className="font-semibold text-slate-900">{title}</p>
        </div>

        {/* The primary shortcut is available from every page in the app. */}
        <Link
          to="/"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + New Quote
        </Link>
      </div>
    </header>
  );
}

export default Topbar;
