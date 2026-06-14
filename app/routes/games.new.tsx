import { useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/games.new";
import { createGame, loadGames, saveGames, todayISO } from "~/data/games";
import { TopBar } from "~/components/ui/top-bar";

export function meta({}: Route.MetaArgs) {
  return [{ title: "New Game · Plate Game" }];
}

export default function NewGame() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!name.trim()) {
      setError("Give this game a name");
      return;
    }
    if (!date) {
      setError("Pick a date");
      return;
    }
    const games = loadGames();
    const game = createGame(name.trim(), date);
    saveGames([...games, game]);
    navigate(`/games/${game.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <TopBar backTo="/" backLabel="Games" />

      <div className="max-w-lg mx-auto px-4 pt-6 pb-20">
        <h1 className="text-2xl font-black tracking-tight mb-1">New Game</h1>
        <p className="text-sm text-gray-400 mb-6">Name your trip and set the start date</p>

        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Trip Name
            </label>
            <input
              className="w-full border-1.5 border-gray-200 rounded-xl px-3.5 py-3 text-[15px] text-gray-900 outline-none focus:border-sky-400 transition-colors"
              placeholder="e.g. Summer Road Trip 2025"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              maxLength={60}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Date
            </label>
            <input
              className="w-full border-1.5 border-gray-200 rounded-xl px-3.5 py-3 text-[15px] text-gray-900 outline-none focus:border-sky-400 transition-colors"
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setError(""); }}
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Set a past date to log a previous trip retroactively
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 rounded-xl px-4 py-2.5 text-sm font-semibold">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full bg-[#F5A623] text-[#1B2340] font-black text-base rounded-xl py-3"
          >
            Start Game →
          </button>
        </div>
      </div>
    </div>
  );
}
