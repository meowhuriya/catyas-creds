"use client";

import * as React from "react";

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Slowly spinning 3D glass cube (pure CSS 3D). */
export function GlassCube({
  size = 40,
  className = "",
  style,
  speed = 14,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  speed?: number;
}) {
  return (
    <div aria-hidden className={`vc-float3d pointer-events-none absolute ${className}`} style={{ perspective: 600, ...style }}>
      <div className="vc-cube" style={{ ["--s" as string]: `${size}px`, animationDuration: `${speed}s` } as React.CSSProperties}>
        <span className="f1" />
        <span className="f2" />
        <span className="f3" />
        <span className="f4" />
        <span className="f5" />
        <span className="f6" />
      </div>
    </div>
  );
}

/** Glossy pearl bubble with a 3D highlight. */
export function Bubble({ size = 30, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      aria-hidden
      className={`vc-bubble vc-float3d pointer-events-none absolute ${className}`}
      style={{ width: size, height: size, ...style }}
    />
  );
}

/** Water drops falling through a banner and splashing into ripples, plus beads resting on the glass. */
export function WaterDrops({ seed, drops = 4, beads = 4 }: { seed: string; drops?: number; beads?: number }) {
  const items = Array.from({ length: drops }, (_, i) => {
    const v = hash(seed + "d" + i);
    return { left: 8 + (v % 84), delay: ((v >> 5) % 50) / 10, dur: 3.2 + ((v >> 11) % 20) / 10, size: 7 + ((v >> 17) % 5) };
  });
  const rest = Array.from({ length: beads }, (_, i) => {
    const v = hash(seed + "b" + i);
    return { left: 4 + (v % 90), top: 10 + ((v >> 7) % 75), size: 4 + ((v >> 13) % 7) };
  });
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((d, i) => (
        <React.Fragment key={i}>
          <span
            className="vc-drop absolute"
            style={{ left: `${d.left}%`, width: d.size, height: d.size, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` }}
          />
          <span
            className="vc-ripple absolute"
            style={{ left: `calc(${d.left}% - 14px)`, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s` }}
          />
        </React.Fragment>
      ))}
      {rest.map((b, i) => (
        <span key={`b${i}`} className="vc-bead absolute" style={{ left: `${b.left}%`, top: `${b.top}%`, width: b.size, height: b.size * 1.12 }} />
      ))}
    </div>
  );
}
