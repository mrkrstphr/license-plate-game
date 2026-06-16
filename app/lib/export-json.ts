import type { Game } from "~/data/games";
import { US_PLATES, CA_PLATES } from "~/data/plates";

type PlateStatus = Record<string, boolean>;

interface ExportedGame {
  name: string;
  date: string;
  us: PlateStatus;
  ca: PlateStatus;
}

interface ExportedData {
  exportedAt: string;
  games: ExportedGame[];
}

function plateStatusMap(plates: { code: string }[], found: string[]): PlateStatus {
  const map: PlateStatus = {};
  for (const { code } of plates) {
    map[code] = found.includes(code);
  }
  return map;
}

export function buildExportData(games: Game[]): ExportedData {
  return {
    exportedAt: new Date().toISOString(),
    games: games.map((game) => ({
      name: game.name,
      date: game.date,
      us: plateStatusMap(US_PLATES, game.found),
      ca: plateStatusMap(CA_PLATES, game.found),
    })),
  };
}

export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
