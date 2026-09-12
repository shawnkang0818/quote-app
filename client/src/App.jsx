import { Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import QuoteHistoryPage from "./pages/QuoteHistoryPage";
import QuoteDetailPage from "./pages/QuoteDetailPage";
import SettingsPage from "./pages/SettingsPage";
import NotFoundPage from "./pages/NotFoundPage";
import CustomersPage from "./pages/CustomersPage";
import InventoryPage from "./pages/InventoryPage";
import ServiceTemplatesPage from "./pages/ServiceTemplatesPage";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/quotes" element={<QuoteHistoryPage />} />
        <Route path="/quotes/:quoteId" element={<QuoteDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/services" element={<ServiceTemplatesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
