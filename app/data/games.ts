import { supabase } from "~/lib/supabase";
import { ALL_PLATES } from "~/data/plates";

export interface Game {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  found: string[]; // plate codes
  foundBy: Record<string, string | null>; // plate code -> finder's email (or null if unknown/owner-only)
}

// ── Reads ─────────────────────────────────────────────────────────────────────

export async function loadGames(): Promise<Game[]> {
  const { data: gamesData, error: gamesError } = await supabase
    .from("games")
    .select("id, name, date, created_at")
    .order("date", { ascending: false });

  if (gamesError || !gamesData) {
    console.error("loadGames error:", gamesError);
    return [];
  }

  if (gamesData.length === 0) return [];

  const gameIds = gamesData.map((g) => g.id);
  const { data: platesData, error: platesError } = await supabase
    .from("game_plates")
    .select("game_id, code, found_by, profiles(email)")
    .in("game_id", gameIds)
    .eq("found", true);

  if (platesError) {
    console.error("loadGames (plates) error:", platesError);
  }

  const foundByGame = new Map<string, string[]>();
  const foundByMap = new Map<string, Record<string, string | null>>();
  for (const row of (platesData as any[]) ?? []) {
    const list = foundByGame.get(row.game_id) ?? [];
    list.push(row.code);
    foundByGame.set(row.game_id, list);

    const map = foundByMap.get(row.game_id) ?? {};
    map[row.code] = row.profiles?.email ?? null;
    foundByMap.set(row.game_id, map);
  }

  return gamesData.map((g) => ({
    id: g.id,
    name: g.name,
    date: g.date,
    createdAt: g.created_at,
    found: foundByGame.get(g.id) ?? [],
    foundBy: foundByMap.get(g.id) ?? {},
  }));
}

export async function loadGame(id: string): Promise<Game | null> {
  const { data: gameData, error: gameError } = await supabase
    .from("games")
    .select("id, name, date, created_at")
    .eq("id", id)
    .single();

  if (gameError || !gameData) {
    console.error("loadGame error:", gameError);
    return null;
  }

  const { data: platesData, error: platesError } = await supabase
    .from("game_plates")
    .select("code, found_by, profiles(email)")
    .eq("game_id", id)
    .eq("found", true);

  if (platesError) {
    console.error("loadGame (plates) error:", platesError);
  }

  const foundBy: Record<string, string | null> = {};
  for (const row of (platesData as any[]) ?? []) {
    foundBy[row.code] = row.profiles?.email ?? null;
  }

  return {
    id: gameData.id,
    name: gameData.name,
    date: gameData.date,
    createdAt: gameData.created_at,
    found: (platesData ?? []).map((r: any) => r.code),
    foundBy,
  };
}

// ── Writes ────────────────────────────────────────────────────────────────────

export async function createGame(name: string, date: string): Promise<Game | null> {
  const { data: userData } = await supabase.auth.getUser();
  const ownerId = userData.user?.id;
  if (!ownerId) {
    console.error("createGame: no authenticated user");
    return null;
  }

  const { data: gameData, error: gameError } = await supabase
    .from("games")
    .insert({ name, date, owner_id: ownerId })
    .select("id, name, date, created_at")
    .single();

  if (gameError || !gameData) {
    console.error("createGame error:", gameError);
    return null;
  }

  // Seed a row per plate so toggling is just an update, not insert-or-update
  const rows = ALL_PLATES.map((p) => ({ game_id: gameData.id, code: p.code, found: false }));
  const { error: seedError } = await supabase.from("game_plates").insert(rows);
  if (seedError) {
    console.error("createGame (seed plates) error:", seedError);
  }

  return {
    id: gameData.id,
    name: gameData.name,
    date: gameData.date,
    createdAt: gameData.created_at,
    found: [],
    foundBy: {},
  };
}

export async function setPlateFound(gameId: string, code: string, found: boolean): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  const { error } = await supabase
    .from("game_plates")
    .update({
      found,
      found_at: found ? new Date().toISOString() : null,
      found_by: found ? userId : null,
    })
    .eq("game_id", gameId)
    .eq("code", code);

  if (error) {
    console.error("setPlateFound error:", error);
    return false;
  }
  return true;
}

export async function deleteGame(id: string): Promise<boolean> {
  const { error } = await supabase.from("games").delete().eq("id", id);
  if (error) {
    console.error("deleteGame error:", error);
    return false;
  }
  return true;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
