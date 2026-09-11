import { Route, Routes } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import QuoteHistoryPage from "./pages/QuoteHistoryPage";
import QuoteDetailPage from "./pages/QuoteDetailPage";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/quotes" element={<QuoteHistoryPage />} />
        <Route path="/quotes/:quoteId" element={<QuoteDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
