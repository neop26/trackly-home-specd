import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import Login from "./routes/Login";
import AuthCallback from "./routes/AuthCallback";

import SetupPage from "./screens/SetupPage";
import JoinPage from "./screens/JoinPage";
import AppShell from "./screens/AppShell";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route
        path="/setup"
        element={
          <ProtectedRoute>
            <SetupPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/join"
        element={
          <ProtectedRoute>
            <JoinPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />

      {/* Default */}
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
