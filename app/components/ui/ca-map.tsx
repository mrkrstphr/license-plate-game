import { CA_PROVINCE_PATHS, CA_MAP_VIEWBOX } from "~/data/ca-province-paths";
import { CA_PLATES } from "~/data/plates";

interface CAMapProps {
  found: string[];
}

// Label positions for the Lambert projection at 800x480, Y-flipped
const PROVINCE_LABELS: Record<string, [number, number]> = {
  YT: [112,  88], NT: [268, 140], NU: [468, 118],
  BC: [118, 255], AB: [228, 272], SK: [332, 272], MB: [428, 268],
  ON: [530, 318], QC: [618, 235], NB: [672, 330], NS: [692, 350],
  PE: [702, 318], NL: [692, 195],
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
                style={{ transition: "fill 0.25s ease" }}
              />
              {label && (
                <text
                  x={label[0]} y={label[1]}
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
