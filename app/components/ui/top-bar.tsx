import { Link } from "react-router";

interface TopBarProps {
  action?: React.ReactNode;
}

export function TopBar({ action }: TopBarProps) {
  return (
    <header className="h-14 px-4 flex items-center justify-between sticky top-0 z-50 shadow-md"
      style={{ background: "var(--navy)" }}>
      <Link to="/" className="font-black text-lg tracking-tight flex items-center gap-2" style={{ color: "#fff" }}>
        <span>🚗</span>
        <span>Plate <span style={{ color: "var(--amber)" }}>Game</span></span>
      </Link>
      {action && <div>{action}</div>}
    </header>
  );
}
