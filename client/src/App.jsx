import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import QuoteHistoryPage from "./pages/QuoteHistoryPage";
import QuoteDetailPage from "./pages/QuoteDetailPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import InventoryPage from "./pages/InventoryPage";
import ServiceTemplatesPage from "./pages/ServiceTemplatesPage";

// A data router enables navigation blocking for unsaved quote work while
// preserving the same URLs and shared AppLayout used throughout the app.
const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/quotes", element: <QuoteHistoryPage /> },
      { path: "/quotes/:quoteId", element: <QuoteDetailPage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/customers", element: <CustomersPage /> },
      { path: "/customers/:customerId", element: <CustomerDetailPage /> },
      { path: "/inventory", element: <InventoryPage /> },
      { path: "/services", element: <ServiceTemplatesPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
