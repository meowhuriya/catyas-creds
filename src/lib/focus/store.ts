"use client";

import { readKey, todayKey, useStored, writeKey } from "@/lib/notes/study";
import { newId } from "@/lib/notes/vault-types";
import { QRef } from "@/lib/notes/questions";

export interface FocusTask {
  id: string;
  title: string;
  kind: "custom" | "questions";
  subjectId?: string;
  chapter?: string;
  refs?: QRef[];
  done: boolean;
  minutes: number; // focused minutes spent on it
  pomos: number;
  auto?: boolean; // created by the planner
  why?: string; // planner's reason
  /** Optional time slot, "HH:MM" 24-hour (e.g. "09:00" to "10:00"). */
  start?: string;
  end?: string;
  createdAt: string;
}

export interface FocusDay {
  tasks: FocusTask[];
  minutes: number;
  pomos: number;
  bySubject?: Record<string, number>;
}

export interface FocusSettings {
  focusMin: number;
  shortMin: number;
  longMin: number;
  longEvery: number;
  goalMin: number; // daily study goal
  autoBreak: boolean;
}

export const DEFAULT_SETTINGS: FocusSettings = { focusMin: 25, shortMin: 5, longMin: 15, longEvery: 4, goalMin: 180, autoBreak: true };

const DAYS_KEY = "vc_focus_days_v1";
const SETTINGS_KEY = "vc_focus_settings_v1";
const EMPTY_DAYS: Record<string, FocusDay> = {};
const EMPTY_DAY: FocusDay = { tasks: [], minutes: 0, pomos: 0 };

function prune(days: Record<string, FocusDay>): Record<string, FocusDay> {
  const keys = Object.keys(days).sort();
  if (keys.length <= 500) return days;
  const out: Record<string, FocusDay> = {};
  for (const k of keys.slice(-500)) out[k] = days[k];
  return out;
}

function updateDay(date: string, fn: (d: FocusDay) => FocusDay) {
  const all = readKey(DAYS_KEY, EMPTY_DAYS);
  writeKey(DAYS_KEY, prune({ ...all, [date]: fn(all[date] ?? EMPTY_DAY) }));
}

export function useFocusDays() {
  return useStored(DAYS_KEY, EMPTY_DAYS);
}

export function useFocusSettings(): [FocusSettings, (patch: Partial<FocusSettings>) => void] {
  const s = useStored(SETTINGS_KEY, DEFAULT_SETTINGS);
  const merged = { ...DEFAULT_SETTINGS, ...s };
  return [merged, (patch) => writeKey(SETTINGS_KEY, { ...merged, ...patch })];
}

export function readSettings(): FocusSettings {
  return { ...DEFAULT_SETTINGS, ...readKey(SETTINGS_KEY, DEFAULT_SETTINGS) };
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useFocusDay(date: string = todayKey()) {
  const days = useFocusDays();
  const day = days[date] ?? EMPTY_DAY;
  return {
    day,
    addTask: (t: Omit<FocusTask, "id" | "done" | "minutes" | "pomos" | "createdAt"> & Partial<FocusTask>) => {
      const task: FocusTask = { done: false, minutes: 0, pomos: 0, createdAt: new Date().toISOString(), ...t, id: t.id ?? newId("task") };
      updateDay(date, (d) => ({ ...d, tasks: [...d.tasks, task] }));
      return task.id;
    },
    updateTask: (id: string, patch: Partial<FocusTask>) =>
      updateDay(date, (d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
    /** Deletes the task for good: also from earlier days' unfinished lists, so it doesn't come back as "unfinished from yesterday". */
    removeTask: (id: string) => {
      const all = readKey(DAYS_KEY, EMPTY_DAYS);
      const title = all[date]?.tasks.find((t) => t.id === id)?.title;
      updateDay(date, (d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) }));
      if (!title) return;
      // only the "unfinished from yesterday" copy, and only when deleting from today's list
      if (date !== todayKey()) return;
      for (const k of Object.keys(all)) {
        if (k >= date || k < addDays(date, -1)) continue;
        if (all[k].tasks.some((t) => !t.done && t.title === title)) updateDay(k, (d) => ({ ...d, tasks: d.tasks.filter((t) => t.done || t.title !== title) }));
      }
    },
    /** Drops yesterday's unfinished tasks without bringing them over. */
    dismissFrom: (day: string) => updateDay(day, (d) => ({ ...d, tasks: d.tasks.filter((t) => t.done) })),
    moveTask: (id: string, dir: -1 | 1) =>
      updateDay(date, (d) => {
        const i = d.tasks.findIndex((t) => t.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= d.tasks.length) return d;
        const tasks = [...d.tasks];
        [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
        return { ...d, tasks };
      }),
    /** Replace planner-made tasks that haven't been started; keeps yours and anything you've worked on. */
    replaceAuto: (fresh: FocusTask[]) =>
      updateDay(date, (d) => ({ ...d, tasks: [...d.tasks.filter((t) => !t.auto || t.done || t.minutes > 0), ...fresh] })),
  };
}

/** Adds focused minutes to a day (and to a task / subject when given). */
export function logFocus(minutes: number, opts: { taskId?: string; subjectId?: string; pomo?: boolean; date?: string } = {}) {
  if (minutes <= 0) return;
  const date = opts.date ?? todayKey();
  updateDay(date, (d) => ({
    ...d,
    minutes: d.minutes + minutes,
    pomos: d.pomos + (opts.pomo ? 1 : 0),
    bySubject: opts.subjectId ? { ...(d.bySubject ?? {}), [opts.subjectId]: (d.bySubject?.[opts.subjectId] ?? 0) + minutes } : d.bySubject,
    tasks: opts.taskId
      ? d.tasks.map((t) => (t.id === opts.taskId ? { ...t, minutes: t.minutes + minutes, pomos: t.pomos + (opts.pomo ? 1 : 0) } : t))
      : d.tasks,
  }));
}

export function findTask(taskId: string | undefined, date: string = todayKey()): FocusTask | undefined {
  if (!taskId) return undefined;
  return readKey(DAYS_KEY, EMPTY_DAYS)[date]?.tasks.find((t) => t.id === taskId);
}

export function makeTask(t: Omit<FocusTask, "id" | "done" | "minutes" | "pomos" | "createdAt"> & Partial<FocusTask>): FocusTask {
  return { done: false, minutes: 0, pomos: 0, createdAt: new Date().toISOString(), ...t, id: t.id ?? newId("task") };
}

/** Consecutive days (ending today or yesterday) with at least one focused minute. */
export function streak(days: Record<string, FocusDay>): number {
  let n = 0;
  const d = new Date();
  if (!(days[dateKey(d)]?.minutes > 0)) d.setDate(d.getDate() - 1);
  while (days[dateKey(d)]?.minutes > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/* ---------------- time slots for to-dos ---------------- */
const two = (n: number) => String(n).padStart(2, "0");

/** "09:00" → "9:00 AM" */
export function fmtTime(t?: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${two(m)} ${h < 12 ? "AM" : "PM"}`;
}
export function fmtRange(start?: string, end?: string): string {
  if (!start) return "";
  return end ? `${fmtTime(start)} – ${fmtTime(end)}` : fmtTime(start);
}

function toHHMM(h: number, m: number, ap?: string, guessFrom?: number): string {
  let hh = h;
  if (ap) {
    const pm = /p/i.test(ap);
    if (hh === 12) hh = pm ? 12 : 0;
    else if (pm) hh += 12;
  } else if (guessFrom !== undefined) {
    // no am/pm on the end time: keep it after the start
    while (hh < guessFrom && hh + 12 < 24) hh += 12;
  } else if (hh >= 1 && hh <= 6) hh += 12; // "3 - 4 revise" means the afternoon
  return `${two(Math.min(23, hh))}:${two(Math.min(59, m))}`;
}

/**
 * Reads a time slot typed in front of a to-do:
 * "9:00 am - 10:00 am Revise unit 2", "9-10 maths", "2:30pm to 4 lab record", "7 pm essay".
 */
export function parseTimedTodo(text: string): { title: string; start?: string; end?: string } {
  const t = text.trim();
  const T = String.raw`(\d{1,2})(?:[:.](\d{2}))?\s*([ap]\.?m\.?)?`;
  const range = new RegExp(`^${T}\\s*(?:-|–|—|to)\\s*${T}\\s*[:,-]?\\s+(.+)$`, "i");
  const single = new RegExp(`^(?:at\\s+)?${T}\\s*[:,-]?\\s+(.+)$`, "i");
  let m = t.match(range);
  if (m) {
    const [, h1, m1, a1, h2, m2, a2, rest] = m;
    const endAp = a2 || undefined;
    const startAp = a1 || (endAp && Number(h1) <= Number(h2) && Number(h2) !== 12 ? endAp : undefined);
    const start = toHHMM(Number(h1), Number(m1 ?? 0), startAp);
    const end = toHHMM(Number(h2), Number(m2 ?? 0), endAp, endAp ? undefined : Number(start.slice(0, 2)));
    if (Number(h1) <= 24 && Number(h2) <= 24) return { title: rest.trim(), start, end };
  }
  m = t.match(single);
  if (m && (m[3] || m[2])) {
    const [, h1, m1, a1, rest] = m;
    return { title: rest.trim(), start: toHHMM(Number(h1), Number(m1 ?? 0), a1) };
  }
  return { title: t };
}

/** Timed to-dos first, in time order; the rest keep the order you gave them. */
export function byTime(tasks: FocusTask[]): FocusTask[] {
  const timed = tasks.filter((x) => x.start).sort((a, b) => a.start!.localeCompare(b.start!));
  return [...timed, ...tasks.filter((x) => !x.start)];
}

/* ---------------- planning across days ---------------- */

/** "2026-11-28" plus n days. */
export function addDays(key: string, n: number): string {
  const d = new Date(key + "T00:00:00");
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

/** Moves (or copies) a to-do to another day. */
export function moveTaskToDay(id: string, from: string, to: string, copy = false) {
  if (from === to) return;
  const all = readKey(DAYS_KEY, EMPTY_DAYS);
  const t = all[from]?.tasks.find((x) => x.id === id);
  if (!t) return;
  const moved: FocusTask = copy ? { ...t, id: newId("task"), done: false, minutes: 0, pomos: 0 } : t;
  if (!copy) updateDay(from, (d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== id) }));
  updateDay(to, (d) => ({ ...d, tasks: [...d.tasks, { ...moved, auto: false }] }));
}

/** Minutes a to-do was planned for (its time slot), 0 if it has none. */
export function slotMinutes(t: FocusTask): number {
  if (!t.start || !t.end) return 0;
  const m = (x: string) => Number(x.slice(0, 2)) * 60 + Number(x.slice(3, 5));
  const d = m(t.end) - m(t.start);
  return d > 0 ? d : 0;
}

export interface DayStats {
  planned: number;
  done: number;
  plannedMin: number;
  focusedMin: number;
  /** share of planned to-dos finished, 0-100 (null when nothing was planned) */
  followed: number | null;
}
export function dayStats(day: FocusDay | undefined): DayStats {
  const tasks = day?.tasks ?? [];
  const done = tasks.filter((t) => t.done).length;
  return {
    planned: tasks.length,
    done,
    plannedMin: tasks.reduce((a, t) => a + slotMinutes(t), 0),
    focusedMin: day?.minutes ?? 0,
    followed: tasks.length ? Math.round((done / tasks.length) * 100) : null,
  };
}

/** Adds a to-do to any day (used by the planner and exam coverage). */
export function addTaskToDay(date: string, t: Omit<FocusTask, "id" | "done" | "minutes" | "pomos" | "createdAt"> & Partial<FocusTask>): string {
  const task = makeTask(t);
  updateDay(date, (d) => ({ ...d, tasks: [...d.tasks, task] }));
  return task.id;
}
