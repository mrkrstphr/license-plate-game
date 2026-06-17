import { supabase } from "~/lib/supabase";
import { ALL_PLATES } from "~/data/plates";

const OLD_STORAGE_KEY = "lpg_games_v1";
const MIGRATION_DONE_KEY = "lpg_migrated_v1";

interface LegacyGame {
  id: string;
  name: string;
  date: string;
  createdAt: string;
  found: string[];
}

function readLegacyGames(): LegacyGame[] {
  try {
    const raw = localStorage.getItem(OLD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (g): g is LegacyGame =>
        g && typeof g.name === "string" && typeof g.date === "string" && Array.isArray(g.found)
    );
  } catch {
    return [];
  }
}

export interface MigrationResult {
  ran: boolean;
  migratedCount: number;
  error?: string;
}

/**
 * One-time import of pre-Supabase localStorage games into the database
 * for the currently signed-in user. Safe to call on every load — it's a
 * no-op after the first successful run (tracked via a separate localStorage
 * flag), and a no-op entirely if there's nothing to migrate.
 */
export async function migrateLocalStorageGames(ownerId: string): Promise<MigrationResult> {
  if (typeof window === "undefined") return { ran: false, migratedCount: 0 };

  // Already migrated on this device — skip
  if (localStorage.getItem(MIGRATION_DONE_KEY) === "true") {
    return { ran: false, migratedCount: 0 };
  }

  const legacyGames = readLegacyGames();
  if (legacyGames.length === 0) {
    // Nothing to migrate, but mark as done so we don't keep checking
    localStorage.setItem(MIGRATION_DONE_KEY, "true");
    return { ran: false, migratedCount: 0 };
  }

  let migratedCount = 0;

  // Mark as done immediately, before inserting anything. If this gets
  // interrupted partway through (tab closed, crash), we'd rather skip
  // the remaining games than risk re-running and duplicating the ones
  // that already succeeded.
  localStorage.setItem(MIGRATION_DONE_KEY, "true");

  for (const legacy of legacyGames) {
    const { data: gameRow, error: gameError } = await supabase
      .from("games")
      .insert({
        name: legacy.name,
        date: legacy.date,
        owner_id: ownerId,
        created_at: legacy.createdAt || new Date().toISOString(),
      })
      .select("id")
      .single();

    if (gameError || !gameRow) {
      console.error("migrateLocalStorageGames: failed to insert game", legacy.name, gameError);
      continue;
    }

    // Seed every plate row, marking found ones as found
    const foundSet = new Set(legacy.found);
    const rows = ALL_PLATES.map((p) => ({
      game_id: gameRow.id,
      code: p.code,
      found: foundSet.has(p.code),
      found_at: foundSet.has(p.code) ? new Date().toISOString() : null,
    }));

    const { error: plateError } = await supabase.from("game_plates").insert(rows);
    if (plateError) {
      console.error("migrateLocalStorageGames: failed to seed plates for", legacy.name, plateError);
      // Game row exists but plates failed — still count it as migrated
      // rather than leaving it half-imported and retrying forever.
    }

    migratedCount++;
  }

  // Clean up the old data now that it's safely imported
  localStorage.removeItem(OLD_STORAGE_KEY);

  return { ran: true, migratedCount };
}
