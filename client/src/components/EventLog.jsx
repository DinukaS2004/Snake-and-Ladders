import React from "react";

const EVENT_ICONS = {
  snake: "🐍",
  ladder: "🪜",
  win: "🏆",
  overshoot: "🔄",
  normal: "🎲",
};

export default function EventLog({ events = [] }) {
  if (!events.length) return null;

  return (
    <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
      {events.slice().reverse().map((ev, i) => (
        <div
          key={i}
          className={`
            flex items-start gap-2 px-3 py-2 rounded-lg text-sm animate-slide-in
            ${i === 0 ? "bg-white/15 font-semibold" : "bg-white/5 text-slate-400 text-xs"}
          `}
        >
          <span className="text-base leading-none mt-0.5 shrink-0">
            {EVENT_ICONS[ev.event] || "🎲"}
          </span>
          <span className="leading-snug">{ev.message}</span>
        </div>
      ))}
    </div>
  );
}
