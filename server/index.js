const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const {
  createRoom,
  getRoom,
  deleteRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  markPlayerDisconnected,
  rejoinPlayer,
  getRoomBySocketId,
  initGameState,
} = require("./roomManager");

const { rollDice, movePlayer, isExtraTurn } = require("./gameLogic");

// ─── Express + HTTP ───────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Grace-period timers: playerId → timeoutId
// If a player disconnects mid-game and doesn't rejoin within 2 minutes,
// they are permanently removed and the room is cleaned up.
const disconnectTimers = new Map();
const REJOIN_GRACE_MS = 2 * 60 * 1000; // 2 minutes

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok", timestamp: Date.now() }));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPlayerPayload(player) {
  return {
    id:        player.id,
    socketId:  player.socketId,
    name:      player.name,
    position:  player.position,
    index:     player.index,
    color:     player.color,
    isCreator: player.isCreator,
    connected: player.connected,
  };
}

function buildRoomPayload(room) {
  return {
    roomCode:  room.roomCode,
    roomName:  room.roomName,
    status:    room.status,
    players:   room.players.map(buildPlayerPayload),
    gameState: room.gameState,
  };
}

function processDiceRoll(room, socketId) {
  if (!room.gameState || room.gameState.winner) return false;

  const currentPlayer = room.players[room.gameState.currentPlayerIndex];
  if (!currentPlayer) return false;

  if (currentPlayer.socketId !== socketId) {
    io.to(socketId).emit("error", { message: "Not your turn!" });
    return false;
  }

  const dice = rollDice();
  room.gameState.diceValue = dice;

  const result = movePlayer(currentPlayer.position, dice);
  currentPlayer.position = result.position;
  room.gameState.lastEvent = { playerName: currentPlayer.name, dice, ...result };

  // Win
  if (result.event === "win") {
    room.gameState.winner = currentPlayer.index;
    room.status = "finished";
    io.to(room.roomCode).emit("game-update", buildRoomPayload(room));
    io.to(room.roomCode).emit("game-over", {
      winner: currentPlayer.name,
      winnerIndex: currentPlayer.index,
    });
    return true;
  }

  // Extra turn on 6 (not on overshoot)
  const extraTurn = isExtraTurn(dice) && result.event !== "overshoot";
  if (!extraTurn) {
    room.gameState.currentPlayerIndex =
      (room.gameState.currentPlayerIndex + 1) % room.players.length;
  }

  room.gameState.turnCount += 1;
  room.gameState.extraTurn = extraTurn;

  io.to(room.roomCode).emit("game-update", buildRoomPayload(room));
  return true;
}

// ─── Socket Events ────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[+] Connected: ${socket.id}`);

  // ── CREATE ROOM ─────────────────────────────────────────────────────────────
  socket.on("create-room", ({ roomName, password, playerName }, callback) => {
    if (!roomName || !password || !playerName)
      return callback({ error: "Room name, password, and player name are required." });
    if (roomName.trim().length < 2)
      return callback({ error: "Room name must be at least 2 characters." });
    if (password.trim().length < 4)
      return callback({ error: "Password must be at least 4 characters." });

    const room   = createRoom(roomName.trim(), password.trim(), socket.id);
    const result = addPlayerToRoom(room.roomCode, socket.id, playerName.trim());

    if (result.error) return callback({ error: result.error });

    socket.join(room.roomCode);
    console.log(`[Room] Created: ${room.roomCode} by ${playerName}`);

    callback({ success: true, room: buildRoomPayload(room), player: buildPlayerPayload(result.player) });
  });

  // ── JOIN ROOM ────────────────────────────────────────────────────────────────
  socket.on("join-room", ({ roomCode, password, playerName }, callback) => {
    if (!roomCode || !password || !playerName)
      return callback({ error: "Room code, password, and player name are required." });

    const room = getRoom(roomCode.toUpperCase());
    if (!room)           return callback({ error: "Room not found. Check the room code." });
    if (room.password !== password.trim()) return callback({ error: "Incorrect password." });
    if (room.status !== "waiting")         return callback({ error: "Game already in progress." });
    if (room.players.length >= 2)          return callback({ error: "Room is full." });

    const result = addPlayerToRoom(room.roomCode, socket.id, playerName.trim());
    if (result.error) return callback({ error: result.error });

    socket.join(room.roomCode);
    console.log(`[Room] ${playerName} joined: ${room.roomCode}`);

    callback({ success: true, room: buildRoomPayload(room), player: buildPlayerPayload(result.player) });
    socket.to(room.roomCode).emit("player-joined", {
      room: buildRoomPayload(room),
      playerName: playerName.trim(),
    });
  });

  // ── REJOIN ROOM (after page refresh / network drop) ───────────────────────
  socket.on("rejoin-room", ({ roomCode, playerId }, callback) => {
    if (!roomCode || !playerId)
      return callback({ error: "Missing roomCode or playerId." });

    const result = rejoinPlayer(roomCode.toUpperCase(), playerId, socket.id);
    if (result.error) return callback({ error: result.error });

    const { player, room } = result;

    // Cancel the cleanup timer if it was running
    if (disconnectTimers.has(player.id)) {
      clearTimeout(disconnectTimers.get(player.id));
      disconnectTimers.delete(player.id);
      console.log(`[Rejoin] Timer cancelled for ${player.name}`);
    }

    socket.join(room.roomCode);
    console.log(`[Rejoin] ${player.name} rejoined room ${room.roomCode}`);

    // Tell the other player their opponent is back
    socket.to(room.roomCode).emit("player-rejoined", {
      room: buildRoomPayload(room),
      playerName: player.name,
    });

    callback({ success: true, room: buildRoomPayload(room), player: buildPlayerPayload(player) });
  });

  // ── START GAME ───────────────────────────────────────────────────────────────
  socket.on("start-game", ({ roomCode }, callback) => {
    const room = getRoom(roomCode);
    if (!room)                            return callback({ error: "Room not found." });
    if (room.creatorSocketId !== socket.id) return callback({ error: "Only the host can start." });
    if (room.players.length < 2)          return callback({ error: "Waiting for second player." });
    if (room.status !== "waiting")        return callback({ error: "Game already started." });

    initGameState(room);
    console.log(`[Game] Started in room: ${roomCode}`);

    io.to(roomCode).emit("game-started", buildRoomPayload(room));
    callback({ success: true });
  });

  // ── ROLL DICE ────────────────────────────────────────────────────────────────
  socket.on("roll-dice", ({ roomCode }, callback) => {
    const room = getRoom(roomCode);
    if (!room)                   return callback?.({ error: "Room not found." });
    if (room.status !== "playing") return callback?.({ error: "Game is not in progress." });

    const ok = processDiceRoll(room, socket.id);
    callback?.({ success: ok, error: ok ? undefined : "Not your turn." });
  });

  // ── PLAY AGAIN ───────────────────────────────────────────────────────────────
  socket.on("play-again", ({ roomCode }, callback) => {
    const room = getRoom(roomCode);
    if (!room)                              return callback?.({ error: "Room not found." });
    if (room.creatorSocketId !== socket.id) return callback?.({ error: "Only the host can restart." });

    // Re-check both players are connected before restarting
    const allConnected = room.players.every((p) => p.connected);
    if (!allConnected) return callback?.({ error: "Opponent is not connected. Wait for them to rejoin." });

    initGameState(room);
    console.log(`[Game] Restarted in room: ${roomCode}`);

    io.to(roomCode).emit("game-started", buildRoomPayload(room));
    callback?.({ success: true });
  });

  // ── DISCONNECT ───────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log(`[-] Disconnected: ${socket.id}`);

    const room = getRoomBySocketId(socket.id);
    if (!room) return;

    const roomCode = room.roomCode;
    const player   = room.players.find((p) => p.socketId === socket.id);
    if (!player) return;

    // Soft disconnect for ALL states so a page-refresh can always rejoin.
    // Grace period is shorter in the waiting room (page refreshes reconnect fast).
    const graceMs = (room.status === "playing" || room.status === "finished")
      ? REJOIN_GRACE_MS   // 2 minutes during an active game
      : 30_000;           // 30 seconds in the waiting room

    markPlayerDisconnected(socket.id);

    socket.to(roomCode).emit("player-disconnected", {
      room: buildRoomPayload(room),
      message: room.status === "waiting"
        ? `${player.name} disconnected — reconnecting...`
        : `${player.name} disconnected. Waiting up to 2 min to reconnect...`,
    });

    const timer = setTimeout(() => {
      disconnectTimers.delete(player.id);

      const idx = room.players.findIndex((p) => p.id === player.id);
      if (idx !== -1) room.players.splice(idx, 1);

      if (room.players.length === 0) {
        deleteRoom(roomCode);
        console.log(`[Room] Abandoned room deleted: ${roomCode}`);
      } else {
        io.to(roomCode).emit("player-left", {
          room: buildRoomPayload(room),
          message: `${player.name} left${room.status === "waiting" ? " the room." : " the game."}`,
        });
        console.log(`[Room] ${player.name} removed after grace period from ${roomCode}`);
      }
    }, graceMs);

    disconnectTimers.set(player.id, timer);
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3020;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🐍 Snake & Ladders Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
