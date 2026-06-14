import { CA_PROVINCE_PATHS, CA_MAP_VIEWBOX } from "~/data/ca-province-paths";
import { CA_PLATES } from "~/data/plates";

interface CAMapProps {
  found: string[];
}

export function CAMap({ found }: CAMapProps) {
  return (
    <div className="w-full">
      <svg viewBox={CA_MAP_VIEWBOX} className="w-full h-auto" style={{ maxHeight: 300 }} aria-label="Map of Canadian provinces and territories">
        {CA_PLATES.map(({ code }) => {
          const d = CA_PROVINCE_PATHS[code];
          if (!d) return null;
          const isFound = found.includes(code);
          return (
            <path key={code} d={d}
              fill={isFound ? "var(--amber)" : "var(--map-empty)"}
              stroke="var(--bg-card)"
              strokeWidth={1}
              strokeLinejoin="round"
              style={{ transition: "fill 0.25s ease" }}
            />
          );
        })}
      </svg>
    </div>
  );
}
