"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScorePill } from "@/components/notes/topic-checklist";
import { getSubject } from "@/lib/notes/curriculum";
import { QEntry, groupByChapter, qStats, smartOpen } from "@/lib/notes/questions";
import { cn } from "@/lib/utils";

export interface PickResult {
  subjectId: string;
  chapter: string;
  entries: QEntry[];
}

/** Subject -> chapter -> questions. Used by Focus to decide what a session is about. */
export function QuestionPicker({
  entries,
  initialSubject,
  onClose,
  onPick,
}: {
  entries: QEntry[];
  initialSubject?: string;
  onClose: () => void;
  onPick: (r: PickResult, focusNow: boolean) => void;
}) {
  const subjects = Array.from(new Set(entries.map((e) => e.subjectId)));
  const [subjectId, setSubjectId] = React.useState(initialSubject && subjects.includes(initialSubject) ? initialSubject : subjects[0] ?? "");
  const inSubject = entries.filter((e) => e.subjectId === subjectId);
  const chapters = groupByChapter(inSubject);
  const [chapter, setChapter] = React.useState<string | null>(null);
  const current = chapter === null ? null : chapters.find((c) => c.chapter === chapter);
  const [picked, setPicked] = React.useState<Set<string>>(new Set());
  const [onlyOpen, setOnlyOpen] = React.useState(true);

  React.useEffect(() => {
    setChapter(chapters[0]?.chapter ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const list = current ? current.entries.filter((e) => !onlyOpen || !e.item.done) : [];
  // Picks are kept while you move between chapters and subjects; each chapter becomes one item on today's list.
  const chosen = entries.filter((e) => picked.has(e.key));
  const togglePick = (keys: string[], on: boolean) =>
    setPicked((p) => {
      const n = new Set(p);
      keys.forEach((k) => (on ? n.add(k) : n.delete(k)));
      return n;
    });
  const done = (focusNow: boolean) => {
    if (!chosen.length) return;
    const groups = new Map<string, QEntry[]>();
    for (const e of chosen) {
      const k = `${e.subjectId}|${e.chapter}`;
      groups.set(k, [...(groups.get(k) ?? []), e]);
    }
    let first = true;
    groups.forEach((es, k) => {
      const [sid, ch] = [k.slice(0, k.indexOf("|")), k.slice(k.indexOf("|") + 1)];
      onPick({ subjectId: sid, chapter: ch, entries: es }, focusNow && first);
      first = false;
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-app-border bg-app-surface shadow-2xl sm:rounded-2xl">
        <div className="flex items-center gap-2 border-b border-app-border px-5 py-3">
          <h2 className="flex-1 text-sm font-semibold text-app-ink">What do you want to focus on?</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-control p-1.5 text-app-ink-muted hover:bg-app-surface-muted"><X className="h-4 w-4" /></button>
        </div>

        {subjects.length === 0 ? (
          <p className="p-6 text-sm text-app-ink-muted">No questions yet. Open a course, add a Q-bank and import its questions.</p>
        ) : (
          <div className="grid min-h-0 flex-1 overflow-hidden sm:grid-cols-[220px_1fr]">
            {/* Subjects + chapters */}
            <div className="space-y-3 overflow-y-auto border-b border-app-border p-4 sm:border-b-0 sm:border-r">
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm">
                {subjects.map((id) => (<option key={id} value={id}>{getSubject(id)?.title ?? id}</option>))}
              </select>
              <div className="flex gap-1 overflow-x-auto sm:flex-col">
                {chapters.map((c) => {
                  const s = qStats(c.entries);
                  return (
                    <button key={c.chapter || "_"} onClick={() => setChapter(c.chapter)}
                      className={cn("shrink-0 rounded-control px-3 py-2 text-left text-xs transition-colors", chapter === c.chapter ? "bg-[var(--accent-soft)] text-app-ink" : "text-app-ink-muted hover:bg-app-surface-muted")}>
                      <span className="block truncate font-medium">{c.chapter || "Other"}</span>
                      <span className="block opacity-70">{s.total - s.mastered} left · {s.weak} weak</span>
                      {c.entries.some((e) => picked.has(e.key)) && <span className="mt-1 inline-block rounded-full bg-app-accent px-1.5 text-[10px] font-semibold text-white">{c.entries.filter((e) => picked.has(e.key)).length} picked</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Questions */}
            <div className="flex min-h-0 flex-col">
              <div className="flex items-center gap-3 px-4 pt-3 text-xs text-app-ink-muted">
                <span className="flex-1">{chosen.length} picked{chosen.length && current && chosen.length !== current.entries.filter((e) => picked.has(e.key)).length ? " (across chapters)" : ""}</span>
                <button onClick={() => togglePick(list.map((e) => e.key), true)} className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 font-semibold text-[var(--color-accent)]">Whole chapter</button>
                <button onClick={() => togglePick(smartOpen(current?.entries ?? []).slice(0, 5).map((e) => e.key), true)} className="hover:text-app-ink">5 suggested</button>
                <button onClick={() => togglePick(list.map((e) => e.key), false)} className="hover:text-app-ink">Clear</button>
                <label className="flex items-center gap-1"><input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} className="accent-[var(--accent)]" /> Hide mastered</label>
              </div>
              <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-3">
                {list.map((e) => (
                  <li key={e.key}>
                    <label className="flex cursor-pointer items-start gap-2 rounded px-1.5 py-1.5 hover:bg-app-surface-muted">
                      <input type="checkbox" checked={picked.has(e.key)} onChange={() => togglePick([e.key], !picked.has(e.key))} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
                      <span className={cn("flex-1 text-sm leading-snug", e.item.done ? "text-app-ink-muted" : "text-app-ink")}>{e.item.text}</span>
                      {!!e.item.marks && <span className="shrink-0 rounded-full border border-app-border px-1.5 text-[10px] text-app-ink-muted">{e.item.marks}M</span>}
                      <ScorePill item={e.item} />
                    </label>
                  </li>
                ))}
                {list.length === 0 && <li className="p-3 text-sm text-app-ink-muted">Everything here is mastered.</li>}
              </ul>
              <div className="flex gap-2 border-t border-app-border p-3">
                <Button variant="ghost" className="flex-1" disabled={!chosen.length} onClick={() => done(false)}>Add {chosen.length || ""} to today</Button>
                <Button className="flex-1" disabled={!chosen.length} onClick={() => done(true)}>Add &amp; focus now</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
