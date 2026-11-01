import * as React from "react";
import { cn } from "@/lib/utils";

interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  className?: string;
}

export function Stat({ label, value, unit, subtext, className }: StatProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-card border border-app-border bg-app-surface p-4 transition-colors",
        className
      )}
    >
      <span className="eyebrow-label">
        {label}
      </span>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-ink)] tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-semibold text-[var(--color-ink-muted)]">{unit}</span>
        )}
      </div>
      {subtext && (
        <span className="mt-1 text-xs font-medium text-[var(--color-ink-muted)]">{subtext}</span>
      )}
    </div>
  );
}
