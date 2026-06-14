import { Link } from "react-router";

interface TopBarProps {
  backTo?: string;
  backLabel?: string;
  action?: React.ReactNode;
}

export function TopBar({ backTo, backLabel = "Back", action }: TopBarProps) {
  return (
    <header className="h-14 px-4 flex items-center justify-between sticky top-0 z-50 shadow-md"
      style={{ background: "var(--navy)" }}>
      <div className="flex items-center gap-3">
        {backTo ? (
          <Link to={backTo} className="font-bold text-sm flex items-center gap-1" style={{ color: "var(--sky)" }}>
            ← {backLabel}
          </Link>
        ) : (
          <div className="font-black text-lg tracking-tight flex items-center gap-2" style={{ color: "#fff" }}>
            <span>🚗</span>
            <span>Plate <span style={{ color: "var(--amber)" }}>Game</span></span>
          </div>
        )}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
