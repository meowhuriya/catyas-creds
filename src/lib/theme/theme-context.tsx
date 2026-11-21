"use client";

import * as React from "react";
import { onCloudSyncUpdate } from "@/lib/cloud-sync/synced-storage";
import { ACCENT_KEY, DEFAULT_ACCENT, MODE_KEY, ThemeMode, applyAppearance, isHex } from "./accent";

// Kept for older imports. "pearl" = light, "clove" = dark; the rest map to dark.
export type AppTheme = "pearl" | "clove" | "strawberry" | "obsidian" | "harvard" | "heritage";

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  accent: string;
  setAccent: (hex: string) => void;
}

const ThemeContext = React.createContext<ThemeContextType>({
  theme: "pearl",
  setTheme: () => {},
  cycleTheme: () => {},
  mode: "light",
  setMode: () => {},
  toggleMode: () => {},
  accent: DEFAULT_ACCENT,
  setAccent: () => {},
});

function readSaved(): { mode: ThemeMode; accent: string } {
  try {
    const m = localStorage.getItem(MODE_KEY);
    const a = localStorage.getItem(ACCENT_KEY);
    return { mode: m === "dark" ? "dark" : "light", accent: isHex(a) ? a : DEFAULT_ACCENT };
  } catch {
    return { mode: "light", accent: DEFAULT_ACCENT };
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = React.useState<ThemeMode>("light");
  const [accent, setAccentState] = React.useState<string>(DEFAULT_ACCENT);

  React.useEffect(() => {
    const saved = readSaved();
    setModeState(saved.mode);
    setAccentState(saved.accent);
    applyAppearance(saved.mode, saved.accent);
    const resync = () => {
      const s = readSaved();
      setModeState(s.mode);
      setAccentState(s.accent);
      applyAppearance(s.mode, s.accent);
    };
    const off1 = onCloudSyncUpdate(MODE_KEY, resync);
    const off2 = onCloudSyncUpdate(ACCENT_KEY, resync);
    return () => {
      off1?.();
      off2?.();
    };
  }, []);

  const setMode = React.useCallback(
    (m: ThemeMode) => {
      setModeState(m);
      try {
        localStorage.setItem(MODE_KEY, m);
      } catch {}
      applyAppearance(m, accent);
    },
    [accent]
  );

  const setAccent = React.useCallback(
    (hex: string) => {
      if (!isHex(hex)) return;
      setAccentState(hex);
      try {
        localStorage.setItem(ACCENT_KEY, hex);
      } catch {}
      applyAppearance(mode, hex);
    },
    [mode]
  );

  const toggleMode = React.useCallback(() => setMode(mode === "dark" ? "light" : "dark"), [mode, setMode]);
  const theme: AppTheme = mode === "dark" ? "clove" : "pearl";
  const setTheme = React.useCallback((t: AppTheme) => setMode(t === "pearl" ? "light" : "dark"), [setMode]);

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, cycleTheme: toggleMode, mode, setMode, toggleMode, accent, setAccent }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}

/** Compatibility helper for older callers. */
export function applyThemeToDOM(theme: AppTheme) {
  applyAppearance(theme === "pearl" ? "light" : "dark", readSaved().accent);
}
