"use client";

import { readKey, todayKey, useStored, writeKey } from "@/lib/notes/study";
import { newId } from "@/lib/notes/vault-types";
import { SPECIES, Species } from "@/lib/focus/flowers";

export interface GardenFlower {
  id: string;
  date: string; // yyyy-mm-dd
  kind: Species;
  minutes: number;
  wilted?: boolean;
  title?: string;
  bouquetId?: string;
}
export interface Bouquet {
  id: string;
  date: string;
  kinds: Species[];
  flowerIds: string[];
}
interface Garden {
  flowers: GardenFlower[];
  bouquets: Bouquet[];
}

const KEY = "vc_garden_v1";
const EMPTY: Garden = { flowers: [], bouquets: [] };
export const BOUQUET_MIN = 3; // flowers needed to wrap one

export const pickSpecies = (): Species => SPECIES[Math.floor(Math.random() * SPECIES.length)].id;

export function plantFlower(f: { kind: Species; minutes: number; wilted?: boolean; title?: string }) {
  const g = readKey<Garden>(KEY, EMPTY);
  writeKey(KEY, { ...g, flowers: [...g.flowers, { id: newId("fl"), date: todayKey(), ...f }] });
}

export function useGarden() {
  const g = useStored<Garden>(KEY, EMPTY);
  const today = todayKey();
  const todays = g.flowers.filter((f) => f.date === today);
  const loose = todays.filter((f) => !f.wilted && !f.bouquetId);
  const wrap = () => {
    if (loose.length < BOUQUET_MIN) return;
    const id = newId("fl");
    const ids = new Set(loose.map((f) => f.id));
    const cur = readKey<Garden>(KEY, EMPTY);
    writeKey(KEY, {
      flowers: cur.flowers.map((f) => (ids.has(f.id) ? { ...f, bouquetId: id } : f)),
      bouquets: [...cur.bouquets, { id, date: today, kinds: loose.map((f) => f.kind), flowerIds: [...ids] }],
    });
  };
  return {
    todays,
    bloomed: todays.filter((f) => !f.wilted),
    wilted: todays.filter((f) => f.wilted),
    loose,
    bouquets: [...g.bouquets].reverse(),
    wrap,
    total: g.flowers.filter((f) => !f.wilted).length,
  };
}
