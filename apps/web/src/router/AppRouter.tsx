import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../screens/LoginPage";
import AuthCallback from "../screens/AuthCallback";
import AppShell from "../screens/AppShell";
import ProtectedRoute from "../ProtectedRoute";
import SetupPage from "../screens/SetupPage";
import JoinPage from "../screens/JoinPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/join" element={<JoinPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
