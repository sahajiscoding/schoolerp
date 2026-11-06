/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/shared/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      colors: {
        navy: "#1e3a8a",
        // Legacy aliases now resolve to the report identity (navy/blue).
        olive: "#1e3a8a",
        terracotta: "#2563eb",
        sand: "#f8fafc",
        ink: "#0f172a",
        muted: "#64748b",
        cream: "#ffffff",
        brand: {
          navy: "#1e3a8a",
          accent: "#2563eb",
          accentSoft: "#3b82f6",
        },
        status: {
          present: "#10b981",
          absent: "#ef4444",
          leave: "#f59e0b",
          holiday: "#6366f1",
          pending: "#f97316",
          approved: "#059669",
        },
      },
    },
  },
  plugins: [],
};
