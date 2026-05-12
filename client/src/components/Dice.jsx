import React, { useState, useEffect } from "react";

const DOT_POSITIONS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

export default function Dice({ value, rolling, disabled, onRoll }) {
  const [displayValue, setDisplayValue] = useState(value || 1);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (rolling) {
      setAnimating(true);
      let count = 0;
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
        count++;
        if (count > 8) {
          clearInterval(interval);
          setDisplayValue(value);
          setAnimating(false);
        }
      }, 80);
      return () => clearInterval(interval);
    } else if (value) {
      setDisplayValue(value);
    }
  }, [rolling, value]);

  const dots = DOT_POSITIONS[displayValue] || DOT_POSITIONS[1];

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onRoll}
        disabled={disabled || animating}
        className={`
          relative w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-2xl
          transition-all duration-200 select-none
          ${animating ? "animate-dice-roll" : ""}
          ${disabled || animating
            ? "bg-gray-300 cursor-not-allowed shadow-inner"
            : "bg-white hover:scale-105 active:scale-95 cursor-pointer hover:shadow-yellow-400/50 hover:shadow-xl"
          }
        `}
        style={{ border: "3px solid #1e293b" }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-2">
          {dots.map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={disabled || animating ? 7 : 8}
              fill={disabled ? "#9ca3af" : "#1e293b"}
            />
          ))}
        </svg>
      </button>
      <span className={`text-sm font-semibold ${disabled ? "text-gray-400" : "text-white"}`}>
        {disabled ? "Wait..." : animating ? "Rolling..." : "Roll Dice"}
      </span>
    </div>
  );
}
