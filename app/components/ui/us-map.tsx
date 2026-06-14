import { US_STATE_PATHS, US_MAP_VIEWBOX } from "~/data/us-state-paths";
import { US_PLATES } from "~/data/plates";

interface USMapProps {
  found: string[];
}

export function USMap({ found }: USMapProps) {
  return (
    <div className="w-full">
      <svg
        viewBox={US_MAP_VIEWBOX}
        className="w-full h-auto"
        style={{ maxHeight: 320 }}
        aria-label="Map of US states"
      >
        {US_PLATES.map(({ code }) => {
          const d = US_STATE_PATHS[code];
          if (!d) return null;
          const isFound = found.includes(code);
          return (
            <path
              key={code}
              d={d}
              fill={isFound ? "#22C55E" : "#D1D5E0"}
              stroke="white"
              strokeWidth={code === "DC" ? 0.5 : 1}
              strokeLinejoin="round"
              style={{ transition: "fill 0.25s ease" }}
            />
          );
        })}
        {/* Inset boxes for AK / HI */}
        <rect x="18" y="388" width="148" height="62" rx="4" fill="none" stroke="#D1D5E0" strokeWidth="1" strokeDasharray="3,3"/>
        <rect x="200" y="420" width="115" height="48" rx="4" fill="none" stroke="#D1D5E0" strokeWidth="1" strokeDasharray="3,3"/>
        <text x="22" y="396" fontSize="6" fill="#9CA3AF">Alaska</text>
        <text x="204" y="428" fontSize="6" fill="#9CA3AF">Hawaii</text>
      </svg>
    </div>
  );
}
