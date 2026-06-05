import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthStore } from "./store/auth";
import Layout from "./components/Layout";
import UserLayout from "./components/UserLayout";
import PageLoader from "./components/PageLoader";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ServicesPage from "./pages/ServicesPage";
import OrdersPage from "./pages/OrdersPage";
import CreateOrderPage from "./pages/CreateOrderPage";
import DocsPage from "./pages/DocsPage";
import SettingsPage from "./pages/SettingsPage";
import LogsPage from "./pages/LogsPage";
import UsersPage from "./pages/UsersPage";
import BalancePage from "./pages/BalancePage";
import TokenRequestPage from "./pages/TokenRequestPage";
import TokenSettingsPage from "./pages/TokenSettingsPage";

// Wrapper: cek auth, pilih layout sesuai role
function AuthLayout() {
  const token = useAuthStore((s) => s.token);
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  if (!token) return <Navigate to="/login" replace />;
  return isAdmin
    ? <Layout><Outlet /></Layout>
    : <UserLayout><Outlet /></UserLayout>;
}

export default function App() {
  const [ready, setReady] = useState(false);

  // Tunda sedikit agar Zustand hydrate dari localStorage sebelum render route
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <PageLoader />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected — Layout hanya render SATU KALI */}
      <Route element={<AuthLayout />}>
        <Route path="/"               element={<DashboardPage />} />
        <Route path="/orders/create"  element={<CreateOrderPage />} />
        <Route path="/orders"         element={<OrdersPage />} />
        <Route path="/services"       element={<ServicesPage />} />
        <Route path="/docs"           element={<DocsPage />} />
        <Route path="/settings"       element={<SettingsPage />} />
        <Route path="/logs"           element={<LogsPage />} />
        <Route path="/users"          element={<UsersPage />} />
        <Route path="/balance"        element={<BalancePage />} />
        <Route path="/token-request"  element={<TokenRequestPage />} />
        <Route path="/token-settings" element={<TokenSettingsPage />} />
        <Route path="/transactions"   element={<Navigate to="/balance" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
