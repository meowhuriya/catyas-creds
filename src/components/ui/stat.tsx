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
      <span className="text-xs font-semibold tracking-wider uppercase text-app-ink-muted">
        {label}
      </span>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className="font-serif text-3xl font-semibold tracking-tight text-app-ink tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-app-ink-muted">{unit}</span>
        )}
      </div>
      {subtext && (
        <span className="mt-1 text-xs text-app-ink-muted/80">{subtext}</span>
      )}
    </div>
  );
}
