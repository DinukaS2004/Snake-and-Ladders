import React, { useState, useEffect, useRef } from "react";

const DOT_POSITIONS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

const ANIM_TICKS = 8;
const ANIM_MS = 75;

export default function Dice({ value, rolling, disabled, onRoll }) {
  const [displayValue, setDisplayValue] = useState(value || 1);
  const [animating, setAnimating] = useState(false);
  // Ref so the animation closure always reads the latest server value
  const valueRef = useRef(value || 1);

  useEffect(() => {
    valueRef.current = value || 1;
  }, [value]);

  // Animation is driven solely by the `rolling` prop.
  // Bug fix: when rolling → false we ALWAYS call setAnimating(false)
  // so the dice can never get stuck in a permanently-disabled state.
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
  }, [rolling]); // intentionally not listing `value` — use ref instead

  // Keep display fresh when value arrives/changes while idle
  useEffect(() => {
    if (!rolling && !animating) setDisplayValue(value || 1);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const dots = DOT_POSITIONS[displayValue] || DOT_POSITIONS[1];
  const isDisabled = disabled || animating;
  const dotFill = disabled && !animating ? "#9ca3af" : "#1e293b";

  let label = "Tap to Roll";
  if (animating) label = "Rolling…";
  else if (disabled) label = "Wait…";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onRoll}
        disabled={isDisabled}
        className={`
          relative w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-2xl
          transition-all duration-150 select-none
          ${animating ? "animate-bounce" : ""}
          ${isDisabled
            ? "bg-gray-300 cursor-not-allowed shadow-inner"
            : "bg-white hover:scale-110 active:scale-95 cursor-pointer hover:shadow-yellow-400/60 hover:shadow-2xl"
          }
        `}
        style={{ border: "3px solid #1e293b" }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full p-2">
          {dots.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={isDisabled ? 7 : 8} fill={dotFill} />
          ))}
        </svg>
      </button>

      <span className={`text-sm font-semibold ${disabled && !animating ? "text-gray-400" : "text-white"}`}>
        {label}
      </span>
    </div>
  );
}
