import { useEffect, useState } from "react";
import type { Game } from "~/data/games";
import { loadSharesForGame, createShare, revokeShare, type Share, type ShareMode } from "~/data/shares";

interface ShareGameProps {
  game: Game;
  onClose: () => void;
}

function shareUrl(token: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}shared/${token}`;
}

export function ShareGame({ game, onClose }: ShareGameProps) {
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<ShareMode | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadSharesForGame(game.id).then((data) => {
      if (active) {
        setShares(data);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [game.id]);

  async function handleCreate(mode: ShareMode) {
    setCreating(mode);
    const share = await createShare(game.id, mode);
    setCreating(null);
    if (share) setShares((prev) => [share, ...prev]);
  }

  async function handleRevoke(shareId: string) {
    const ok = await revokeShare(shareId);
    if (ok) setShares((prev) => prev.filter((s) => s.id !== shareId));
  }

  async function handleCopy(share: Share) {
    try {
      await navigator.clipboard.writeText(shareUrl(share.token));
      setCopiedId(share.id);
      setTimeout(() => setCopiedId((cur) => (cur === share.id ? null : cur)), 2000);
    } catch {
      // Clipboard API unavailable — silently ignore, the link is still
      // visible in the UI for manual copy.
    }
  }

  const viewShares = shares.filter((s) => s.mode === "view");
  const collabShares = shares.filter((s) => s.mode === "collaborate");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl shadow-xl p-5 space-y-5 max-h-[85vh] overflow-y-auto" style={{ background: "var(--bg-card)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-lg" style={{ color: "var(--text-primary)" }}>Share Game</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{game.name}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: "var(--text-muted)" }}>×</button>
        </div>

        {loading ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>Loading…</p>
        ) : (
          <>
            <ShareSection
              title="View Links"
              description="Anyone with the link can see live progress — no sign-in needed."
              mode="view"
              shares={viewShares}
              creating={creating === "view"}
              copiedId={copiedId}
              onCreate={() => handleCreate("view")}
              onRevoke={handleRevoke}
              onCopy={handleCopy}
            />
            <ShareSection
              title="Collaborate Links"
              description="Anyone with the link can mark plates found — they'll need to sign in with email first."
              mode="collaborate"
              shares={collabShares}
              creating={creating === "collaborate"}
              copiedId={copiedId}
              onCreate={() => handleCreate("collaborate")}
              onRevoke={handleRevoke}
              onCopy={handleCopy}
            />
          </>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-xl py-3 font-bold text-sm"
          style={{ background: "var(--bg-muted)", color: "var(--text-primary)" }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

interface ShareSectionProps {
  title: string;
  description: string;
  mode: ShareMode;
  shares: Share[];
  creating: boolean;
  copiedId: string | null;
  onCreate: () => void;
  onRevoke: (id: string) => void;
  onCopy: (share: Share) => void;
}

function ShareSection({ title, description, shares, creating, copiedId, onCreate, onRevoke, onCopy }: ShareSectionProps) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>{title}</p>
      <p className="text-xs mb-2.5" style={{ color: "var(--text-muted)" }}>{description}</p>

      <div className="space-y-2 mb-2.5">
        {shares.map((share) => (
          <div
            key={share.id}
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: "var(--bg-muted)" }}
          >
            <p
              className="flex-1 text-xs font-mono truncate"
              style={{ color: "var(--text-primary)" }}
              title={shareUrl(share.token)}
            >
              {shareUrl(share.token)}
            </p>
            <button
              onClick={() => onCopy(share)}
              className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
              style={{ background: "var(--bg-card)", color: "var(--sky)" }}
            >
              {copiedId === share.id ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={() => onRevoke(share.id)}
              className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
              style={{ background: "var(--danger-bg)", color: "var(--danger-text)" }}
            >
              Revoke
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onCreate}
        disabled={creating}
        className="w-full rounded-xl py-2.5 font-bold text-sm border-2 border-dashed"
        style={{ borderColor: "var(--border)", color: "var(--sky)", opacity: creating ? 0.6 : 1 }}
      >
        {creating ? "Creating…" : "+ New link"}
      </button>
    </div>
  );
}
