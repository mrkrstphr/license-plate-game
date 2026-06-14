import { useState } from "react";
import type { Game } from "~/data/games";
import { formatDate } from "~/data/games";
import { US_PLATES, CA_PLATES, pct } from "~/data/plates";

interface ExportPDFProps {
  game: Game;
  onClose: () => void;
}

export function ExportPDF({ game, onClose }: ExportPDFProps) {
  const [includeUS, setIncludeUS] = useState(true);
  const [includeCA, setIncludeCA] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function handleExport() {
    if (!includeUS && !includeCA) return;
    setGenerating(true);

    const { jsPDF } = await import("jspdf");
    const { buildUSMapImage, buildCAMapImage } = await import("~/lib/map-to-image");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const PW = 215.9;
    const PH = 279.4;
    const M = 16;
    const CW = PW - M * 2;

    const NAVY  = [27, 35, 64]    as const;
    const AMBER = [245, 166, 35]  as const;
    const SKY   = [74, 144, 217]  as const;
    const GREEN = [34, 197, 94]   as const;
    const GRAY  = [107, 114, 128] as const;
    const LGRAY = [209, 213, 224] as const;
    const BGALT = [245, 246, 248] as const;
    const WHITE = [255, 255, 255] as const;

    // Pre-render maps while we start laying out
    const [usMapImg, caMapImg] = await Promise.all([
      includeUS ? buildUSMapImage(game.found) : Promise.resolve(null),
      includeCA ? buildCAMapImage(game.found) : Promise.resolve(null),
    ]);

    let y = M;

    // Header bar
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, PW, 22, "F");
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("License Plate Game", M, 14);

    y = 30;

    // Title + date
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(game.name, M, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text(formatDate(game.date), M, y);
    y += 12;

    // Progress bar helper
    function drawProgressBar(
      label: string,
      found: number,
      total: number,
      color: readonly [number, number, number],
      yPos: number
    ): number {
      const barH = 5;
      const pctVal = pct(found, total);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text(label.toUpperCase(), M, yPos);
      doc.setTextColor(...color);
      doc.text(`${found}/${total} - ${pctVal}%`, PW - M, yPos, { align: "right" });
      yPos += 3;
      doc.setFillColor(...LGRAY);
      doc.roundedRect(M, yPos, CW, barH, 2, 2, "F");
      if (found > 0) {
        doc.setFillColor(...color);
        doc.roundedRect(M, yPos, CW * (pctVal / 100), barH, 2, 2, "F");
      }
      return yPos + barH + 6;
    }

    // Progress bars
    if (includeUS) {
      const usFound = game.found.filter(c => US_PLATES.some(p => p.code === c)).length;
      y = drawProgressBar("US States", usFound, US_PLATES.length, SKY, y);
    }
    if (includeCA) {
      const caFound = game.found.filter(c => CA_PLATES.some(p => p.code === c)).length;
      y = drawProgressBar("Canada", caFound, CA_PLATES.length, AMBER, y);
    }

    // Map image helper
    function drawMap(
      imgData: string,
      title: string,
      accentColor: readonly [number, number, number],
      nativeW: number,
      nativeH: number,
      yPos: number
    ): number {
      if (yPos + 20 > PH - M) { doc.addPage(); yPos = M; }

      // Section heading
      doc.setFillColor(...accentColor);
      doc.rect(M, yPos, CW, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...WHITE);
      doc.text(title, M + 3, yPos + 5);
      yPos += 9;

      // Scale image to fit content width
      const imgH = (nativeH / nativeW) * CW;
      if (yPos + imgH > PH - M) { doc.addPage(); yPos = M; }
      doc.addImage(imgData, "PNG", M, yPos, CW, imgH);
      return yPos + imgH + 8;
    }

    y += 2;
    if (includeUS && usMapImg) {
      y = drawMap(usMapImg, "US States", SKY, 1520, 920, y);
    }
    if (includeCA && caMapImg) {
      if (y + 10 > PH - M) { doc.addPage(); y = M; }
      y = drawMap(caMapImg, "Canadian Provinces & Territories", AMBER, 1600, 960, y);
    }

    // 3-column status table
    function drawTable(
      plates: typeof US_PLATES,
      title: string,
      accentColor: readonly [number, number, number],
      yStart: number
    ): number {
      if (yStart + 20 > PH - M) { doc.addPage(); yStart = M; }

      doc.setFillColor(...accentColor);
      doc.rect(M, yStart, CW, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...WHITE);
      doc.text(title, M + 3, yStart + 5);
      yStart += 9;

      const numCols = 3;
      const colW = CW / numCols;
      const codeW = 14;
      const pillW = 20;
      const rowH = 6;

      // Column headers
      for (let col = 0; col < numCols; col++) {
        const xBase = M + col * colW;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY);
        doc.text("CODE", xBase + 2, yStart + 4);
        doc.text("NAME", xBase + codeW + 2, yStart + 4);
        doc.text("STATUS", xBase + colW - pillW - 2, yStart + 4);
      }
      yStart += rowH;

      doc.setDrawColor(...LGRAY);
      doc.setLineWidth(0.3);
      doc.line(M, yStart, M + CW, yStart);
      yStart += 1;

      const rowsPerCol = Math.ceil(plates.length / numCols);

      for (let row = 0; row < rowsPerCol; row++) {
        if (yStart + rowH > PH - M) { doc.addPage(); yStart = M; }

        if (row % 2 === 0) {
          doc.setFillColor(...BGALT);
          doc.rect(M, yStart, CW, rowH, "F");
        }

        for (let col = 0; col < numCols; col++) {
          const idx = col * rowsPerCol + row;
          if (idx >= plates.length) continue;
          const plate = plates[idx];
          const isFound = game.found.includes(plate.code);
          const xBase = M + col * colW;

          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor(...NAVY);
          doc.text(plate.code, xBase + 2, yStart + 4.2);

          doc.setFont("helvetica", "normal");
          doc.setTextColor(...GRAY);
          const name = plate.name.length > 16 ? plate.name.slice(0, 15) + "." : plate.name;
          doc.text(name, xBase + codeW + 2, yStart + 4.2);

          const pillX = xBase + colW - pillW - 1;
          const pillH = 4;
          const pillY = yStart + (rowH - pillH) / 2;
          doc.setFillColor(...(isFound ? GREEN : LGRAY));
          doc.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6.5);
          doc.setTextColor(...(isFound ? WHITE : GRAY));
          doc.text(isFound ? "Found" : "Not found", pillX + pillW / 2, pillY + pillH / 2 + 0.5, {
            align: "center", baseline: "middle",
          });

          if (col < numCols - 1) {
            doc.setDrawColor(...LGRAY);
            doc.setLineWidth(0.2);
            doc.line(xBase + colW, yStart, xBase + colW, yStart + rowH);
          }
        }
        yStart += rowH;
      }
      return yStart + 8;
    }

    if (includeUS) {
      if (y + 20 > PH - M) { doc.addPage(); y = M; }
      else y += 4;
      y = drawTable(US_PLATES, "US States", SKY, y);
    }
    if (includeCA) {
      if (y + 20 > PH - M) { doc.addPage(); y = M; }
      else y += 4;
      y = drawTable(CA_PLATES, "Canadian Provinces & Territories", AMBER, y);
    }

    // Footer on every page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(...NAVY);
      doc.rect(0, PH - 10, PW, 10, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...WHITE);
      doc.text(`${game.name} - ${formatDate(game.date)}`, M, PH - 4);
      doc.text(`Page ${i} of ${pageCount}`, PW - M, PH - 4, { align: "right" });
    }

    const filename = `${game.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-plates.pdf`;
    doc.save(filename);
    setGenerating(false);
    onClose();
  }

  const canExport = includeUS || includeCA;
  const usFound = game.found.filter(c => US_PLATES.some(p => p.code === c)).length;
  const caFound = game.found.filter(c => CA_PLATES.some(p => p.code === c)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl shadow-xl p-5 space-y-5"
        style={{ background: "var(--bg-card)" }}>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg" style={{ color: "var(--text-primary)" }}>Export to PDF</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{game.name} · {formatDate(game.date)}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Include Plates</p>
          <div className="space-y-2">
            {[
              { label: "US States", value: includeUS, set: setIncludeUS, sub: `${usFound}/${US_PLATES.length} found` },
              { label: "Canadian Provinces", value: includeCA, set: setIncludeCA, sub: `${caFound}/${CA_PLATES.length} found` },
            ].map(({ label, value, set, sub }) => (
              <button key={label} onClick={() => set(!value)}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border-2"
                style={{
                  background: value ? "var(--found-bg)" : "var(--bg-muted)",
                  borderColor: value ? "var(--found-border)" : "transparent",
                }}>
                <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                  style={{
                    borderColor: value ? "var(--found)" : "var(--border)",
                    background: value ? "var(--found)" : "transparent",
                  }}>
                  {value && <span className="text-white text-xs font-black">✓</span>}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{label}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs rounded-xl px-3 py-2" style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}>
          Includes map view, progress bars, and full status table
        </p>

        <div className="flex gap-2.5">
          <button onClick={onClose}
            className="flex-1 rounded-xl py-3 font-bold text-sm"
            style={{ background: "var(--bg-muted)", color: "var(--text-primary)" }}>
            Cancel
          </button>
          <button onClick={handleExport} disabled={!canExport || generating}
            className="flex-1 rounded-xl py-3 font-black text-sm"
            style={{
              background: canExport ? "var(--amber)" : "var(--bg-muted)",
              color: canExport ? "var(--navy)" : "var(--text-muted)",
              opacity: generating ? 0.7 : 1,
            }}>
            {generating ? "Generating..." : "Export PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
