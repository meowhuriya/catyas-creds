"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/** The cat's outline: a soft head with two ears (viewBox 0 0 120 100). */
const HEAD = "M18 34 C 16 22, 18 10, 24 6 C 30 4, 38 12, 44 20 C 54 17, 66 17, 76 20 C 82 12, 90 4, 96 6 C 102 10, 104 22, 102 34 C 112 46, 112 70, 102 82 C 90 96, 30 96, 18 82 C 8 70, 8 46, 18 34 Z";

/**
 * A glass cat that fills up with caramel as you get through something.
 * Shows `value` (0-100). If `onSet` is given you can tap it to set the level yourself.
 */
export function CatJar({
  value,
  auto,
  size = 56,
  label,
  onSet,
  className,
}: {
  value: number;
  /** what the level would be on its own; shown so you can go back to it */
  auto?: number;
  size?: number;
  label?: string;
  onSet?: (v: number | undefined) => void;
  className?: string;
}) {
  const uid = React.useId().replace(/:/g, "");
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const top = 92 - (v / 100) * 84; // liquid surface y
  const [open, setOpen] = React.useState<{ x: number; y: number } | null>(null);
  const full = v >= 100;
  const lav = "#8B86E8";
  const brown = "#B07A4F";

  const svg = (
    <svg viewBox="0 0 120 100" width={size} height={size * 0.84} aria-hidden>
      <defs>
        <clipPath id={`c-${uid}`}><path d={HEAD} /></clipPath>
        <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0F1FF" /><stop offset="1" stopColor="#C9CCF7" />
        </linearGradient>
        <linearGradient id={`f-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F3C98F" /><stop offset=".5" stopColor="#E8B072" /><stop offset="1" stopColor="#D79A5C" />
        </linearGradient>
        {/* the outline is lavender above the caramel and brown below it */}
        <linearGradient id={`o-${uid}`} x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset={Math.max(0, top - 1) / 100} stopColor={lav} /><stop offset={Math.min(100, top + 1) / 100} stopColor={brown} />
        </linearGradient>
      </defs>
      <path d={HEAD} fill={`url(#g-${uid})`} />
      <g clipPath={`url(#c-${uid})`}>
        {v > 0 && (
          <g className="vc-slosh">
            <path d={`M-20 ${top} C 10 ${top - 5}, 30 ${top + 5}, 60 ${top} S 110 ${top - 5}, 160 ${top} V 110 H -20 Z`} fill={`url(#f-${uid})`} />
            <path d={`M-20 ${top} C 10 ${top - 5}, 30 ${top + 5}, 60 ${top} S 110 ${top - 5}, 160 ${top}`} fill="none" stroke="#A8693D" strokeWidth="2.4" opacity=".55" />
          </g>
        )}
        {/* little paper grain */}
        <rect width="120" height="100" fill="#fff" opacity=".05" />
      </g>
      <path d={HEAD} fill="none" stroke={full ? brown : `url(#o-${uid})`} strokeWidth="5" strokeLinejoin="round" />
      {/* face */}
      <circle cx="44" cy="62" r="4.4" fill={v > 30 ? "#7A4E2E" : "#7B78C9"} />
      <circle cx="76" cy="62" r="4.4" fill={v > 30 ? "#7A4E2E" : "#7B78C9"} />
      <path d="M56 66 q4 4 4 0 q0 4 4 0" fill="none" stroke={v > 26 ? "#7A4E2E" : "#7B78C9"} strokeWidth="1.8" strokeLinecap="round" />
      {/* glass shine */}
      <ellipse cx="34" cy="36" rx="9" ry="5" fill="#fff" opacity=".85" transform="rotate(-25 34 36)" />
      <ellipse cx="46" cy="30" rx="3" ry="2" fill="#fff" opacity=".7" />
    </svg>
  );

  if (!onSet)
    return (
      <span className={cn("inline-flex", className)} title={`${label ? label + ": " : ""}${v}%`} role="img" aria-label={`${label ?? "Progress"} ${v}%`}>
        {svg}
      </span>
    );

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          setOpen({ x: r.left + r.width / 2, y: r.bottom + 6 });
        }}
        title={`${label ? label + ": " : ""}${v}% · tap to set`}
        aria-label={`${label ?? "Progress"} ${v}%. Tap to change.`}
        className={cn("inline-flex shrink-0 rounded-2xl transition-transform hover:scale-105 active:scale-95", className)}
      >
        {svg}
      </button>
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[260]" onClick={() => setOpen(null)}>
            <div
              onClick={(e) => e.stopPropagation()}
              className="vc-fade-in absolute w-60 -translate-x-1/2 space-y-3 rounded-2xl bg-app-surface p-4 shadow-2xl ring-1 ring-black/5"
              style={{ left: Math.min(window.innerWidth - 130, Math.max(130, open.x)), top: Math.min(window.innerHeight - 170, open.y) }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-app-ink">{label ?? "How far along?"}</span>
                <span className="tabular-nums text-app-ink-muted">{v}%</span>
              </div>
              <input type="range" min={0} max={100} step={5} value={v} onChange={(e) => onSet(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
              <div className="flex gap-2 text-xs">
                {[0, 25, 50, 75, 100].map((n) => (
                  <button key={n} onClick={() => onSet(n)} className="flex-1 rounded-full bg-[var(--ctl-fill)] py-1 text-app-ink hover:bg-[var(--ctl-fill-strong)]">{n}</button>
                ))}
              </div>
              {auto !== undefined && (
                <button onClick={() => { onSet(undefined); setOpen(null); }} className="w-full rounded-full py-1.5 text-xs font-medium text-[var(--color-accent)] hover:bg-[var(--ctl-fill)]">
                  Back to automatic ({Math.round(auto)}%)
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
