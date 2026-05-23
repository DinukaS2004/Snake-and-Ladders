'use client';
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "./hooks/useSocket.js";
import LobbyScreen from "./screens/LobbyScreen.jsx";
import RoomScreen from "./screens/RoomScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";

const SCREENS = { LOBBY: "lobby", ROOM: "room", GAME: "game" };
const SESSION_KEY = "snl_session";

// ── Session helpers (sessionStorage — cleared when tab closes) ────────────────
function saveSession(roomCode, playerId) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ roomCode, playerId })); }
  catch { /* storage unavailable */ }
}
function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}
function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

// ── Toast style map ───────────────────────────────────────────────────────────
const TOAST = {
  success: { border: "rgba(46,184,114,0.45)",  text: "#2EB872", icon: "✦" },
  danger:  { border: "rgba(232,69,69,0.45)",   text: "#E84545", icon: "⚠" },
  warning: { border: "rgba(240,183,50,0.45)",  text: "#F0B732", icon: "◆" },
  info:    { border: "rgba(122,158,135,0.35)", text: "#7A9E87", icon: "◈" },
};

export default function App() {
  const { connected, emit, on } = useSocket();
  const [screen,    setScreen]    = useState(SCREENS.LOBBY);
  const [room,      setRoom]      = useState(null);
  const [myPlayer,  setMyPlayer]  = useState(null);
  const [notif,     setNotif]     = useState(null);

  // Only attempt auto-rejoin once per page load
  const rejoinAttemptedRef = useRef(false);

  function showNotif(msg, type = "info") {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3500);
  }

  // ── Auto-rejoin on first connection ──────────────────────────────────────────
  useEffect(() => {
    if (!connected || rejoinAttemptedRef.current) return;
    rejoinAttemptedRef.current = true;

    const session = loadSession();
    if (!session) return;

    emit("rejoin-room", { roomCode: session.roomCode, playerId: session.playerId })
      .then((res) => {
        if (res?.error) {
          clearSession();
          showNotif("Previous session expired. Start a new game.", "info");
          return;
        }
        setRoom(res.room);
        setMyPlayer(res.player);
        // Restore the correct screen based on saved room status
        if (res.room.status === "playing" || res.room.status === "finished") {
          setScreen(SCREENS.GAME);
        } else {
          setScreen(SCREENS.ROOM);
        }
        showNotif("Reconnected to your game!", "success");
      });
  }, [connected, emit]);

  // ── Socket listeners ──────────────────────────────────────────────────────────
  useEffect(() => {
    const cleanups = [
      on("player-joined", ({ room: r, playerName }) => {
        setRoom(r);
        showNotif(`${playerName} joined the room!`, "success");
      }),

      on("game-started", (r) => {
        setRoom(r);
        setScreen(SCREENS.GAME);
        showNotif("Game started! Good luck!", "success");
      }),

      on("game-update", (r) => {
        setRoom(r);
        const ev = r.gameState?.lastEvent;
        if (ev) {
          if (ev.event === "snake")     showNotif(`🐍 ${ev.message}`, "danger");
          else if (ev.event === "ladder") showNotif(`🪜 ${ev.message}`, "success");
          else if (ev.event === "overshoot") showNotif(`🔄 ${ev.message}`, "warning");
        }
      }),

      on("game-over", ({ winner }) => {
        showNotif(`🏆 ${winner} wins!`, "success");
      }),

      // Opponent disconnected mid-game — stay on game screen, game is paused
      on("player-disconnected", ({ room: r, message }) => {
        if (r) setRoom(r);
        showNotif(`⚠️ ${message}`, "warning");
        // Only drop back to room screen if we're not in an active/finished game
        if (!r || (r.status !== "playing" && r.status !== "finished")) {
          setScreen(SCREENS.ROOM);
        }
      }),

      // Opponent came back after a disconnect
      on("player-rejoined", ({ room: r, playerName }) => {
        setRoom(r);
        showNotif(`${playerName} reconnected!`, "success");
      }),

      // Grace period expired — opponent is gone for good
      on("player-left", ({ room: r, message }) => {
        if (r) setRoom(r);
        showNotif(`${message} The game has ended.`, "danger");
        clearSession();
        setTimeout(() => {
          setRoom(null);
          setMyPlayer(null);
          setScreen(SCREENS.LOBBY);
        }, 3000);
      }),
    ];
    return () => cleanups.forEach((fn) => fn && fn());
  }, [on]);

  // ── Actions ───────────────────────────────────────────────────────────────────
  const handleCreateRoom = useCallback(async (roomName, password, playerName) => {
    const res = await emit("create-room", { roomName, password, playerName });
    if (res?.error) return res;
    setRoom(res.room);
    setMyPlayer(res.player);
    saveSession(res.room.roomCode, res.player.id);
    setScreen(SCREENS.ROOM);
    return res;
  }, [emit]);

  const handleJoinRoom = useCallback(async (roomCode, password, playerName) => {
    const res = await emit("join-room", { roomCode, password, playerName });
    if (res?.error) return res;
    setRoom(res.room);
    setMyPlayer(res.player);
    saveSession(res.room.roomCode, res.player.id);
    setScreen(SCREENS.ROOM);
    return res;
  }, [emit]);

  const handleStartGame = useCallback(async () => {
    const res = await emit("start-game", { roomCode: room.roomCode });
    if (res?.error) showNotif(res.error, "danger");
  }, [emit, room]);

  const handleRollDice = useCallback(async () => {
    return await emit("roll-dice", { roomCode: room.roomCode });
  }, [emit, room]);

  const handlePlayAgain = useCallback(async () => {
    const res = await emit("play-again", { roomCode: room.roomCode });
    if (res?.error) showNotif(res.error, "danger");
  }, [emit, room]);

  const handleLeave = useCallback(() => {
    clearSession();
    setRoom(null);
    setMyPlayer(null);
    setScreen(SCREENS.LOBBY);
    rejoinAttemptedRef.current = false; // allow rejoin attempt if they create a new room
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────────
  const toastStyle = notif ? (TOAST[notif.type] || TOAST.info) : null;

  return (
    <div className="relative">
      {/* Toast notification */}
      {notif && toastStyle && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl animate-slide-in"
          style={{
            background: "rgba(8,22,12,0.92)",
            border: `1px solid ${toastStyle.border}`,
            backdropFilter: "blur(16px)",
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${toastStyle.border}`,
            minWidth: 220,
          }}
        >
          <span style={{ color: toastStyle.text, fontSize: "1rem" }}>{toastStyle.icon}</span>
          <span className="font-semibold text-sm" style={{ color: toastStyle.text, fontFamily: "var(--font-body)" }}>
            {notif.msg}
          </span>
        </div>
      )}

      {screen === SCREENS.LOBBY && (
        <LobbyScreen connected={connected} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
      )}
      {screen === SCREENS.ROOM && room && (
        <RoomScreen room={room} myPlayer={myPlayer} onStartGame={handleStartGame} onLeave={handleLeave} />
      )}
      {screen === SCREENS.GAME && room && myPlayer && (
        <GameScreen
          room={room}
          myPlayer={myPlayer}
          onRoll={handleRollDice}
          onPlayAgain={handlePlayAgain}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}
