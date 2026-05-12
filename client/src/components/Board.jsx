import React, { useMemo } from "react";
import {
  SNAKES, LADDERS, squareToGrid, squareToSVG,
  getCellColor, buildSnakePath, SNAKE_COLORS,
} from "../utils/boardUtils";

// Build all 100 cells in correct order
function buildCells() {
  const cells = [];
  for (let sq = 1; sq <= 100; sq++) {
    const { row, col } = squareToGrid(sq);
    cells.push({ sq, row, col });
  }
  return cells;
}

// Draw a ladder between two squares
function LadderSVG({ from, to, color }) {
  const f = squareToSVG(from);
  const t = squareToSVG(to);
  const angle = Math.atan2(t.y - f.y, t.x - f.x);
  const perp = angle + Math.PI / 2;
  const offset = 12;
  const numRungs = Math.max(3, Math.round(Math.hypot(t.x - f.x, t.y - f.y) / 60));

  const lx1 = f.x + Math.cos(perp) * offset;
  const ly1 = f.y + Math.sin(perp) * offset;
  const lx2 = t.x + Math.cos(perp) * offset;
  const ly2 = t.y + Math.sin(perp) * offset;
  const rx1 = f.x - Math.cos(perp) * offset;
  const ry1 = f.y - Math.sin(perp) * offset;
  const rx2 = t.x - Math.cos(perp) * offset;
  const ry2 = t.y - Math.sin(perp) * offset;

  const rungs = [];
  for (let i = 0; i <= numRungs; i++) {
    const t_ = i / numRungs;
    const x1 = lx1 + (lx2 - lx1) * t_;
    const y1 = ly1 + (ly2 - ly1) * t_;
    const x2 = rx1 + (rx2 - rx1) * t_;
    const y2 = ry1 + (ry2 - ry1) * t_;
    rungs.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="5" strokeLinecap="round" />);
  }

  return (
    <g opacity="0.85">
      <line x1={lx1} y1={ly1} x2={lx2} y2={ly2} stroke={color} strokeWidth="6" strokeLinecap="round" />
      <line x1={rx1} y1={ry1} x2={rx2} y2={ry2} stroke={color} strokeWidth="6" strokeLinecap="round" />
      {rungs}
    </g>
  );
}

// Draw a colorful snake
function SnakeSVG({ head, tail, color }) {
  const path = buildSnakePath(head, tail);
  const h = squareToSVG(head);
  const t = squareToSVG(tail);

  return (
    <g>
      {/* Shadow */}
      <path d={path} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="14" strokeLinecap="round" />
      {/* Body */}
      <path d={path} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" />
      {/* Lighter belly */}
      <path d={path} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 16" />
      {/* Head circle */}
      <circle cx={h.x} cy={h.y} r={14} fill={color} stroke="white" strokeWidth="2" />
      {/* Eyes */}
      <circle cx={h.x - 5} cy={h.y - 4} r={3} fill="white" />
      <circle cx={h.x + 5} cy={h.y - 4} r={3} fill="white" />
      <circle cx={h.x - 5} cy={h.y - 4} r={1.5} fill="#1e293b" />
      <circle cx={h.x + 5} cy={h.y - 4} r={1.5} fill="#1e293b" />
      {/* Tongue */}
      <path d={`M ${h.x} ${h.y + 10} L ${h.x - 4} ${h.y + 17} M ${h.x} ${h.y + 10} L ${h.x + 4} ${h.y + 17}`}
        stroke="red" strokeWidth="2" strokeLinecap="round" />
      {/* Tail tip */}
      <circle cx={t.x} cy={t.y} r={5} fill={color} />
    </g>
  );
}

// Player token
function PlayerToken({ square, player, offset = 0 }) {
  if (!square || square === 0) return null;
  const { row, col } = squareToGrid(square);
  const cx = col * 100 + 50 + (offset * 20 - 10);
  const cy = row * 100 + 50;

  return (
    <g className="animate-token-bounce">
      <circle cx={cx} cy={cy} r={16} fill={player.color} stroke="white" strokeWidth="3"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }} />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">
        {player.name.charAt(0).toUpperCase()}
      </text>
    </g>
  );
}

const LADDER_COLORS = ["#92400e", "#78350f", "#a16207", "#166534", "#1e3a5f", "#4c1d95"];

export default function Board({ players = [], highlightSquare = null }) {
  const cells = useMemo(() => buildCells(), []);
  const snakeEntries = useMemo(() => Object.entries(SNAKES).map(([k, v]) => [+k, +v]), []);
  const ladderEntries = useMemo(() => Object.entries(LADDERS).map(([k, v]) => [+k, +v]), []);

  return (
    <div className="relative w-full" style={{ maxWidth: 600 }}>
      {/* Grid */}
      <div
        className="grid rounded-xl overflow-hidden shadow-2xl border-4 border-amber-800"
        style={{ gridTemplateColumns: "repeat(10, 1fr)", gridTemplateRows: "repeat(10, 1fr)" }}
      >
        {cells.map(({ sq, row, col }) => (
          <div
            key={sq}
            className="board-cell"
            style={{
              gridRow: row + 1,
              gridColumn: col + 1,
              backgroundColor: sq === highlightSquare ? "#fbbf24" : getCellColor(sq),
              transition: "background-color 0.4s",
              aspectRatio: "1",
              minHeight: 0,
            }}
          >
            <span className="cell-num">{sq}</span>
          </div>
        ))}
      </div>

      {/* SVG Overlay for snakes, ladders, tokens */}
      <svg
        viewBox="0 0 1000 1000"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ top: 0, left: 0 }}
      >
        {/* Ladders */}
        {ladderEntries.map(([from, to], i) => (
          <LadderSVG key={`l-${from}`} from={from} to={to} color={LADDER_COLORS[i % LADDER_COLORS.length]} />
        ))}

        {/* Snakes */}
        {snakeEntries.map(([head, tail], i) => (
          <SnakeSVG key={`s-${head}`} head={head} tail={tail} color={SNAKE_COLORS[i % SNAKE_COLORS.length]} />
        ))}

        {/* Player tokens */}
        {players.map((player, i) => (
          player.position > 0 && (
            <PlayerToken
              key={player.id || i}
              square={player.position}
              player={player}
              offset={players.filter((p, j) => j < i && p.position === player.position).length}
            />
          )
        ))}
      </svg>
    </div>
  );
}
