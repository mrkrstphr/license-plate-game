import { CA_PROVINCE_PATHS, CA_MAP_VIEWBOX } from "~/data/ca-province-paths";
import { CA_PLATES } from "~/data/plates";

interface CAMapProps {
  found: string[];
}

// Approximate label centers in the 800x480 viewBox
const PROVINCE_LABELS: Record<string, [number, number]> = {
  BC: [130, 240], AB: [230, 270], SK: [330, 270], MB: [420, 270],
  ON: [520, 310], QC: [610, 240], NB: [668, 330], NS: [682, 355],
  PE: [692, 330], NL: [680, 190], NT: [300, 150], NU: [460, 130],
  YT: [100, 80],
};

export function CAMap({ found }: CAMapProps) {
  return (
    <div className="w-full">
      <svg
        viewBox={CA_MAP_VIEWBOX}
        className="w-full h-auto"
        style={{ maxHeight: 300 }}
        aria-label="Map of Canadian provinces and territories"
      >
        {CA_PLATES.map(({ code }) => {
          const d = CA_PROVINCE_PATHS[code];
          if (!d) return null;
          const isFound = found.includes(code);
          const label = PROVINCE_LABELS[code];
          return (
            <g key={code}>
              <path
                d={d}
                fill={isFound ? "#F59E0B" : "#D1D5E0"}
                stroke="white"
                strokeWidth={1}
                strokeLinejoin="round"
                style={{ transition: "fill 0.2s ease" }}
              />
              {label && (
                <text
                  x={label[0]}
                  y={label[1]}
                  fontSize={8}
                  fontWeight="700"
                  fill={isFound ? "white" : "#6B7280"}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {code}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
