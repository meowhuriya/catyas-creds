/**
 * One way to look at "questions" everywhere in the app (subject panel, Focus, exams, AI plan).
 * A question is a checklist item inside a note (Q-bank questions or note topics).
 */
import { MASTERED_SCORE, StudyItem, drillOrder } from "@/lib/notes/study";
import { VaultNote } from "@/lib/notes/vault-types";

export interface QRef {
  noteId: string;
  itemId: string;
}
export interface QEntry extends QRef {
  key: string; // `${noteId}:${itemId}`
  subjectId: string;
  noteTitle: string;
  isQbank: boolean;
  chapter: string; // "" when none
  item: StudyItem;
}

export const refKey = (r: QRef) => `${r.noteId}:${r.itemId}`;

export function questionEntries(notes: VaultNote[], topics: Record<string, StudyItem[]>): QEntry[] {
  const out: QEntry[] = [];
  for (const n of notes) {
    for (const item of topics[n.id] ?? []) {
      out.push({
        key: `${n.id}:${item.id}`,
        noteId: n.id,
        itemId: item.id,
        subjectId: n.courseId,
        noteTitle: n.title,
        isQbank: n.section === "qbank",
        chapter: item.chapter || "",
        item,
      });
    }
  }
  return out;
}

export interface QStats {
  total: number;
  mastered: number;
  attempted: number;
  weak: number;
  untried: number;
  pct: number;
}

export function qStats(entries: QEntry[]): QStats {
  const total = entries.length;
  const mastered = entries.filter((e) => e.item.done).length;
  const attempted = entries.filter((e) => e.item.attempts).length;
  const weak = entries.filter((e) => e.item.weak && !e.item.done).length;
  return { total, mastered, attempted, weak, untried: total - attempted, pct: total ? Math.round((mastered / total) * 100) : 0 };
}

export function groupByChapter(entries: QEntry[]): { chapter: string; entries: QEntry[] }[] {
  const groups: { chapter: string; entries: QEntry[] }[] = [];
  for (const e of entries) {
    let g = groups.find((x) => x.chapter === e.chapter);
    if (!g) groups.push((g = { chapter: e.chapter, entries: [] }));
    g.entries.push(e);
  }
  // Units in order (Unit 1, Unit 2, ...), other chapters in first-seen order, "no chapter" last.
  const unitNo = (c: string) => Number(c.match(/^(?:unit|experiment)\s*(\d+)/i)?.[1] ?? 1e6);
  return groups
    .map((g, i) => ({ g, i }))
    .sort((a, b) => Number(a.g.chapter === "") - Number(b.g.chapter === "") || unitNo(a.g.chapter) - unitNo(b.g.chapter) || a.i - b.i)
    .map((x) => x.g);
}

/** Rough minutes a question takes to answer from memory, by marks. */
export function estMinutes(item: StudyItem): number {
  const m = item.marks ?? 0;
  return m >= 8 ? 15 : m >= 5 ? 10 : m > 0 ? 4 : 6;
}

/** Open (not mastered) entries in smart order: weak, untried, shaky, then the rest. */
export function smartOpen(entries: QEntry[]): QEntry[] {
  const open = entries.filter((e) => !e.item.done);
  const order = drillOrder(open.map((e) => e.item));
  return order.map((it) => open.find((e) => e.item === it)!);
}

export function isMastered(item: StudyItem) {
  return item.done || (item.lastScore ?? 0) >= MASTERED_SCORE;
}
