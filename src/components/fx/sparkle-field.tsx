"use client";

import * as React from "react";
import { Bubble, GlassCube } from "./three-d";

const COLORS = ["#FF8AD0", "#B98CFF", "#FFD36E", "#7FE3F0", "#F7A8E0"];

/** Big four-point sparkles twinkling across the whole page (behind content). */
export function SparkleField({ count = 22 }: { count?: number }) {
  const sparkles = React.useMemo(() => {
    let seed = 1337;
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: count }, (_, i) => ({
      left: r() * 100,
      top: r() * 100,
      size: 8 + r() * 18,
      color: COLORS[i % COLORS.length],
      delay: r() * 4,
      dur: 2.4 + r() * 2.4,
    }));
  }, [count]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <GlassCube size={30} className="left-[3%] top-[78%] opacity-70" speed={18} />
      <GlassCube size={22} className="right-[4%] top-[42%] opacity-60" speed={12} style={{ animationDelay: "-4s" }} />
      <Bubble size={26} className="right-[12%] top-[88%] opacity-80" style={{ animationDelay: "-2s" }} />
      <Bubble size={16} className="left-[18%] top-[8%] opacity-80" style={{ animationDelay: "-5s" }} />
      {sparkles.map((s, i) => (
        <span
          key={i}
          className="vc-spark absolute"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            background: s.color,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}
