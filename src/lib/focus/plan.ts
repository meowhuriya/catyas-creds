/**
 * Turns "what's left to master" across every subject into today's question blocks.
 * Gemini decides the split when available; this file also has an offline fallback.
 */
import { getSubject } from "@/lib/notes/curriculum";
import { QEntry, estMinutes, smartOpen } from "@/lib/notes/questions";
import { Exam, daysLeft } from "@/lib/notes/study";
import { FocusTask, makeTask } from "@/lib/focus/store";

export interface PlanChapter {
  name: string; // "" = no chapter
  open: number;
  weak: number;
  untried: number;
  avgMin: number;
}
export interface PlanSubject {
  id: string;
  code: string;
  title: string;
  exam?: string;
  daysLeft: number | null;
  chapters: PlanChapter[];
}
export interface PlanBlock {
  subjectId: string;
  chapter: string;
  count: number;
  why?: string;
}

export function planInput(entries: QEntry[], exams: Exam[]): PlanSubject[] {
  const bySubject = new Map<string, QEntry[]>();
  for (const e of entries) if (!e.item.done) bySubject.set(e.subjectId, [...(bySubject.get(e.subjectId) ?? []), e]);
  const out: PlanSubject[] = [];
  for (const [id, list] of bySubject) {
    const s = getSubject(id);
    const exam = exams
      .filter((x) => x.subjectId === id && (daysLeft(x.date) ?? 1) >= 0)
      .sort((a, b) => (a.date || "9").localeCompare(b.date || "9"))[0];
    const chapters = new Map<string, QEntry[]>();
    for (const e of list) chapters.set(e.chapter, [...(chapters.get(e.chapter) ?? []), e]);
    out.push({
      id,
      code: s?.code ?? id,
      title: s?.title ?? id,
      exam: exam?.name,
      daysLeft: exam ? daysLeft(exam.date) : null,
      chapters: Array.from(chapters, ([name, l]) => ({
        name,
        open: l.length,
        weak: l.filter((e) => e.item.weak).length,
        untried: l.filter((e) => !e.item.attempts).length,
        avgMin: Math.round(l.reduce((a, e) => a + estMinutes(e.item), 0) / l.length),
      })),
    });
  }
  return out;
}

/** Offline split: more time to subjects with sooner exams and more weak / open questions. */
export function fallbackBlocks(subjects: PlanSubject[], budgetMin: number): PlanBlock[] {
  const urgency = (s: PlanSubject) => {
    const open = s.chapters.reduce((a, c) => a + c.open + c.weak, 0);
    const days = s.daysLeft === null ? 30 : Math.max(1, s.daysLeft);
    return open / days;
  };
  const ranked = [...subjects].sort((a, b) => urgency(b) - urgency(a));
  const total = ranked.reduce((a, s) => a + urgency(s), 0) || 1;
  const blocks: PlanBlock[] = [];
  for (const s of ranked) {
    let share = (budgetMin * urgency(s)) / total;
    if (share < 8 && blocks.length > 0) continue;
    const chapters = [...s.chapters].sort((a, b) => b.weak - a.weak || b.open - a.open);
    for (const c of chapters) {
      if (share < c.avgMin * 0.6 || blocks.length >= 6) break;
      const count = Math.max(1, Math.min(c.open, Math.floor(share / c.avgMin)));
      blocks.push({ subjectId: s.id, chapter: c.name, count, why: s.daysLeft !== null ? `${s.exam} in ${s.daysLeft}d` : undefined });
      share -= count * c.avgMin;
    }
  }
  return blocks;
}

/** Picks the actual questions for each block (weak first), skipping ones already planned today. */
export function blocksToTasks(blocks: PlanBlock[], entries: QEntry[], already: Set<string>): FocusTask[] {
  const used = new Set(already);
  const tasks: FocusTask[] = [];
  for (const b of blocks) {
    const pool = smartOpen(entries.filter((e) => e.subjectId === b.subjectId && e.chapter === (b.chapter ?? "") && !used.has(e.key)));
    const pick = pool.slice(0, Math.max(1, Math.round(b.count)));
    if (!pick.length) continue;
    pick.forEach((e) => used.add(e.key));
    const s = getSubject(b.subjectId);
    tasks.push(
      makeTask({
        title: `${s?.code ?? b.subjectId} · ${b.chapter || "Mixed questions"}`,
        kind: "questions",
        subjectId: b.subjectId,
        chapter: b.chapter || undefined,
        refs: pick.map((e) => ({ noteId: e.noteId, itemId: e.itemId })),
        auto: true,
        why: b.why,
      })
    );
  }
  return tasks;
}
