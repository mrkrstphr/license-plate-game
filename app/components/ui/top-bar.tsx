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
        <div className="font-black text-lg tracking-tight flex items-center gap-2" style={{ color: "#fff" }}>
          <span>🚗</span>
          <span>Plate <span style={{ color: "var(--amber)" }}>Game</span></span>
        </div>
        {backTo && (
          <Link to={backTo}
            className="font-semibold text-sm flex items-center gap-1 transition-opacity opacity-60 hover:opacity-100"
            style={{ color: "#fff" }}>
            · ← {backLabel}
          </Link>
        )}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
