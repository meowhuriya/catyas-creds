"use client";

import * as React from "react";

export type AppTheme = "obsidian" | "harvard" | "heritage";

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  cycleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType>({
  theme: "obsidian",
  setTheme: () => {},
  cycleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<AppTheme>("obsidian");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("app_theme") as AppTheme | null;
      const initialTheme: AppTheme =
        saved === "obsidian" || saved === "harvard" || saved === "heritage"
          ? saved
          : "obsidian";
      setThemeState(initialTheme);
      applyThemeToDOM(initialTheme);
    } catch {
      applyThemeToDOM("obsidian");
    }
    setMounted(true);
  }, []);

  const setTheme = React.useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem("app_theme", newTheme);
    } catch {}
    applyThemeToDOM(newTheme);
  }, []);

  const cycleTheme = React.useCallback(() => {
    setThemeState((prev) => {
      const next: AppTheme =
        prev === "obsidian" ? "harvard" : prev === "harvard" ? "heritage" : "obsidian";
      try {
        localStorage.setItem("app_theme", next);
      } catch {}
      applyThemeToDOM(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}

export function applyThemeToDOM(theme: AppTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);

  if (theme === "obsidian") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}
