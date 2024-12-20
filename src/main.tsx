import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { LoginPage } from "./pages/login/login.tsx";
import { FiltersPage } from "./pages/filters/filters.tsx";
import { DatabasesPage } from "./pages/databases/databases.tsx";
import ClientLayout from "./shared/ui/layouts/client-layout.tsx";

import "./global.scss";
import { AuthProvider } from "./shared/ui/contexts/auth-context.tsx";
import ProtectedRoute from "./shared/config/protected-route.tsx";

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
        </Routes>
      </BrowserRouter>
    </ClientLayout>
  </AuthProvider>
);
