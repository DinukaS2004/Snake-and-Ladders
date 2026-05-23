'use client';
import React, { useState } from "react";

export default function RoomScreen({ room, myPlayer, onStartGame, onLeave }) {
  const [copied, setCopied] = useState(false);
  const isCreator = myPlayer?.isCreator;
  // Both slots filled AND both players connected (blocks start during a reconnect)
  const canStart =
    room.players.length === 2 &&
    isCreator &&
    room.players.every((p) => p.connected !== false);

  function copyCode() {
    navigator.clipboard.writeText(room.roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-game min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Diamond pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 4L44 24L24 44L4 24z' fill='none' stroke='%23F0B732' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "48px 48px",
          opacity: 0.04,
        }}
      />

      <div className="w-full max-w-sm relative z-10 animate-pop flex flex-col gap-4">
        {/* Header */}
        <div className="text-center mb-2">
          <div className="text-4xl mb-3" style={{ filter: "drop-shadow(0 2px 8px rgba(240,183,50,0.2))" }}>
            🎮
          </div>
          <h2
            className="font-display text-3xl md:text-4xl"
            style={{ color: "#EDF2EE", letterSpacing: "0.03em" }}
          >
            {room.roomName}
          </h2>
          <p className="mt-1 text-sm font-medium" style={{ color: "#4A7A57" }}>
            Waiting for players to join...
          </p>
        </div>

        {/* Room code card */}
        <div className="game-card overflow-hidden">
          <div className="gold-line" />
          <div className="p-5">
            <p
              className="text-center text-xs font-bold tracking-[0.18em] uppercase mb-3"
              style={{ color: "#4A7A57" }}
            >
              Share This Room Code
            </p>
            <div className="flex items-center gap-3">
              <div
                className="flex-1 rounded-xl py-3 px-4 text-center font-mono"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(240,183,50,0.12)" }}
              >
                <span
                  className="text-3xl font-black tracking-[0.3em]"
                  style={{ color: "#F0B732", textShadow: "0 0 20px rgba(240,183,50,0.3)" }}
                >
                  {room.roomCode}
                </span>
              </div>
              <button
                onClick={copyCode}
                className="px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95"
                style={{
                  background: copied
                    ? "rgba(46,184,114,0.15)"
                    : "rgba(240,183,50,0.1)",
                  border: `1px solid ${copied ? "rgba(46,184,114,0.4)" : "rgba(240,183,50,0.25)"}`,
                  color: copied ? "#2EB872" : "#F0B732",
                  minWidth: 72,
                }}
              >
                {copied ? "✓ Done" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-center mt-2" style={{ color: "#2E4F37" }}>
              Share the code + password with your opponent
            </p>
          </div>
          <div className="gold-line" style={{ opacity: 0.2 }} />
        </div>

        {/* Players card */}
        <div className="game-card overflow-hidden">
          <div className="p-5">
            <p
              className="text-xs font-bold tracking-[0.18em] uppercase mb-4"
              style={{ color: "#4A7A57" }}
            >
              Players
            </p>
            <div className="flex flex-col gap-3">
              {[0, 1].map((i) => {
                const p = room.players[i];
                const isMe = p?.socketId === myPlayer?.socketId;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: p
                        ? "rgba(240,183,50,0.05)"
                        : "rgba(5,14,8,0.4)",
                      border: p
                        ? `1px solid ${p.connected === false ? "rgba(232,69,69,0.2)" : "rgba(240,183,50,0.15)"}`
                        : "1px dashed rgba(122,158,135,0.2)",
                      opacity: p?.connected === false ? 0.7 : 1,
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0"
                      style={{
                        backgroundColor: p ? p.color : "rgba(30,50,35,0.8)",
                        color: "#fff",
                        boxShadow: p && p.connected !== false ? `0 0 12px ${p.color}40` : "none",
                      }}
                    >
                      {p ? p.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div className="flex-1">
                      <div
                        className="font-semibold text-sm"
                        style={{ color: p ? "#EDF2EE" : "#2E4F37" }}
                      >
                        {p ? `${p.name}${isMe ? " (You)" : ""}` : "Waiting..."}
                      </div>
                      <div className="text-xs" style={{ color: p?.connected === false ? "#E84545" : "#4A7A57" }}>
                        {p?.connected === false
                          ? "⏳ Reconnecting..."
                          : p ? (p.isCreator ? "👑 Host" : "Player 2") : "Not joined yet"}
                      </div>
                    </div>
                    {/* Status dot */}
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: !p
                          ? "transparent"
                          : p.connected === false
                          ? "#E84545"
                          : "#2EB872",
                        animation: p && p.connected !== false ? "pulse 2s infinite" : "none",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isCreator ? (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className="w-full py-4 btn-gold text-base"
            >
              {canStart
                ? "Start Game →"
                : room.players.length === 2
                ? "⏳ Waiting for opponent to reconnect..."
                : "⏳ Waiting for opponent..."}
            </button>
          ) : (
            <div
              className="w-full py-4 rounded-2xl text-center text-sm font-semibold"
              style={{
                background: "rgba(5,14,8,0.5)",
                border: "1px solid rgba(122,158,135,0.15)",
                color: "#4A7A57",
              }}
            >
              ⏳ Waiting for host to start the game...
            </div>
          )}

          <button
            onClick={onLeave}
            className="w-full py-3 btn-danger text-sm"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
