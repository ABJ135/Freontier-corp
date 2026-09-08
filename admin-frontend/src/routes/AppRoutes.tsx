import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import Employees from "../pages/employees/Employees";
import Categories from "../pages/categories/Categories";
import Products from "../pages/products/Products";
import AddProduct from "../pages/products/AddProduct";
import EditProduct from "../pages/products/EditProduct";
import InactiveCategories from "../pages/categories/InactiveCategories";
import SettingsPage from "../pages/settings/SettingsPage";
import InactiveProducts from "../pages/products/InactiveProducts";
import ForgotPassword from "../pages/Password Reset/ForgotPasswordPage";
import ResetPassword from "../pages/Password Reset/ResetPassword";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="products">
            <Route index element={<Products />} />
            <Route path="new" element={<AddProduct />} />
            <Route path="/admin/products/:id/edit" element={<EditProduct />} />
            <Route path="/admin/products/inactive" element={<InactiveProducts />} />
          </Route>

          <Route path="categories" >
            <Route index element={<Categories />} />
            <Route path="inactive" element={<InactiveCategories />} />
          </Route>

          <Route path="orders" element={<Dashboard />} />
          <Route path="customers" element={<Dashboard />} />

          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="employees" element={<Employees />} />
          </Route>
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;