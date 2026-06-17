import { Link, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/home";
import { loadGames, formatDate, type Game } from "~/data/games";
import { US_PLATES, CA_PLATES, usFound, caFound, pct } from "~/data/plates";
import { TopBar } from "~/components/ui/top-bar";
import { ProgressBar } from "~/components/ui/progress";
import { USFlag } from "~/components/ui/us-flag";
import { CAFlag } from "~/components/ui/ca-flag";
import { buildExportData, downloadJSON } from "~/lib/export-json";
import { useAuth } from "~/lib/auth-context";
import { migrateLocalStorageGames } from "~/lib/local-storage-migration";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "License Plate Game" },
    { name: "description", content: "Track license plates on your road trip!" },
  ];
}

const FLAG_STYLE = { width: 14, height: 10, borderRadius: 1 } as const;

export default function Home() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [migrationBanner, setMigrationBanner] = useState<string | null>(null);

  // Redirect to login if there's no session (and we're not still resolving auth)
  useEffect(() => {
    if (!authLoading && !session) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, session, navigate]);

  // On each visit with a session: migrate any legacy localStorage games
  // (one-time, no-op after first run on this device), then load games.
  useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;
    setLoadingGames(true);

    migrateLocalStorageGames(session.user.id)
      .then((result) => {
        if (!active) return;
        if (result.ran && result.migratedCount > 0) {
          setMigrationBanner(
            `Imported ${result.migratedCount} game${result.migratedCount === 1 ? "" : "s"} from this device's old local storage.`
          );
        }
        return loadGames();
      })
      .then((data) => {
        if (!active || !data) return;
        const sorted = [...data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setGames(sorted);
        setLoadingGames(false);
      });

    return () => { active = false; };
  }, [session, location]);

  const totalMax = US_PLATES.length + CA_PLATES.length;

  function handleExportAll() {
    const data = buildExportData(games);
    const date = new Date().toISOString().slice(0, 10);
    downloadJSON(data, `license-plate-game-export-${date}.json`);
  }

  if (authLoading || !session) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-app)" }}>
        <TopBar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
      <TopBar action={
        <div className="flex items-center gap-2">
          <Link
            to="/games/new"
            className="font-black text-sm px-3 py-1.5 rounded-lg"
            style={{ background: "var(--amber)", color: "var(--navy)" }}
          >
            + New
          </Link>
        </div>
      } />

      <div className="max-w-lg mx-auto px-4 pb-20 pt-4">
        {/* Hero */}
        <div
          className="rounded-2xl p-6 mb-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, var(--bg-hero-from) 0%, var(--bg-hero-to) 100%)" }}
        >
          <div className="absolute top-[-20px] right-[-20px] text-[100px] opacity-[0.06] select-none pointer-events-none">🚗</div>
          <div className="flex items-center gap-3 mb-1">
            <div className="text-4xl flex-shrink-0">🛣️</div>
            <h1 className="text-2xl font-black leading-tight tracking-tight" style={{ color: "#fff" }}>
              License Plate<br />
              <span style={{ color: "var(--amber)" }}>Game</span>
            </h1>
          </div>
          <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
            Spot plates from all 50 states + Canada on your road trip
          </p>
          <Link
            to="/games/new"
            className="mt-4 flex items-center justify-center w-full font-black text-base rounded-xl py-3"
            style={{ background: "var(--amber)", color: "var(--navy)" }}
          >
            + Start New Game
          </Link>
        </div>

        {/* Migration banner */}
        {migrationBanner && (
          <div
            className="flex items-start justify-between gap-3 rounded-2xl p-4 mb-4"
            style={{ background: "var(--found-bg)", border: "1.5px solid var(--found-border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--found)" }}>
              ✓ {migrationBanner}
            </p>
            <button
              onClick={() => setMigrationBanner(null)}
              className="text-lg leading-none flex-shrink-0"
              style={{ color: "var(--found)" }}
            >
              ×
            </button>
          </div>
        )}

        {/* Games list */}
        {loadingGames ? (
          <div className="rounded-2xl shadow-sm p-10 text-center" style={{ background: "var(--bg-card)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading your games…</p>
          </div>
        ) : games.length === 0 ? (
          <div className="rounded-2xl shadow-sm p-10 text-center" style={{ background: "var(--bg-card)" }}>
            <div className="text-4xl mb-3">🗺️</div>
            <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>No games yet</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Start your first road trip game above</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest pl-1" style={{ color: "var(--text-muted)" }}>
              Your Games
            </p>
            {games.map((game) => {
              const uf   = usFound(game.found);
              const cf   = caFound(game.found);
              const upct = pct(uf, US_PLATES.length);
              const cpct = pct(cf, CA_PLATES.length);
              return (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="block rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow"
                  style={{ background: "var(--bg-card)" }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-black text-base" style={{ color: "var(--text-primary)" }}>{game.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{formatDate(game.date)}</p>
                    </div>
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={game.found.length === totalMax
                        ? { background: "var(--found-bg)", color: "var(--found)" }
                        : { background: "var(--bg-muted)", color: "var(--text-muted)" }}
                    >
                      {game.found.length}/{totalMax}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <ProgressBar
                      value={upct} hex="#4A90D9"
                      label={<><USFlag style={FLAG_STYLE} /> US States</>}
                      sub={`${uf}/${US_PLATES.length} · ${upct}%`}
                    />
                    <ProgressBar
                      value={cpct} hex="#F5A623"
                      label={<><CAFlag style={FLAG_STYLE} /> Canada</>}
                      sub={`${cf}/${CA_PLATES.length} · ${cpct}%`}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {games.length > 0 && (
          <button
            onClick={handleExportAll}
            className="w-full font-bold text-sm rounded-xl py-3 mt-4"
            style={{ background: "var(--bg-card)", color: "var(--sky)", border: "1.5px solid var(--border)" }}
          >
            ↓ Export All Data (JSON)
          </button>
        )}
      </div>
    </div>
  );
}
