import { supabase } from "~/lib/supabase";
import type { Game } from "~/data/games";

export type ShareMode = "view" | "collaborate";

export interface Share {
  id: string;
  gameId: string;
  token: string;
  mode: ShareMode;
  createdAt: string;
  viewCount: number;
}

export interface ShareCollaborator {
  userId: string;
  email: string | null;
  firstAccessedAt: string;
  lastAccessedAt: string;
}

// ── Owner-side: manage shares for a game ────────────────────────────────────

export async function loadSharesForGame(gameId: string): Promise<Share[]> {
  const { data, error } = await supabase
    .from("game_shares")
    .select("id, game_id, token, mode, created_at, view_count")
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
    viewCount: s.view_count ?? 0,
  }));
}

export async function createShare(gameId: string, mode: ShareMode): Promise<Share | null> {
  const { data, error } = await supabase
    .from("game_shares")
    .insert({ game_id: gameId, mode })
    .select("id, game_id, token, mode, created_at, view_count")
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
    viewCount: data.view_count ?? 0,
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

/**
 * Who has opened this share link (owner-facing). Useful to review before
 * revoking — shows everyone who's accessed it, whether or not they've
 * actually edited any plates.
 */
export async function loadShareCollaborators(shareId: string): Promise<ShareCollaborator[]> {
  const { data, error } = await supabase
    .from("share_access")
    .select("user_id, first_accessed_at, last_accessed_at, profiles(email)")
    .eq("share_id", shareId)
    .order("last_accessed_at", { ascending: false });

  if (error || !data) {
    console.error("loadShareCollaborators error:", error);
    return [];
  }

  return data.map((row: any) => ({
    userId: row.user_id,
    email: row.profiles?.email ?? null,
    firstAccessedAt: row.first_accessed_at,
    lastAccessedAt: row.last_accessed_at,
  }));
}

// ── Public-side: resolve a share link by token ──────────────────────────────

export interface SharedGameResult {
  game: Game;
  mode: ShareMode;
}

/**
 * Resolves a share token to its game + plate data via the get_shared_game()
 * security-definer RPC. This is the only legitimate way to read a shared
 * game's data -- the RPC verifies the token internally (`where token =
 * p_token`), so unlike the table-level RLS policies this replaced, there's
 * no way to reach another game's data without holding its exact token.
 */
export async function loadSharedGame(token: string): Promise<SharedGameResult | null> {
  const { data, error } = await supabase.rpc("get_shared_game", { p_token: token });

  if (error) {
    console.error("loadSharedGame error:", error);
    return null;
  }
  if (!data || data.length === 0) {
    return null;
  }

  const first = data[0];
  const found: string[] = [];
  const foundBy: Record<string, string | null> = {};

  for (const row of data as any[]) {
    if (row.found) {
      found.push(row.plate_code);
      foundBy[row.plate_code] = row.found_by_email ?? null;
    }
  }

  return {
    game: {
      id: first.game_id,
      name: first.name,
      date: first.date,
      createdAt: first.created_at,
      found,
      foundBy,
    },
    mode: first.mode as ShareMode,
  };
}

/**
 * Increments the view counter for a share link via a security-definer RPC,
 * so anonymous (signed-out) visitors to a view-mode link can contribute to
 * the count without any direct write grant on game_shares. Called once per
 * page load — every load counts, no de-duplication by visitor.
 */
export async function recordShareView(token: string): Promise<void> {
  const { error } = await supabase.rpc("increment_share_view_count", { p_token: token });
  if (error) {
    console.error("recordShareView error:", error);
  }
}

/**
 * Records that the current signed-in user has accessed a collaborate share
 * link, via the record_share_access() RPC, which re-verifies the token
 * resolves to a real collaborate share before logging anything -- so a
 * caller can't log themselves against an arbitrary share_id they merely
 * guessed.
 */
export async function recordShareAccess(token: string): Promise<void> {
  const { error } = await supabase.rpc("record_share_access", { p_token: token });
  if (error) {
    console.error("recordShareAccess error:", error);
  }
}

/**
 * Toggles a plate on a collaborate-shared game via the
 * set_shared_plate_found() RPC, which verifies inside the function that:
 * the token resolves to a real share, that share is in collaborate mode,
 * and the caller is authenticated -- all server-side, none of it relying
 * on a client-trusted gameId the way the old direct-table-update version
 * did.
 */
export async function setSharedPlateFound(token: string, code: string, found: boolean): Promise<boolean> {
  const { error } = await supabase.rpc("set_shared_plate_found", {
    p_token: token,
    p_code: code,
    p_found: found,
  });

  if (error) {
    console.error("setSharedPlateFound error:", error);
    return false;
  }
  return true;
}
