import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/login";
import { supabase } from "~/lib/supabase";
import { useAuth } from "~/lib/auth-context";
import { TopBar } from "~/components/ui/top-bar";
import { Alert } from "~/components/ui/dialog";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Sign in · Plate Game" }];
}

export default function Login() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/games";

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session && !sent) {
    navigate(redirectTo, { replace: true });
    return null;
  }

  async function handleSubmit() {
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setSubmitting(true);
    setError("");
    const callbackUrl = new URL(`${window.location.origin}${import.meta.env.BASE_URL}auth/callback`);
    if (redirectTo !== "/games") {
      callbackUrl.searchParams.set("redirect", redirectTo);
    }
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: callbackUrl.toString(),
      },
    });
    setSubmitting(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    setSent(true);
  }

  const inputStyle = {
    background: "var(--bg-input)",
    border: "1.5px solid var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
      <TopBar />
      <div className="max-w-lg mx-auto px-4 pt-10 pb-20">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🚗</div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Sign in</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            We'll email you a magic link — no password needed
          </p>
        </div>

        <div className="rounded-2xl shadow-sm p-5 space-y-4" style={{ background: "var(--bg-card)" }}>
          {sent ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-3">📬</div>
              <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>Check your email</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                We sent a sign-in link to <strong>{email}</strong>
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Email
                </label>
                <input
                  className="w-full rounded-xl px-3.5 py-3 text-[16px] outline-none transition-colors"
                  style={inputStyle}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  autoFocus
                />
              </div>
              <Alert message={error} />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full font-black text-base rounded-xl py-3"
                style={{ background: "var(--amber)", color: "var(--navy)", opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? "Sending…" : "Send Magic Link"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
