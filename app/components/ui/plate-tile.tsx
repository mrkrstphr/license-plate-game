import type { Plate } from "~/data/plates";

interface PlateTileProps {
  plate: Plate;
  found: boolean;
  onToggle: (code: string) => void;
}

export function PlateTile({ plate, found, onToggle }: PlateTileProps) {
  return (
    <button
      onClick={() => onToggle(plate.code)}
      title={plate.name}
      className="relative flex flex-col items-center justify-center rounded-xl border-2 p-2 cursor-pointer transition-all duration-150 min-h-14 w-full"
      style={found ? {
        borderColor: "var(--found-border)",
        background: "var(--found-bg)",
      } : {
        borderColor: "var(--plate-border)",
        background: "var(--plate-empty)",
      }}
    >
      {found && (
        <span className="absolute top-1 right-1.5 text-[9px] font-black" style={{ color: "var(--found)" }}>✓</span>
      )}
      <span className="font-black text-sm tracking-wide leading-none" style={{ color: found ? "var(--found)" : "var(--text-muted)" }}>
        {plate.code}
      </span>
      <span className="text-[8px] font-medium mt-1 text-center leading-tight max-w-[48px] truncate"
        style={{ color: found ? "var(--found)" : "var(--text-faint)" }}>
        {plate.name}
      </span>
    </button>
  );
}
