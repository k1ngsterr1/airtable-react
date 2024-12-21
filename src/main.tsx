import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { LoginPage } from "./pages/login/login.tsx";
import { FiltersPage } from "./pages/filters/filters.tsx";
import { DatabasesPage } from "./pages/databases/databases.tsx";
import ClientLayout from "./shared/ui/layouts/client-layout.tsx";
import { AuthProvider } from "./shared/ui/contexts/auth-context.tsx";
import ProtectedRoute from "./shared/config/protected-route.tsx";
import { ReportsPage } from "./pages/reports/reports.tsx";

import "./global.scss";
import { ReportDetails } from "./pages/report-details/report-details.tsx";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ClientLayout>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/databases"
            element={
              <ProtectedRoute>
                <DatabasesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:id/filters"
            element={
              <ProtectedRoute>
                <FiltersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />{" "}
          <Route
            path="/reports/:id"
            element={
              <ProtectedRoute>
                <ReportDetails />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ClientLayout>
  </AuthProvider>
);
