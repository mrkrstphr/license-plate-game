import { US_STATE_PATHS, US_MAP_VIEWBOX } from "~/data/us-state-paths";
import { CA_PROVINCE_PATHS, CA_MAP_VIEWBOX } from "~/data/ca-province-paths";
import { US_PLATES, CA_PLATES } from "~/data/plates";

function buildSVG(
  paths: Record<string, string>,
  viewBox: string,
  plates: { code: string }[],
  found: string[],
  foundColor: string,
  emptyColor: string,
  strokeColor: string
): string {
  const pathEls = plates
    .map(({ code }) => {
      const d = paths[code];
      if (!d) return "";
      const fill = found.includes(code) ? foundColor : emptyColor;
      return `<path d="${d}" fill="${fill}" stroke="${strokeColor}" stroke-width="1" stroke-linejoin="round"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${pathEls}</svg>`;
}

export async function svgToDataUrl(svg: string, widthPx: number, heightPx: number): Promise<string> {
  const { Canvg } = await import("canvg");
  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d")!;
  const v = await Canvg.from(ctx, svg, { ignoreMouse: true, ignoreAnimation: true });
  await v.render();
  return canvas.toDataURL("image/png");
}

export async function buildUSMapImage(found: string[], dark = false): Promise<string> {
  const svg = buildSVG(
    US_STATE_PATHS, US_MAP_VIEWBOX, US_PLATES, found,
    "#22C55E", dark ? "#2E3347" : "#D1D5E0", dark ? "#1C1F2B" : "#FFFFFF"
  );
  return svgToDataUrl(svg, 1520, 920);
}

export async function buildCAMapImage(found: string[], dark = false): Promise<string> {
  const svg = buildSVG(
    CA_PROVINCE_PATHS, CA_MAP_VIEWBOX, CA_PLATES, found,
    "#F5A623", dark ? "#2E3347" : "#D1D5E0", dark ? "#1C1F2B" : "#FFFFFF"
  );
  return svgToDataUrl(svg, 1600, 960);
}
