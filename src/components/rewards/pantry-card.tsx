"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Egg, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EggProgress } from "@/components/rewards/egg";
import { HatchOverlay } from "@/components/rewards/hatch-overlay";
import { RARITY, foodById } from "@/lib/rewards/catalog";
import { PantryItem, usePantry } from "@/lib/rewards/pantry";
import { todayKey } from "@/lib/notes/study";
import { cn } from "@/lib/utils";

const fmtDay = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const keyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** A dining table seen from above, laid with one plate per hatched food. */
export function FoodTable({ items, compact = false }: { items: PantryItem[]; compact?: boolean }) {
  const foods = items.filter((i) => i.foodId).map((i) => ({ it: i, f: foodById(i.foodId)! })).filter((x) => x.f);
  const cols = compact ? Math.max(4, Math.min(8, foods.length)) : Math.max(3, Math.min(6, Math.ceil(Math.sqrt(foods.length * 1.6))));
  return (
    <div
      className="relative overflow-hidden rounded-[28px] p-4 shadow-[inset_0_2px_0_rgba(255,255,255,.25),0_20px_40px_-24px_rgba(60,30,10,.6)]"
      style={{
        background:
          "repeating-linear-gradient(90deg, rgba(0,0,0,.05) 0 2px, transparent 2px 90px), linear-gradient(160deg, #b9875c, #8f6440 60%, #7a5334)",
      }}
    >
      {/* gingham runner */}
      <div
        className="relative rounded-[20px] p-3"
        style={{
          backgroundColor: "#fff6f2",
          backgroundImage:
            "linear-gradient(90deg, rgba(232,120,140,.22) 50%, transparent 50%), linear-gradient(rgba(232,120,140,.22) 50%, transparent 50%)",
          backgroundSize: "28px 28px",
          boxShadow: "0 1px 0 rgba(255,255,255,.6) inset, 0 6px 14px -8px rgba(60,20,20,.45)",
        }}
      >
        {foods.length === 0 ? (
          <p className="py-6 text-center text-sm font-medium text-[#8a4a5a]">The table is empty. Finish a focus session and hatch an egg.</p>
        ) : (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {foods.map(({ it, f }) => (
              <div key={it.id} title={`${f.name} · ${RARITY[f.rarity].label} · ${it.minutes} min${it.title ? ` · ${it.title}` : ""}`} className="group relative aspect-square">
                <span aria-hidden className="absolute inset-[6%] rounded-full bg-white shadow-[0_4px_10px_-4px_rgba(80,30,30,.45),inset_0_-3px_0_rgba(0,0,0,.05)]" />
                <span aria-hidden className="absolute inset-[16%] rounded-full border border-[#f1e4e4]" />
                <img src={f.src} alt={f.name} className="relative h-full w-full object-contain p-[6%] transition-transform group-hover:-translate-y-1 group-hover:scale-105" draggable={false} />
                {f.rarity !== "common" && <span aria-hidden className="absolute right-[8%] top-[8%] h-2 w-2 rounded-full" style={{ background: RARITY[f.rarity].color, boxShadow: `0 0 8px ${RARITY[f.rarity].color}` }} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Focus page card: today's table, eggs waiting to hatch, and every past day on a calendar. */
export function PantryCard() {
  const p = usePantry();
  const [hatching, setHatching] = React.useState<PantryItem[] | null>(null);
  const [month, setMonth] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [day, setDay] = React.useState<string | null>(null);
  const today = todayKey();
  const foodsToday = p.today.filter((i) => i.foodId);

  // first cell = Monday on or before the 1st
  const start = new Date(month);
  start.setDate(1 - ((month.getDay() + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, k) => {
    const d = new Date(start);
    d.setDate(start.getDate() + k);
    return d;
  });

  return (
    <section className="vc-tile space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-app-ink">Today&apos;s pantry</h2>
          <p className="text-xs text-app-ink-muted">
            {foodsToday.length ? `${foodsToday.length} dish${foodsToday.length === 1 ? "" : "es"} on the table` : "Every finished focus session lays an egg. Hatch it for food."}
            {p.foodCount > foodsToday.length ? ` · ${p.foodCount} collected in total` : ""}
          </p>
        </div>
        {p.waiting.length > 0 && (
          <Button onClick={() => setHatching(p.waiting)}><Egg className="h-4 w-4" /> Hatch {p.waiting.length} egg{p.waiting.length === 1 ? "" : "s"}</Button>
        )}
      </div>

      {p.waiting.length > 0 && (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-[var(--ctl-fill)] p-3">
          {p.waiting.slice(0, 8).map((it) => (
            <EggProgress key={it.id} eggId={it.eggId} progress={1} ready size={54} onTap={() => setHatching([it])} />
          ))}
          <span className="pb-2 text-xs text-app-ink-muted">Tap an egg to hatch it</span>
        </div>
      )}

      <FoodTable items={p.today} compact />

      {/* calendar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-app-ink-muted">Your pantry</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month" className="rounded-full p-1.5 hover:bg-[var(--ctl-fill)]"><ChevronLeft className="h-4 w-4" /></button>
            <span className="w-32 text-center text-sm font-medium text-app-ink">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month" className="rounded-full p-1.5 hover:bg-[var(--ctl-fill)]"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-app-ink-muted">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d}>{d}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d) => {
            const k = keyOf(d);
            const items = (p.byDay[k] ?? []).filter((i) => i.foodId);
            const inMonth = d.getMonth() === month.getMonth();
            const first = items[0] ? foodById(items[0].foodId) : undefined;
            return (
              <button
                key={k}
                onClick={() => setDay(k)}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center rounded-xl text-[11px] transition-colors",
                  inMonth ? "text-app-ink" : "text-app-ink-muted/40",
                  items.length ? "bg-[var(--accent-soft)] hover:brightness-95" : "hover:bg-[var(--ctl-fill)]",
                  k === today && "ring-2 ring-app-accent"
                )}
              >
                <span className="absolute left-1.5 top-1 font-medium">{d.getDate()}</span>
                {first && <img src={first.src} alt="" className="mt-2 h-[58%] w-[58%] object-contain" draggable={false} />}
                {items.length > 1 && <span className="absolute bottom-0.5 right-1 rounded-full bg-app-accent px-1 text-[9px] font-bold text-white">{items.length}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {day && <DayTable date={day} items={p.byDay[day] ?? []} onClose={() => setDay(null)} />}
      {hatching && <HatchOverlay items={hatching} onClose={() => setHatching(null)} />}
    </section>
  );
}

function DayTable({ date, items, onClose }: { date: string; items: PantryItem[]; onClose: () => void }) {
  const foods = items.filter((i) => i.foodId);
  const minutes = items.reduce((a, i) => a + i.minutes, 0);
  return createPortal(
    <div className="vc-fade-in fixed inset-0 z-[250] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-[28px] bg-app-surface p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-app-ink-muted">{fmtDay(date)}</p>
            <h3 className="font-display text-2xl text-app-ink">{foods.length ? `${foods.length} dish${foods.length === 1 ? "" : "es"} on the table` : "Nothing on the table"}</h3>
            <p className="text-sm text-app-ink-muted">{minutes} focused minutes{items.length > foods.length ? ` · ${items.length - foods.length} egg${items.length - foods.length === 1 ? "" : "s"} still to hatch` : ""}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-[var(--ctl-fill)]"><X className="h-5 w-5" /></button>
        </div>
        <FoodTable items={items} />
        {foods.length > 0 && (
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {foods.map((i) => {
              const f = foodById(i.foodId)!;
              return (
                <li key={i.id} className="flex items-center gap-2 rounded-xl bg-[var(--ctl-fill)] px-3 py-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: RARITY[f.rarity].color }} />
                  <span className="flex-1 truncate text-app-ink">{f.name}</span>
                  <span className="shrink-0 text-xs text-app-ink-muted">{i.minutes} min{i.title ? ` · ${i.title}` : ""}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>,
    document.body
  );
}
