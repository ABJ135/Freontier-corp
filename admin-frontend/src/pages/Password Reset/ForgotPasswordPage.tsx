import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Send } from "lucide-react";
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
    <div className="flex min-h-screen items-center justify-center bg-bg px-6 font-[Inter]">
      <div className="rise-in w-full max-w-sm">
        <h2 className="font-[Space_Grotesk] text-3xl font-bold text-text-primary">
          Forgot password
        </h2>
        <p className="mt-2 text-[15px] text-text-secondary">
          Enter your admin email and we'll send you a one-time code.
        </p>

        {error && (
          <div className="mt-6 rounded-md border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="mt-8 space-y-6">
            <div className="rounded-md border border-success-border bg-success-bg px-4 py-3 text-sm text-success">
              If that email is registered, an OTP has been sent.
            </div>
            <button
              type="button"
              onClick={() =>
                navigate("/admin/reset-password", { state: { email } })
              }
              className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-3 font-medium text-white transition-transform active:scale-[0.98]"
            >
              <Send size={15} strokeWidth={1.75} />
              I have a code
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-7">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-md bg-accent px-4 py-3 font-medium text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Sending…" : "Send code"}
            </button>
          </form>
        )}

        <p className="mt-8 text-sm text-text-secondary">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-accent hover:underline">
            <ArrowLeft size={13} strokeWidth={1.75} />
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;