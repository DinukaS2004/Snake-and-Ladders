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
  getRoomBySocketId,
  initGameState,
} = require("./roomManager");

const {
  rollDice,
  movePlayer,
  isExtraTurn,
  TURN_TIMER_SECONDS,
} = require("./gameLogic");

// ─── Express + HTTP ─────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// ─── Socket.io ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ─── Health check endpoint ───────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok", timestamp: Date.now() }));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildRoomPayload(room) {
  return {
    roomCode: room.roomCode,
    roomName: room.roomName,
    status: room.status,
    players: room.players.map((p) => ({
      id: p.id,
      socketId: p.socketId,
      name: p.name,
      position: p.position,
      index: p.index,
      color: p.color,
      isCreator: p.isCreator,
    })),
    gameState: room.gameState,
  };
}

function startTurnTimer(room) {
  // Clear any existing timer
  if (room.turnTimer) {
    clearInterval(room.turnTimer);
    room.turnTimer = null;
  }

  if (!room.gameState || room.gameState.winner) return;

  room.gameState.timerSeconds = TURN_TIMER_SECONDS;

  room.turnTimer = setInterval(() => {
    if (!room.gameState || room.gameState.winner) {
      clearInterval(room.turnTimer);
      room.turnTimer = null;
      return;
    }

    room.gameState.timerSeconds -= 1;

    // Broadcast timer tick
    io.to(room.roomCode).emit("timer-tick", {
      timerSeconds: room.gameState.timerSeconds,
      currentPlayerIndex: room.gameState.currentPlayerIndex,
    });

    // Time's up — auto-roll for current player
    if (room.gameState.timerSeconds <= 0) {
      clearInterval(room.turnTimer);
      room.turnTimer = null;
      autoRoll(room);
    }
  }, 1000);
}

function autoRoll(room) {
  if (!room.gameState || room.gameState.winner) return;

  const currentPlayer = room.players[room.gameState.currentPlayerIndex];
  if (!currentPlayer) return;

  processDiceRoll(room, currentPlayer.socketId, true);
}

function processDiceRoll(room, socketId, isAutoRoll = false) {
  if (!room.gameState || room.gameState.winner) return;

  const currentPlayer = room.players[room.gameState.currentPlayerIndex];
  if (!currentPlayer) return;

  // Only current player can roll (unless auto-roll)
  if (!isAutoRoll && currentPlayer.socketId !== socketId) {
    io.to(socketId).emit("error", { message: "Not your turn!" });
    return;
  }

  const dice = rollDice();
  room.gameState.diceValue = dice;

  const result = movePlayer(currentPlayer.position, dice);
  currentPlayer.position = result.position;
  room.gameState.lastEvent = {
    playerName: currentPlayer.name,
    dice,
    ...result,
    isAutoRoll,
  };

  // Check win
  if (result.event === "win") {
    room.gameState.winner = currentPlayer.index;
    room.status = "finished";

    if (room.turnTimer) {
      clearInterval(room.turnTimer);
      room.turnTimer = null;
    }

    io.to(room.roomCode).emit("game-update", buildRoomPayload(room));
    io.to(room.roomCode).emit("game-over", {
      winner: currentPlayer.name,
      winnerIndex: currentPlayer.index,
    });
    return;
  }

  // Extra turn on rolling 6
  const extraTurn = isExtraTurn(dice) && result.event !== "overshoot";
  if (!extraTurn) {
    room.gameState.currentPlayerIndex =
      (room.gameState.currentPlayerIndex + 1) % room.players.length;
  }

  room.gameState.turnCount += 1;
  room.gameState.timerSeconds = TURN_TIMER_SECONDS;
  room.gameState.extraTurn = extraTurn;

  io.to(room.roomCode).emit("game-update", buildRoomPayload(room));

  // Restart timer for next turn
  startTurnTimer(room);
}

// ─── Socket Events ────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[+] Socket connected: ${socket.id}`);

  // ── CREATE ROOM ────────────────────────────────────────────────────────────
  socket.on("create-room", ({ roomName, password, playerName }, callback) => {
    if (!roomName || !password || !playerName) {
      return callback({ error: "Room name, password, and player name are required." });
    }
    if (roomName.trim().length < 2) {
      return callback({ error: "Room name must be at least 2 characters." });
    }
    if (password.trim().length < 4) {
      return callback({ error: "Password must be at least 4 characters." });
    }

    const room = createRoom(roomName.trim(), password.trim(), socket.id);
    const result = addPlayerToRoom(room.roomCode, socket.id, playerName.trim());

    if (result.error) {
      return callback({ error: result.error });
    }

    socket.join(room.roomCode);
    console.log(`[Room] Created: ${room.roomCode} by ${playerName}`);

    callback({ success: true, room: buildRoomPayload(room), player: result.player });
  });

  // ── JOIN ROOM ──────────────────────────────────────────────────────────────
  socket.on("join-room", ({ roomCode, password, playerName }, callback) => {
    if (!roomCode || !password || !playerName) {
      return callback({ error: "Room code, password, and player name are required." });
    }

    const room = getRoom(roomCode.toUpperCase());
    if (!room) {
      return callback({ error: "Room not found. Check the room code." });
    }
    if (room.password !== password.trim()) {
      return callback({ error: "Incorrect password." });
    }
    if (room.status !== "waiting") {
      return callback({ error: "Game already in progress." });
    }
    if (room.players.length >= 2) {
      return callback({ error: "Room is full." });
    }

    const result = addPlayerToRoom(room.roomCode, socket.id, playerName.trim());
    if (result.error) {
      return callback({ error: result.error });
    }

    socket.join(room.roomCode);
    console.log(`[Room] ${playerName} joined: ${room.roomCode}`);

    // Notify both players
    callback({ success: true, room: buildRoomPayload(room), player: result.player });
    socket.to(room.roomCode).emit("player-joined", {
      room: buildRoomPayload(room),
      playerName: playerName.trim(),
    });
  });

  // ── START GAME ─────────────────────────────────────────────────────────────
  socket.on("start-game", ({ roomCode }, callback) => {
    const room = getRoom(roomCode);
    if (!room) return callback({ error: "Room not found." });
    if (room.creatorSocketId !== socket.id) {
      return callback({ error: "Only the room creator can start the game." });
    }
    if (room.players.length < 2) {
      return callback({ error: "Waiting for second player to join." });
    }
    if (room.status !== "waiting") {
      return callback({ error: "Game already started." });
    }

    initGameState(room);
    console.log(`[Game] Started in room: ${roomCode}`);

    io.to(roomCode).emit("game-started", buildRoomPayload(room));
    callback({ success: true });

    // Start the first turn timer
    startTurnTimer(room);
  });

  // ── ROLL DICE ──────────────────────────────────────────────────────────────
  socket.on("roll-dice", ({ roomCode }, callback) => {
    const room = getRoom(roomCode);
    if (!room) return callback ? callback({ error: "Room not found." }) : null;
    if (room.status !== "playing") {
      return callback ? callback({ error: "Game is not in progress." }) : null;
    }

    processDiceRoll(room, socket.id);
    if (callback) callback({ success: true });
  });

  // ── PLAY AGAIN ─────────────────────────────────────────────────────────────
  socket.on("play-again", ({ roomCode }, callback) => {
    const room = getRoom(roomCode);
    if (!room) return callback({ error: "Room not found." });
    if (room.creatorSocketId !== socket.id) {
      return callback({ error: "Only the room creator can restart." });
    }

    initGameState(room);
    room.status = "playing";

    console.log(`[Game] Restarted in room: ${roomCode}`);
    io.to(roomCode).emit("game-started", buildRoomPayload(room));
    callback({ success: true });

    startTurnTimer(room);
  });

  // ── DISCONNECT ─────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log(`[-] Socket disconnected: ${socket.id}`);

    const result = removePlayerFromRoom(socket.id);
    if (!result) return;

    const { roomCode, room } = result;

    if (room.players.length === 0) {
      // Last player left — clean up room
      deleteRoom(roomCode);
      console.log(`[Room] Deleted empty room: ${roomCode}`);
    } else {
      // Notify remaining player
      if (room.status === "playing") {
        room.status = "waiting";
        if (room.turnTimer) {
          clearInterval(room.turnTimer);
          room.turnTimer = null;
        }
      }
      io.to(roomCode).emit("player-disconnected", {
        room: buildRoomPayload(room),
        message: "Opponent disconnected. Waiting for reconnect...",
      });
    }
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🐍 Snake & Ladders Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});
