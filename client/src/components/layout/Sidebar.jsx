import { NavLink } from "react-router-dom";

const navigation = [
  { label: "Create Quote", shortLabel: "CQ", to: "/", end: true },
  { label: "Quote History", shortLabel: "QH", to: "/quotes" },
  { label: "Customers", shortLabel: "CU", to: "/customers" },
  { label: "Inventory", shortLabel: "IN", to: "/inventory" },
  { label: "Services", shortLabel: "QS", to: "/services" },
  { label: "Settings", shortLabel: "SE", to: "/settings" },
];

function Sidebar() {
  const getLinkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <aside className="border-b border-slate-800 bg-slate-950 text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0">
      <div className="flex items-center justify-between px-4 py-4 lg:block lg:px-5 lg:py-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-black shadow-lg shadow-blue-950/30">
            G
          </span>
          <div>
            <p className="text-lg font-bold">Garage Quote</p>
            <p className="text-xs text-slate-400">Service workspace</p>
          </div>
        </div>

        <nav className="flex max-w-full gap-2 overflow-x-auto lg:mt-10 lg:flex-col lg:overflow-visible">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={getLinkClass}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[10px] font-bold tracking-wide group-hover:bg-white/15">
                {item.shortLabel}
              </span>
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
