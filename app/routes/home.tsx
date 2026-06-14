import { Link } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/home";
import { loadGames, formatDate, type Game } from "~/data/games";
import { US_PLATES, CA_PLATES, usFound, caFound, pct } from "~/data/plates";
import { TopBar } from "~/components/ui/top-bar";
import { ProgressBar } from "~/components/ui/progress";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "License Plate Game" },
    { name: "description", content: "Track license plates on your road trip!" },
  ];
}

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  useEffect(() => {
    setGames(loadGames().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  const totalMax = US_PLATES.length + CA_PLATES.length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
      <TopBar action={
        <Link to="/games/new" className="font-black text-sm px-3 py-1.5 rounded-lg"
          style={{ background: "var(--amber)", color: "var(--navy)" }}>
          + New
        </Link>
      } />

      <div className="max-w-lg mx-auto px-4 pb-20 pt-4">
        <div className="rounded-2xl p-6 mb-5 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, var(--bg-hero-from) 0%, var(--bg-hero-to) 100%)` }}>
          <div className="absolute top-[-20px] right-[-20px] text-[100px] opacity-[0.06] select-none pointer-events-none">🚗</div>
          <div className="text-4xl mb-2">🛣️</div>
          <h1 className="text-2xl font-black leading-tight tracking-tight" style={{ color: "#fff" }}>
            License Plate<br /><span style={{ color: "var(--amber)" }}>Game</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.6)" }}>
            Spot plates from all 50 states + Canada on your road trip
          </p>
          <Link to="/games/new"
            className="mt-4 flex items-center justify-center w-full font-black text-base rounded-xl py-3"
            style={{ background: "var(--amber)", color: "var(--navy)" }}>
            + Start New Game
          </Link>
        </div>

        {games.length === 0 ? (
          <div className="rounded-2xl shadow-sm p-10 text-center" style={{ background: "var(--bg-card)" }}>
            <div className="text-4xl mb-3">🗺️</div>
            <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>No games yet</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Start your first road trip game above</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest pl-1" style={{ color: "var(--text-muted)" }}>Your Games</p>
            {games.map((game) => {
              const uf = usFound(game.found);
              const cf = caFound(game.found);
              const upct = pct(uf, US_PLATES.length);
              const cpct = pct(cf, CA_PLATES.length);
              return (
                <Link key={game.id} to={`/games/${game.id}`}
                  className="block rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow"
                  style={{ background: "var(--bg-card)" }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-black text-base" style={{ color: "var(--text-primary)" }}>{game.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{formatDate(game.date)}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={game.found.length === totalMax
                        ? { background: "var(--found-bg)", color: "var(--found)" }
                        : { background: "var(--bg-muted)", color: "var(--text-muted)" }}>
                      {game.found.length}/{totalMax}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <ProgressBar value={upct} colorVar="--sky" hex="#4A90D9" label="🇺🇸 US States" sub={`${uf}/${US_PLATES.length} · ${upct}%`} />
                    <ProgressBar value={cpct} colorVar="--amber" hex="#F5A623" label="🍁 Canada" sub={`${cf}/${CA_PLATES.length} · ${cpct}%`} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
