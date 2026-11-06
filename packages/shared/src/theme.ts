// Pacific World School design tokens — source of truth for admin + mobile.
// Measured reference (pws.schoolforschools.ai/login, light mode, 2026-11-07):
// olive hsl(76, 29%, 31%) primary, hsl(76, 29%, 43%) accent, hsl(0, 99%, 54%)
// hover, focus ring in the primary tone. See
// docs/superpowers/specs/2026-11-07-pws-clone-design.md §3 (updated values).
// Roboto, olive primary/accent, slate backgrounds, time-aware dark.
export const theme = {
  colors: {
    // Reference canonical tokens (live documentElement inline styles,
    // pws.schoolforschools.ai/login, 2026-11-07 — owner decision: use olive)
    main: "#5A6638",
    primary: "#5A6638",
    sidebarPrimary: "#5A6638",
    // accent hsl(76, 29%, 43%)
    accent: "#7C8D4E",
    accentSoft: "#7C8D4E",
    // hover-primary hsl(0, 99%, 54%) — hover only; sidebar hover text #FE1616
    hover: "#FE1616",
    hoverText: "#FE1616",
    // ring / sidebar-ring hsl(76, 29%, 36%)
    ring: "#687641",
    sidebarRing: "#687641",
    onPrimary: "#FFFFFF",
    onAccent: "#FFFFFF",
    bgLight: "#f8fafc",
    bgDark: "#0f172a",
    surfaceLight: "#ffffff",
    surfaceDark: "#1e293b",
    ink: "#0f172a",
    muted: "#64748b",
    // Legacy aliases kept so existing class names (bg-olive, text-navy etc.)
    // resolve to the reference identity: olive/navy = primary, terracotta = accent.
    navy: "#5A6638",
    olive: "#5A6638",
    terracotta: "#7C8D4E",
    sand: "#f8fafc",
    cream: "#ffffff",
    // Semantic status
    present: "#10b981",
    absent: "#ef4444",
    leave: "#f59e0b",
    holiday: "#6366f1",
    pending: "#f97316",
    approved: "#059669",
  },
  font: {
    family: "Roboto, system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 12, lg: 16 },
  themeSchedule: { lightFromMinutes: 300, lightToMinutes: 1080 }, // 05:00–18:00
} as const;

export type ThemeTokens = typeof theme;
