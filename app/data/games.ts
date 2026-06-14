export interface Game {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  found: string[]; // plate codes
}

const STORAGE_KEY = "lpg_games_v1";

export function loadGames(): Game[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGames(games: Game[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function createGame(name: string, date: string): Game {
  return {
    id: crypto.randomUUID(),
    name,
    date,
    createdAt: new Date().toISOString(),
    found: [],
  };
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
