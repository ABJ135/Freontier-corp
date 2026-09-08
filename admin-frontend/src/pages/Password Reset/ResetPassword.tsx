import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  Lock,
  Mail,
  RefreshCw,
} from "lucide-react";
import { forgotAdminPassword, resetAdminPassword } from "../../services/authApi";

const RESEND_COOLDOWN = 60; // seconds

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = (location.state as { email?: string })?.email ?? "";

  const [email, setEmail] = useState(prefilledEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  // Resend OTP state
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    setIsResending(true);
    setResendMsg(null);
    setError(null);
    try {
      await forgotAdminPassword({ email });
      setResendMsg("A new OTP has been sent to your email.");
      setResendCooldown(RESEND_COOLDOWN);
    } catch {
      setResendMsg("Could not resend — please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await resetAdminPassword({ email, otp, newPassword });
      setSucceeded(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not reset password. Check your code and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Success screen ─── */
  if (succeeded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-6 font-[Inter]">
        <div className="fade-in w-full max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-bg">
            <CheckCircle2 size={36} strokeWidth={1.5} className="text-success" />
          </div>
          <h2 className="mt-6 font-[Space_Grotesk] text-3xl font-bold text-text-primary">
            Password reset!
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
            Your password has been updated successfully. You can now sign in with your new credentials.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-8 w-full rounded-md bg-accent px-4 py-3 font-medium text-white transition-transform active:scale-[0.98]"
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  /* ─── Form screen ─── */
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 font-[Inter]">
      <div className="rise-in w-full max-w-sm">
        <h2 className="font-[Space_Grotesk] text-3xl font-bold text-text-primary">
          Reset password
        </h2>
        <p className="mt-2 text-[15px] text-text-secondary">
          Enter the code we sent you and choose a new password.
        </p>

        {error && (
          <div className="mt-6 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {resendMsg && (
          <div className="mt-4 rounded-md border border-success-border bg-success-bg px-4 py-3 text-sm text-success">
            {resendMsg}
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

          {/* OTP */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
                <Key size={14} strokeWidth={1.75} />
                OTP code
              </label>

              {/* Resend OTP */}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || resendCooldown > 0}
                className="flex items-center gap-1 text-xs text-accent transition-opacity hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={11}
                  strokeWidth={2}
                  className={isResending ? "animate-spin" : ""}
                />
                {resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : isResending
                    ? "Sending…"
                    : "Resend OTP"}
              </button>
            </div>

            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="6-digit code"
              required
              className="mt-2 w-full border-0 border-b border-bg-border bg-transparent px-0 py-2 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent"
            />
          </div>

          {/* New password */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
              <Lock size={14} strokeWidth={1.75} />
              New password
            </label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="w-full border-0 border-b border-bg-border bg-transparent pr-8 px-0 py-2 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={15} strokeWidth={1.75} />
                ) : (
                  <Eye size={15} strokeWidth={1.75} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-accent px-4 py-3 font-medium text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Resetting…" : "Reset password"}
          </button>
        </form>

        <p className="mt-8 text-sm text-text-secondary">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-accent hover:underline"
          >
            <ArrowLeft size={13} strokeWidth={1.75} />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;