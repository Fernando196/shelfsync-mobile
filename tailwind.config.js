/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        surface: "#f8fafc",
        // Pizarra industrial (antes indigo). Mantener en sync con src/const/theme.const.ts.
        primary: {
          DEFAULT: "#334155",
          50: "#f1f5f9",
          100: "#e2e8f0",
          200: "#cbd5e1",
          600: "#334155",
          700: "#1e293b",
        },
        // Verde "stock": solo para la accion principal (escanear, siguiente paso).
        accent: {
          DEFAULT: "#059669",
          50: "#ecfdf5",
          600: "#059669",
          700: "#047857",
        },
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#f43f5e",
      },
    },
  },
  plugins: [],
};
