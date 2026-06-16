import { useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/games.new";
import { createGame, todayISO } from "~/data/games";
import { TopBar } from "~/components/ui/top-bar";
import { Alert } from "~/components/ui/dialog";

export function meta({}: Route.MetaArgs) {
  return [{ title: "New Game · Plate Game" }];
}

export default function NewGame() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim()) { setError("Give this game a name"); return; }
    if (!date) { setError("Pick a date"); return; }
    setSubmitting(true);
    const game = await createGame(name.trim(), date);
    setSubmitting(false);
    if (!game) {
      setError("Couldn't create the game. Try again.");
      return;
    }
    navigate(`/games/${game.id}`);
  }

  const inputStyle = {
    background: "var(--bg-input)",
    border: "1.5px solid var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
      <TopBar />
      <div className="max-w-lg mx-auto px-4 pt-6 pb-20">
        <h1 className="text-2xl font-black tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>New Game</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Name your trip and set the start date</p>

        <div className="rounded-2xl shadow-sm p-5 space-y-5" style={{ background: "var(--bg-card)" }}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
              Trip Name
            </label>
            <input className="w-full rounded-xl px-3.5 py-3 text-[15px] outline-none transition-colors"
              style={inputStyle}
              placeholder="e.g. Summer Road Trip 2025"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              maxLength={60} autoFocus />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>
              Date
            </label>
            <input className="w-full rounded-xl px-3.5 py-3 text-[15px] outline-none transition-colors"
              style={inputStyle}
              type="date" value={date}
              onChange={(e) => { setDate(e.target.value); setError(""); }} />
            <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>Set a past date to log a previous trip</p>
          </div>
          <Alert message={error} />
          <button onClick={handleSubmit} disabled={submitting}
            className="w-full font-black text-base rounded-xl py-3"
            style={{ background: "var(--amber)", color: "var(--navy)", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Creating…" : "Start Game →"}
          </button>
        </div>
      </div>
    </div>
  );
}
