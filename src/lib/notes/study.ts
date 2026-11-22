"use client";

import * as React from "react";
import { CLOUD_SYNC_EVENT } from "@/lib/cloud-sync/synced-storage";
import { newId } from "@/lib/notes/vault-types";

export interface StudyItem {
  id: string;
  text: string;
  done: boolean;
  weak?: boolean; // scored low in a drill / added from a practice miss
  chapter?: string; // unit / chapter heading from the Q-bank
  marks?: number;
  attempts?: number;
  lastScore?: number; // 0-10 from the last graded attempt
  lastAt?: string;
}

export type NewItem = string | { text: string; chapter?: string; marks?: number };
export interface SubjectStudy {
  items: StudyItem[];
}
export interface Exam {
  id: string;
  subjectId: string;
  name: string;
  date: string; // yyyy-mm-dd
  noteIds: string[];
  todos?: StudyItem[];
  today?: { date: string; keys: string[] };
}
export interface Progress {
  done: number;
  total: number;
  pct: number;
}

export function progressOf(items: StudyItem[] | undefined): Progress {
  const list = items ?? [];
  const done = list.filter((i) => i.done).length;
  return { done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
}

export function sumProgress(parts: Progress[]): Progress {
  const done = parts.reduce((a, p) => a + p.done, 0);
  const total = parts.reduce((a, p) => a + p.total, 0);
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function daysLeft(d?: string): number | null {
  if (!d) return null;
  const t = new Date(d + "T00:00:00").getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - new Date().setHours(0, 0, 0, 0)) / 86400000);
}

/* ---- tiny shared localStorage store so every component stays in sync ---- */
const listeners = new Set<() => void>();
const memo = new Map<string, { raw: string | null; value: unknown }>();

export function readKey<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    /* blocked */
  }
  const hit = memo.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  try {
    if (raw) value = JSON.parse(raw) as T;
  } catch {
    /* corrupt value */
  }
  memo.set(key, { raw, value });
  return value;
}

export function writeKey(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
  listeners.forEach((l) => l());
}

export function useStored<T>(key: string, fallback: T): T {
  const subscribe = React.useCallback((cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    window.addEventListener(CLOUD_SYNC_EVENT, cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
      window.removeEventListener(CLOUD_SYNC_EVENT, cb);
    };
  }, []);
  const fb = React.useRef(fallback).current;
  return React.useSyncExternalStore(subscribe, () => readKey(key, fb), () => fb);
}

function mergeItems(existing: StudyItem[], texts: NewItem[], weak: boolean): StudyItem[] {
  const have = new Set(existing.map((i) => i.text.toLowerCase()));
  const fresh: StudyItem[] = [];
  for (const t of texts) {
    const o = typeof t === "string" ? { text: t } : t;
    const text = o.text.trim();
    if (!text || have.has(text.toLowerCase())) continue;
    have.add(text.toLowerCase());
    fresh.push({ id: newId("chk"), text, done: false, weak: weak || undefined, chapter: o.chapter || undefined, marks: o.marks || undefined });
  }
  return [...existing, ...fresh];
}

/** Mastered = scored 7+ ; weak = under 5. */
export const MASTERED_SCORE = 7;
export const WEAK_SCORE = 5;

/** Smart order for drilling: weak first, then never tried, then shaky, then oldest mastered. */
export function drillOrder<T extends StudyItem>(items: T[]): T[] {
  const rank = (i: T) =>
    i.weak && !i.done ? 0 : !i.attempts ? 1 : (i.lastScore ?? 0) < MASTERED_SCORE ? 2 : 3;
  return [...items].sort((a, b) => rank(a) - rank(b) || (a.lastAt ?? "").localeCompare(b.lastAt ?? ""));
}

/* ---- general (per-subject) topics ---- */
const STUDY_KEY = "vc_study_v1";
const EMPTY_STUDY: Record<string, SubjectStudy> = {};

export function useStudy(subjectId: string) {
  const all = useStored(STUDY_KEY, EMPTY_STUDY);
  const data: SubjectStudy = all[subjectId] ?? { items: [] };
  const update = (fn: (s: SubjectStudy) => SubjectStudy) => {
    const cur = readKey(STUDY_KEY, EMPTY_STUDY);
    writeKey(STUDY_KEY, { ...cur, [subjectId]: fn(cur[subjectId] ?? { items: [] }) });
  };
  return {
    data,
    addItems: (texts: NewItem[], weak = false) => update((s) => ({ ...s, items: mergeItems(s.items, texts, weak) })),
    toggle: (id: string) => update((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) })),
    remove: (id: string) => update((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) })),
  };
}

/* ---- topics checklist for each individual note ---- */
const TOPICS_KEY = "vc_note_topics_v1";
const EMPTY_TOPICS: Record<string, StudyItem[]> = {};

export function useNoteTopics() {
  const topics = useStored(TOPICS_KEY, EMPTY_TOPICS);
  const update = (noteId: string, fn: (items: StudyItem[]) => StudyItem[]) => {
    const cur = readKey(TOPICS_KEY, EMPTY_TOPICS);
    writeKey(TOPICS_KEY, { ...cur, [noteId]: fn(cur[noteId] ?? []) });
  };
  return {
    topics,
    progress: (noteId: string) => progressOf(topics[noteId]),
    add: (noteId: string, texts: NewItem[], weak = false) => update(noteId, (l) => mergeItems(l, texts, weak)),
    record: (noteId: string, id: string, score: number) =>
      update(noteId, (l) =>
        l.map((i) =>
          i.id === id
            ? {
                ...i,
                attempts: (i.attempts ?? 0) + 1,
                lastScore: score,
                lastAt: new Date().toISOString(),
                done: score >= MASTERED_SCORE ? true : i.done && score >= WEAK_SCORE,
                weak: score < WEAK_SCORE,
              }
            : i
        )
      ),
    clear: (noteId: string) => update(noteId, () => []),
    toggle: (noteId: string, id: string) => update(noteId, (l) => l.map((i) => (i.id === id ? { ...i, done: !i.done } : i))),
    remove: (noteId: string, id: string) => update(noteId, (l) => l.filter((i) => i.id !== id)),
    removeMany: (noteId: string, ids: string[]) => update(noteId, (l) => l.filter((i) => !ids.includes(i.id))),
  };
}

/* ---- exams: a date + the notes you're revising for it ---- */
const EXAMS_KEY = "vc_exams_v1";
const EMPTY_EXAMS: Exam[] = [];

export function useExams() {
  const exams = useStored(EXAMS_KEY, EMPTY_EXAMS);
  return {
    exams,
    save: (exam: Omit<Exam, "id"> & { id?: string }) => {
      const cur = readKey(EXAMS_KEY, EMPTY_EXAMS);
      const full: Exam = { ...exam, id: exam.id ?? newId("exam") };
      writeKey(EXAMS_KEY, cur.some((e) => e.id === full.id) ? cur.map((e) => (e.id === full.id ? full : e)) : [...cur, full]);
      return full.id;
    },
    remove: (id: string) => writeKey(EXAMS_KEY, readKey(EXAMS_KEY, EMPTY_EXAMS).filter((e) => e.id !== id)),
    setToday: (examId: string, today: { date: string; keys: string[] }) =>
      writeKey(EXAMS_KEY, readKey(EXAMS_KEY, EMPTY_EXAMS).map((e) => (e.id === examId ? { ...e, today } : e))),
    addTodo: (examId: string, text: string) =>
      writeKey(
        EXAMS_KEY,
        readKey(EXAMS_KEY, EMPTY_EXAMS).map((e) => (e.id === examId ? { ...e, todos: mergeItems(e.todos ?? [], [text], false) } : e))
      ),
    toggleTodo: (examId: string, id: string) =>
      writeKey(
        EXAMS_KEY,
        readKey(EXAMS_KEY, EMPTY_EXAMS).map((e) =>
          e.id === examId ? { ...e, todos: (e.todos ?? []).map((t) => (t.id === id ? { ...t, done: !t.done } : t)) } : e
        )
      ),
    removeTodo: (examId: string, id: string) =>
      writeKey(
        EXAMS_KEY,
        readKey(EXAMS_KEY, EMPTY_EXAMS).map((e) => (e.id === examId ? { ...e, todos: (e.todos ?? []).filter((t) => t.id !== id) } : e))
      ),
  };
}

/** Note topics only. */
export function examTopicProgress(exam: Exam, topics: Record<string, StudyItem[]>): Progress {
  return sumProgress(exam.noteIds.map((id) => progressOf(topics[id])));
}

/** Note topics + the exam's own to-do list, combined. */
export function examProgress(exam: Exam, topics: Record<string, StudyItem[]>): Progress {
  return sumProgress([examTopicProgress(exam, topics), progressOf(exam.todos)]);
}

/* ---- daily plan: spread what's left over the days before the exam ---- */
export const REVISION_DAYS = 2;

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface PlanEntry {
  key: string; // "t:<noteId>:<itemId>" or "d:<todoId>"
  text: string;
  done: boolean;
  weak?: boolean;
  noteId?: string;
  noteTitle?: string;
}

/** Every checklist item for this exam, weak ones first, in note order. */
export function examEntries(exam: Exam, notes: { id: string; title: string }[], topics: Record<string, StudyItem[]>): PlanEntry[] {
  const out: PlanEntry[] = [];
  for (const id of exam.noteIds) {
    const n = notes.find((x) => x.id === id);
    if (!n) continue;
    for (const it of topics[id] ?? []) out.push({ key: `t:${id}:${it.id}`, text: it.text, done: it.done, weak: it.weak, noteId: id, noteTitle: n.title });
  }
  for (const t of exam.todos ?? []) out.push({ key: `d:${t.id}`, text: t.text, done: t.done });
  return out;
}

export type PlanPhase = "nodate" | "study" | "revision" | "examday" | "over";

export function planPhase(exam: Exam): { phase: PlanPhase; left: number | null; studyDaysLeft: number } {
  const left = daysLeft(exam.date);
  if (left === null) return { phase: "nodate", left, studyDaysLeft: 7 };
  if (left < 0) return { phase: "over", left, studyDaysLeft: 0 };
  if (left === 0) return { phase: "examday", left, studyDaysLeft: 0 };
  if (left <= REVISION_DAYS) return { phase: "revision", left, studyDaysLeft: 0 };
  return { phase: "study", left, studyDaysLeft: left - REVISION_DAYS };
}

/** Pick today's items: weak spots first, then the next ones in order, sized so you finish before revision days. */
export function buildToday(exam: Exam, entries: PlanEntry[]): string[] {
  const { phase, studyDaysLeft } = planPhase(exam);
  const open = entries.filter((e) => !e.done);
  const ordered = [...open.filter((e) => e.weak), ...open.filter((e) => !e.weak)];
  if (phase === "over") return [];
  if (phase === "examday") return ordered.filter((e) => e.weak).slice(0, 10).map((e) => e.key);
  if (phase === "revision") return ordered.slice(0, 12).map((e) => e.key);
  const perDay = Math.max(1, Math.ceil(open.length / studyDaysLeft));
  return ordered.slice(0, perDay).map((e) => e.key);
}
