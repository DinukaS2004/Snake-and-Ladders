import React, { useState, useEffect, useCallback } from "react";
import { useSocket } from "./hooks/useSocket.js";
import LobbyScreen from "./screens/LobbyScreen.jsx";
import RoomScreen from "./screens/RoomScreen.jsx";
import GameScreen from "./screens/GameScreen.jsx";

// Screen states
const SCREENS = { LOBBY: "lobby", ROOM: "room", GAME: "game" };

export default function App() {
  const { connected, emit, on, off } = useSocket();
  const [screen, setScreen] = useState(SCREENS.LOBBY);
  const [room, setRoom] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [notification, setNotification] = useState(null);

  function showNotif(msg, type = "info") {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }

  // ── Socket listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    const cleanups = [
      on("player-joined", ({ room: updatedRoom, playerName }) => {
        setRoom(updatedRoom);
        showNotif(`${playerName} joined the room!`, "success");
      }),

      on("game-started", (updatedRoom) => {
        setRoom(updatedRoom);
        setScreen(SCREENS.GAME);
        showNotif("Game started! Good luck!", "success");
      }),

      on("game-update", (updatedRoom) => {
        setRoom(updatedRoom);
        const lastEvent = updatedRoom.gameState?.lastEvent;
        if (lastEvent) {
          if (lastEvent.event === "snake") showNotif(`🐍 ${lastEvent.message}`, "danger");
          else if (lastEvent.event === "ladder") showNotif(`🪜 ${lastEvent.message}`, "success");
          else if (lastEvent.event === "overshoot") showNotif(`🔄 ${lastEvent.message}`, "warning");
        }
      }),

      on("game-over", ({ winner }) => {
        showNotif(`🏆 ${winner} wins!`, "success");
      }),

      on("player-disconnected", ({ message }) => {
        showNotif(`⚠️ ${message}`, "warning");
        setScreen(SCREENS.ROOM);
      }),
    ];

    return () => cleanups.forEach((fn) => fn && fn());
  }, [on]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleCreateRoom = useCallback(async (roomName, password, playerName) => {
    const res = await emit("create-room", { roomName, password, playerName });
    if (res?.error) return res;
    setRoom(res.room);
    setMyPlayer(res.player);
    setScreen(SCREENS.ROOM);
    return res;
  }, [emit]);

  const handleJoinRoom = useCallback(async (roomCode, password, playerName) => {
    const res = await emit("join-room", { roomCode, password, playerName });
    if (res?.error) return res;
    setRoom(res.room);
    setMyPlayer(res.player);
    setScreen(SCREENS.ROOM);
    return res;
  }, [emit]);

  const handleStartGame = useCallback(async () => {
    const res = await emit("start-game", { roomCode: room.roomCode });
    if (res?.error) showNotif(res.error, "danger");
  }, [emit, room]);

  const handleRollDice = useCallback(async () => {
    await emit("roll-dice", { roomCode: room.roomCode });
  }, [emit, room]);

  const handlePlayAgain = useCallback(async () => {
    const res = await emit("play-again", { roomCode: room.roomCode });
    if (res?.error) showNotif(res.error, "danger");
  }, [emit, room]);

  const handleLeave = useCallback(() => {
    setRoom(null);
    setMyPlayer(null);
    setScreen(SCREENS.LOBBY);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Global notification toast */}
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl
          shadow-2xl text-white font-semibold text-sm animate-slide-in
          ${notification.type === "success" ? "bg-green-600" : ""}
          ${notification.type === "danger"  ? "bg-red-600"   : ""}
          ${notification.type === "warning" ? "bg-yellow-600 text-slate-900" : ""}
          ${notification.type === "info"    ? "bg-slate-700" : ""}
        `}>
          {notification.msg}
        </div>
      )}

      {screen === SCREENS.LOBBY && (
        <LobbyScreen
          connected={connected}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      )}

      {screen === SCREENS.ROOM && room && (
        <RoomScreen
          room={room}
          myPlayer={myPlayer}
          onStartGame={handleStartGame}
          onLeave={handleLeave}
        />
      )}

      {screen === SCREENS.GAME && room && (
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
