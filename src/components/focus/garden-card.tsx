"use client";

import * as React from "react";
import { Download, Gift, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BOUQUET_MIN, useGarden } from "@/lib/focus/garden";
import { SPECIES } from "@/lib/focus/flowers";
import { Bloom, Bouquet, downloadBouquet } from "@/components/focus/flower";

const nameOf = (k: string) => SPECIES.find((s) => s.id === k)?.name ?? k;

export function GardenCard() {
  const g = useGarden();
  const [showAll, setShowAll] = React.useState(false);
  const latest = g.bouquets[0];
  const need = Math.max(0, BOUQUET_MIN - g.loose.length);
  const mins = g.bloomed.reduce((a, f) => a + f.minutes, 0);

  return (
    <section className="vc-tile p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-app-ink"><Sprout className="h-4 w-4" /> Today&apos;s garden</h2>
          <p className="text-xs text-app-ink-muted">
            {g.bloomed.length === 0 ? "Finish a focus session to grow your first flower." : `${g.bloomed.length} flower${g.bloomed.length === 1 ? "" : "s"} · ${mins} min focused${g.wilted.length ? ` · ${g.wilted.length} wilted` : ""}`}
          </p>
        </div>
        <span className="font-display text-3xl font-semibold text-app-ink tabular-nums">{g.bloomed.length}</span>
      </div>

      {g.todays.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {g.todays.map((f) => (
            <span key={f.id} title={`${nameOf(f.kind)} · ${f.minutes} min${f.wilted ? " · left early" : ""}${f.title ? ` · ${f.title}` : ""}`} className={f.wilted ? "opacity-40 grayscale" : f.bouquetId ? "opacity-60" : ""}>
              <Bloom species={f.kind} size={52} />
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 rounded-control border border-app-border p-3 text-sm">
        {g.loose.length >= BOUQUET_MIN ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-app-ink">You have {g.loose.length} flowers, enough for a bouquet!</p>
            <Button onClick={g.wrap}><Gift className="h-4 w-4" /> Wrap bouquet</Button>
          </div>
        ) : (
          <p className="text-app-ink-muted">{need} more flower{need === 1 ? "" : "s"} and you can wrap a bouquet (needs {BOUQUET_MIN}).</p>
        )}
      </div>

      {latest && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-app-ink-muted">Your bouquets</p>
          <div className="mt-1 flex flex-wrap items-end gap-3">
            {(showAll ? g.bouquets : g.bouquets.slice(0, 1)).map((b) => (
              <div key={b.id} className="space-y-1 text-center">
                <Bouquet kinds={b.kinds} size={showAll ? 150 : 230} />
                <button onClick={() => downloadBouquet(b.kinds, `bouquet-${b.date}`)} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)]">
                  <Download className="h-3 w-3" /> Save picture · {b.kinds.length} flowers
                </button>
              </div>
            ))}
          </div>
          {g.bouquets.length > 1 && <button onClick={() => setShowAll((v) => !v)} className="mt-2 text-xs text-app-ink-muted hover:text-app-ink">{showAll ? "Show less" : `Show all ${g.bouquets.length}`}</button>}
        </div>
      )}
    </section>
  );
}
