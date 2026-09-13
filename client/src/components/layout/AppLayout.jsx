import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout() {
  // The dashboard header search and catalog share one value through the route
  // outlet, avoiding a second global state library for a single workspace tool.
  const [workspaceSearch, setWorkspaceSearch] = useState("");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar
          search={workspaceSearch}
          onSearchChange={setWorkspaceSearch}
        />
        <main>
          <div className="mx-auto max-w-[1700px] px-3 py-4 sm:px-4 lg:px-5">
            <Outlet context={{ workspaceSearch, setWorkspaceSearch }} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
