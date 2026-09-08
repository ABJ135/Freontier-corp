import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
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
      // Error is already surfaced via the store's `error` state.
    }
  };

  return (
    <div className="flex min-h-screen bg-bg font-[Inter]">
      {/* Left panel */}
      <div className="relative hidden w-[45%] overflow-hidden bg-bg-panel lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div
          className="drift-shape pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-accent opacity-20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <span className="font-[Space_Grotesk] text-sm font-medium tracking-wide text-text-secondary">
            Vikestore
          </span>
        </div>
        <div className="relative">
          <h1 className="font-[Space_Grotesk] text-6xl font-bold leading-[0.95] text-text-primary">
            Admin
            <br />
            Console
          </h1>
          <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-text-secondary">
            Manage products, orders, and your storefront from one place.
          </p>
        </div>
        <div className="relative text-xs text-text-muted">
          © {new Date().getFullYear()} Vikestore
        </div>
      </div>

      {/* Right panel */}
      <div className="flex w-full items-center justify-center px-6 py-16 lg:w-[55%]">
        <div className="rise-in w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <span className="font-[Space_Grotesk] text-sm font-medium tracking-wide text-text-secondary">
              Vikestore
            </span>
          </div>

          <h2 className="font-[Space_Grotesk] text-3xl font-bold text-text-primary">
            Sign in
          </h2>
          <p className="mt-2 text-[15px] text-text-secondary">
            Enter your admin credentials to continue.
          </p>

          {error && (
            <div className="mt-6 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-7">
            {/* Email */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
                <Mail size={14} strokeWidth={1.75} />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@vikestore.com"
                required
                className="mt-2 w-full border-0 border-b border-bg-border bg-transparent px-0 py-2 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent"
              />
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
                <Lock size={14} strokeWidth={1.75} />
                Password
              </label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full border-0 border-b border-bg-border bg-transparent pr-8 px-0 py-2 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} strokeWidth={1.75} /> : <Eye size={15} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2.5 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 appearance-none rounded border border-bg-border bg-transparent checked:border-accent checked:bg-accent focus:outline-none focus:ring-1 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg"
                />
                <span className="text-sm text-text-secondary">
                  Remember me
                </span>
              </label>
              <Link
                to="/admin/forgot-password"
                className="text-sm text-accent hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-accent px-4 py-3 font-medium text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;