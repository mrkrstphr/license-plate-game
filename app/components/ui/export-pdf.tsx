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
  const [includeMap, setIncludeMap] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function handleExport() {
    if (!includeUS && !includeCA) return;
    setGenerating(true);

    // Dynamically import jsPDF to keep initial bundle lean
    const { jsPDF } = await import("jspdf");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
    const PW = 215.9; // letter width mm
    const PH = 279.4; // letter height mm
    const M = 16;     // margin
    const CW = PW - M * 2; // content width

    // ── Colors ────────────────────────────────────────────────────────────
    const NAVY   = [27, 35, 64] as const;
    const AMBER  = [245, 166, 35] as const;
    const SKY    = [74, 144, 217] as const;
    const GREEN  = [34, 197, 94] as const;
    const GRAY   = [107, 114, 128] as const;
    const LGRAY  = [209, 213, 224] as const;
    const BGCARD = [245, 246, 248] as const;
    const WHITE  = [255, 255, 255] as const;

    let y = M;

    // ── Header bar ────────────────────────────────────────────────────────
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, PW, 22, "F");
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("🚗 License Plate Game", M, 14);

    y = 30;

    // ── Title + date ──────────────────────────────────────────────────────
    doc.setTextColor(...NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(game.name, M, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text(formatDate(game.date), M, y);
    y += 10;

    // ── Progress bars ─────────────────────────────────────────────────────
    function drawProgressBar(
      label: string,
      found: number,
      total: number,
      color: readonly [number, number, number],
      yPos: number
    ): number {
      const barW = CW;
      const barH = 5;
      const pctVal = pct(found, total);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text(label.toUpperCase(), M, yPos);
      doc.setTextColor(...color);
      doc.text(`${found}/${total} · ${pctVal}%`, PW - M, yPos, { align: "right" });
      yPos += 3;

      // Track
      doc.setFillColor(...LGRAY);
      doc.roundedRect(M, yPos, barW, barH, 2, 2, "F");
      // Fill
      if (found > 0) {
        doc.setFillColor(...color);
        doc.roundedRect(M, yPos, barW * (pctVal / 100), barH, 2, 2, "F");
      }
      return yPos + barH + 5;
    }

    if (includeUS) {
      const usFound = game.found.filter(c => US_PLATES.some(p => p.code === c)).length;
      y = drawProgressBar("🇺🇸 US States", usFound, US_PLATES.length, SKY, y);
    }
    if (includeCA) {
      const caFound = game.found.filter(c => CA_PLATES.some(p => p.code === c)).length;
      y = drawProgressBar("🍁 Canada", caFound, CA_PLATES.length, AMBER, y);
    }

    // ── Map SVG (rendered via canvas) ─────────────────────────────────────
    if (includeMap && (includeUS || includeCA)) {
      // Draw a simple visual plate grid as map substitute
      // Each plate is a small rounded rect colored green (found) or light gray
      const drawPlateGrid = (
        plates: typeof US_PLATES,
        title: string,
        color: readonly [number, number, number],
        yStart: number
      ): number => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...NAVY);
        doc.text(title, M, yStart);
        yStart += 5;

        const cols = 9;
        const cellW = CW / cols;
        const cellH = 10;
        const pad = 1;

        plates.forEach((plate, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const cx = M + col * cellW + pad;
          const cy = yStart + row * (cellH + pad);
          const cw = cellW - pad * 2;
          const ch = cellH;
          const isFound = game.found.includes(plate.code);

          // Cell background
          doc.setFillColor(...(isFound ? color : LGRAY));
          doc.roundedRect(cx, cy, cw, ch, 1.5, 1.5, "F");

          // Code text
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6);
          doc.setTextColor(...(isFound ? WHITE : GRAY));
          doc.text(plate.code, cx + cw / 2, cy + ch / 2 + 0.5, { align: "center", baseline: "middle" });
        });

        const rows = Math.ceil(plates.length / cols);
        return yStart + rows * (cellH + pad) + 8;
      };

      y += 2;
      if (includeUS) {
        // Check if we need a new page
        const usRows = Math.ceil(US_PLATES.length / 9);
        if (y + usRows * 11 + 20 > PH - M) { doc.addPage(); y = M; }
        y = drawPlateGrid(US_PLATES, "US States at a Glance", GREEN, y);
      }
      if (includeCA) {
        const caRows = Math.ceil(CA_PLATES.length / 9);
        if (y + caRows * 11 + 20 > PH - M) { doc.addPage(); y = M; }
        y = drawPlateGrid(CA_PLATES, "Canada at a Glance", [245, 159, 0], y);
      }
    }

    // ── Status table ──────────────────────────────────────────────────────
    const drawTable = (
      plates: typeof US_PLATES,
      title: string,
      accentColor: readonly [number, number, number],
      yStart: number
    ): number => {
      // Check space; new page if needed
      if (yStart + 30 > PH - M) { doc.addPage(); yStart = M; }

      // Section heading
      doc.setFillColor(...accentColor);
      doc.rect(M, yStart, CW, 7, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...WHITE);
      doc.text(title, M + 3, yStart + 5);
      yStart += 9;

      // Column headers
      const cols = [
        { label: "Code",   w: 18 },
        { label: "Name",   w: 72 },
        { label: "Status", w: 32 },
      ];
      const rowH = 6.5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      let xc = M;
      cols.forEach(col => {
        doc.text(col.label, xc + 2, yStart + 4);
        xc += col.w;
      });
      yStart += rowH;

      // Rows
      plates.forEach((plate, i) => {
        if (yStart + rowH > PH - M) {
          doc.addPage();
          yStart = M;
        }
        const isFound = game.found.includes(plate.code);
        // Alternating row bg
        if (i % 2 === 0) {
          doc.setFillColor(...BGCARD);
          doc.rect(M, yStart, CW, rowH, "F");
        }

        xc = M;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...NAVY);
        doc.text(plate.code, xc + 2, yStart + 4.5);
        xc += cols[0].w;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...GRAY);
        doc.text(plate.name, xc + 2, yStart + 4.5);
        xc += cols[1].w;

        // Status pill
        const pillW = 22;
        const pillH = 4;
        const pillY = yStart + (rowH - pillH) / 2;
        doc.setFillColor(...(isFound ? GREEN : LGRAY));
        doc.roundedRect(xc + 2, pillY, pillW, pillH, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...(isFound ? WHITE : GRAY));
        doc.text(isFound ? "✓ Found" : "Not found", xc + 2 + pillW / 2, pillY + pillH / 2 + 0.5, {
          align: "center", baseline: "middle",
        });

        yStart += rowH;
      });

      return yStart + 8;
    };

    // US table
    if (includeUS) {
      if (y + 20 > PH - M) { doc.addPage(); y = M; }
      else y += 4;
      y = drawTable(US_PLATES, "US States", SKY, y);
    }
    // Canada table
    if (includeCA) {
      if (y + 20 > PH - M) { doc.addPage(); y = M; }
      else y += 4;
      y = drawTable(CA_PLATES, "Canadian Provinces & Territories", AMBER, y);
    }

    // ── Footer on every page ──────────────────────────────────────────────
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(...NAVY);
      doc.rect(0, PH - 10, PW, 10, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...WHITE);
      doc.text(`${game.name} · ${formatDate(game.date)}`, M, PH - 4);
      doc.text(`Page ${i} of ${pageCount}`, PW - M, PH - 4, { align: "right" });
    }

    // ── Save ──────────────────────────────────────────────────────────────
    const filename = `${game.name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-plates.pdf`;
    doc.save(filename);
    setGenerating(false);
    onClose();
  }

  const canExport = includeUS || includeCA;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-2xl shadow-xl p-5 space-y-5"
        style={{ background: "var(--bg-card)" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg" style={{ color: "var(--text-primary)" }}>Export to PDF</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{game.name} · {formatDate(game.date)}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        {/* Include sections */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Include Plates</p>
          <div className="space-y-2">
            {[
              { label: "🇺🇸 US States", value: includeUS, set: setIncludeUS,
                sub: `${game.found.filter(c => US_PLATES.some(p => p.code === c)).length}/${US_PLATES.length} found` },
              { label: "🍁 Canadian Provinces", value: includeCA, set: setIncludeCA,
                sub: `${game.found.filter(c => CA_PLATES.some(p => p.code === c)).length}/${CA_PLATES.length} found` },
            ].map(({ label, value, set, sub }) => (
              <button key={label} onClick={() => set(!value)}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border-2"
                style={{
                  background: value ? "var(--found-bg)" : "var(--bg-muted)",
                  borderColor: value ? "var(--found-border)" : "transparent",
                }}>
                <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
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

        {/* Include views */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Include Views</p>
          <button onClick={() => setIncludeMap(!includeMap)}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all border-2"
            style={{
              background: includeMap ? "var(--found-bg)" : "var(--bg-muted)",
              borderColor: includeMap ? "var(--found-border)" : "transparent",
            }}>
            <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
              style={{
                borderColor: includeMap ? "var(--found)" : "var(--border)",
                background: includeMap ? "var(--found)" : "transparent",
              }}>
              {includeMap && <span className="text-white text-xs font-black">✓</span>}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>▦ Plate grid view</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Visual overview of all plates</p>
            </div>
          </button>
        </div>

        {/* What's always included note */}
        <p className="text-xs rounded-xl px-3 py-2" style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}>
          Always included: progress bars and full status table
        </p>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button onClick={onClose}
            className="flex-1 rounded-xl py-3 font-bold text-sm"
            style={{ background: "var(--bg-muted)", color: "var(--text-primary)" }}>
            Cancel
          </button>
          <button onClick={handleExport} disabled={!canExport || generating}
            className="flex-1 rounded-xl py-3 font-black text-sm transition-opacity"
            style={{
              background: canExport ? "var(--amber)" : "var(--bg-muted)",
              color: canExport ? "var(--navy)" : "var(--text-muted)",
              opacity: generating ? 0.7 : 1,
            }}>
            {generating ? "Generating…" : "Export PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
