import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname ?? "/admin/dashboard";

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
      // Error surfaced via store
    }
  };

  return (
    <div className="flex min-h-screen bg-bg font-[Inter]">
      {/* ── Left panel ── */}
      <div className="relative hidden w-[45%] overflow-hidden bg-bg-panel lg:flex lg:flex-col lg:justify-between lg:p-14">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-[500px] w-[500px] rounded-full bg-accent opacity-10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-accent opacity-[0.07] blur-3xl" />

        {/* Logo */}
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <span className="font-[Space_Grotesk] text-sm font-bold tracking-wide text-text-primary">
              Vikestore
            </span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Admin Console
          </div>
          <h1 className="font-[Space_Grotesk] text-5xl font-bold leading-[1.05] text-text-primary">
            One place to<br />
            <span className="text-accent">run everything.</span>
          </h1>
          <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-text-secondary">
            Products, orders, customers, and your team — all manageable from a single, powerful console.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-wrap gap-2">
            {["Orders", "Products", "Customers", "Analytics", "Team Management"].map((f) => (
              <span key={f} className="rounded-full border border-bg-border bg-bg px-3 py-1 text-xs text-text-secondary">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-xs text-text-muted">
          © {new Date().getFullYear()} Vikestore · All rights reserved
        </div>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-16 lg:w-[55%]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <span className="font-[Space_Grotesk] text-sm font-bold tracking-wide text-text-primary">
              Vikestore
            </span>
          </div>

          <h2 className="font-[Space_Grotesk] text-3xl font-bold text-text-primary">
            Welcome back
          </h2>
          <p className="mt-2 text-[15px] text-text-secondary">
            Sign in to your admin account to continue.
          </p>

          {/* Error banner */}
          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
              <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full bg-danger/20 text-center text-[10px] font-bold leading-4">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Email */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                <Mail size={13} strokeWidth={1.75} />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@vikestore.com"
                required
                className="w-full rounded-xl border border-bg-border bg-bg-panel px-4 py-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                <Lock size={13} strokeWidth={1.75} />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-bg-border bg-bg-panel px-4 py-3 pr-11 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-muted hover:text-text-secondary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            {/* Remember me / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer select-none items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 appearance-none rounded border border-bg-border bg-transparent checked:border-accent checked:bg-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <Link
                to="/admin/forgot-password"
                className="text-sm font-medium text-accent hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 font-semibold text-white transition-all hover:bg-accent-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-text-muted">
            Protected by role-based access control. Unauthorized access is prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;