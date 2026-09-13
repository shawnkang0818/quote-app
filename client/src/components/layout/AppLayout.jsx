import { useCallback, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppLayout() {
  // The dashboard header search and catalog share one value through the route
  // outlet, avoiding a second global state library for a single workspace tool.
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const newQuoteHandler = useRef(null);

  // Only the mounted Dashboard knows whether its local draft is dirty. Other
  // pages simply navigate home when no handler is registered.
  const registerNewQuoteHandler = useCallback((handler) => {
    newQuoteHandler.current = handler;
    return () => {
      if (newQuoteHandler.current === handler) newQuoteHandler.current = null;
    };
  }, []);

  const requestNewQuote = () => {
    if (!newQuoteHandler.current) return false;
    newQuoteHandler.current();
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:flex">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar
          onNewQuote={requestNewQuote}
          search={workspaceSearch}
          onSearchChange={setWorkspaceSearch}
        />
        <main>
          <div className="mx-auto max-w-[1700px] px-3 py-4 sm:px-4 lg:px-5">
            <Outlet
              context={{
                registerNewQuoteHandler,
                workspaceSearch,
                setWorkspaceSearch,
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
