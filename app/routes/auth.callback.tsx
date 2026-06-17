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
  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
    const code = searchParams.get("code");

    if (code) {
      // PKCE flow: a `code` query param that must be explicitly exchanged
      // for a session using the verifier stored in localStorage.
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        navigate(redirectTo, { replace: true });
      });
      return;
    }

    // Implicit grant flow: tokens arrive directly in the URL hash fragment
    // (#access_token=...&refresh_token=...). Supabase's client only
    // auto-detects this hash once, at construction time — but our GitHub
    // Pages SPA redirect (404.html -> sessionStorage -> history.replaceState)
    // restores the URL *after* the client module has already run, so the
    // hash is invisible to that auto-detection. We parse it ourselves here.
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hash);
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error: setSessionError }) => {
          if (setSessionError) {
            setError(setSessionError.message);
            return;
          }
          navigate(redirectTo, { replace: true });
        });
      return;
    }

    // Last resort: maybe a session already exists somehow
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      if (data.session) {
        navigate(redirectTo, { replace: true });
      } else {
        setError("No sign-in code found in the link. It may have expired — try requesting a new one.");
      }
    });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
      <TopBar />
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
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
    </div>
  );
}
