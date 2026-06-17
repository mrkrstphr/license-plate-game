import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router";
import type { Route } from "./+types/shared.$token";
import { loadSharedGame, setSharedPlateFound, recordShareAccess, type ShareMode } from "~/data/shares";
import { formatDate, type Game } from "~/data/games";
import { US_PLATES, CA_PLATES, ALL_PLATES, usFound, caFound, pct } from "~/data/plates";
import { TopBar } from "~/components/ui/top-bar";
import { ProgressBar } from "~/components/ui/progress";
import { PlateTile } from "~/components/ui/plate-tile";
import { USMap } from "~/components/ui/us-map";
import { CAMap } from "~/components/ui/ca-map";
import { USFlag } from "~/components/ui/us-flag";
import { CAFlag } from "~/components/ui/ca-flag";
import { useAuth } from "~/lib/auth-context";

export function meta() {
  return [{ title: "Shared Game · Plate Game" }];
}

type RegionTab = "us" | "ca";
type ViewMode  = "grid" | "map";

const FLAG_SM = { width: 14, height: 10, borderRadius: 1 } as const;
const FLAG_MD = { width: 18, height: 12, borderRadius: 1 } as const;

export default function SharedGame() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();

  const [game, setGame]         = useState<Game | null>(null);
  const [mode, setMode]         = useState<ShareMode | null>(null);
  const [shareId, setShareId]   = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab]           = useState<RegionTab>("us");
  const [view, setView]         = useState<ViewMode>("grid");
  const [search, setSearch]     = useState("");

  // Load the shared game — works whether signed in or not, since reading
  // is always public for any valid share token (view or collaborate).
  useEffect(() => {
    if (!token) return;
    let active = true;
    loadSharedGame(token).then((result) => {
      if (!active) return;
      if (!result) { setNotFound(true); return; }
      setGame(result.game);
      setMode(result.mode);
      setShareId(result.shareId);
    });
    return () => { active = false; };
  }, [token]);

  // Collaborate mode requires a real signed-in account. If we land here
  // signed out, redirect to login and bring them right back afterward.
  useEffect(() => {
    if (authLoading || mode !== "collaborate") return;
    if (!session) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`, { replace: true });
    }
  }, [authLoading, session, mode, navigate]);

  // Log that this user has opened the collaborate link, so the owner can
  // see who has access (and when) before deciding to revoke.
  useEffect(() => {
    if (mode !== "collaborate" || !session || !shareId) return;
    recordShareAccess(shareId);
  }, [mode, session, shareId]);

  const canEdit = mode === "collaborate" && Boolean(session);

  const updateFound = useCallback((code: string) => {
    if (!canEdit) return;
    setGame((prev) => {
      if (!prev) return prev;
      const willBeFound = !prev.found.includes(code);
      const next = willBeFound
        ? [...prev.found, code]
        : prev.found.filter((c) => c !== code);
      const nextFoundBy = { ...prev.foundBy };
      if (willBeFound) {
        nextFoundBy[code] = session?.user?.email ?? null;
      } else {
        delete nextFoundBy[code];
      }
      setSharedPlateFound(prev.id, code, willBeFound);
      return { ...prev, found: next, foundBy: nextFoundBy };
    });
  }, [canEdit, session]);

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <div className="text-center px-6">
          <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>Link not found</p>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            This share link may have been revoked or never existed.
          </p>
          <Link to="/" style={{ color: "var(--sky)" }}>← Back to Plate Game</Link>
        </div>
      </div>
    );
  }

  if (!game || !mode) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-app)" }}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      </div>
    );
  }

  const uf = usFound(game.found);
  const cf = caFound(game.found);
  const upct = pct(uf, US_PLATES.length);
  const cpct = pct(cf, CA_PLATES.length);
  const plates = tab === "us" ? US_PLATES : CA_PLATES;
  const filtered = search.trim()
    ? plates.filter((p) =>
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : plates;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
      <TopBar />

      {/* Mode banner */}
      <div className="px-4 py-2 text-center text-xs font-bold" style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}>
        {mode === "view"
          ? "👁 View-only shared link"
          : canEdit
          ? "✏️ Collaborating — your changes save automatically"
          : "Signing in to collaborate…"}
      </div>

      {/* Sticky summary */}
      <div className="px-4 py-3 sticky top-[88px] z-40 border-b" style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}>
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
            <ProgressBar value={upct} hex="#4A90D9" label={<><USFlag style={FLAG_SM} /> US States</>} sub={`${uf}/${US_PLATES.length}`} />
            <ProgressBar value={cpct} hex="#F5A623" label={<><CAFlag style={FLAG_SM} /> Canada</>}   sub={`${cf}/${CA_PLATES.length}`} />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-20">
        {/* Region tabs + view toggle */}
        <div className="flex items-center gap-2 mb-3.5">
          <div className="flex-1 grid grid-cols-2 rounded-xl p-1" style={{ background: "var(--bg-muted)" }}>
            {(["us", "ca"] as RegionTab[]).map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => { setTab(t); setSearch(""); }}
                  className="rounded-xl py-2.5 text-sm font-bold transition-all"
                  style={active
                    ? { background: "var(--bg-card)", color: "var(--text-primary)", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }
                    : { background: "transparent", color: "var(--text-muted)" }
                  }
                >
                  {t === "us" ? (
                    <><USFlag style={FLAG_MD} /> US States<br />
                    <span className="font-black text-base" style={{ color: active ? "#4A90D9" : "var(--text-muted)" }}>{uf}/{US_PLATES.length}</span></>
                  ) : (
                    <><CAFlag style={FLAG_MD} /> Canada<br />
                    <span className="font-black text-base" style={{ color: active ? "#F5A623" : "var(--text-muted)" }}>{cf}/{CA_PLATES.length}</span></>
                  )}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl p-1 flex flex-col gap-1" style={{ background: "var(--bg-muted)" }}>
            {(["grid", "map"] as ViewMode[]).map((v) => {
              const active = view === v;
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  title={v === "grid" ? "Grid view" : "Map view"}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
                  style={active
                    ? { background: "var(--bg-card)", color: "var(--text-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                    : { background: "transparent", color: "var(--text-muted)" }
                  }
                >
                  {v === "grid" ? "▦" : "▤"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map view */}
        {view === "map" && (
          <div className="rounded-2xl shadow-sm p-4 mb-4" style={{ background: "var(--bg-card)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              {tab === "us"
                ? <><USFlag style={FLAG_SM} /> United States — {uf}/{US_PLATES.length} found</>
                : <><CAFlag style={FLAG_SM} /> Canada — {cf}/{CA_PLATES.length} found</>
              }
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="grid grid-cols-4 gap-2 mb-5">
              {filtered.map((plate) => (
                <PlateTile
                  key={plate.code}
                  plate={plate}
                  found={game.found.includes(plate.code)}
                  foundByEmail={game.foundBy[plate.code]}
                  onToggle={canEdit ? updateFound : () => {}}
                />
              ))}
            </div>
            {!canEdit && (
              <p className="text-xs text-center mb-5" style={{ color: "var(--text-muted)" }}>
                This is a view-only link — plates can't be changed here.
              </p>
            )}
          </>
        )}

        {/* Found chips */}
        {game.found.length > 0 && (
          <div className="rounded-2xl shadow-sm p-4 mb-3" style={{ background: "var(--bg-card)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: "var(--text-muted)" }}>
              Found Plates
            </p>
            <div className="flex flex-wrap gap-1.5">
              {game.found.map((code) => (
                <button
                  key={code}
                  onClick={() => canEdit && updateFound(code)}
                  disabled={!canEdit}
                  title={canEdit ? `Remove ${ALL_PLATES.find((p) => p.code === code)?.name}` : ALL_PLATES.find((p) => p.code === code)?.name}
                  className="rounded-lg px-2.5 py-1 text-sm font-bold border"
                  style={{ background: "var(--found-bg)", color: "var(--found)", borderColor: "var(--found-border)" }}
                >
                  {code}{canEdit ? " ✕" : ""}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
