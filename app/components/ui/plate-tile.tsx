import type { Plate } from "~/data/plates";

interface PlateTileProps {
  plate: Plate;
  found: boolean;
  foundByEmail?: string | null;
  onToggle: (code: string) => void;
}

function initials(email: string | null | undefined): string | null {
  if (!email) return null;
  const name = email.split("@")[0];
  return name.slice(0, 1).toUpperCase();
}

export function PlateTile({ plate, found, foundByEmail, onToggle }: PlateTileProps) {
  const badge = found ? initials(foundByEmail) : null;

  return (
    <button
      onClick={() => onToggle(plate.code)}
      title={found && foundByEmail ? `${plate.name} — found by ${foundByEmail}` : plate.name}
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
        badge ? (
          <span
            className="absolute top-1 right-1.5 text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center"
            style={{ background: "var(--found)", color: "white" }}
          >
            {badge}
          </span>
        ) : (
          <span className="absolute top-1 right-1.5 text-[9px] font-black" style={{ color: "var(--found)" }}>✓</span>
        )
      )}
      <span className="font-black text-sm tracking-wide leading-none" style={{ color: found ? "var(--found)" : "var(--text-muted)" }}>
        {plate.code}
      </span>
      <span className="text-[9px] font-medium mt-1 text-center leading-tight max-w-[60px] truncate"
        style={{ color: found ? "var(--found)" : "var(--text-muted)" }}>
        {plate.name}
      </span>
    </button>
  );
}
