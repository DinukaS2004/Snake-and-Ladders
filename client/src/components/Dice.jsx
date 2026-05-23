'use client';
import React, { useState, useEffect, useRef } from "react";

const DOT_POSITIONS = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 22], [72, 22], [28, 50], [72, 50], [28, 78], [72, 78]],
};

const ANIM_TICKS = 8;
const ANIM_MS = 75;

export default function Dice({ value, rolling, disabled, onRoll }) {
  const [displayValue, setDisplayValue] = useState(value || 1);
  const [animating, setAnimating] = useState(false);
  const valueRef = useRef(value || 1);

  useEffect(() => {
    valueRef.current = value || 1;
  }, [value]);

  useEffect(() => {
    if (!rolling) {
      setAnimating(false);
      setDisplayValue(valueRef.current);
      return;
    }
    setAnimating(true);
    let tick = 0;
    const id = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
      tick++;
      if (tick >= ANIM_TICKS) {
        clearInterval(id);
        setDisplayValue(valueRef.current);
        setAnimating(false);
      }
    }, ANIM_MS);
    return () => clearInterval(id);
  }, [rolling]);

  useEffect(() => {
    if (!rolling && !animating) setDisplayValue(value || 1);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const dots = DOT_POSITIONS[displayValue] || DOT_POSITIONS[1];
  const isDisabled = disabled || animating;

  let label = "Tap to Roll";
  if (animating) label = "Rolling…";
  else if (disabled) label = "Wait…";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onRoll}
        disabled={isDisabled}
        className={`relative select-none transition-all duration-150 rounded-2xl ${animating ? "animate-bounce" : ""}`}
        style={{
          width: 88,
          height: 88,
          background: isDisabled && !animating
            ? "rgba(30,50,35,0.6)"
            : "linear-gradient(145deg, #FEFEFE 0%, #E8E8E8 100%)",
          border: isDisabled && !animating
            ? "2px solid rgba(122,158,135,0.15)"
            : "2px solid rgba(240,183,50,0.6)",
          boxShadow: isDisabled && !animating
            ? "inset 0 2px 4px rgba(0,0,0,0.3)"
            : "0 6px 24px rgba(240,183,50,0.25), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8)",
          cursor: isDisabled ? "not-allowed" : "pointer",
          transform: isDisabled ? "none" : undefined,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.transform = "scale(1.08) translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 10px 32px rgba(240,183,50,0.4), 0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 6px 24px rgba(240,183,50,0.25), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8)";
          }
        }}
        onMouseDown={(e) => {
          if (!isDisabled) e.currentTarget.style.transform = "scale(0.94)";
        }}
        onMouseUp={(e) => {
          if (!isDisabled) e.currentTarget.style.transform = "scale(1.08) translateY(-2px)";
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-2">
          {dots.map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={isDisabled && !animating ? 7 : 8}
              fill={isDisabled && !animating ? "rgba(122,158,135,0.4)" : "#1a1a1a"}
              style={{ transition: "all 0.1s" }}
            />
          ))}
        </svg>
      </button>

      <span
        className="text-xs font-bold tracking-widest uppercase"
        style={{ color: isDisabled && !animating ? "#2E4F37" : "#7A9E87" }}
      >
        {label}
      </span>
    </div>
  );
}
