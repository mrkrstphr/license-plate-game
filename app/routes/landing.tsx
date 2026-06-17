import { Link, useNavigate } from "react-router";
import { useEffect } from "react";
import type { Route } from "./+types/landing";
import { TopBar } from "~/components/ui/top-bar";
import { useAuth } from "~/lib/auth-context";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "License Plate Game" },
    { name: "description", content: "Track license plates on your road trip! Spot all 50 US states and every Canadian province." },
  ];
}

export default function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  // Signed-in users skip the pitch and go straight to their games
  useEffect(() => {
    if (!loading && session) {
      navigate("/games", { replace: true });
    }
  }, [loading, session, navigate]);

  if (loading || session) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
      <TopBar action={
        <Link
          to="/login"
          className="font-black text-sm px-3 py-1.5 rounded-lg"
          style={{ background: "var(--amber)", color: "var(--navy)" }}
        >
          Sign In
        </Link>
      } />

      <div className="max-w-lg mx-auto px-4 pb-20 pt-4">
        {/* Hero */}
        <div
          className="rounded-2xl p-6 mb-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--bg-hero-from) 0%, var(--bg-hero-to) 100%)" }}
        >
          <div className="absolute top-[-20px] right-[-20px] text-[100px] opacity-[0.06] select-none pointer-events-none">🚗</div>
          <div className="flex items-center gap-3 mb-1">
            <div className="text-4xl flex-shrink-0">🛣️</div>
            <h1 className="text-2xl font-black leading-tight tracking-tight" style={{ color: "#fff" }}>
              License Plate<br />
              <span style={{ color: "var(--amber)" }}>Game</span>
            </h1>
          </div>
          <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
            Spot plates from all 50 states + Canada on your road trip
          </p>
          <Link
            to="/login"
            className="mt-4 flex items-center justify-center w-full font-black text-base rounded-xl py-3"
            style={{ background: "var(--amber)", color: "var(--navy)" }}
          >
            Get Started — It's Free
          </Link>
        </div>

        {/* Feature highlights */}
        <div className="space-y-3 mb-5">
          <FeatureRow icon="🗺️" title="Track every state & province" desc="51 US states + DC and 13 Canadian provinces and territories" />
          <FeatureRow icon="👨‍👩‍👧‍👦" title="Play together" desc="Share a link so the whole car can mark plates as you spot them" />
          <FeatureRow icon="📄" title="Export your results" desc="Save a PDF or JSON snapshot of every trip when you're done" />
          <FeatureRow icon="🌙" title="Works everywhere" desc="Mobile-friendly, dark mode, and syncs across your devices" />
        </div>

        <div className="rounded-2xl shadow-sm p-5 text-center" style={{ background: "var(--bg-card)" }}>
          <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
            Already playing?
          </p>
          <Link
            to="/login"
            className="inline-block font-bold text-sm rounded-xl px-5 py-2.5"
            style={{ background: "var(--bg-muted)", color: "var(--sky)" }}
          >
            Sign In →
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl shadow-sm p-4" style={{ background: "var(--bg-card)" }}>
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div>
        <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
      </div>
    </div>
  );
}
