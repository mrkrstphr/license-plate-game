import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import type { Route } from "./+types/games.$id";
import { loadGames, saveGames, formatDate, type Game } from "~/data/games";
import { US_PLATES, CA_PLATES, ALL_PLATES, usFound, caFound, pct } from "~/data/plates";
import { TopBar } from "~/components/ui/top-bar";
import { ProgressBar } from "~/components/ui/progress";
import { PlateTile } from "~/components/ui/plate-tile";
import { USMap } from "~/components/ui/us-map";
import { CAMap } from "~/components/ui/ca-map";
import { CAFlag } from "~/components/ui/ca-flag";
import { ExportPDF } from "~/components/ui/export-pdf";

export function meta({}: Route.MetaArgs) {
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
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    const games = loadGames();
    const found = games.find((g) => g.id === id);
    if (!found) { navigate("/"); return; }
    setGame(found);
  }, [id]);

  function updateFound(code: string) {
    if (!game) return;
    const next = game.found.includes(code) ? game.found.filter((c) => c !== code) : [...game.found, code];
    const updated = { ...game, found: next };
    setGame(updated);
    saveGames(loadGames().map((g) => (g.id === game.id ? updated : g)));
  }

  function handleDelete() {
    saveGames(loadGames().filter((g) => g.id !== id));
    navigate("/");
  }

  if (!game) return null;

  const uf = usFound(game.found);
  const cf = caFound(game.found);
  const upct = pct(uf, US_PLATES.length);
  const cpct = pct(cf, CA_PLATES.length);
  const plates = tab === "us" ? US_PLATES : CA_PLATES;
  const filtered = search.trim()
    ? plates.filter((p) => p.code.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase()))
    : plates;

  const tabActive = { background: "var(--bg-card)", color: "var(--text-primary)", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" };
  const tabInactive = { background: "transparent", color: "var(--text-muted)" };
  const viewActive = { background: "var(--bg-card)", color: "var(--text-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" };
  const viewInactive = { background: "transparent", color: "var(--text-muted)" };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
      <TopBar />

      {/* Sticky summary */}
      <div className="px-4 py-3 sticky top-14 z-40 border-b" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-center mb-2.5">
            <div>
              <p className="font-black text-base leading-tight" style={{ color: "var(--text-primary)" }}>{game.name}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(game.date)}</p>
            </div>
            <span className="text-sm font-black px-3 py-1 rounded-full" style={{ background: "var(--navy)", color: "#fff" }}>
              {game.found.length} found
            </span>
          </div>
          <div className="space-y-1.5">
            <ProgressBar value={upct} colorVar="--sky" hex="#4A90D9" label="🇺🇸 US States" sub={`${uf}/${US_PLATES.length}`} />
            <ProgressBar value={cpct} colorVar="--amber" hex="#F5A623" label={<><CAFlag style={{ width: 14, height: 10, borderRadius: 1 }} /> Canada</>} hex="#F5A623" sub={`${cf}/${CA_PLATES.length}`} />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-20">
        {/* Tabs + view toggle */}
        <div className="flex items-center gap-2 mb-3.5">
          <div className="flex-1 grid grid-cols-2 rounded-xl p-1" style={{ background: "var(--bg-muted)" }}>
            {(["us", "ca"] as RegionTab[]).map((t) => (
              <button key={t} onClick={() => { setTab(t); setSearch(""); }}
                className="rounded-xl py-2.5 text-sm font-bold transition-all"
                style={tab === t ? tabActive : tabInactive}>
                {t === "us"
                  ? <>{`🇺🇸 US States`}<br /><span className="font-black text-base" style={{ color: tab === t ? "#4A90D9" : "var(--text-muted)" }}>{uf}/{US_PLATES.length}</span></>
                  : <><CAFlag style={{ width: 16, height: 11, borderRadius: 1, marginBottom: 2 }} /><br /><span className="font-black text-base" style={{ color: tab === t ? "#F5A623" : "var(--text-muted)" }}>{cf}/{CA_PLATES.length}</span></>
                }
              </button>
            ))}
          </div>
          <div className="rounded-xl p-1 flex flex-col gap-1" style={{ background: "var(--bg-muted)" }}>
            <button onClick={() => setView("grid")} title="Grid view"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all"
              style={view === "grid" ? viewActive : viewInactive}>▦</button>
            <button onClick={() => setView("map")} title="Map view"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base transition-all"
              style={view === "map" ? viewActive : viewInactive}>🗺</button>
          </div>
        </div>

        {/* Map view */}
        {view === "map" && (
          <div className="rounded-2xl shadow-sm p-4 mb-4" style={{ background: "var(--bg-card)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              {tab === "us" ? `🇺🇸 United States — ${uf}/${US_PLATES.length} found` : `Canada — ${cf}/${CA_PLATES.length} found`}
            </p>
            {tab === "us" ? <USMap found={game.found} /> : <CAMap found={game.found} />}
          </div>
        )}

        {/* Grid view */}
        {view === "grid" && (
          <>
            <input
              className="w-full rounded-xl px-4 py-3 text-[15px] outline-none mb-3.5 border"
              style={{ background: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              placeholder={`Search ${tab === "us" ? "states" : "provinces"}…`}
              value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="grid grid-cols-4 gap-2 mb-5">
              {filtered.map((plate) => (
                <PlateTile key={plate.code} plate={plate} found={game.found.includes(plate.code)} onToggle={updateFound} />
              ))}
            </div>
          </>
        )}

        {/* Found chips */}
        {game.found.length > 0 && (
          <div className="rounded-2xl shadow-sm p-4 mb-4" style={{ background: "var(--bg-card)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: "var(--text-muted)" }}>Found Plates</p>
            <div className="flex flex-wrap gap-1.5">
              {game.found.map((code) => (
                <button key={code} onClick={() => updateFound(code)}
                  title={`Remove ${ALL_PLATES.find((p) => p.code === code)?.name}`}
                  className="rounded-lg px-2.5 py-1 text-sm font-bold border"
                  style={{ background: "var(--found-bg)", color: "var(--found)", borderColor: "var(--found-border)" }}>
                  {code} ✕
                </button>
              ))}
            </div>
          </div>
        )}


        {/* Export */}
        <button onClick={() => setShowExport(true)}
          className="w-full font-bold text-sm rounded-xl py-3 mb-3"
          style={{ background: "var(--bg-card)", color: "var(--sky)", border: "1.5px solid var(--border)" }}>
          ↓ Export to PDF
        </button>

                {/* Delete */}
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)}
            className="w-full font-bold text-sm rounded-xl py-3"
            style={{ background: "#fef2f2", color: "#ef4444" }}>
            Delete Game
          </button>
        ) : (
          <div className="rounded-2xl p-4" style={{ background: "#fef2f2" }}>
            <p className="font-bold mb-3" style={{ color: "#ef4444" }}>Delete "{game.name}"? This can't be undone.</p>
            <div className="grid grid-cols-2 gap-2.5">
              <button onClick={() => setShowDelete(false)}
                className="font-bold rounded-xl py-2.5"
                style={{ background: "var(--bg-muted)", color: "var(--text-primary)" }}>Cancel</button>
              <button onClick={handleDelete}
                className="font-bold rounded-xl py-2.5 text-white"
                style={{ background: "#ef4444" }}>Delete</button>
            </div>
          </div>
        )}
      </div>

      {showExport && <ExportPDF game={game} onClose={() => setShowExport(false)} />}
    </div>
  );
}
