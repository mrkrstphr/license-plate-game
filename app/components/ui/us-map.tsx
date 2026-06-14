import { US_STATE_PATHS, US_MAP_VIEWBOX } from "~/data/us-state-paths";
import { US_PLATES } from "~/data/plates";

interface USMapProps {
  found: string[];
}

// Label positions for each state (cx, cy in the 800x500 viewBox)
const STATE_LABELS: Record<string, [number, number]> = {
  AL: [548, 170], AK: [80, 445], AZ: [175, 220], AR: [500, 175],
  CA: [95, 195], CO: [270, 185], CT: [680, 115], DE: [657, 145],
  FL: [575, 245], GA: [570, 195], HI: [250, 455], ID: [175, 115],
  IL: [510, 145], IN: [535, 140], IA: [470, 118], KS: [400, 180],
  KY: [548, 158], LA: [490, 220], ME: [695, 68], MD: [645, 148],
  MA: [690, 100], MI: [535, 100], MN: [450, 82], MS: [518, 190],
  MO: [480, 158], MT: [240, 85], NE: [390, 145], NV: [140, 175],
  NH: [682, 85], NJ: [660, 132], NM: [240, 228], NY: [650, 100],
  NC: [600, 175], ND: [380, 82], OH: [570, 130], OK: [415, 202],
  OR: [120, 110], PA: [620, 120], RI: [692, 112], SC: [590, 195],
  SD: [380, 112], TN: [545, 178], TX: [380, 248], UT: [205, 185],
  VT: [668, 80], VA: [612, 158], WA: [130, 72], WV: [590, 145],
  WI: [490, 95], WY: [275, 133], DC: [648, 152],
};

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
          const iFound = found.includes(code);
          const label = STATE_LABELS[code];
          return (
            <g key={code}>
              <path
                d={d}
                fill={iFound ? "#22C55E" : "#D1D5E0"}
                stroke="white"
                strokeWidth={code === "DC" ? 0.5 : 1}
                strokeLinejoin="round"
                style={{ transition: "fill 0.2s ease" }}
              />
              {label && (
                <text
                  x={label[0]}
                  y={label[1]}
                  fontSize={code === "DC" ? 5 : 7}
                  fontWeight="700"
                  fill={iFound ? "white" : "#6B7280"}
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
        {/* AK / HI inset box */}
        <rect x="20" y="375" width="175" height="110" rx="4" fill="none" stroke="#D1D5E0" strokeWidth="1" strokeDasharray="4,3"/>
        <rect x="200" y="425" width="120" height="60" rx="4" fill="none" stroke="#D1D5E0" strokeWidth="1" strokeDasharray="4,3"/>
        <text x="28" y="383" fontSize="6" fill="#9CA3AF">Alaska</text>
        <text x="208" y="433" fontSize="6" fill="#9CA3AF">Hawaii</text>
      </svg>
    </div>
  );
}
