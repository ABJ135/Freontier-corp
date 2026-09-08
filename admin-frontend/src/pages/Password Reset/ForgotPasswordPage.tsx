import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotAdminPassword } from "../../services/authApi";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await forgotAdminPassword({ email });
      setSubmitted(true);
    } catch {
      // Keep this generic — don't leak whether the email exists.
      setSubmitted(true);
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
          Forgot password
        </h2>
        <p className="mt-2 text-[15px] text-[#9A99A6]">
          Enter your admin email and we'll send you a one-time code.
        </p>

        {error && (
          <div className="mt-6 rounded-md border border-[#3A2226] bg-[#241417] px-4 py-3 text-sm text-[#FF8A8A]">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-md border border-[#22301F] bg-[#161C14] px-4 py-3 text-sm text-[#9CD67D]">
              If that email is registered, an OTP has been sent.
            </div>
            <button
              type="button"
              onClick={() =>
                navigate("/admin/reset-password", { state: { email } })
              }
              className="w-full rounded-md bg-[#3A5CFF] px-4 py-3 font-medium text-[#F4F3F1] transition-transform active:scale-[0.98]"
            >
              I have a code
            </button>
          </div>
        ) : (
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-[#3A5CFF] px-4 py-3 font-medium text-[#F4F3F1] transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send code"}
            </button>
          </form>
        )}

        <p className="mt-8 text-sm text-[#9A99A6]">
          <Link to="/admin/login" className="text-[#3A5CFF] hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;