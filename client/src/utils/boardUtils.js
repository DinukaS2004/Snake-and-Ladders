// Snakes and ladders matching server gameLogic.js
export const SNAKES = {
  99: 54, 92: 75, 87: 24, 62: 19, 64: 60,
  56: 53, 54: 34, 49: 11, 46: 25, 32: 6, 16: 6,
};

export const LADDERS = {
  2: 38, 7: 14, 8: 30, 28: 84, 36: 44,
  51: 67, 71: 90, 78: 98,
};

// Convert square number (1-100) to grid {row, col} (0-indexed, row 0 = top)
export function squareToGrid(square) {
  const idx = square - 1;
  const boardRow = Math.floor(idx / 10); // 0 = bottom row of board
  const boardCol = idx % 10;
  const col = boardRow % 2 === 0 ? boardCol : 9 - boardCol;
  const row = 9 - boardRow; // flip so row 0 is top in CSS grid
  return { row, col };
}

// Center pixel position inside a 1000×1000 SVG viewBox
export function squareToSVG(square) {
  const { row, col } = squareToGrid(square);
  return {
    x: col * 100 + 50,
    y: row * 100 + 50,
  };
}

// Pastel color palette for board cells — matches the colorful classic board
const PALETTE = [
  "#FDE68A", // yellow
  "#FCA5A5", // red-pink
  "#A7F3D0", // mint green
  "#BAE6FD", // sky blue
  "#DDD6FE", // lavender
  "#FED7AA", // peach
  "#D1FAE5", // light green
  "#FEF3C7", // cream yellow
  "#E0F2FE", // pale blue
  "#FCE7F3", // pale pink
  "#ECFCCB", // lime
  "#FFE4E6", // blush
  "#E0E7FF", // periwinkle
  "#FEF9C3", // pale yellow
  "#F0FDF4", // near white green
  "#FFF7ED", // near white orange
];

export function getCellColor(square) {
  const { row, col } = squareToGrid(square);
  return PALETTE[(row * 3 + col * 7 + row + col) % PALETTE.length];
}

// Build a smooth cubic bezier snake path between two squares
export function buildSnakePath(headSq, tailSq) {
  const h = squareToSVG(headSq);
  const t = squareToSVG(tailSq);
  const dx = t.x - h.x;
  const dy = t.y - h.y;
  const cx1 = h.x + dx * 0.3 + (dy > 0 ? 60 : -60);
  const cy1 = h.y + dy * 0.2;
  const cx2 = t.x - dx * 0.3 + (dy > 0 ? -60 : 60);
  const cy2 = t.y - dy * 0.2;
  return `M ${h.x} ${h.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${t.x} ${t.y}`;
}

// Snake colors per snake for visual variety
export const SNAKE_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6",
  "#f59e0b", "#10b981", "#6366f1",
];
