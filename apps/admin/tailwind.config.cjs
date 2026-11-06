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
        // Reference identity (live documentElement vars, see packages/shared/src/theme.ts):
        // primary/main/sidebar-primary #5A6638 (olive hsl 76,29%,31%),
        // accent #7C8D4E (43%), ring/sidebar-ring #687641 (36%),
        // hover/hover-text #FE1616 (hsl 0,99%,54%), on-primary #FFFFFF.
        navy: "#5A6638",
        olive: {
          DEFAULT: "#5A6638",
          300: "#C1CCA3",
          400: "#A7B77B",
          600: "#4B562F",
          700: "#404828",
        },
        // Legacy alias now resolves to the reference accent (olive), not blue.
        terracotta: "#7C8D4E",
        sand: "#f8fafc",
        ink: "#0f172a",
        muted: "#64748b",
        cream: "#ffffff",
        brand: {
          navy: "#5A6638",
          main: "#5A6638",
          primary: "#5A6638",
          sidebarPrimary: "#5A6638",
          accent: "#7C8D4E",
          accentSoft: "#7C8D4E",
          hover: "#FE1616",
          hoverText: "#FE1616",
          ring: "#687641",
          sidebarRing: "#687641",
          onPrimary: "#FFFFFF",
          onAccent: "#FFFFFF",
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
