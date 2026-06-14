import { Link } from "react-router";
import { cn } from "~/lib/utils";

interface TopBarProps {
  title?: string;
  backTo?: string;
  backLabel?: string;
  action?: React.ReactNode;
}

export function TopBar({ title, backTo, backLabel = "Back", action }: TopBarProps) {
  return (
    <header className="bg-[#1B2340] h-14 px-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-3">
        {backTo ? (
          <Link
            to={backTo}
            className="text-sky-400 font-bold text-sm flex items-center gap-1"
          >
            ← {backLabel}
          </Link>
        ) : (
          <div className="text-white font-black text-lg tracking-tight flex items-center gap-2">
            <span>🚗</span>
            <span>
              Plate <span className="text-[#F5A623]">Game</span>
            </span>
          </div>
        )}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
