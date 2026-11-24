"use client";

import { readKey, useStored, writeKey } from "@/lib/notes/study";
import { TIERS, Tier } from "@/lib/rewards/catalog";

/**
 * Rank badges you earn as you master questions.
 * Chapter: Iron 10% → Bronze 25% → Silver 40% → Gold 55% → Platinum 70% → Diamond 85% → Master 100%.
 * A whole exam at 100% ready: Grandmaster. A whole Q-bank mastered: Challenger.
 */
export interface Badge {
  key: string; // unique: what it was earned for + tier
  tier: Tier;
  kind: "chapter" | "exam" | "qbank";
  noteId?: string;
  chapter?: string;
  examId?: string;
  courseId?: string;
  label: string; // "Unit 3: Mean Value Theorems" / exam name / Q-bank title
  earnedAt: string;
}

interface Store {
  seeded: boolean;
  badges: Badge[];
}

export const BADGES_KEY = "vc_badges_v1";
const EMPTY: Store = { seeded: false, badges: [] };

export function readBadges(): Store {
  return readKey<Store>(BADGES_KEY, EMPTY);
}
export function writeBadges(s: Store) {
  writeKey(BADGES_KEY, s);
}

export function useBadges() {
  return useStored<Store>(BADGES_KEY, EMPTY).badges;
}

const ORDER = TIERS.map((t) => t.id);
export const tierRank = (t: Tier) => ORDER.indexOf(t);

/** Badges earned in one chapter of one Q-bank, best first. */
export function chapterBadges(all: Badge[], noteId: string, chapter: string): Badge[] {
  return all.filter((b) => b.kind === "chapter" && b.noteId === noteId && (b.chapter ?? "") === chapter).sort((a, b) => tierRank(b.tier) - tierRank(a.tier));
}

/** Chapter tiers reached at a given percentage mastered. */
export function chapterTiers(pct: number, total: number): Tier[] {
  if (!total) return [];
  return TIERS.filter((t) => t.at <= 100 && pct >= t.at).map((t) => t.id);
}
