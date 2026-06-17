import { supabase } from "~/lib/supabase";
import type { Game } from "~/data/games";

export type ShareMode = "view" | "collaborate";

export interface Share {
  id: string;
  gameId: string;
  token: string;
  mode: ShareMode;
  createdAt: string;
}

// ── Owner-side: manage shares for a game ────────────────────────────────────

export async function loadSharesForGame(gameId: string): Promise<Share[]> {
  const { data, error } = await supabase
    .from("game_shares")
    .select("id, game_id, token, mode, created_at")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("loadSharesForGame error:", error);
    return [];
  }

  return data.map((s) => ({
    id: s.id,
    gameId: s.game_id,
    token: s.token,
    mode: s.mode as ShareMode,
    createdAt: s.created_at,
  }));
}

export async function createShare(gameId: string, mode: ShareMode): Promise<Share | null> {
  const { data, error } = await supabase
    .from("game_shares")
    .insert({ game_id: gameId, mode })
    .select("id, game_id, token, mode, created_at")
    .single();

  if (error || !data) {
    console.error("createShare error:", error);
    return null;
  }

  return {
    id: data.id,
    gameId: data.game_id,
    token: data.token,
    mode: data.mode as ShareMode,
    createdAt: data.created_at,
  };
}

export async function revokeShare(shareId: string): Promise<boolean> {
  const { error } = await supabase.from("game_shares").delete().eq("id", shareId);
  if (error) {
    console.error("revokeShare error:", error);
    return false;
  }
  return true;
}

// ── Public-side: resolve a share link by token ──────────────────────────────

export interface SharedGameResult {
  game: Game;
  mode: ShareMode;
}

/**
 * Resolves a share token to its game + plate data. Relies entirely on the
 * "Public can view shared games" / "...plates of shared games" RLS policies
 * — this works for signed-out visitors for both view and collaborate modes,
 * since reading is always public; only editing requires auth (enforced
 * separately by setSharedPlateFound).
 */
export async function loadSharedGame(token: string): Promise<SharedGameResult | null> {
  const { data: shareData, error: shareError } = await supabase
    .from("game_shares")
    .select("game_id, mode")
    .eq("token", token)
    .single();

  if (shareError || !shareData) {
    console.error("loadSharedGame (share lookup) error:", shareError);
    return null;
  }

  const { data: gameData, error: gameError } = await supabase
    .from("games")
    .select("id, name, date, created_at")
    .eq("id", shareData.game_id)
    .single();

  if (gameError || !gameData) {
    console.error("loadSharedGame (game) error:", gameError);
    return null;
  }

  const { data: platesData, error: platesError } = await supabase
    .from("game_plates")
    .select("code")
    .eq("game_id", shareData.game_id)
    .eq("found", true);

  if (platesError) {
    console.error("loadSharedGame (plates) error:", platesError);
  }

  return {
    game: {
      id: gameData.id,
      name: gameData.name,
      date: gameData.date,
      createdAt: gameData.created_at,
      found: (platesData ?? []).map((r) => r.code),
    },
    mode: shareData.mode as ShareMode,
  };
}

/**
 * Toggles a plate on a collaborate-shared game. Requires the caller to be
 * authenticated — enforced by the "Authenticated users can edit plates on
 * collaborate-shared games" RLS policy, which checks auth.uid() is not null.
 * Since this app never creates anonymous sessions, that policy now means
 * "any signed-in (magic link) user," exactly as intended.
 */
export async function setSharedPlateFound(gameId: string, code: string, found: boolean): Promise<boolean> {
  const { error } = await supabase
    .from("game_plates")
    .update({ found, found_at: found ? new Date().toISOString() : null })
    .eq("game_id", gameId)
    .eq("code", code);

  if (error) {
    console.error("setSharedPlateFound error:", error);
    return false;
  }
  return true;
}
