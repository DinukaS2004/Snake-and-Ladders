const { v4: uuidv4 } = require("uuid");

// rooms: Map<roomCode, RoomState>
const rooms = new Map();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom(roomName, password, creatorSocketId) {
  let roomCode = generateRoomCode();
  while (rooms.has(roomCode)) roomCode = generateRoomCode();

  const room = {
    roomCode,
    roomName,
    password,
    status: "waiting", // waiting | playing | finished
    creatorSocketId,
    players: [],
    gameState: null,
    createdAt: Date.now(),
  };

  rooms.set(roomCode, room);
  return room;
}

function getRoom(roomCode) {
  return rooms.get(roomCode) || null;
}

function deleteRoom(roomCode) {
  rooms.delete(roomCode);
}

function addPlayerToRoom(roomCode, socketId, playerName) {
  const room = rooms.get(roomCode);
  if (!room) return { error: "Room not found." };
  if (room.players.length >= 2) return { error: "Room is full." };
  if (room.status !== "waiting") return { error: "Game already in progress." };

  const playerIndex = room.players.length;
  const player = {
    id: uuidv4(),          // stable UUID — survives reconnects
    socketId,
    name: playerName,
    position: 0,
    index: playerIndex,
    color: playerIndex === 0 ? "#ef4444" : "#3b82f6",
    isCreator: socketId === room.creatorSocketId,
    connected: true,
  };

  room.players.push(player);
  return { player, room };
}

// Hard removal — used when grace period expires or waiting-room leave
function removePlayerFromRoom(socketId) {
  for (const [roomCode, room] of rooms.entries()) {
    const idx = room.players.findIndex((p) => p.socketId === socketId);
    if (idx !== -1) {
      const [player] = room.players.splice(idx, 1);
      return { roomCode, room, player };
    }
  }
  return null;
}

// Soft disconnect — marks as offline but keeps slot in room
function markPlayerDisconnected(socketId) {
  for (const [roomCode, room] of rooms.entries()) {
    const player = room.players.find((p) => p.socketId === socketId);
    if (player) {
      player.connected = false;
      return { roomCode, room, player };
    }
  }
  return null;
}

// Rejoin: find player by stable UUID, update socket
function rejoinPlayer(roomCode, playerId, newSocketId) {
  const room = rooms.get(roomCode);
  if (!room) return { error: "Room no longer exists." };

  const player = room.players.find((p) => p.id === playerId);
  if (!player) return { error: "You are no longer in this room." };

  player.socketId = newSocketId;
  player.connected = true;

  // Keep creatorSocketId in sync so start/play-again checks still work
  if (player.isCreator) room.creatorSocketId = newSocketId;

  return { player, room };
}

function getRoomBySocketId(socketId) {
  for (const [, room] of rooms.entries()) {
    if (room.players.some((p) => p.socketId === socketId)) return room;
  }
  return null;
}

function initGameState(room) {
  room.gameState = {
    currentPlayerIndex: 0,
    turnCount: 0,
    diceValue: null,
    lastEvent: null,
    winner: null,
    extraTurn: false,   // explicitly initialised — prevents stale value on play-again
  };
  room.status = "playing";
  room.players.forEach((p) => {
    p.position = 0;
    p.connected = true;  // reset connected flag on new game
  });
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  deleteRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  markPlayerDisconnected,
  rejoinPlayer,
  getRoomBySocketId,
  initGameState,
};
