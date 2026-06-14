import { US_STATE_PATHS, US_MAP_VIEWBOX } from "~/data/us-state-paths";
import { US_PLATES } from "~/data/plates";

interface USMapProps {
  found: string[];
}

export function USMap({ found }: USMapProps) {
  return (
    <div className="w-full">
      <svg viewBox={US_MAP_VIEWBOX} className="w-full h-auto" style={{ maxHeight: 320 }} aria-label="Map of US states">
        {US_PLATES.map(({ code }) => {
          const d = US_STATE_PATHS[code];
          if (!d) return null;
          const isFound = found.includes(code);
          return (
            <path key={code} d={d}
              fill={isFound ? "var(--found)" : "var(--map-empty)"}
              stroke="var(--bg-card)"
              strokeWidth={code === "DC" ? 0.5 : 1}
              strokeLinejoin="round"
              style={{ transition: "fill 0.25s ease" }}
            />
          );
        })}
        <rect x="8" y="356" width="194" height="98" rx="4" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3"/>
        <rect x="203" y="394" width="124" height="60" rx="4" fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3"/>
        <text x="12" y="364" fontSize="6" fill="var(--text-faint)">Alaska</text>
        <text x="207" y="402" fontSize="6" fill="var(--text-faint)">Hawaii</text>
      </svg>
    </div>
  );
}
