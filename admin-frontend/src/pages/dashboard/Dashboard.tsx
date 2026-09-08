import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import {
  ShoppingCart,
  DollarSign,
  Package,
  AlertTriangle,
} from "lucide-react";
import { getProducts } from "../../services/productApi";
import type { Product } from "../../types/product";

function Dashboard() {
  const { admin } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products for dashboard", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const totalProducts = isLoading ? "..." : products.length.toString();
  const lowStock = isLoading ? "..." : products.filter((p) => p.stock < 10).length.toString();

  const STATS = [
    { label: "Orders today", value: "—", icon: ShoppingCart },
    { label: "Revenue today", value: "—", icon: DollarSign },
    { label: "Products", value: totalProducts, icon: Package },
    { label: "Low stock", value: lowStock, icon: AlertTriangle },
  ];

  return (
    <div className="px-4 py-6 sm:px-10 sm:py-10">
      <h1 className="font-[Space_Grotesk] text-xl font-bold text-text-primary sm:text-2xl">
        Welcome back, {admin?.name}
      </h1>
      <p className="mt-1 text-sm text-text-secondary sm:text-[15px]">
        Here's what's happening with your store.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:mt-8 lg:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-lg border border-bg-border bg-bg-panel px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-secondary">{stat.label}</p>
                <Icon
                  size={15}
                  strokeWidth={1.75}
                  className="text-text-muted"
                />
              </div>
              <p className="mt-2 font-[Space_Grotesk] text-2xl font-bold text-text-primary">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-bg-border px-6 py-14 text-center sm:mt-10">
        <p className="text-sm text-text-muted">
          Stats for orders and revenue are currently wired to placeholder values. Connect their respective endpoints to populate.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;