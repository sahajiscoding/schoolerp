// Pacific World School design tokens — source of truth for admin + mobile.
// Report parity (docs/superpowers/specs/2026-11-07-pws-clone-design.md §3):
// Roboto, Pacific Navy primary, blue accent, slate backgrounds, time-aware dark.
export const theme = {
  colors: {
    // Report canonical tokens
    navy: "#1e3a8a",
    primary: "#1e3a8a",
    accent: "#2563eb",
    accentSoft: "#3b82f6",
    bgLight: "#f8fafc",
    bgDark: "#0f172a",
    surfaceLight: "#ffffff",
    surfaceDark: "#1e293b",
    ink: "#0f172a",
    muted: "#64748b",
    // Legacy aliases kept so existing class names (bg-olive etc.) resolve to
    // the report identity instead of the old olive/terracotta palette.
    olive: "#1e3a8a",
    terracotta: "#2563eb",
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
