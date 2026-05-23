'use client';
import React, { useState, useEffect, useRef, useCallback } from "react";
import Board from "../components/Board.jsx";
import Dice from "../components/Dice.jsx";
import EventLog from "../components/EventLog.jsx";

export default function GameScreen({ room, myPlayer, onRoll, onPlayAgain, onLeave }) {
  const { gameState, players } = room;
  const [rolling, setRolling] = useState(false);
  const [events, setEvents] = useState([]);
  const [highlightSquare, setHighlightSquare] = useState(null);
  const prevLastEventRef = useRef(null);
  const rollResetTimerRef = useRef(null);

  // True when the opponent is marked as disconnected (waiting to rejoin)
  const opponentDisconnected = players.some(
    (p) => p.index !== myPlayer?.index && p.connected === false
  );

  const isMyTurn = !!(
    gameState &&
    myPlayer != null &&
    gameState.currentPlayerIndex === myPlayer.index &&
    !opponentDisconnected   // can't roll while opponent is gone
  );

  const currentPlayer = players[gameState?.currentPlayerIndex];
  const winner = gameState?.winner != null ? players[gameState.winner] : null;

  const prevTurnCountRef = useRef(gameState?.turnCount ?? -1);
  useEffect(() => {
    const tc = gameState?.turnCount ?? -1;
    if (tc !== prevTurnCountRef.current) {
      prevTurnCountRef.current = tc;
      clearTimeout(rollResetTimerRef.current);
      setRolling(false);
    }
  }, [gameState?.turnCount]);

  useEffect(() => () => clearTimeout(rollResetTimerRef.current), []);

  useEffect(() => {
    if (!gameState?.lastEvent) return;
    const ev = gameState.lastEvent;
    if (JSON.stringify(ev) === JSON.stringify(prevLastEventRef.current)) return;
    prevLastEventRef.current = ev;
    setEvents((e) => [...e.slice(-19), { ...ev }]);
    if (ev.position) {
      setHighlightSquare(ev.position);
      setTimeout(() => setHighlightSquare(null), 1500);
    }
  }, [gameState]);

  const handleRoll = useCallback(async () => {
    if (!isMyTurn || rolling) return;
    setRolling(true);
    let res;
    try {
      res = await onRoll();
    } catch {
      setRolling(false);
      return;
    }
    if (res?.error) {
      setRolling(false);
      return;
    }
    rollResetTimerRef.current = setTimeout(() => setRolling(false), 4000);
  }, [isMyTurn, rolling, onRoll]);

  // ── Winner screen ─────────────────────────────────────────────────────────
  if (winner) {
    const iWon = winner.index === myPlayer?.index;
    return (
      <div className="bg-game min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Diamond BG */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M24 4L44 24L24 44L4 24z' fill='none' stroke='%23F0B732' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "48px 48px",
            opacity: 0.04,
          }}
        />
        <div className="text-center animate-pop relative z-10 w-full max-w-lg">
          {/* Result emoji + glow */}
          <div
            className="text-8xl mb-4 inline-block"
            style={{ filter: iWon ? "drop-shadow(0 0 32px rgba(240,183,50,0.5))" : "drop-shadow(0 4px 16px rgba(0,0,0,0.5))" }}
          >
            {iWon ? "🏆" : "😢"}
          </div>

          {/* Separator */}
          <div className="gold-line w-40 mx-auto mb-4" style={{ opacity: iWon ? 0.7 : 0.25 }} />

          <h2
            className="font-display text-5xl md:text-6xl mb-3"
            style={{
              color: iWon ? "#F0B732" : "#EDF2EE",
              textShadow: iWon ? "0 0 40px rgba(240,183,50,0.3)" : "none",
              letterSpacing: "0.03em",
            }}
          >
            {iWon ? "VICTORY!" : `${winner.name} WINS`}
          </h2>
          <p className="text-sm mb-8 font-medium" style={{ color: "#4A7A57" }}>
            {iWon
              ? "Congratulations — you reached square 100!"
              : "Better luck next time. The board awaits."}
          </p>

          <div className="w-full max-w-sm mx-auto mb-8 rounded-2xl overflow-hidden"
            style={{ boxShadow: "0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(240,183,50,0.1)" }}>
            <Board players={players} />
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            {myPlayer?.isCreator && (
              <button
                onClick={onPlayAgain}
                className="px-8 py-4 btn-gold text-base"
              >
                Play Again →
              </button>
            )}
            <button
              onClick={onLeave}
              className="px-8 py-4 btn-ghost text-base"
            >
              Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active game screen ────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse 70% 60% at 15% 50%, rgba(13,43,25,0.7) 0%, transparent 70%), linear-gradient(160deg, #050e08 0%, #0a1f0d 45%, #050e08 100%)",
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          background: "rgba(5,14,8,0.8)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(240,183,50,0.1)",
        }}
      >
        {/* Room info */}
        <div className="flex items-center gap-3">
          <span className="text-xl">🐍</span>
          <div>
            <div className="font-semibold text-sm leading-none" style={{ color: "#EDF2EE" }}>
              {room.roomName}
            </div>
            <div className="text-xs mt-0.5 font-mono tracking-wider" style={{ color: "#2E4F37" }}>
              {room.roomCode}
            </div>
          </div>
        </div>

        {/* Turn indicator */}
        {currentPlayer && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all"
            style={{
              background: isMyTurn ? "rgba(240,183,50,0.12)" : "rgba(5,14,8,0.5)",
              border: `1px solid ${isMyTurn ? "rgba(240,183,50,0.35)" : "rgba(122,158,135,0.15)"}`,
              color: isMyTurn ? "#F0B732" : "#4A7A57",
              boxShadow: isMyTurn ? "0 0 16px rgba(240,183,50,0.1)" : "none",
            }}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: currentPlayer.color,
                boxShadow: isMyTurn ? `0 0 6px ${currentPlayer.color}` : "none",
              }}
            />
            {isMyTurn ? "Your Turn" : `${currentPlayer.name}'s Turn`}
          </div>
        )}

        <button
          onClick={onLeave}
          className="text-xs px-3 py-2 rounded-xl transition-all"
          style={{ color: "#2E4F37", border: "1px solid transparent" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#E84545";
            e.currentTarget.style.borderColor = "rgba(232,69,69,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#2E4F37";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          ✕ Leave
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row flex-1 gap-4 p-4">
        {/* Board */}
        <div className="flex-1 flex items-start justify-center">
          <div
            className="w-full rounded-2xl overflow-hidden"
            style={{
              maxWidth: 600,
              boxShadow: "0 8px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(240,183,50,0.08)",
            }}
          >
            <Board players={players} highlightSquare={highlightSquare} />
          </div>
        </div>

        {/* Side panel */}
        <div className="lg:w-68 xl:w-72 flex flex-col gap-3">
          {/* Players */}
          <div className="game-card overflow-hidden">
            <div className="gold-line" />
            <div className="p-4">
              <h3
                className="text-xs font-bold tracking-[0.18em] uppercase mb-3"
                style={{ color: "#4A7A57" }}
              >
                Players
              </h3>
              <div className="flex flex-col gap-2">
                {players.map((p, i) => {
                  const isActive = gameState?.currentPlayerIndex === i;
                  const isMe = p.index === myPlayer?.index;
                  return (
                    <div
                      key={p.id || i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                      style={{
                        background: isActive
                          ? "rgba(240,183,50,0.07)"
                          : "rgba(5,14,8,0.4)",
                        border: `1px solid ${isActive ? "rgba(240,183,50,0.2)" : "rgba(122,158,135,0.08)"}`,
                        boxShadow: isActive ? "0 0 16px rgba(240,183,50,0.06)" : "none",
                        opacity: p.connected === false ? 0.4 : 1,
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0"
                        style={{
                          backgroundColor: p.color,
                          boxShadow: isActive ? `0 0 12px ${p.color}50` : "none",
                        }}
                      >
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate" style={{ color: "#EDF2EE" }}>
                          {p.name}{isMe ? " (You)" : ""}
                        </div>
                        <div className="text-xs" style={{ color: p.connected === false ? "#E84545" : "#4A7A57" }}>
                          {p.connected === false
                            ? "Disconnected…"
                            : p.position === 0 ? "Start" : `Square ${p.position}`}
                        </div>
                      </div>
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: p.connected === false
                            ? "#E84545"
                            : isActive ? "#F0B732" : "transparent",
                          animation: p.connected !== false && isActive ? "pulse 2s infinite" : "none",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dice panel */}
          <div className="game-card overflow-hidden">
            <div className="p-4">
              {opponentDisconnected && (
                <div
                  className="mb-3 px-3 py-2 rounded-xl text-xs font-semibold text-center animate-slide-in"
                  style={{
                    background: "rgba(232,69,69,0.08)",
                    border: "1px solid rgba(232,69,69,0.25)",
                    color: "#E84545",
                  }}
                >
                  ⏳ Opponent disconnected — waiting to reconnect…
                </div>
              )}
              <p
                className="text-xs font-bold tracking-[0.18em] uppercase mb-4 text-center"
                style={{ color: isMyTurn ? "#F0B732" : "#4A7A57" }}
              >
                {opponentDisconnected
                  ? "Game paused"
                  : isMyTurn
                  ? "Your turn — roll!"
                  : `Waiting for ${currentPlayer?.name ?? "opponent"}…`}
              </p>

              {gameState?.diceValue != null && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-xs tracking-widest uppercase" style={{ color: "#2E4F37" }}>
                    Last roll
                  </span>
                  <span
                    className="font-display text-3xl"
                    style={{ color: "#F0B732" }}
                  >
                    {gameState.diceValue}
                  </span>
                </div>
              )}

              <div className="flex justify-center">
                <Dice
                  value={gameState?.diceValue}
                  rolling={rolling}
                  disabled={!isMyTurn || rolling}
                  onRoll={handleRoll}
                />
              </div>

              {gameState?.extraTurn && isMyTurn && (
                <div
                  className="mt-4 text-center px-3 py-2 rounded-xl text-sm font-bold animate-slide-in"
                  style={{
                    background: "rgba(240,183,50,0.1)",
                    border: "1px solid rgba(240,183,50,0.25)",
                    color: "#F0B732",
                  }}
                >
                  🎉 Rolled a 6 — Roll again!
                </div>
              )}
            </div>
          </div>

          {/* Event log */}
          <div className="game-card overflow-hidden flex-1">
            <div className="p-4">
              <h3
                className="text-xs font-bold tracking-[0.18em] uppercase mb-3"
                style={{ color: "#4A7A57" }}
              >
                Game Log
              </h3>
              {events.length > 0 ? (
                <EventLog events={events} />
              ) : (
                <p className="text-sm" style={{ color: "#2E4F37" }}>
                  No moves yet. Roll the dice!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
