import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/auth.callback";
import { supabase } from "~/lib/supabase";
import { TopBar } from "~/components/ui/top-bar";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Signing in… · Plate Game" }];
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");

    if (code) {
      // Modern Supabase magic links use PKCE: a `code` query param that
      // must be explicitly exchanged for a session. The code verifier
      // was stored in localStorage when signInWithOtp() was called.
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        navigate("/", { replace: true });
      });
      return;
    }

    // Fallback: older-style implicit grant with #access_token in the hash.
    // Supabase's client auto-detects this on construction if present.
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      if (data.session) {
        navigate("/", { replace: true });
      } else {
        setError("No sign-in code found in the link. It may have expired — try requesting a new one.");
      }
    });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
      <TopBar />
      <div className="max-w-lg mx-auto px-4 pt-16 text-center">
        {error ? (
          <>
            <p className="font-bold text-base mb-2" style={{ color: "var(--danger-text)" }}>Sign-in failed</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
          </>
        ) : (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Signing you in…</p>
        )}
      </div>
    </div>
  );
}
