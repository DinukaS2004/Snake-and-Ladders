const { v4: uuidv4 } = require("uuid");

// rooms: Map<roomCode, RoomState>
const rooms = new Map();

function generateRoomCode() {
  // 6-char uppercase alphanumeric
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom(roomName, password, creatorSocketId) {
  let roomCode = generateRoomCode();
  // Ensure unique code
  while (rooms.has(roomCode)) {
    roomCode = generateRoomCode();
  }

  const room = {
    roomCode,
    roomName,
    password,
    status: "waiting", // waiting | playing | finished
    creatorSocketId,
    players: [],       // max 2
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

  const playerIndex = room.players.length; // 0 = Player 1, 1 = Player 2
  const player = {
    id: uuidv4(),
    socketId,
    name: playerName,
    position: 0,
    index: playerIndex,
    color: playerIndex === 0 ? "#ef4444" : "#3b82f6", // red, blue
    isCreator: socketId === room.creatorSocketId,
  };

  room.players.push(player);
  return { player, room };
}

function removePlayerFromRoom(socketId) {
  for (const [roomCode, room] of rooms.entries()) {
    const idx = room.players.findIndex((p) => p.socketId === socketId);
    if (idx !== -1) {
      room.players.splice(idx, 1);
      return { roomCode, room };
    }
  }
  return null;
}

function getRoomBySocketId(socketId) {
  for (const [roomCode, room] of rooms.entries()) {
    if (room.players.some((p) => p.socketId === socketId)) {
      return room;
    }
  }
  return null;
}

function initGameState(room) {
  room.gameState = {
    currentPlayerIndex: 0,   // index into room.players
    turnCount: 0,
    diceValue: null,
    lastEvent: null,
    winner: null,
  };
  room.status = "playing";
  // Reset positions
  room.players.forEach((p) => (p.position = 0));
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  deleteRoom,
  addPlayerToRoom,
  removePlayerFromRoom,
  getRoomBySocketId,
  initGameState,
};
