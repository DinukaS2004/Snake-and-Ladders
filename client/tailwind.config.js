/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
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
        "snake-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        "ladder-climb": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-10px)" },
        },
        "flash": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        "slide-in": {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pop": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "70%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "dice-roll": "dice-roll 0.6s ease-in-out",
        "token-bounce": "token-bounce 0.5s ease-in-out 3",
        "snake-shake": "snake-shake 0.4s ease-in-out 3",
        "flash": "flash 0.5s ease-in-out 4",
        "slide-in": "slide-in 0.3s ease-out",
        "pop": "pop 0.4s ease-out",
      },
    },
  },
  plugins: [],
};
