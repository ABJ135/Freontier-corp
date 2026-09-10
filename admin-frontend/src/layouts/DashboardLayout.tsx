import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  UserCog,
  Truck,
  Settings,
  LogOut,
  Menu,
  X,
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
  { to: "/admin/shipping-partners", label: "Shipping Partners", icon: Truck, roles: ["ADMIN"] },
];

function DashboardLayout() {
  const { admin, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  // Lock background scroll while the drawer is open, and let Escape close it.
  useEffect(() => {
    if (!isMobileNavOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileNavOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileNavOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (admin && item.roles.includes(admin.role)),
  );

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors ${
      isActive
        ? "border-accent/30 bg-accent/15 text-accent"
        : "border-transparent text-text-secondary hover:border-bg-border hover:bg-bg-hover hover:text-text-primary"
    }`;

  return (
    <div className="flex h-screen overflow-hidden bg-bg font-[Inter]">
      {/* Mobile top bar — hamburger is on the LEFT to match left-side drawer */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-bg-border bg-bg-panel px-4 md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-2 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>
          <span className="font-[Space_Grotesk] text-sm font-semibold tracking-wide text-text-primary">
            Vikestore
          </span>
        </div>
        {/* Right side: admin name on mobile bar */}
        <span className="text-xs text-text-muted">{admin?.name}</span>
      </div>

      {/* Backdrop */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — slides in from left on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-bg-border bg-bg-panel px-5 py-8 shadow-sm transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0 md:shadow-sm ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isMobileNavOpen}
      >
        <div>
          <div className="flex items-center justify-between px-2">
            <span className="font-[Space_Grotesk] text-sm font-semibold tracking-wide text-text-primary">
              Vikestore
            </span>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Close menu"
              className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover hover:text-text-primary md:hidden"
            >
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          <nav className="mt-10 flex flex-col gap-1">
            {visibleItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={navLinkClasses}>
                <Icon size={18} strokeWidth={1.75} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-bg-border pt-5">
          <div className="flex items-center justify-between gap-2 px-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">
                {admin?.name}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">{admin?.role}</p>
            </div>
            <NavLink
              to="/admin/settings"
              title="Settings"
              className={({ isActive }) =>
                `shrink-0 rounded-md border p-1.5 transition-colors ${
                  isActive
                    ? "border-accent/30 bg-accent/15 text-accent"
                    : "border-transparent text-text-muted hover:border-bg-border hover:bg-bg-hover hover:text-text-primary"
                }`
              }
            >
              <Settings size={17} strokeWidth={1.75} />
            </NavLink>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm text-text-secondary transition-colors hover:border-danger-border hover:bg-danger-bg hover:text-danger"
          >
            <LogOut size={18} strokeWidth={1.75} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content — independently scrollable */}
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;