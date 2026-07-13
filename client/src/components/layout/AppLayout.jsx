import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
