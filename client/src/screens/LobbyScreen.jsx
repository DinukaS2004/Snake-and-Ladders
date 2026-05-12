import React, { useState } from "react";

export default function LobbyScreen({ onCreateRoom, onJoinRoom, connected }) {
  const [tab, setTab] = useState("create"); // "create" | "join"
  const [form, setForm] = useState({ roomName: "", password: "", playerName: "", roomCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!form.playerName.trim()) return setError("Enter your name.");
    if (!form.roomName.trim()) return setError("Enter a room name.");
    if (form.password.trim().length < 4) return setError("Password must be at least 4 characters.");
    setLoading(true);
    const res = await onCreateRoom(form.roomName, form.password, form.playerName);
    if (res?.error) setError(res.error);
    setLoading(false);
  }

  async function handleJoin(e) {
    e.preventDefault();
    setError("");
    if (!form.playerName.trim()) return setError("Enter your name.");
    if (!form.roomCode.trim()) return setError("Enter the room code.");
    if (!form.password.trim()) return setError("Enter the room password.");
    setLoading(true);
    const res = await onJoinRoom(form.roomCode, form.password, form.playerName);
    if (res?.error) setError(res.error);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>

      {/* Title */}
      <div className="text-center mb-8 animate-pop">
        <div className="text-7xl mb-3">🐍</div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
          Snake &amp; Ladders
        </h1>
        <p className="text-slate-400 mt-2 text-lg">Online Multiplayer</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
          <span className="text-sm text-slate-400">{connected ? "Connected to server" : "Connecting..."}</span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Tabs */}
        <div className="flex">
          {["create", "join"].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all
                ${tab === t
                  ? "bg-white/20 text-white border-b-2 border-yellow-400"
                  : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              {t === "create" ? "🏠 Create Room" : "🚪 Join Room"}
            </button>
          ))}
        </div>

        <form onSubmit={tab === "create" ? handleCreate : handleJoin} className="p-6 flex flex-col gap-4">
          {/* Player name — always visible */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
              Your Name
            </label>
            <input
              type="text" maxLength={16} placeholder="Enter your name"
              value={form.playerName} onChange={(e) => set("playerName", e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-500
                border border-white/20 focus:border-yellow-400 focus:outline-none focus:ring-2
                focus:ring-yellow-400/30 transition-all"
            />
          </div>

          {tab === "create" ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Room Name
                </label>
                <input
                  type="text" maxLength={24} placeholder="My Awesome Room"
                  value={form.roomName} onChange={(e) => set("roomName", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-500
                    border border-white/20 focus:border-yellow-400 focus:outline-none focus:ring-2
                    focus:ring-yellow-400/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Room Password
                </label>
                <input
                  type="password" minLength={4} maxLength={20} placeholder="At least 4 characters"
                  value={form.password} onChange={(e) => set("password", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-500
                    border border-white/20 focus:border-yellow-400 focus:outline-none focus:ring-2
                    focus:ring-yellow-400/30 transition-all"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Room Code
                </label>
                <input
                  type="text" maxLength={6} placeholder="6-character code (e.g. AB12CD)"
                  value={form.roomCode}
                  onChange={(e) => set("roomCode", e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-500
                    border border-white/20 focus:border-yellow-400 focus:outline-none focus:ring-2
                    focus:ring-yellow-400/30 transition-all font-mono tracking-widest text-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Room Password
                </label>
                <input
                  type="password" placeholder="Enter room password"
                  value={form.password} onChange={(e) => set("password", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-500
                    border border-white/20 focus:border-yellow-400 focus:outline-none focus:ring-2
                    focus:ring-yellow-400/30 transition-all"
                />
              </div>
            </>
          )}

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-400/40 text-red-300 text-sm animate-slide-in">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !connected}
            className="w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider
              bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900
              hover:from-yellow-300 hover:to-orange-400 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200 shadow-lg shadow-orange-500/30 mt-1"
          >
            {loading ? "⏳ Please wait..." : tab === "create" ? "🏠 Create Room" : "🚪 Join Room"}
          </button>
        </form>
      </div>

      <p className="text-slate-600 text-xs mt-6">Two players • Real-time • Online</p>
    </div>
  );
}
