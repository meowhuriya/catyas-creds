"use client";

import { StudyItem, daysLeft, readKey, useStored, writeKey } from "@/lib/notes/study";
import { newId } from "@/lib/notes/vault-types";

export type AssignmentKind = "slides" | "written" | "lab" | "other";
export type AssignmentStatus = "todo" | "doing" | "ready" | "submitted";

export const KIND_LABEL: Record<AssignmentKind, string> = { slides: "PPT / slides", written: "Written work", lab: "Lab record", other: "Other" };
export const STATUS_LABEL: Record<AssignmentStatus, string> = { todo: "Not started", doing: "In progress", ready: "Ready, not submitted", submitted: "Submitted" };

export interface AssignmentLink {
  id: string;
  url: string;
  label: string;
}

export interface Assignment {
  id: string;
  subjectId: string;
  title: string;
  kind: AssignmentKind;
  due: string; // yyyy-mm-dd or ""
  status: AssignmentStatus;
  /** What to do: the questions to write, or the slides to make. */
  parts: StudyItem[];
  links: AssignmentLink[];
  /** Vault note holding the teacher's brief (files, photos), and one holding your own work. */
  briefNoteId?: string;
  workNoteId?: string;
  how?: string; // how / where to hand it in
  notes?: string;
  createdAt: string;
  submittedAt?: string;
  /** Set by hand on the cat (0-100); otherwise worked out from status and parts. */
  progress?: number;
}

const KEY = "vc_assignments_v1";
const EMPTY: Assignment[] = [];

export const makeParts = (lines: string[]): StudyItem[] =>
  lines
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)]|Q\d+[.):]?)\s*/i, "").trim())
    .filter(Boolean)
    .map((text) => ({ id: newId("ap"), text, done: false }));

function update(id: string, fn: (a: Assignment) => Assignment) {
  writeKey(KEY, readKey(KEY, EMPTY).map((a) => (a.id === id ? fn(a) : a)));
}

export function useAssignments() {
  const assignments = useStored<Assignment[]>(KEY, EMPTY);
  return {
    assignments,
    save: (a: Omit<Assignment, "id" | "createdAt" | "status" | "parts" | "links"> & Partial<Assignment>) => {
      const cur = readKey(KEY, EMPTY);
      const full: Assignment = {
        status: "todo",
        parts: [],
        links: [],
        ...a,
        id: a.id ?? newId("asg"),
        createdAt: a.createdAt ?? new Date().toISOString(),
      };
      writeKey(KEY, cur.some((x) => x.id === full.id) ? cur.map((x) => (x.id === full.id ? full : x)) : [...cur, full]);
      return full.id;
    },
    remove: (id: string) => writeKey(KEY, readKey(KEY, EMPTY).filter((a) => a.id !== id)),
    patch: (id: string, p: Partial<Assignment>) => update(id, (a) => ({ ...a, ...p })),
    setStatus: (id: string, status: AssignmentStatus) =>
      update(id, (a) => ({ ...a, status, submittedAt: status === "submitted" ? new Date().toISOString() : undefined })),
    addParts: (id: string, lines: string[]) => update(id, (a) => ({ ...a, parts: [...a.parts, ...makeParts(lines)], status: a.status === "submitted" ? "doing" : a.status })),
    togglePart: (id: string, partId: string) =>
      update(id, (a) => {
        const parts = a.parts.map((p) => (p.id === partId ? { ...p, done: !p.done } : p));
        return { ...a, parts, status: a.status === "todo" && parts.some((p) => p.done) ? "doing" : a.status };
      }),
    removePart: (id: string, partId: string) => update(id, (a) => ({ ...a, parts: a.parts.filter((p) => p.id !== partId) })),
    addLink: (id: string, url: string, label: string) =>
      update(id, (a) => ({ ...a, links: [...a.links, { id: newId("al"), url, label: label || url }] })),
    removeLink: (id: string, linkId: string) => update(id, (a) => ({ ...a, links: a.links.filter((l) => l.id !== linkId) })),
  };
}

export type Bucket = "ready" | "overdue" | "week" | "later" | "nodate" | "done";

export function bucketOf(a: Assignment): Bucket {
  if (a.status === "submitted") return "done";
  if (a.status === "ready") return "ready";
  const d = daysLeft(a.due);
  if (d === null) return "nodate";
  if (d < 0) return "overdue";
  if (d <= 7) return "week";
  return "later";
}

export function partsProgress(a: Assignment) {
  const total = a.parts.length;
  const done = a.parts.filter((p) => p.done).length;
  return { total, done, pct: total ? Math.round((done / total) * 100) : a.status === "submitted" ? 100 : 0 };
}

/** How full the cat is: your own setting if you set one, otherwise status + ticked parts. */
export function catLevel(a: Assignment): number {
  if (typeof a.progress === "number") return a.progress;
  if (a.status === "submitted") return 100;
  if (a.status === "ready") return 90;
  const p = partsProgress(a);
  const base = a.status === "doing" ? 15 : 0;
  return p.total ? Math.max(base, Math.round(p.pct * 0.85)) : base;
}
