"use client";

import { readKey, todayKey, useStored, writeKey } from "@/lib/notes/study";
import { newId } from "@/lib/notes/vault-types";
import { FoodArt, randomEgg, randomFood } from "@/lib/rewards/catalog";

/**
 * Every finished focus session lays an egg. Tap it to hatch: the food inside goes
 * on that day's table in your pantry and stays there for good.
 */
export interface PantryItem {
  id: string;
  date: string; // yyyy-mm-dd the session finished
  eggId: string;
  minutes: number;
  title?: string;
  foodId?: string; // set once hatched
  hatchedAt?: string;
}

interface Pantry {
  items: PantryItem[];
}

const KEY = "vc_pantry_v1";
const EMPTY: Pantry = { items: [] };

export function layEgg(opts: { eggId?: string; minutes: number; title?: string }): PantryItem {
  const item: PantryItem = { id: newId("egg"), date: todayKey(), eggId: opts.eggId ?? randomEgg().id, minutes: opts.minutes, title: opts.title };
  const p = readKey<Pantry>(KEY, EMPTY);
  writeKey(KEY, { items: [...p.items, item] });
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("vc:egg-laid", { detail: item }));
  return item;
}

/** Opens an egg and returns the food that came out (already saved to the pantry). */
export function hatchEgg(id: string): FoodArt | null {
  const p = readKey<Pantry>(KEY, EMPTY);
  const it = p.items.find((x) => x.id === id);
  if (!it || it.foodId) return null;
  const food = randomFood(it.minutes);
  writeKey(KEY, { items: p.items.map((x) => (x.id === id ? { ...x, foodId: food.id, hatchedAt: new Date().toISOString() } : x)) });
  return food;
}

export function usePantry() {
  const p = useStored<Pantry>(KEY, EMPTY);
  const today = todayKey();
  const byDay: Record<string, PantryItem[]> = {};
  for (const it of p.items) (byDay[it.date] ??= []).push(it);
  return {
    items: p.items,
    byDay,
    today: byDay[today] ?? [],
    waiting: p.items.filter((x) => !x.foodId),
    foodCount: p.items.filter((x) => x.foodId).length,
  };
}
