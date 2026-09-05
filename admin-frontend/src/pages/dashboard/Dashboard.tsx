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
    <div className="px-10 py-10">
      <h1 className="font-[Space_Grotesk] text-2xl font-bold text-[#F4F3F1]">
        Welcome back, {admin?.name}
      </h1>
      <p className="mt-1 text-[15px] text-[#9A99A6]">
        Here's what's happening with your store.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[#22222C] bg-[#1A1A22] px-5 py-4"
          >
            <p className="text-xs text-[#9A99A6]">{stat.label}</p>
            <p className="mt-2 font-[Space_Grotesk] text-2xl font-bold text-[#F4F3F1]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-dashed border-[#22222C] px-6 py-14 text-center">
        <p className="text-sm text-[#5C5B66]">
          Stats are wired to placeholder values — connect the orders and
          products endpoints to populate this view.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;