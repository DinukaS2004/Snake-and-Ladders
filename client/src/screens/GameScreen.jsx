import React, { useState, useEffect, useRef, useCallback } from "react";
import Board from "../components/Board.jsx";
import Dice from "../components/Dice.jsx";
import EventLog from "../components/EventLog.jsx";

// Animation duration must be slightly shorter than the Dice component's own animation
// (ANIM_TICKS * ANIM_MS = 8 * 75 = 600ms) so we wait 750ms before resetting.
const ROLL_RESET_MS = 750;

export default function GameScreen({ room, myPlayer, onRoll, onPlayAgain, onLeave }) {
  const { gameState, players } = room;
  const [rolling, setRolling] = useState(false);
  const [events, setEvents] = useState([]);
  const [highlightSquare, setHighlightSquare] = useState(null);
  const prevLastEventRef = useRef(null);
  const rollResetTimerRef = useRef(null);

  const isMyTurn = !!(
    gameState &&
    players[gameState.currentPlayerIndex]?.socketId === myPlayer?.socketId
  );
  const currentPlayer = players[gameState?.currentPlayerIndex];
  const winner = gameState?.winner != null ? players[gameState.winner] : null;

  // Append new events from incoming game-state
  useEffect(() => {
    if (!gameState?.lastEvent) return;
    const ev = gameState.lastEvent;
    const prevEv = prevLastEventRef.current;
    if (JSON.stringify(ev) === JSON.stringify(prevEv)) return;
    prevLastEventRef.current = ev;

    setEvents((e) => [...e.slice(-19), { ...ev }]);
    if (ev.position) {
      setHighlightSquare(ev.position);
      setTimeout(() => setHighlightSquare(null), 1500);
    }
  }, [gameState]);

  // Clean up roll-reset timer on unmount
  useEffect(() => () => clearTimeout(rollResetTimerRef.current), []);

  const handleRoll = useCallback(async () => {
    if (!isMyTurn || rolling) return;

    setRolling(true);
    try {
      const res = await onRoll();
      if (res?.error) {
        // Server rejected the roll — reset immediately
        setRolling(false);
        return;
      }
    } catch {
      setRolling(false);
      return;
    }

    // Let the Dice animation finish before resetting
    rollResetTimerRef.current = setTimeout(() => setRolling(false), ROLL_RESET_MS);
  }, [isMyTurn, rolling, onRoll]);

  // ── Winner screen ────────────────────────────────────────────────────────────
  if (winner) {
    const iWon = winner.socketId === myPlayer?.socketId;
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
      >
        <div className="text-center">
          <div className="text-8xl mb-4">{iWon ? "🏆" : "😢"}</div>
          <h2 className="text-5xl font-black text-white mb-2">
            {iWon ? "You Win!" : `${winner.name} Wins!`}
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            {iWon ? "Congratulations! You reached square 100!" : "Better luck next time!"}
          </p>
          <div className="w-full max-w-sm mx-auto mb-6">
            <Board players={players} />
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            {myPlayer?.isCreator && (
              <button
                onClick={onPlayAgain}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500
                  text-slate-900 font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                🔄 Play Again
              </button>
            )}
            <button
              onClick={onLeave}
              className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20
                text-white font-bold text-lg transition-all active:scale-95"
            >
              🏠 Leave
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Game screen ──────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/30 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐍</span>
          <div>
            <div className="text-white font-bold text-sm leading-none">{room.roomName}</div>
            <div className="text-slate-400 text-xs">{room.roomCode}</div>
          </div>
        </div>

        {currentPlayer && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold
              ${isMyTurn ? "bg-yellow-400/20 text-yellow-300 animate-pulse" : "bg-white/10 text-slate-300"}`}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentPlayer.color }} />
            {isMyTurn ? "Your Turn!" : `${currentPlayer.name}'s Turn`}
          </div>
        )}

        <button
          onClick={onLeave}
          className="text-slate-500 hover:text-red-400 transition-colors text-sm px-2 py-1"
        >
          ✕ Leave
        </button>
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row flex-1 gap-4 p-4">

        {/* Board */}
        <div className="flex-1 flex items-start justify-center">
          <Board players={players} highlightSquare={highlightSquare} />
        </div>

        {/* Side panel */}
        <div className="lg:w-72 flex flex-col gap-4">

          {/* Players */}
          <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Players</h3>
            <div className="flex flex-col gap-2">
              {players.map((p, i) => {
                const isActive = gameState?.currentPlayerIndex === i;
                return (
                  <div
                    key={p.id || i}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                      ${isActive ? "bg-white/20 ring-2 ring-yellow-400/60" : "bg-white/5"}`}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold text-sm truncate">{p.name}</div>
                      <div className="text-slate-400 text-xs">
                        Square {p.position === 0 ? "Start" : p.position}
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dice panel */}
          <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-4">
            {/* Turn status */}
            <div className="mb-3 text-center">
              <p className={`text-sm font-bold ${isMyTurn ? "text-yellow-300" : "text-slate-400"}`}>
                {isMyTurn ? "🎯 Your turn — roll the dice!" : `⏳ Waiting for ${currentPlayer?.name ?? "opponent"}…`}
              </p>
            </div>

            {/* Last roll display */}
            {gameState?.diceValue != null && (
              <div className="mb-3 flex items-center justify-center gap-2">
                <span className="text-slate-400 text-xs uppercase tracking-widest">Last roll</span>
                <span className="text-white font-black text-xl leading-none">{gameState.diceValue}</span>
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
              <div className="mt-3 text-center px-3 py-2 rounded-lg bg-yellow-400/20 text-yellow-300 text-sm font-bold">
                🎉 Rolled a 6 — Roll again!
              </div>
            )}
          </div>

          {/* Event log */}
          <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-4 flex-1">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Game Log</h3>
            {events.length > 0
              ? <EventLog events={events} />
              : <p className="text-slate-500 text-sm">No moves yet. Roll the dice!</p>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
