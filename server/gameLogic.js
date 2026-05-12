// Standard Snake & Ladders board positions (matching classic board from image)
// Snakes: { head: tail } — land on head, slide down to tail
const SNAKES = {
  99: 54,
  92: 75,
  87: 24,
  62: 19,
  64: 60,
  56: 53,
  54: 34,
  49: 11,
  46: 25,
  32: 6,
  16: 6,
};

// Ladders: { bottom: top } — land on bottom, climb up to top
const LADDERS = {
  2: 38,
  7: 14,
  8: 30,
  28: 84,
  36: 44,
  51: 67,
  71: 90,
  78: 98,
};

const BOARD_SIZE = 100;

function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

function movePlayer(currentPos, diceValue) {
  const newPos = currentPos + diceValue;

  // Overshoot — stay in place
  if (newPos > BOARD_SIZE) {
    return {
      position: currentPos,
      event: "overshoot",
      message: `Overshot! Needs exact roll to reach 100. Stay at ${currentPos}.`,
    };
  }

  // Exact win
  if (newPos === BOARD_SIZE) {
    return {
      position: BOARD_SIZE,
      event: "win",
      message: `Reached 100! You WIN!`,
    };
  }

  // Check snake
  if (SNAKES[newPos]) {
    const tail = SNAKES[newPos];
    return {
      position: tail,
      event: "snake",
      message: `Snake! Slid from ${newPos} down to ${tail}.`,
      from: newPos,
    };
  }

  // Check ladder
  if (LADDERS[newPos]) {
    const top = LADDERS[newPos];
    return {
      position: top,
      event: "ladder",
      message: `Ladder! Climbed from ${newPos} up to ${top}.`,
      from: newPos,
    };
  }

  return {
    position: newPos,
    event: "normal",
    message: `Moved to ${newPos}.`,
  };
}

// Returns true if player should get an extra turn (rolled a 6)
function isExtraTurn(diceValue) {
  return diceValue === 6;
}

module.exports = {
  SNAKES,
  LADDERS,
  BOARD_SIZE,
  rollDice,
  movePlayer,
  isExtraTurn,
};
