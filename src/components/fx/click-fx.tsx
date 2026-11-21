"use client";

import * as React from "react";
import { butterflySvg } from "@/components/brand/butterfly";

const PALETTE = ["#FF6EC7", "#B04DFF", "#8A63F2", "#F28AD0", "#7FE3F0", "#C86BFF"];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Global click "abilities": every click releases a few iridescent butterflies and
 * a sparkle ring; primary actions cast a bigger burst with a soft smoke puff.
 * Pure DOM + Web Animations (no React re-renders) so it stays smooth.
 */
export function ClickFx() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const layer = document.createElement("div");
    layer.className = "vc-fx-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    let last = 0;

    const spawn = (el: HTMLElement, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
      layer.appendChild(el);
      const anim = el.animate(frames, { fill: "forwards", ...opts });
      anim.onfinish = () => el.remove();
      anim.oncancel = () => el.remove();
    };

    const butterflies = (x: number, y: number, count: number, spread: number) => {
      for (let i = 0; i < count; i++) {
        const el = document.createElement("div");
        el.className = "vc-fx-item";
        const size = Math.round(rand(14, 24));
        el.innerHTML = butterflySvg(PALETTE[(Math.random() * PALETTE.length) | 0], size);
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        const ang = ((-90 + rand(-spread, spread)) * Math.PI) / 180;
        const dist = rand(60, 150);
        const dx = Math.cos(ang) * dist;
        const dy = Math.sin(ang) * dist - rand(10, 40);
        const wob = rand(-30, 30);
        spawn(
          el,
          [
            { transform: "translate(-50%,-50%) scale(0.2) rotate(0deg)", opacity: 0 },
            { offset: 0.15, opacity: 1, transform: `translate(calc(-50% + ${dx * 0.2}px), calc(-50% + ${dy * 0.2}px)) scale(1) rotate(${wob}deg)` },
            { offset: 0.6, opacity: 0.9, transform: `translate(calc(-50% + ${dx * 0.7 + wob}px), calc(-50% + ${dy * 0.7}px)) scale(0.95) rotate(${-wob}deg)` },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.7) rotate(${wob * 0.5}deg)`, opacity: 0 },
          ],
          { duration: rand(1100, 1700), easing: "cubic-bezier(.2,.7,.2,1)" }
        );
      }
    };

    const ring = (x: number, y: number, big: boolean) => {
      const el = document.createElement("div");
      el.className = "vc-fx-ring";
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      spawn(
        el,
        [
          { transform: "translate(-50%,-50%) scale(0.2)", opacity: 0.9 },
          { transform: `translate(-50%,-50%) scale(${big ? 2.4 : 1.4})`, opacity: 0 },
        ],
        { duration: big ? 700 : 520, easing: "cubic-bezier(.2,.7,.2,1)" }
      );
    };

    const sparkles = (x: number, y: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const el = document.createElement("div");
        el.className = "vc-fx-spark";
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.background = PALETTE[i % PALETTE.length];
        const a = rand(0, Math.PI * 2);
        const d = rand(18, 46);
        spawn(
          el,
          [
            { transform: "translate(-50%,-50%) scale(0) rotate(0deg)", opacity: 1 },
            { offset: 0.4, transform: `translate(calc(-50% + ${Math.cos(a) * d * 0.7}px), calc(-50% + ${Math.sin(a) * d * 0.7}px)) scale(1) rotate(90deg)`, opacity: 1 },
            { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(0) rotate(180deg)`, opacity: 0 },
          ],
          { duration: rand(500, 800), easing: "ease-out" }
        );
      }
    };

    const smoke = (x: number, y: number) => {
      for (let i = 0; i < 3; i++) {
        const el = document.createElement("div");
        el.className = "vc-fx-smoke";
        el.style.left = `${x + rand(-14, 14)}px`;
        el.style.top = `${y + rand(-10, 10)}px`;
        spawn(
          el,
          [
            { transform: "translate(-50%,-50%) scale(0.3)", opacity: 0.75 },
            { transform: `translate(calc(-50% + ${rand(-20, 20)}px), calc(-50% - ${rand(10, 30)}px)) scale(${rand(1.8, 2.6)})`, opacity: 0 },
          ],
          { duration: rand(900, 1300), delay: i * 60, easing: "cubic-bezier(.2,.7,.2,1)" }
        );
      }
    };

    const onDown = (e: PointerEvent) => {
      if (reduce.matches || e.button !== 0) return;
      const now = performance.now();
      if (now - last < 90) return;
      last = now;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable='true'], .no-fx")) return;
      const x = e.clientX;
      const y = e.clientY;
      const cast = t?.closest(".vc-btn-primary, [data-fx='cast']");
      const interactive = t?.closest("a, button, [role='button'], [role='tab'], summary, label, .vc-tile");
      if (cast) {
        smoke(x, y);
        ring(x, y, true);
        sparkles(x, y, 8);
        butterflies(x, y, 8, 80);
      } else if (interactive) {
        ring(x, y, false);
        sparkles(x, y, 4);
        butterflies(x, y, 3, 55);
      } else {
        ring(x, y, false);
        sparkles(x, y, 3);
        if (Math.random() < 0.5) butterflies(x, y, 1, 40);
      }
    };

    window.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onDown);
      layer.remove();
    };
  }, []);

  return null;
}
