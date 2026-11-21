"use client";

import * as React from "react";

const N = 7;
const PETAL = "M0 0 C 8 -18, 52 -40, 70 -86 C 84 -124, 46 -150, 18 -132 C -8 -116, -14 -70, -6 -36 C -3 -20, -1 -8, 0 0 Z";
const SHINE = "M30 -126 C 50 -134, 72 -118, 70 -98 C 64 -112, 50 -122, 30 -126 Z";
const EDGE = "M-4 -40 C -8 -70, 0 -104, 16 -126";

/**
 * Glossy violet glass flower (original artwork). Petals unfold on load,
 * then the bloom slowly turns. Pure SVG + CSS.
 */
export function GlassFlower({ size = 300, className = "" }: { size?: number; className?: string }) {
  const id = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg width={size} height={size} viewBox="-200 -200 400 400" className={className} aria-hidden>
      <defs>
        <linearGradient id={`pg-${id}`} x1="0.2" y1="1" x2="0.8" y2="0">
          <stop offset="0" stopColor="#1E0548" />
          <stop offset=".3" stopColor="#5B21B6" />
          <stop offset=".55" stopColor="#9333EA" />
          <stop offset=".78" stopColor="#D946EF" />
          <stop offset="1" stopColor="#F5D0FE" />
        </linearGradient>
        <linearGradient id={`pd-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0A0118" stopOpacity=".55" />
          <stop offset=".45" stopColor="#0A0118" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`ps-${id}`} cx=".75" cy=".2" r=".8">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".55" />
          <stop offset=".3" stopColor="#E9D5FF" stopOpacity=".15" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`core-${id}`} r=".5">
          <stop offset="0" stopColor="#0A0118" />
          <stop offset=".6" stopColor="#1E0548" stopOpacity=".9" />
          <stop offset="1" stopColor="#1E0548" stopOpacity="0" />
        </radialGradient>
        <filter id={`bloom-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" result="b" />
          <feColorMatrix in="b" values="0.9 0 0 0 0.25  0 0.4 0 0 0  0 0 1 0 0.45  0 0 0 .7 0" result="g" />
          <feMerge>
            <feMergeNode in="g" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#bloom-${id})`}>
        <g className="gf-spin">
          {Array.from({ length: N }, (_, i) => (
            <g key={i} transform={`rotate(${(i * 360) / N})`}>
              <g className="gf-petal" style={{ animationDelay: `${i * 90}ms` }}>
                <path d={PETAL} fill={`url(#pg-${id})`} fillOpacity=".94" />
                <path d={PETAL} fill={`url(#pd-${id})`} />
                <path d={PETAL} fill={`url(#ps-${id})`} opacity=".9" />
                <path d={PETAL} fill="none" stroke="#F0ABFC" strokeOpacity=".35" strokeWidth="1.5" />
                <path d={EDGE} stroke="#F5D0FE" strokeOpacity=".55" strokeWidth="2" fill="none" />
                <path d={SHINE} fill="#fff" opacity=".85" />
              </g>
            </g>
          ))}
          <circle r="26" fill={`url(#core-${id})`} />
        </g>
      </g>
    </svg>
  );
}
