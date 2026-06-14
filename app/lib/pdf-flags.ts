// SVG flag and icon definitions for PDF embedding
// Each returns an SVG string at a standard 4:3 or native aspect ratio

export const SVG_US_FLAG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 100">
  <!-- 13 stripes -->
  <rect width="190" height="100" fill="#B22234"/>
  <rect y="7.69" width="190" height="7.69" fill="#FFFFFF"/>
  <rect y="15.38" width="190" height="7.69" fill="#B22234"/>
  <rect y="23.08" width="190" height="7.69" fill="#FFFFFF"/>
  <rect y="30.77" width="190" height="7.69" fill="#B22234"/>
  <rect y="38.46" width="190" height="7.69" fill="#FFFFFF"/>
  <rect y="46.15" width="190" height="7.69" fill="#B22234"/>
  <rect y="53.85" width="190" height="7.69" fill="#FFFFFF"/>
  <rect y="61.54" width="190" height="7.69" fill="#B22234"/>
  <rect y="69.23" width="190" height="7.69" fill="#FFFFFF"/>
  <rect y="76.92" width="190" height="7.69" fill="#B22234"/>
  <rect y="84.62" width="190" height="7.69" fill="#FFFFFF"/>
  <!-- Canton (blue field) -->
  <rect width="76" height="53.85" fill="#3C3B6E"/>
  <!-- 50 stars: 5 rows of 6 + 4 rows of 5, simplified as a grid of dots -->
  <g fill="#FFFFFF">
    <!-- Row 1: 6 stars at y=5 -->
    <circle cx="6"  cy="5"  r="2.2"/><circle cx="18" cy="5"  r="2.2"/>
    <circle cx="30" cy="5"  r="2.2"/><circle cx="42" cy="5"  r="2.2"/>
    <circle cx="54" cy="5"  r="2.2"/><circle cx="66" cy="5"  r="2.2"/>
    <!-- Row 2: 5 stars at y=11 (offset) -->
    <circle cx="12" cy="11" r="2.2"/><circle cx="24" cy="11" r="2.2"/>
    <circle cx="36" cy="11" r="2.2"/><circle cx="48" cy="11" r="2.2"/>
    <circle cx="60" cy="11" r="2.2"/>
    <!-- Row 3: 6 stars -->
    <circle cx="6"  cy="17" r="2.2"/><circle cx="18" cy="17" r="2.2"/>
    <circle cx="30" cy="17" r="2.2"/><circle cx="42" cy="17" r="2.2"/>
    <circle cx="54" cy="17" r="2.2"/><circle cx="66" cy="17" r="2.2"/>
    <!-- Row 4: 5 stars -->
    <circle cx="12" cy="23" r="2.2"/><circle cx="24" cy="23" r="2.2"/>
    <circle cx="36" cy="23" r="2.2"/><circle cx="48" cy="23" r="2.2"/>
    <circle cx="60" cy="23" r="2.2"/>
    <!-- Row 5: 6 stars -->
    <circle cx="6"  cy="29" r="2.2"/><circle cx="18" cy="29" r="2.2"/>
    <circle cx="30" cy="29" r="2.2"/><circle cx="42" cy="29" r="2.2"/>
    <circle cx="54" cy="29" r="2.2"/><circle cx="66" cy="29" r="2.2"/>
    <!-- Row 6: 5 stars -->
    <circle cx="12" cy="35" r="2.2"/><circle cx="24" cy="35" r="2.2"/>
    <circle cx="36" cy="35" r="2.2"/><circle cx="48" cy="35" r="2.2"/>
    <circle cx="60" cy="35" r="2.2"/>
    <!-- Row 7: 6 stars -->
    <circle cx="6"  cy="41" r="2.2"/><circle cx="18" cy="41" r="2.2"/>
    <circle cx="30" cy="41" r="2.2"/><circle cx="42" cy="41" r="2.2"/>
    <circle cx="54" cy="41" r="2.2"/><circle cx="66" cy="41" r="2.2"/>
    <!-- Row 8: 5 stars -->
    <circle cx="12" cy="47" r="2.2"/><circle cx="24" cy="47" r="2.2"/>
    <circle cx="36" cy="47" r="2.2"/><circle cx="48" cy="47" r="2.2"/>
    <circle cx="60" cy="47" r="2.2"/>
    <!-- Row 9: 6 stars -->
    <circle cx="6"  cy="53" r="2.2"/><circle cx="18" cy="53" r="2.2"/>
    <circle cx="30" cy="53" r="2.2"/><circle cx="42" cy="53" r="2.2"/>
    <circle cx="54" cy="53" r="2.2"/><circle cx="66" cy="53" r="2.2"/>
  </g>
</svg>`;

// Canadian flag: red-white-red vertical triband with maple leaf
export const SVG_CA_FLAG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 100">
  <!-- Red bands -->
  <rect width="190" height="100" fill="#FF0000"/>
  <!-- White centre band -->
  <rect x="47.5" width="95" height="100" fill="#FFFFFF"/>
  <!-- Maple leaf centred at (95, 50), drawn as a path -->
  <path d="
    M95,18
    L98,28 L108,24 L104,33 L114,33 L107,40
    L110,50 L100,46 L100,66 L95,64 L90,66
    L90,46 L80,50 L83,40 L76,33 L86,33
    L82,24 L92,28 Z
  " fill="#FF0000"/>
</svg>`;

// Green highway sign
export const SVG_HIGHWAY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80">
  <rect x="2" y="2" width="196" height="76" rx="8" fill="#006747" stroke="#FFFFFF" stroke-width="4"/>
  <rect x="8" y="8" width="184" height="64" rx="5" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
  <text x="100" y="34" font-family="helvetica,Arial,sans-serif" font-size="22" font-weight="bold"
    fill="#FFFFFF" text-anchor="middle">LICENSE PLATE</text>
  <text x="100" y="60" font-family="helvetica,Arial,sans-serif" font-size="22" font-weight="bold"
    fill="#FFFFFF" text-anchor="middle">GAME</text>
</svg>`;

// Render an SVG string to a data URL via canvas
export async function svgStringToDataUrl(svg: string, w: number, h: number): Promise<string> {
  const { Canvg } = await import("canvg");
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const v = await Canvg.from(ctx, svg, { ignoreMouse: true, ignoreAnimation: true });
  await v.render();
  return canvas.toDataURL("image/png");
}
