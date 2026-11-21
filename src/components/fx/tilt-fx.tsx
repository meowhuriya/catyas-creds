"use client";

import * as React from "react";

/** Tilts any .vc-tile toward the cursor for a subtle 3D feel. */
export function TiltFx() {
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;
    let current: HTMLElement | null = null;
    let raf = 0;
    const reset = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.removeProperty("--rx");
      el.style.removeProperty("--ry");
      ["--px", "--py", "--mx", "--my"].forEach((k) => el.style.removeProperty(k));
      el.classList.remove("vc-tilting");
    };
    const onMove = (e: PointerEvent) => {
      const tile = (e.target as HTMLElement | null)?.closest<HTMLElement>(".vc-tile");
      if (tile !== current) {
        reset(current);
        current = tile ?? null;
      }
      if (!tile) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = tile.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tile.classList.add("vc-tilting");
        tile.style.setProperty("--rx", `${(-py * 7).toFixed(2)}deg`);
        tile.style.setProperty("--ry", `${(px * 9).toFixed(2)}deg`);
        tile.style.setProperty("--px", px.toFixed(3));
        tile.style.setProperty("--py", py.toFixed(3));
        tile.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
        tile.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
      });
    };
    const onLeave = () => {
      reset(current);
      current = null;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
