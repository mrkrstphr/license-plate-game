import highwaySvg from "./icon-highway.svg?raw";
import usFlagSvg  from "./icon-us-flag.svg?raw";
import caFlagSvg  from "./icon-ca-flag.svg?raw";

export const SVG_HIGHWAY = highwaySvg;
export const SVG_US_FLAG = usFlagSvg;
export const SVG_CA_FLAG = caFlagSvg;

export async function svgStringToDataUrl(svg: string, w: number, h: number): Promise<string> {
  const { Canvg } = await import("canvg");
  const canvas = document.createElement("canvas");
  canvas.width  = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const v = await Canvg.from(ctx, svg, { ignoreMouse: true, ignoreAnimation: true });
  await v.render();
  return canvas.toDataURL("image/png");
}
