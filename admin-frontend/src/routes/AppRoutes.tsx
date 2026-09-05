import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import Employees from "../pages/employees/Employees";
import Categories from "../pages/categories/Categories";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="products" element={<Dashboard />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<Dashboard />} />
          <Route path="customers" element={<Dashboard />} />

          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="employees" element={<Employees />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;