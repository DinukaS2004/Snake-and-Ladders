'use client';
import React from "react";

export default function TurnTimer({ seconds, maxSeconds = 30 }) {
  const pct = (seconds / maxSeconds) * 100;
  const color = seconds > 15 ? "#2EB872" : seconds > 8 ? "#F0B732" : "#E84545";
  const circumference = 2 * Math.PI * 22;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 50 50" className="w-full h-full -rotate-90">
          <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(30,50,35,0.8)" strokeWidth="4" />
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
      <span className="text-xs" style={{ color: "#4A7A57" }}>seconds</span>
    </div>
  );
}
