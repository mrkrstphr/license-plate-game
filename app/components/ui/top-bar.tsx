import { Link, useNavigate } from "react-router";
import { useAuth } from "~/lib/auth-context";
import { supabase } from "~/lib/supabase";

interface TopBarProps {
  action?: React.ReactNode;
  sticky?: boolean;
}

export function TopBar({ action, sticky = true }: TopBarProps) {
  const { session, isAnonymous, user } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className={sticky ? "sticky top-0 z-50 shadow-md" : ""}>
      <header className="h-14 px-4 flex items-center justify-between"
        style={{ background: "var(--navy)" }}>
        <Link to="/" className="font-black text-lg tracking-tight flex items-center gap-2" style={{ color: "#fff" }}>
          <span>🚗</span>
          <span>Plate <span style={{ color: "var(--amber)" }}>Game</span></span>
        </Link>
        {action && <div>{action}</div>}
      </header>
      {!isAnonymous && session && user?.email && (
        <div className="px-4 py-1.5 flex items-center justify-between" style={{ background: "var(--bg-muted)" }}>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
            Signed in as <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{user.email}</span>
          </p>
          <button onClick={handleSignOut} className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: "var(--sky)" }}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
