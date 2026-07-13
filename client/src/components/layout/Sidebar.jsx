import { NavLink } from "react-router-dom";

const navigation = [
  { label: "Create Quote", to: "/", end: true },
  { label: "Quote History", to: "/quotes" },
];

function Sidebar() {
  const getLinkClass = ({ isActive }) =>
    `rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
      isActive
        ? "bg-blue-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  return (
    <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between px-5 py-5 lg:block">
        <div>
          <p className="text-lg font-bold text-slate-950">Garage Quote</p>
          <p className="text-sm text-slate-500">Service workspace</p>
        </div>

        <nav className="flex gap-2 lg:mt-8 lg:flex-col">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={getLinkClass}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export default Sidebar;
