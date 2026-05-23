'use client';
import React, { useState } from "react";

export default function LobbyScreen({ onCreateRoom, onJoinRoom, connected }) {
  const [tab, setTab] = useState("create");
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
    <div className="bg-game min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Diamond pattern background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 4L44 24L24 44L4 24z' fill='none' stroke='%23F0B732' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "48px 48px",
          opacity: 0.04,
        }}
      />

      {/* Radial glow behind title */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 300,
          background: "radial-gradient(ellipse, rgba(240,183,50,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Title */}
      <div className="text-center mb-10 animate-pop relative z-10">
        <div
          className="inline-block text-6xl mb-5 animate-float"
          style={{ filter: "drop-shadow(0 4px 16px rgba(240,183,50,0.3))" }}
        >
          🐍
        </div>

        <div className="leading-none">
          <div
            className="font-display text-6xl md:text-7xl"
            style={{
              color: "#F0B732",
              textShadow: "0 2px 24px rgba(240,183,50,0.25), 0 0 60px rgba(240,183,50,0.1)",
              letterSpacing: "0.02em",
            }}
          >
            SNAKE
          </div>
          <div
            className="text-lg font-body font-semibold tracking-[0.45em] uppercase mt-1 mb-1"
            style={{ color: "rgba(122,158,135,0.7)" }}
          >
            &amp; &amp;
          </div>
          <div
            className="font-display text-6xl md:text-7xl"
            style={{
              color: "#EDF2EE",
              textShadow: "0 2px 24px rgba(0,0,0,0.5)",
              letterSpacing: "0.02em",
            }}
          >
            LADDERS
          </div>
        </div>

        <div
          className="gold-line w-32 mx-auto mt-4 mb-4"
          style={{ opacity: 0.4 }}
        />

        <p
          className="text-sm font-semibold tracking-[0.2em] uppercase"
          style={{ color: "#7A9E87" }}
        >
          Online Multiplayer
        </p>

        <div className="flex items-center justify-center gap-2 mt-3">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`}
          />
          <span className="text-xs" style={{ color: "#4A7A57" }}>
            {connected ? "Server connected" : "Connecting to server..."}
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm game-card overflow-hidden relative z-10 animate-pop" style={{ animationDelay: "0.1s" }}>
        {/* Top gold line */}
        <div className="gold-line" />

        {/* Tab switcher */}
        <div
          className="flex"
          style={{ borderBottom: "1px solid rgba(240,183,50,0.1)" }}
        >
          {[
            { id: "create", label: "Create Room", icon: "⊕" },
            { id: "join",   label: "Join Room",   icon: "→" },
          ].map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setError(""); }}
              className="flex-1 py-4 text-sm font-semibold tracking-wider transition-all duration-200 relative"
              style={{
                color: tab === id ? "#F0B732" : "#4A7A57",
                background: tab === id ? "rgba(240,183,50,0.04)" : "transparent",
                borderBottom: tab === id ? "1px solid #F0B732" : "1px solid transparent",
                marginBottom: -1,
              }}
            >
              <span className="mr-2 opacity-70">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={tab === "create" ? handleCreate : handleJoin} className="p-6 flex flex-col gap-4">
          {/* Player name */}
          <div>
            <label className="field-label">Your Name</label>
            <input
              type="text"
              maxLength={16}
              placeholder="Enter your name"
              value={form.playerName}
              onChange={(e) => set("playerName", e.target.value)}
              className="input-field"
            />
          </div>

          {tab === "create" ? (
            <>
              <div>
                <label className="field-label">Room Name</label>
                <input
                  type="text"
                  maxLength={24}
                  placeholder="My Awesome Room"
                  value={form.roomName}
                  onChange={(e) => set("roomName", e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="field-label">Room Password</label>
                <input
                  type="password"
                  minLength={4}
                  maxLength={20}
                  placeholder="Min. 4 characters"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className="input-field"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="field-label">Room Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="AB12CD"
                  value={form.roomCode}
                  onChange={(e) => set("roomCode", e.target.value.toUpperCase())}
                  className="input-field text-center font-mono tracking-[0.35em] text-xl"
                  style={{ color: "#F0B732" }}
                />
              </div>
              <div>
                <label className="field-label">Room Password</label>
                <input
                  type="password"
                  placeholder="Enter room password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className="input-field"
                />
              </div>
            </>
          )}

          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm animate-slide-in flex items-center gap-2"
              style={{
                background: "rgba(232,69,69,0.08)",
                border: "1px solid rgba(232,69,69,0.3)",
                color: "#E84545",
              }}
            >
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !connected}
            className="w-full py-4 btn-gold text-[0.9375rem] mt-1"
          >
            {loading
              ? "Please wait..."
              : tab === "create"
              ? "Create Room →"
              : "Join Room →"}
          </button>
        </form>

        {/* Bottom gold line */}
        <div className="gold-line" style={{ opacity: 0.3 }} />
      </div>

      <p className="text-xs mt-6 relative z-10 tracking-widest" style={{ color: "#2E4F37" }}>
        TWO PLAYERS &nbsp;·&nbsp; REAL-TIME &nbsp;·&nbsp; ONLINE
      </p>
    </div>
  );
}
