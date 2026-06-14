import { cn } from "~/lib/utils";

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  label: string;
  sub: string;
  className?: string;
}

export function ProgressBar({ value, color = "bg-sky-500", label, sub, className }: ProgressBarProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="text-xs font-extrabold" style={{ color: "inherit" }}>{sub}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
