/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        "dice-roll": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "25%": { transform: "rotate(90deg) scale(1.2)" },
          "50%": { transform: "rotate(180deg) scale(0.8)" },
          "75%": { transform: "rotate(270deg) scale(1.2)" },
          "100%": { transform: "rotate(360deg) scale(1)" },
        },
        "token-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "slide-in": {
          "0%": { transform: "translateY(-16px) scale(0.96)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "pop": {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "60%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(240,183,50,0)" },
          "50%": { boxShadow: "0 0 20px 4px rgba(240,183,50,0.25)" },
        },
      },
      animation: {
        "dice-roll": "dice-roll 0.6s ease-in-out",
        "token-bounce": "token-bounce 0.5s ease-in-out 3",
        "slide-in": "slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "pop": "pop 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "float": "float 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
