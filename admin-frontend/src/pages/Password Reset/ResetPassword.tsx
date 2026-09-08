import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { resetAdminPassword } from "../../services/authApi";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = (location.state as { email?: string })?.email ?? "";

  const [email, setEmail] = useState(prefilledEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await resetAdminPassword({ email, otp, newPassword });
      navigate("/admin/login", {
        replace: true,
        state: { resetSuccess: true },
      });
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#121218] px-6 font-[Inter]">
      <style>{`
        @keyframes rise-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rise-in { animation: rise-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
      `}</style>

      <div className="rise-in w-full max-w-sm">
        <h2 className="font-[Space_Grotesk] text-3xl font-bold text-[#F4F3F1]">
          Reset password
        </h2>
        <p className="mt-2 text-[15px] text-[#9A99A6]">
          Enter the code we sent you and choose a new password.
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
              OTP code
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="6-digit code"
              required
              className="mt-2 w-full border-0 border-b border-[#2A2A34] bg-transparent px-0 py-2 text-[#F4F3F1] outline-none transition-colors placeholder:text-[#5C5B66] focus:border-[#3A5CFF]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9A99A6]">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="mt-2 w-full border-0 border-b border-[#2A2A34] bg-transparent px-0 py-2 text-[#F4F3F1] outline-none transition-colors placeholder:text-[#5C5B66] focus:border-[#3A5CFF]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-[#3A5CFF] px-4 py-3 font-medium text-[#F4F3F1] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <p className="mt-8 text-sm text-[#9A99A6]">
          <Link to="/admin/login" className="text-[#3A5CFF] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;