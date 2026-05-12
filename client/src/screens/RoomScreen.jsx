import React, { useState } from "react";

export default function RoomScreen({ room, myPlayer, onStartGame, onLeave }) {
  const [copied, setCopied] = useState(false);
  const isCreator = myPlayer?.isCreator;
  const otherPlayer = room.players.find((p) => p.socketId !== myPlayer?.socketId);
  const canStart = room.players.length === 2 && isCreator;

  function copyCode() {
    navigator.clipboard.writeText(room.roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>

      <div className="w-full max-w-md animate-pop">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🎮</div>
          <h2 className="text-3xl font-black text-white">{room.roomName}</h2>
          <p className="text-slate-400 mt-1">Waiting for players...</p>
        </div>

        {/* Room Code */}
        <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-5 mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 text-center">
            Share this room code
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-900/60 rounded-xl px-4 py-3 text-center">
              <span className="text-3xl font-black text-yellow-400 tracking-[0.3em] font-mono">
                {room.roomCode}
              </span>
            </div>
            <button
              onClick={copyCode}
              className="px-4 py-3 rounded-xl bg-yellow-400/20 hover:bg-yellow-400/30
                text-yellow-400 font-semibold text-sm transition-all active:scale-95"
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-slate-500 text-center mt-2">
            Share code + password with your opponent
          </p>
        </div>

        {/* Players */}
        <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-5 mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Players</p>
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => {
              const p = room.players[i];
              return (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${p ? "bg-white/10" : "bg-white/5 border border-dashed border-white/20"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-lg
                    ${p ? "" : "bg-slate-700"}`}
                    style={{ backgroundColor: p?.color || undefined }}>
                    {p ? p.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">
                      {p ? p.name : "Waiting..."}
                    </div>
                    <div className="text-xs text-slate-400">
                      {p ? (p.isCreator ? "👑 Room Creator" : "Player 2") : "Not joined yet"}
                    </div>
                  </div>
                  {p && (
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isCreator ? (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all
                ${canStart
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-400 hover:to-emerald-500 active:scale-95 shadow-lg shadow-green-500/30"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"}`}
            >
              {canStart ? "🎮 Start Game!" : "⏳ Waiting for opponent..."}
            </button>
          ) : (
            <div className="w-full py-4 rounded-xl bg-slate-700/50 border border-white/10
              text-center text-slate-400 font-semibold">
              ⏳ Waiting for host to start...
            </div>
          )}

          <button
            onClick={onLeave}
            className="w-full py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30
              text-red-400 font-semibold transition-all active:scale-95 border border-red-500/30"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
