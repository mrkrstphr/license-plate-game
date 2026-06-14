import { US_STATE_PATHS, US_MAP_VIEWBOX } from "~/data/us-state-paths";
import { US_PLATES } from "~/data/plates";

interface USMapProps {
  found: string[];
}

// Label positions tuned for the Albers projection at 760x460, Y-up→flipped
const STATE_LABELS: Record<string, [number, number]> = {
  WA: [128,  62], OR: [105, 118], CA: [ 88, 220], NV: [148, 190],
  ID: [178, 115], MT: [238,  85], WY: [278, 145], UT: [208, 195],
  AZ: [218, 250], NM: [248, 258], CO: [278, 195], ND: [375,  75],
  SD: [375, 110], NE: [378, 148], KS: [385, 182], OK: [408, 220],
  TX: [385, 278], MN: [448,  78], IA: [458, 128], MO: [468, 168],
  AR: [468, 210], LA: [465, 252], WI: [488,  98], IL: [508, 148],
  MS: [510, 218], MI: [532,  88], IN: [530, 148], KY: [548, 170],
  TN: [535, 198], AL: [535, 222], OH: [566, 135], GA: [562, 232],
  FL: [570, 278], NC: [598, 190], SC: [588, 218], VA: [612, 170],
  WV: [588, 152], PA: [620, 122], NY: [644, 100], VT: [660,  78],
  NH: [670,  82], ME: [682,  62], MA: [672, 108], RI: [684, 118],
  CT: [668, 118], NJ: [652, 132], DE: [648, 148], MD: [634, 150],
  DC: [632, 162], AK: [ 90, 428], HI: [252, 440],
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
          const isFound = found.includes(code);
          const label = STATE_LABELS[code];
          return (
            <g key={code}>
              <path
                d={d}
                fill={isFound ? "#22C55E" : "#D1D5E0"}
                stroke="white"
                strokeWidth={code === "DC" ? 0.5 : 1}
                strokeLinejoin="round"
                style={{ transition: "fill 0.25s ease" }}
              />
              {label && (
                <text
                  x={label[0]} y={label[1]}
                  fontSize={code === "DC" ? 5 : 7}
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
        {/* Inset boxes for AK / HI */}
        <rect x="18" y="388" width="148" height="62" rx="4" fill="none" stroke="#D1D5E0" strokeWidth="1" strokeDasharray="3,3"/>
        <rect x="200" y="420" width="115" height="48" rx="4" fill="none" stroke="#D1D5E0" strokeWidth="1" strokeDasharray="3,3"/>
        <text x="22" y="396" fontSize="6" fill="#9CA3AF">Alaska</text>
        <text x="204" y="428" fontSize="6" fill="#9CA3AF">Hawaii</text>
      </svg>
    </div>
  );
}
