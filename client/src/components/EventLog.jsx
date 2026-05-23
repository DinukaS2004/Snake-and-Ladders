'use client';
import React from "react";

const EVENT_CONFIG = {
  snake:    { icon: "🐍", color: "#E84545", bg: "rgba(232,69,69,0.06)" },
  ladder:   { icon: "🪜", color: "#2EB872", bg: "rgba(46,184,114,0.06)" },
  win:      { icon: "🏆", color: "#F0B732", bg: "rgba(240,183,50,0.08)" },
  overshoot:{ icon: "🔄", color: "#7A9E87", bg: "rgba(122,158,135,0.06)" },
  normal:   { icon: "🎲", color: "#4A7A57", bg: "rgba(5,14,8,0.3)" },
};

export default function EventLog({ events = [] }) {
  if (!events.length) return null;

  return (
    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1"
      style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(240,183,50,0.15) transparent" }}>
      {events.slice().reverse().map((ev, i) => {
        const cfg = EVENT_CONFIG[ev.event] || EVENT_CONFIG.normal;
        return (
          <div
            key={i}
            className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs animate-slide-in"
            style={{
              background: i === 0 ? cfg.bg : "rgba(5,14,8,0.35)",
              border: i === 0
                ? `1px solid ${cfg.color}22`
                : "1px solid rgba(122,158,135,0.06)",
              opacity: i > 5 ? 0.5 : 1,
            }}
          >
            <span className="text-sm leading-none mt-0.5 shrink-0">{cfg.icon}</span>
            <span
              className="leading-snug font-medium"
              style={{ color: i === 0 ? cfg.color : "#4A7A57" }}
            >
              {ev.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}
