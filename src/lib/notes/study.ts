"use client";

import * as React from "react";
import { CLOUD_SYNC_EVENT } from "@/lib/cloud-sync/synced-storage";
import { newId } from "@/lib/notes/vault-types";

export interface StudyItem {
  id: string;
  text: string;
  done: boolean;
  weak?: boolean; // added from an AI practice miss
}
export interface SubjectStudy {
  items: StudyItem[];
}
export interface Exam {
  id: string;
  subjectId: string;
  name: string;
  date: string; // yyyy-mm-dd
  noteIds: string[];
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

function readKey<T>(key: string, fallback: T): T {
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

function writeKey(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
  listeners.forEach((l) => l());
}

function useStored<T>(key: string, fallback: T): T {
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

function mergeItems(existing: StudyItem[], texts: string[], weak: boolean): StudyItem[] {
  const have = new Set(existing.map((i) => i.text.toLowerCase()));
  const fresh = texts
    .map((t) => t.trim())
    .filter((t) => t && !have.has(t.toLowerCase()))
    .map((text) => ({ id: newId("chk"), text, done: false, weak }));
  return [...existing, ...fresh];
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
    addItems: (texts: string[], weak = false) => update((s) => ({ ...s, items: mergeItems(s.items, texts, weak) })),
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
    add: (noteId: string, texts: string[], weak = false) => update(noteId, (l) => mergeItems(l, texts, weak)),
    toggle: (noteId: string, id: string) => update(noteId, (l) => l.map((i) => (i.id === id ? { ...i, done: !i.done } : i))),
    remove: (noteId: string, id: string) => update(noteId, (l) => l.filter((i) => i.id !== id)),
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
    },
    remove: (id: string) => writeKey(EXAMS_KEY, readKey(EXAMS_KEY, EMPTY_EXAMS).filter((e) => e.id !== id)),
  };
}

export function examProgress(exam: Exam, topics: Record<string, StudyItem[]>): Progress {
  return sumProgress(exam.noteIds.map((id) => progressOf(topics[id])));
}
