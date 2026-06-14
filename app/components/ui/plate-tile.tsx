import { cn } from "~/lib/utils";
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
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 p-2 cursor-pointer transition-all duration-150 min-h-14 w-full",
        found
          ? "border-green-400 bg-green-50 text-green-600"
          : "border-gray-200 bg-gray-100 text-gray-400 hover:border-gray-300"
      )}
    >
      {found && (
        <span className="absolute top-1 right-1.5 text-[9px] font-black text-green-500">✓</span>
      )}
      <span className={cn("font-black text-sm tracking-wide leading-none", found ? "text-green-600" : "text-gray-400")}>
        {plate.code}
      </span>
      <span className={cn("text-[8px] font-medium mt-1 text-center leading-tight max-w-[48px] truncate", found ? "text-green-500" : "text-gray-400")}>
        {plate.name}
      </span>
    </button>
  );
}
