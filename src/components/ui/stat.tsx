import * as React from "react";
import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  className?: string;
}

/** Frameless stat: label, big condensed number, quiet subtext. Separated by hairlines in the parent strip. */
export function Stat({ label, value, unit, subtext, className }: StatProps) {
  return (
    <div className={cn("flex flex-col px-1 py-2 md:px-6", className)}>
      <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-eyebrow)]">{label}</span>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-display text-3xl tabular-nums text-[var(--color-ink)] md:text-4xl">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-[var(--color-ink-muted)]">{unit}</span>}
      </div>
      {subtext && <span className="mt-1 text-xs text-[var(--color-ink-muted)]">{subtext}</span>}
    </div>
  );
}
