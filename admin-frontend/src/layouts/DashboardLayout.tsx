import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  UserCog,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import type { AdminRole } from "../types/auth";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Restrict this link to specific roles; omit to show for all roles. */
  roles?: AdminRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/employees", label: "Employees", icon: UserCog, roles: ["ADMIN"] },
];

function DashboardLayout() {
  const { admin, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (admin && item.roles.includes(admin.role)),
  );

  return (
    <div className="flex min-h-screen bg-[#121218] font-[Inter]">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col justify-between border-r border-[#1F1F28] bg-[#1A1A22] px-5 py-8">
        <div>
          <div className="px-2">
            <span className="font-[Space_Grotesk] text-sm font-medium tracking-wide text-[#9A99A6]">
              Vikestore
            </span>
          </div>

          <nav className="mt-10 flex flex-col gap-1">
            {visibleItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-[#3A5CFF]/15 text-[#F4F3F1]"
                      : "text-[#9A99A6] hover:bg-[#22222C] hover:text-[#F4F3F1]"
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.75} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-[#22222C] pt-5">
          <div className="px-2">
            <p className="truncate text-sm font-medium text-[#F4F3F1]">
              {admin?.name}
            </p>
            <p className="mt-0.5 text-xs text-[#5C5B66]">{admin?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#9A99A6] transition-colors hover:bg-[#22222C] hover:text-[#FF8A8A]"
          >
            <LogOut size={18} strokeWidth={1.75} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;