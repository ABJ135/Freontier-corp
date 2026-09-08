import { useAuthStore } from "../../store/authStore";

const STATS = [
  { label: "Orders today", value: "—" },
  { label: "Revenue today", value: "—" },
  { label: "Products", value: "—" },
  { label: "Low stock", value: "—" },
];

function Dashboard() {
  const { admin } = useAuthStore();

  return (
    <div className="px-4 py-6 sm:px-10 sm:py-10">
      <h1 className="font-[Space_Grotesk] text-xl font-bold text-text-primary sm:text-2xl">
        Welcome back, {admin?.name}
      </h1>
      <p className="mt-1 text-sm text-text-secondary sm:text-[15px]">
        Here's what's happening with your store.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:mt-8 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-bg-border bg-bg-panel px-5 py-4"
          >
            <p className="text-xs text-text-secondary">{stat.label}</p>
            <p className="mt-2 font-[Space_Grotesk] text-2xl font-bold text-text-primary">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-bg-border px-6 py-14 text-center sm:mt-10">
        <p className="text-sm text-text-muted">
          Stats are wired to placeholder values — connect the orders and
          products endpoints to populate this view.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;