import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const from = (location.state as { from?: Location })?.from?.pathname ?? "/admin/dashboard";

  // Already logged in? Don't show the login form again.
  // This check comes AFTER the hooks above, never before.
  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();

    try {
      await login({ email, password }, rememberMe);
      navigate(from, { replace: true });
    } catch {
      // Error is already surfaced via the store's `error` state.
    }
  };

  return (
    <div className="flex min-h-screen bg-[#121218] font-[Inter]">
      <style>{`
        @keyframes rise-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(24px, -18px) rotate(6deg); }
        }
        .rise-in { animation: rise-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .drift-shape { animation: drift 14s ease-in-out infinite; }
      `}</style>

      <div className="relative hidden w-[45%] overflow-hidden bg-[#1A1A22] lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div
          className="drift-shape pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#3A5CFF] opacity-20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <span className="font-[Space_Grotesk] text-sm font-medium tracking-wide text-[#9A99A6]">
            Vikestore
          </span>
        </div>
        <div className="relative">
          <h1 className="font-[Space_Grotesk] text-6xl font-bold leading-[0.95] text-[#F4F3F1]">
            Admin
            <br />
            Console
          </h1>
          <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-[#9A99A6]">
            Manage products, orders, and your storefront from one place.
          </p>
        </div>
        <div className="relative text-xs text-[#5C5B66]">
          © {new Date().getFullYear()} Vikestore
        </div>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-16 lg:w-[55%]">
        <div className="rise-in w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <span className="font-[Space_Grotesk] text-sm font-medium tracking-wide text-[#9A99A6]">
              Vikestore
            </span>
          </div>

          <h2 className="font-[Space_Grotesk] text-3xl font-bold text-[#F4F3F1]">
            Sign in
          </h2>
          <p className="mt-2 text-[15px] text-[#9A99A6]">
            Enter your admin credentials to continue.
          </p>

          {error && (
            <div className="mt-6 rounded-md border border-[#3A2226] bg-[#241417] px-4 py-3 text-sm text-[#FF8A8A]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-7">
            <div>
              <label className="block text-sm font-medium text-[#9A99A6]">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@vikestore.com"
                required
                className="mt-2 w-full border-0 border-b border-[#2A2A34] bg-transparent px-0 py-2 text-[#F4F3F1] outline-none transition-colors placeholder:text-[#5C5B66] focus:border-[#3A5CFF]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#9A99A6]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                required
                className="mt-2 w-full border-0 border-b border-[#2A2A34] bg-transparent px-0 py-2 text-[#F4F3F1] outline-none transition-colors placeholder:text-[#5C5B66] focus:border-[#3A5CFF]"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 appearance-none rounded border border-[#2A2A34] bg-transparent checked:border-[#3A5CFF] checked:bg-[#3A5CFF] focus:outline-none focus:ring-1 focus:ring-[#3A5CFF] focus:ring-offset-2 focus:ring-offset-[#121218]"
              />
              <span className="text-sm text-[#9A99A6]">
                Remember me on this device
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-[#3A5CFF] px-4 py-3 font-medium text-[#F4F3F1] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;