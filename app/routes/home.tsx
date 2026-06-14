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
    <div className="min-h-screen bg-gray-100">
      <TopBar
        action={
          <Link
            to="/games/new"
            className="bg-[#F5A623] text-[#1B2340] font-black text-sm px-3 py-1.5 rounded-lg"
          >
            + New
          </Link>
        }
      />

      <div className="max-w-lg mx-auto px-4 pb-20 pt-4">
        {/* Hero */}
        <div className="bg-gradient-to-br from-[#1B2340] to-[#252f52] rounded-2xl p-6 mb-5 relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] text-[100px] opacity-[0.06] select-none pointer-events-none">
            🚗
          </div>
          <div className="text-4xl mb-2">🛣️</div>
          <h1 className="text-white text-2xl font-black leading-tight tracking-tight">
            License Plate
            <br />
            <span className="text-[#F5A623]">Game</span>
          </h1>
          <p className="text-white/60 text-sm mt-2">
            Spot plates from all 50 states + Canada on your road trip
          </p>
          <Link
            to="/games/new"
            className="mt-4 flex items-center justify-center w-full bg-[#F5A623] text-[#1B2340] font-black text-base rounded-xl py-3"
          >
            + Start New Game
          </Link>
        </div>

        {/* Games list */}
        {games.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center text-gray-400">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="font-bold text-gray-700 text-base mb-1">No games yet</p>
            <p className="text-sm">Start your first road trip game above</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
              Your Games
            </p>
            {games.map((game) => {
              const uf = usFound(game.found);
              const cf = caFound(game.found);
              const upct = pct(uf, US_PLATES.length);
              const cpct = pct(cf, CA_PLATES.length);
              return (
                <Link
                  key={game.id}
                  to={`/games/${game.id}`}
                  className="block bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-black text-base text-gray-900">{game.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(game.date)}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        game.found.length === totalMax
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {game.found.length}/{totalMax}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <ProgressBar
                      value={upct}
                      color="bg-sky-500"
                      label="🇺🇸 US States"
                      sub={`${uf}/${US_PLATES.length} · ${upct}%`}
                    />
                    <ProgressBar
                      value={cpct}
                      color="bg-amber-400"
                      label="🍁 Canada"
                      sub={`${cf}/${CA_PLATES.length} · ${cpct}%`}
                    />
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
