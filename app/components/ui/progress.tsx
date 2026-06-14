import { cn } from "~/lib/utils";

interface ProgressBarProps {
  value: number;
  colorVar: string; // CSS custom property name e.g. "--sky"
  hex: string;      // fallback hex for the fill
  label: string;
  sub: string;
  className?: string;
}

export function ProgressBar({ value, hex, label, sub, className }: ProgressBarProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</span>
        <span className="text-xs font-extrabold" style={{ color: hex }}>{sub}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(value, 100)}%`, background: hex }} />
      </div>
    </div>
  );
}
