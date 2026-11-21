"use client";

import * as React from "react";

/**
 * Original pastel "dream galaxy" artwork for banners: twilight sky, a rainbow
 * aurora ribbon, glitter, twinkling sparkles, plus a little planet, moon,
 * heart or bow picked per seed. Pure SVG, so it is crisp and light.
 */
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const spark = (x: number, y: number, s: number) =>
  `M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s} Z`;

const SKIES = [
  ["#2A1F6B", "#6B3FB0", "#F08DC0"],
  ["#1F2A6B", "#5A4BC0", "#FF9EC4"],
  ["#3A1F66", "#9A4FB8", "#FFB38A"],
  ["#22306E", "#4F7AD0", "#C69CFF"],
  ["#2E1A5C", "#B04FA0", "#FFC2D9"],
];

export function DreamScene({
  seed,
  hue,
  className = "",
}: {
  seed: string;
  hue?: string;
  className?: string;
}) {
  const h = hash(seed);
  const r = rng(h);
  const sky = SKIES[h % SKIES.length];
  const mid = hue ? `color-mix(in srgb, ${hue} 45%, ${sky[1]})` : sky[1];
  const gid = `ds-${h.toString(36)}`;
  const y0 = 120 + r() * 60;
  const wave = `M-60 ${y0} C120 ${y0 - 90} 260 ${y0 + 80} 420 ${y0 - 10} S700 ${y0 - 100} 860 ${y0 - 30}`;
  const glitter = Array.from({ length: 46 }, () => ({ x: r() * 800, y: r() * 260, s: 0.5 + r() * 1.4, o: 0.35 + r() * 0.6 }));
  const sparks = Array.from({ length: 7 }, (_, i) => ({
    x: 30 + r() * 740,
    y: 20 + r() * 220,
    s: 4 + r() * 9,
    c: ["#FFFFFF", "#FFD76A", "#FF9AD5", "#B9E6FF"][i % 4],
    d: (r() * 3).toFixed(2),
  }));
  const deco = h % 4; // 0 planet, 1 moon, 2 heart, 3 bow
  const dx = 470 + r() * 120;
  const dy = 40 + r() * 50;

  return (
    <svg viewBox="0 0 800 260" preserveAspectRatio="xMidYMid slice" className={`h-full w-full ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`${gid}-sky`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset=".55" style={{ stopColor: mid }} />
          <stop offset="1" stopColor={sky[2]} />
        </linearGradient>
        <radialGradient id={`${gid}-glow`} cx=".78" cy=".85" r=".6">
          <stop offset="0" stopColor="#FFD3E8" stopOpacity=".75" />
          <stop offset="1" stopColor="#FFD3E8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${gid}-rb`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FF8FC7" />
          <stop offset=".2" stopColor="#FFC48A" />
          <stop offset=".4" stopColor="#FFF29A" />
          <stop offset=".6" stopColor="#9BF2C7" />
          <stop offset=".8" stopColor="#8FD0FF" />
          <stop offset="1" stopColor="#C9A6FF" />
        </linearGradient>
        <linearGradient id={`${gid}-pl`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE3F3" />
          <stop offset="1" stopColor="#C9A6FF" />
        </linearGradient>
        <filter id={`${gid}-blur`} x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      <rect width="800" height="260" fill={`url(#${gid}-sky)`} />
      <rect width="800" height="260" fill={`url(#${gid}-glow)`} />

      {/* rainbow aurora ribbon */}
      <path d={wave} stroke={`url(#${gid}-rb)`} strokeWidth="70" fill="none" opacity=".45" filter={`url(#${gid}-blur)`} />
      <path d={wave} stroke={`url(#${gid}-rb)`} strokeWidth="14" fill="none" opacity=".9" strokeLinecap="round" />
      <path d={wave} stroke="#ffffff" strokeWidth="2" fill="none" opacity=".75" strokeLinecap="round" />

      {glitter.map((g, i) => (
        <circle key={i} cx={g.x} cy={g.y} r={g.s} fill="#fff" opacity={g.o} />
      ))}

      {deco === 0 && (
        <g transform={`translate(${dx} ${dy})`}>
          <circle r="22" fill={`url(#${gid}-pl)`} />
          <ellipse rx="38" ry="8" fill="none" stroke="#FFD76A" strokeWidth="3" transform="rotate(-18)" opacity=".9" />
          <circle cx="-7" cy="-7" r="5" fill="#fff" opacity=".7" />
        </g>
      )}
      {deco === 1 && (
        <g transform={`translate(${dx} ${dy})`}>
          <path d="M8 -22 A24 24 0 1 0 8 24 A18 18 0 1 1 8 -22 Z" fill="#FFF2B3" />
          <circle cx="-6" cy="-4" r="2" fill="#E8C96A" />
        </g>
      )}
      {deco === 2 && (
        <path
          transform={`translate(${dx} ${dy}) rotate(-12)`}
          d="M0 10 C-26 -8 -14 -30 0 -16 C14 -30 26 -8 0 10 Z"
          fill="#FF8FC7"
          stroke="#fff"
          strokeWidth="2"
        />
      )}
      {deco === 3 && (
        <g transform={`translate(${dx} ${dy}) rotate(10)`} fill="#FFB3D9" stroke="#fff" strokeWidth="2">
          <path d="M0 0 C-14 -16 -30 -10 -26 2 C-24 12 -10 8 0 0 Z" />
          <path d="M0 0 C14 -16 30 -10 26 2 C24 12 10 8 0 0 Z" />
          <path d="M-2 2 L-10 22 M2 2 L10 22" fill="none" />
          <circle r="4" fill="#FF8FC7" />
        </g>
      )}

      {sparks.map((s, i) => (
        <path key={i} d={spark(s.x, s.y, s.s)} fill={s.c} className="vc-twinkle" style={{ animationDelay: `${s.d}s` }} />
      ))}
    </svg>
  );
}
