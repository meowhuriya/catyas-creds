"use client";

import * as React from "react";
import { useTheme, AppTheme } from "@/lib/theme/theme-context";
import { Sparkles, GraduationCap, Grid } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const themes: Array<{ id: AppTheme; label: string; icon: React.ElementType }> = [
    { id: "obsidian", label: "Obsidian", icon: Sparkles },
    { id: "harvard", label: "Harvard", icon: GraduationCap },
    { id: "heritage", label: "Heritage", icon: Grid },
  ];

  return (
    <div
      className={cn(
        "flex items-center rounded-full p-0.5 border border-app-border bg-app-surface/80 backdrop-blur-md shadow-xs select-none transition-all",
        className
      )}
      title="Switch Theme"
      role="group"
      aria-label="Theme Switcher"
    >
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.id;

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 ease-out",
              isActive
                ? "bg-[var(--color-accent)] text-white shadow-xs font-bold"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-black/5 dark:hover:bg-white/5"
            )}
            aria-pressed={isActive}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
