import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type { AdminRole } from "../types/auth";

interface ProtectedRouteProps {
  /** If provided, only these roles may access the nested routes. */
  allowedRoles?: AdminRole[];
}

function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, admin } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !admin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(admin.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;