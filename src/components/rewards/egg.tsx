"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { eggById } from "@/lib/rewards/catalog";
import { cn } from "@/lib/utils";

/**
 * The egg on the timer. It wobbles more and cracks open bit by bit as the session runs;
 * when it's done it glows and waits to be tapped.
 */
export function EggProgress({ eggId, progress, size = 120, ready, onTap, className }: { eggId?: string; progress: number; size?: number; ready?: boolean; onTap?: () => void; className?: string }) {
  const egg = eggById(eggId);
  const p = Math.max(0, Math.min(1, progress));
  const crack = (from: number) => Math.max(0, Math.min(1, (p - from) / 0.18));
  const wob = ready ? 6 : 0.8 + p * 3.5;
  const style = { width: size, height: size * 1.18, "--wob": `${wob}deg`, "--wob-speed": `${ready ? 1.2 : 3.2 - p * 1.6}s` } as React.CSSProperties;
  const Tag = onTap ? "button" : "div";
  return (
    <Tag onClick={onTap} aria-label={ready ? `Hatch your ${egg.name} egg` : `${egg.name} egg`} className={cn("relative inline-block select-none", onTap && "cursor-pointer", className)} style={style}>
      {ready && <span aria-hidden className="vc-halo absolute inset-[-18%] rounded-full" style={{ background: "radial-gradient(closest-side, rgba(255,220,140,.75), rgba(255,200,120,.25) 55%, transparent)" }} />}
      <span aria-hidden className="absolute bottom-[2%] left-1/2 h-[10%] w-[62%] -translate-x-1/2 rounded-[50%] bg-black/20 blur-[3px]" />
      <span className={cn("absolute inset-0 block", p > 0.02 || ready ? "vc-egg-wobble" : "")}>
        <img src={egg.src} alt="" draggable={false} className="h-full w-full object-contain drop-shadow-[0_8px_14px_rgba(20,10,40,.25)]" />
        {/* cracks grow in three stages */}
        <svg viewBox="0 0 100 118" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 1.5px rgba(40,20,0,.9))" }}>
            <path d="M50 22 L46 34 L53 42 L47 53" strokeWidth="2.2" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - crack(0.45)} />
            <path d="M53 42 L62 46 L66 58" strokeWidth="1.8" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - crack(0.62)} />
            <path d="M47 53 L38 60 L41 72 L34 80" strokeWidth="2" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - crack(0.75)} />
            <path d="M66 58 L60 68 L68 76" strokeWidth="1.6" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - crack(0.85)} />
          </g>
          {ready && <path d="M46 34 L53 42 L47 53" fill="none" stroke="#FFE8A8" strokeWidth="3.4" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 4px #FFD36B)" }} />}
        </svg>
      </span>
    </Tag>
  );
}
