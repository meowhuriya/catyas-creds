"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { EggProgress } from "@/components/rewards/egg";
import { FoodArt, RARITY, eggById, foodById, randomFood } from "@/lib/rewards/catalog";
import { PantryItem, hatchEgg } from "@/lib/rewards/pantry";
import { SoundEngine } from "@/lib/sound-engine";

type Stage = "ready" | "cracking" | "reveal";

/** Full-screen hatch: tap the egg, it shakes and cracks, then the food bursts out. */
export function HatchOverlay({ items, onClose }: { items: PantryItem[]; onClose: () => void }) {
  const [i, setI] = React.useState(0);
  const [stage, setStage] = React.useState<Stage>("ready");
  const [food, setFood] = React.useState<FoodArt | null>(null);
  const item = items[i];

  React.useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  if (!item) return null;
  const egg = eggById(item.eggId);

  const tap = () => {
    if (stage !== "ready") return;
    setStage("cracking");
    SoundEngine.getInstance().playHatch();
    window.setTimeout(() => {
      setFood(hatchEgg(item.id) ?? (item.foodId ? foodById(item.foodId) ?? randomFood(item.minutes) : randomFood(item.minutes)));
      setStage("reveal");
    }, 620);
  };
  const next = () => {
    if (i + 1 < items.length) {
      setI(i + 1);
      setFood(null);
      setStage("ready");
    } else onClose();
  };
  const rar = food ? RARITY[food.rarity] : null;

  return createPortal(
    <div className="vc-fade-in fixed inset-0 z-[300] flex flex-col items-center justify-center overflow-hidden text-white" style={{ background: "radial-gradient(ellipse at 50% 45%, #2a1846 0%, #120a22 55%, #07040d 100%)" }}>
      <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20"><X className="h-5 w-5" /></button>

      {/* light rays + sparks behind */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[46%] h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2" style={{ opacity: stage === "reveal" ? 1 : 0.35, transition: "opacity .5s" }}>
        <div className="vc-rays h-full w-full" style={{ background: `repeating-conic-gradient(from 0deg, ${rar ? rar.color : "#c9a7ff"}26 0deg 7deg, transparent 7deg 18deg)`, maskImage: "radial-gradient(closest-side, #000 18%, transparent 70%)", WebkitMaskImage: "radial-gradient(closest-side, #000 18%, transparent 70%)" }} />
      </div>
      {Array.from({ length: 18 }, (_, k) => (
        <span key={k} aria-hidden className="vc-spark pointer-events-none absolute h-1.5 w-1.5 rounded-full" style={{ left: `${30 + ((k * 37) % 40)}%`, top: `${52 + ((k * 13) % 20)}%`, background: rar?.color ?? "#e9d5ff", "--d": `${1.6 + (k % 5) * 0.35}s`, "--delay": `${(k % 7) * 0.25}s` } as React.CSSProperties} />
      ))}

      <p className="vc-rise mb-6 text-[11px] font-semibold uppercase tracking-[0.42em] text-white/60">
        {stage === "reveal" ? "Added to today's pantry" : `${egg.name} egg${item.title ? ` · ${item.title}` : ""}`}
      </p>

      <div className="relative flex h-[300px] w-[300px] items-center justify-center">
        {stage !== "reveal" ? (
          <div className={stage === "cracking" ? "vc-egg-shake" : ""}>
            <EggProgress eggId={item.eggId} progress={1} ready size={190} onTap={tap} />
          </div>
        ) : (
          food && (
            <>
              <span aria-hidden className="vc-flash pointer-events-none fixed inset-0 bg-white" />
              <span aria-hidden className="vc-halo absolute inset-6 rounded-full" style={{ background: `radial-gradient(closest-side, ${rar!.color}99, transparent)` }} />
              <img src={food.src} alt={food.name} className="vc-pop-in relative w-[250px] drop-shadow-[0_18px_30px_rgba(0,0,0,.45)]" draggable={false} />
            </>
          )
        )}
      </div>

      {stage === "reveal" && food ? (
        <div className="mt-4 flex flex-col items-center gap-2 text-center">
          <span className="vc-rise rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: rar!.color, background: `${rar!.color}22`, boxShadow: `0 0 24px ${rar!.color}55`, animationDelay: ".25s" }}>{rar!.label}</span>
          <h2 className="vc-rise font-display text-4xl font-semibold tracking-tight" style={{ animationDelay: ".35s" }}>{food.name}</h2>
          <p className="vc-rise text-sm text-white/60" style={{ animationDelay: ".45s" }}>From {item.minutes} focused minutes</p>
          <button onClick={next} className="vc-rise mt-5 rounded-full bg-white px-7 py-3 text-sm font-semibold text-[#1a1030] shadow-[0_10px_30px_-8px_rgba(255,255,255,.6)] hover:scale-[1.03]" style={{ animationDelay: ".6s" }}>
            {i + 1 < items.length ? `Hatch the next egg (${items.length - i - 1} left)` : "Done"}
          </button>
        </div>
      ) : (
        <p className="mt-6 animate-pulse text-sm font-medium text-white/80">{stage === "cracking" ? "It's hatching…" : "Tap the egg to hatch it"}</p>
      )}
    </div>,
    document.body
  );
}
