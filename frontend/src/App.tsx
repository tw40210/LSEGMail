import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import CalendarPage from "./pages/CalendarPage";
import RotationsPage from "./pages/RotationsPage";
import MembersPage from "./pages/MembersPage";
import GmailPage from "./pages/GmailPage";
import { ConfigProvider, useConfig } from "./ConfigContext";

function AppRoutes() {
  const { devMode } = useConfig();
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/calendar" replace />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="rotations" element={<RotationsPage />} />
        <Route path="members" element={<MembersPage />} />
        <Route
          path="gmail"
          element={
            devMode ? <GmailPage /> : <Navigate to="/calendar" replace />
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <Toaster position="top-right" />
      <AppRoutes />
    </ConfigProvider>
  );
}
