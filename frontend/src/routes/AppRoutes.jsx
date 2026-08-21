import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Dashboard } from "../pages/Dashboard";
import { Transactions } from "../pages/Transactions";
import { Budgets } from "../pages/Budgets";
import { Profile } from "../pages/Profile";
import { Admin as AdminUsers } from "../pages/desktop/Admin";
import { AdminLogin } from "../pages/desktop/AdminLogin";
import { AdminLayout } from "../layouts/AdminLayout";
import { AdminComingSoon } from "../pages/desktop/admin/ComingSoon";
import { AdminOverview } from "../pages/desktop/admin/Overview";
import { AdminSystemHealth } from "../pages/desktop/admin/SystemHealth";
import { AdminUserActivity } from "../pages/desktop/admin/UserActivity";
import { ADMIN_FLAT_ROUTES } from "../config/adminNav";

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Login/Register buat user yang belum login — kalau sudah punya session, lempar ke dashboard.
function GuestRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

// Terpisah dari ProtectedRoute: gagal auth lempar ke /admin/login (bukan
// /login), dan non-admin yang authenticated dilempar ke dashboard biasa.
function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (!user) return null;
  return user.role === "ADMIN" ? children : <Navigate to="/dashboard" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <ProtectedRoute>
            <Budgets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="system-health" element={<AdminSystemHealth />} />
        <Route path="users/activity" element={<AdminUserActivity />} />
        {ADMIN_FLAT_ROUTES.filter(
          (r) =>
            r.path !== "/admin" &&
            r.path !== "/admin/users" &&
            r.path !== "/admin/system-health" &&
            r.path !== "/admin/users/activity"
        ).map((r) => (
          <Route
            key={r.path}
            path={r.path.replace("/admin/", "")}
            element={<AdminComingSoon title={r.label} icon={r.icon} />}
          />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
