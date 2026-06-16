import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/auth.callback";
import { supabase } from "~/lib/supabase";
import { TopBar } from "~/components/ui/top-bar";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Signing in… · Plate Game" }];
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    // Supabase's client automatically parses the URL hash/query and
    // establishes the session; we just need to wait for it then redirect.
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      if (data.session) {
        navigate("/", { replace: true });
      } else {
        // Give the client a moment to process the URL fragment on first load
        const sub = supabase.auth.onAuthStateChange((_event, session) => {
          if (session) navigate("/", { replace: true });
        });
        return () => sub.data.subscription.unsubscribe();
      }
    });
  }, [navigate]);

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
