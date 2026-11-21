"use client";

import * as React from "react";
import { Butterfly } from "./butterfly";

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Clove-style banner art: a crop of the liquid violet swirl painting, tinted per
 * subject, with a soft magenta bloom, Valorant-style corner brackets and a couple
 * of drifting butterflies. Original artwork, not a Riot asset.
 */
export function CloveArt({
  seed,
  hue,
  butterflies = 2,
  brackets = true,
  fade = true,
  sparkleCount = 14,
  className = "",
}: {
  seed: string;
  hue?: string;
  butterflies?: number;
  brackets?: boolean;
  fade?: boolean;
  sparkleCount?: number;
  className?: string;
}) {
  const h = hash(seed);
  const px = h % 100;
  const py = (h >> 8) % 100;
  const flip = (h >> 16) % 2 === 1;
  const sparkles = Array.from({ length: sparkleCount }, (_, i) => {
    const v = hash(seed + "s" + i);
    return {
      left: 4 + (v % 92),
      top: 6 + ((v >> 7) % 86),
      size: 8 + ((v >> 13) % 16),
      color: ["#FF8AD0", "#B98CFF", "#FFD36E", "#7FE3F0", "#FFFFFF"][i % 5],
      delay: ((v >> 3) % 30) / 10,
    };
  });
  const flies = Array.from({ length: butterflies }, (_, i) => {
    const v = hash(seed + i);
    return { left: 52 + (v % 40), top: 12 + ((v >> 7) % 60), size: 14 + ((v >> 13) % 12), delay: ((v >> 3) % 40) / 10 };
  });

  return (
    <div className={`vc-depth-bg absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div
        className="absolute inset-0 scale-125 bg-cover"
        style={{
          backgroundImage: "var(--clove-art, url(/brand/clove-bg.jpg))",
          backgroundPosition: `${px}% ${py}%`,
          transform: `scale(1.3) ${flip ? "scaleX(-1)" : ""}`,
          filter: "blur(5px) saturate(1.1)",
        }}
      />
      {hue && <div className="vc-art-hue absolute inset-0" style={{ backgroundColor: hue }} />}
      <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_20%,rgba(255,138,208,0.30),transparent_70%)]" />
      {fade && <div className="vc-art-fade absolute inset-0" />}
      {brackets && (
        <>
          <span className="absolute left-3 top-3 h-3 w-3 border-l border-t border-[var(--banner-line)]" />
          <span className="absolute right-3 top-3 h-3 w-3 border-r border-t border-[var(--banner-line)]" />
          <span className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-[var(--banner-line)]" />
          <span className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-[var(--banner-line)]" />
        </>
      )}
      {sparkles.map((s, i) => (
        <span
          key={`s${i}`}
          className="vc-spark absolute"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, background: s.color, animationDelay: `${s.delay}s` }}
        />
      ))}
      {flies.map((f, i) => (
        <span
          key={i}
          className="vc-hover-fly absolute"
          style={{ left: `${f.left}%`, top: `${f.top}%`, animationDelay: `${f.delay}s` }}
        >
          <Butterfly size={f.size} glow={false} flap slow />
        </span>
      ))}
    </div>
  );
}
