import React from "react";

export default function TurnTimer({ seconds, maxSeconds = 30 }) {
  const pct = (seconds / maxSeconds) * 100;
  const color = seconds > 15 ? "#22c55e" : seconds > 8 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 22;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 50 50" className="w-full h-full -rotate-90">
          <circle cx="25" cy="25" r="22" fill="none" stroke="#334155" strokeWidth="4" />
          <circle
            cx="25" cy="25" r="22" fill="none"
            stroke={color} strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-lg font-bold"
          style={{ color }}
        >
          {seconds}
        </span>
      </div>
      <span className="text-xs text-slate-400">seconds</span>
    </div>
  );
}
