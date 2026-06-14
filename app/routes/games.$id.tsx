import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import type { Route } from "./+types/games.$id";
import { loadGames, saveGames, formatDate, type Game } from "~/data/games";
import {
  US_PLATES,
  CA_PLATES,
  ALL_PLATES,
  usFound,
  caFound,
  pct,
} from "~/data/plates";
import { TopBar } from "~/components/ui/top-bar";
import { ProgressBar } from "~/components/ui/progress";
import { PlateTile } from "~/components/ui/plate-tile";
import { USMap } from "~/components/ui/us-map";
import { CAMap } from "~/components/ui/ca-map";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: "Playing · Plate Game" }];
}

type RegionTab = "us" | "ca";
type ViewMode = "grid" | "map";

export default function PlayGame() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [tab, setTab] = useState<RegionTab>("us");
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    const games = loadGames();
    const found = games.find((g) => g.id === id);
    if (!found) { navigate("/"); return; }
    setGame(found);
  }, [id]);

  function updateFound(code: string) {
    if (!game) return;
    const next = game.found.includes(code)
      ? game.found.filter((c) => c !== code)
      : [...game.found, code];
    const updated = { ...game, found: next };
    setGame(updated);
    const games = loadGames();
    saveGames(games.map((g) => (g.id === game.id ? updated : g)));
  }

  function handleDelete() {
    const games = loadGames();
    saveGames(games.filter((g) => g.id !== id));
    navigate("/");
  }

  if (!game) return null;

  const uf = usFound(game.found);
  const cf = caFound(game.found);
  const upct = pct(uf, US_PLATES.length);
  const cpct = pct(cf, CA_PLATES.length);

  const plates = tab === "us" ? US_PLATES : CA_PLATES;
  const filtered = search.trim()
    ? plates.filter(
        (p) =>
          p.code.toLowerCase().includes(search.toLowerCase()) ||
          p.name.toLowerCase().includes(search.toLowerCase())
      )
    : plates;

  return (
    <div className="min-h-screen bg-gray-100">
      <TopBar backTo="/" backLabel="Games" />

      {/* Sticky summary */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sticky top-14 z-40">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-2.5">
            <div>
              <p className="font-black text-base leading-tight">{game.name}</p>
              <p className="text-xs text-gray-400">{formatDate(game.date)}</p>
            </div>
            <span className="bg-[#1B2340] text-white text-sm font-black px-3 py-1 rounded-full">
              {game.found.length} found
            </span>
          </div>
          <div className="space-y-1.5">
            <ProgressBar value={upct} color="bg-sky-500" label="🇺🇸 US States" sub={`${uf}/${US_PLATES.length}`} />
            <ProgressBar value={cpct} color="bg-amber-400" label="🍁 Canada" sub={`${cf}/${CA_PLATES.length}`} />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-20">
        {/* Region tabs + view toggle */}
        <div className="flex items-center gap-2 mb-3.5">
          <div className="flex-1 grid grid-cols-2 bg-gray-100 rounded-xl p-1">
            {(["us", "ca"] as RegionTab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setSearch(""); }}
                className={`rounded-xl py-2.5 text-sm font-bold transition-all ${
                  tab === t ? "bg-white shadow text-[#1B2340]" : "text-gray-400"
                }`}
              >
                {t === "us" ? (
                  <>🇺🇸 US States<br /><span className={`font-black text-base ${tab === t ? "text-sky-500" : ""}`}>{uf}/{US_PLATES.length}</span></>
                ) : (
                  <>🍁 Canada<br /><span className={`font-black text-base ${tab === t ? "text-amber-400" : ""}`}>{cf}/{CA_PLATES.length}</span></>
                )}
              </button>
            ))}
          </div>

          {/* Grid / Map toggle */}
          <div className="bg-gray-100 rounded-xl p-1 flex flex-col gap-1">
            <button
              onClick={() => setView("grid")}
              title="Grid view"
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all ${
                view === "grid" ? "bg-white shadow text-[#1B2340]" : "text-gray-400"
              }`}
            >
              ▦
            </button>
            <button
              onClick={() => setView("map")}
              title="Map view"
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all ${
                view === "map" ? "bg-white shadow text-[#1B2340]" : "text-gray-400"
              }`}
            >
              🗺
            </button>
          </div>
        </div>

        {/* Map view */}
        {view === "map" && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            {tab === "us" ? (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  🇺🇸 United States — {uf}/{US_PLATES.length} found
                </p>
                <USMap found={game.found} />
              </>
            ) : (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  🍁 Canada — {cf}/{CA_PLATES.length} found
                </p>
                <CAMap found={game.found} />
              </>
            )}
          </div>
        )}

        {/* Grid view */}
        {view === "grid" && (
          <>
            <input
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[15px] outline-none focus:border-sky-400 mb-3.5"
              placeholder={`Search ${tab === "us" ? "states" : "provinces"}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="grid grid-cols-4 gap-2 mb-5">
              {filtered.map((plate) => (
                <PlateTile
                  key={plate.code}
                  plate={plate}
                  found={game.found.includes(plate.code)}
                  onToggle={updateFound}
                />
              ))}
            </div>
          </>
        )}

        {/* Found chips */}
        {game.found.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2.5">
              Found Plates
            </p>
            <div className="flex flex-wrap gap-1.5">
              {game.found.map((code) => (
                <button
                  key={code}
                  onClick={() => updateFound(code)}
                  title={`Remove ${ALL_PLATES.find((p) => p.code === code)?.name}`}
                  className="bg-green-50 text-green-600 border border-green-300 rounded-lg px-2.5 py-1 text-sm font-bold"
                >
                  {code} ✕
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Delete */}
        {!showDelete ? (
          <button
            onClick={() => setShowDelete(true)}
            className="w-full bg-red-50 text-red-500 font-bold text-sm rounded-xl py-3"
          >
            Delete Game
          </button>
        ) : (
          <div className="bg-red-50 rounded-2xl p-4">
            <p className="font-bold text-red-500 mb-3">
              Delete "{game.name}"? This can't be undone.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setShowDelete(false)}
                className="bg-gray-100 text-gray-700 font-bold rounded-xl py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white font-bold rounded-xl py-2.5"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
