"use client";

import * as React from "react";
import { Check, Moon, Palette, Sun } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme } from "@/lib/theme/theme-context";
import { ACCENTS } from "@/lib/theme/accent";
import { cn } from "@/lib/utils";

/** Light/dark switch + accent colour picker. */
export function AppearancePanel({ className }: { className?: string }) {
  const { mode, setMode, accent, setAccent } = useTheme();
  const isPreset = ACCENTS.some((a) => a.hex.toLowerCase() === accent.toLowerCase());

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <p className="mb-2 text-[12px] font-medium text-[var(--color-ink-muted)]">Mode</p>
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--hair)] bg-[var(--wash)] p-1">
          {(["light", "dark"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={cn(
                "flex h-9 items-center justify-center gap-2 rounded-lg text-[13px] font-medium transition",
                mode === m
                  ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-sm"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              )}
            >
              {m === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {m === "light" ? "Light" : "Dark"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[12px] font-medium text-[var(--color-ink-muted)]">Accent colour</p>
        <div className="grid grid-cols-4 gap-2">
          {ACCENTS.map((a) => {
            const active = a.hex.toLowerCase() === accent.toLowerCase();
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccent(a.hex)}
                title={a.label}
                aria-label={`${a.label} accent`}
                aria-pressed={active}
                className={cn(
                  "group flex flex-col items-center gap-1.5 rounded-xl p-2 transition hover:bg-[var(--wash)]",
                  active && "bg-[var(--wash)]"
                )}
              >
                <span
                  className="grid h-8 w-8 place-items-center rounded-full ring-offset-2 ring-offset-[var(--color-surface)] transition"
                  style={{ background: `linear-gradient(145deg, ${a.hex}cc, ${a.hex})`, boxShadow: active ? `0 0 0 2px ${a.hex}` : undefined }}
                >
                  {active && <Check className="h-4 w-4 text-white" />}
                </span>
                <span className="text-[11px] text-[var(--color-ink-muted)]">{a.label}</span>
              </button>
            );
          })}
        </div>
        <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-[var(--hair)] px-3 py-2 text-[13px] text-[var(--color-ink)] hover:bg-[var(--wash)]">
          <span className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full border border-[var(--hair)]" style={{ background: accent }} />
            Custom colour {!isPreset && <span className="text-[var(--color-ink-muted)]">{accent.toUpperCase()}</span>}
          </span>
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="h-7 w-9 cursor-pointer rounded-md border-0 bg-transparent p-0"
            aria-label="Pick a custom accent colour"
          />
        </label>
      </div>
    </div>
  );
}

export function AppearanceControl() {
  const { mode, toggleMode } = useTheme();
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={toggleMode}
        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={mode === "dark" ? "Light mode" : "Dark mode"}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-ink-muted)] transition hover:bg-[var(--wash)] hover:text-[var(--color-ink)]"
      >
        {mode === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </button>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Appearance and accent colour"
            title="Appearance"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--color-ink-muted)] transition hover:bg-[var(--wash)] hover:text-[var(--color-ink)]"
          >
            <Palette className="h-[18px] w-[18px]" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[300px] p-4">
          <p className="mb-3 font-display text-[15px] font-semibold text-[var(--color-ink)]">Appearance</p>
          <AppearancePanel />
        </PopoverContent>
      </Popover>
    </div>
  );
}
