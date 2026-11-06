import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

// Report-parity keys (§3) — kept byte-identical to the vendor contract.
export const THEME_PREFERENCE_KEY = "dps-theme-preference";
export const THEME_MODE_KEY = "dps-theme-mode";

export type ThemeMode = "light" | "dark";
export type ThemePreference = ThemeMode | "auto";

function autoMode(now = new Date()): ThemeMode {
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= 300 && minutes < 1080 ? "light" : "dark";
}

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(THEME_PREFERENCE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // storage unavailable
  }
  return "auto";
}

function resolve(preference: ThemePreference): ThemeMode {
  return preference === "auto" ? autoMode() : preference;
}

function apply(mode: ThemeMode) {
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.style.colorScheme = mode;
  try {
    localStorage.setItem(THEME_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

interface ThemeContextValue {
  preference: ThemePreference;
  mode: ThemeMode;
  setPreference: (p: ThemePreference) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [mode, setMode] = useState<ThemeMode>(() => resolve(readPreference()));

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    try {
      if (p === "auto") localStorage.removeItem(THEME_PREFERENCE_KEY);
      else localStorage.setItem(THEME_PREFERENCE_KEY, p);
    } catch {
      // storage unavailable
    }
    const next = resolve(p);
    apply(next);
    setMode(next);
  }, []);

  const toggle = useCallback(() => {
    setPreference(mode === "dark" ? "light" : "dark");
  }, [mode, setPreference]);

  return (
    <ThemeContext.Provider value={{ preference, mode, setPreference, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
