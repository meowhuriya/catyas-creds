"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Exam, daysLeft, examSubjects, useExams, useNoteTopics } from "@/lib/notes/study";
import { CatJar } from "@/components/rewards/cat-jar";
import { useExamPlan } from "@/lib/notes/use-exam-plan";
import { VaultNote } from "@/lib/notes/vault-types";
import { getSubject } from "@/lib/notes/curriculum";

export function Bar({ pct, className = "" }: { pct: number; className?: string }) {
  return (
    <div className={"h-1.5 overflow-hidden rounded-full bg-app-surface-muted " + className}>
      <div className="h-full rounded-full bg-app-accent transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ExamForm({ subjectId, notes, exam, onClose }: { subjectId?: string; notes: VaultNote[]; exam?: Exam; onClose: () => void }) {
  const router = useRouter();
  const { save } = useExams();
  const { topics } = useNoteTopics();
  const [courses, setCourses] = React.useState<string[]>(exam ? examSubjects(exam) : subjectId ? [subjectId] : []);
  const [name, setName] = React.useState(exam?.name ?? "");
  const [date, setDate] = React.useState(exam?.date ?? "");
  const [picked, setPicked] = React.useState<string[]>(exam?.noteIds ?? []);
  const [scope, setScope] = React.useState<Record<string, string[]>>(exam?.scope ?? {});
  const courseChoices = Array.from(new Set([...notes.map((n) => n.courseId), ...courses]));
  const shown = notes.filter((n) => courses.includes(n.courseId));

  const toggleCourse = (id: string) => {
    if (courses.includes(id)) {
      setCourses((c) => c.filter((x) => x !== id));
      setPicked((p) => p.filter((nid) => notes.find((n) => n.id === nid)?.courseId !== id));
    } else setCourses((c) => [...c, id]);
  };
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  /** Chapters / experiments found in a note's question list, in order. */
  const chaptersOf = (noteId: string) => {
    const seen: string[] = [];
    for (const it of topics[noteId] ?? []) if (!seen.includes(it.chapter || "")) seen.push(it.chapter || "");
    return seen;
  };
  const toggleChapter = (noteId: string, ch: string, all: string[]) => {
    setScope((sc) => {
      const cur = sc[noteId] ?? all;
      const next = cur.includes(ch) ? cur.filter((x) => x !== ch) : [...cur, ch];
      if (next.length === 0) return sc; // keep at least one
      const copy = { ...sc };
      if (next.length === all.length) delete copy[noteId];
      else copy[noteId] = all.filter((x) => next.includes(x));
      return copy;
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !courses.length) return;
          const keep: Record<string, string[]> = {};
          for (const id of picked) if (scope[id]?.length) keep[id] = scope[id];
          const id = save({
            id: exam?.id,
            subjectId: courses[0],
            subjectIds: courses,
            name: name.trim(),
            date,
            noteIds: picked,
            scope: Object.keys(keep).length ? keep : undefined,
            todos: exam?.todos,
            today: undefined,
          });
          onClose();
          if (!exam) router.push(`/prep/${encodeURIComponent(id)}`);
        }}
        className="flex max-h-[90vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl border border-app-border bg-app-surface p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-app-ink">{exam ? "Edit exam" : "New exam"}</h3>
          <button type="button" onClick={onClose} aria-label="Close"><X className="h-4 w-4 text-app-ink-muted" /></button>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mid-1, Internals, Semester exam" autoFocus
          className="w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm outline-none focus:border-app-accent" />
        <label className="flex items-center gap-2 text-xs text-app-ink-muted">
          <CalendarDays className="h-3.5 w-3.5" /> Exam date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-control border border-app-border bg-app-surface px-2 py-1 text-xs text-app-ink" />
        </label>

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-app-ink">Courses in this exam ({courses.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {courseChoices.map((id) => (
              <button key={id} type="button" onClick={() => toggleCourse(id)}
                className={"rounded-full border px-2.5 py-1 text-xs " + (courses.includes(id) ? "border-app-accent bg-app-accent text-white" : "border-app-border text-app-ink-muted hover:text-app-ink")}>
                {getSubject(id)?.title ?? id}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-app-ink">Q-banks and notes ({picked.length})</p>
            {shown.length > 0 && (
              <button type="button" onClick={() => setPicked(picked.length === shown.length ? [] : shown.map((n) => n.id))} className="text-[11px] font-medium text-[var(--color-accent)]">
                {picked.length === shown.length ? "Clear" : "Select all"}
              </button>
            )}
          </div>
          <div className="space-y-1 rounded-control border border-app-border p-2">
            {shown.length === 0 && <p className="text-xs text-app-ink-muted">{courses.length ? "These courses have no notes yet." : "Pick a course above to see its notes."}</p>}
            {courses.map((c) => {
              const list = shown.filter((n) => n.courseId === c);
              if (!list.length) return null;
              return (
                <div key={c} className="space-y-0.5">
                  {courses.length > 1 && <p className="pt-1 text-[10px] font-semibold uppercase tracking-wide text-app-ink-muted">{getSubject(c)?.title ?? c}</p>}
                  {list.map((n) => {
                    const chs = chaptersOf(n.id);
                    const isOn = picked.includes(n.id);
                    const sel = scope[n.id] ?? chs;
                    return (
                      <div key={n.id}>
                        <label className="flex items-center gap-2 rounded px-1 py-1 text-sm text-app-ink hover:bg-app-surface-muted">
                          <input type="checkbox" checked={isOn} onChange={() => toggle(n.id)} className="h-4 w-4 accent-[var(--accent)]" />
                          <span className="truncate">{n.title}</span>
                          {isOn && chs.length > 1 && <span className="ml-auto shrink-0 text-[10px] text-app-ink-muted">{sel.length}/{chs.length} parts</span>}
                        </label>
                        {isOn && chs.length > 1 && (
                          <div className="mb-1 ml-6 flex flex-wrap gap-1">
                            {chs.map((ch) => (
                              <button key={ch || "_"} type="button" onClick={() => toggleChapter(n.id, ch, chs)}
                                className={"max-w-full truncate rounded-full border px-2 py-0.5 text-[11px] " + (sel.includes(ch) ? "border-app-accent bg-[var(--accent-soft)] text-app-ink" : "border-app-border text-app-ink-muted line-through")}>
                                {ch || "Other"}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-app-ink-muted">Tap a unit or experiment to leave it out of this exam. Only the ones left on count towards progress and the daily plan.</p>
        </div>
        <Button type="submit" className="w-full" disabled={!name.trim() || !courses.length}>Save exam</Button>
      </form>
    </div>,
    document.body
  );
}

export function ExamCard({ exam, allNotes, showSubject = false }: { exam: Exam; allNotes: VaultNote[]; showSubject?: boolean }) {
  const plan = useExamPlan(exam, allNotes);
  const { remove, save } = useExams();
  const [confirm, setConfirm] = React.useState(false);
  const label =
    plan.phase === "nodate" ? "No date set" : plan.phase === "over" ? "Finished" : plan.phase === "examday" ? "Exam today" : `${plan.left} day${plan.left === 1 ? "" : "s"} left`;
  return (
    <Link href={`/prep/${encodeURIComponent(exam.id)}`} className="vc-tile group block space-y-3 p-4 transition-colors hover:border-app-accent">
      <div className="flex items-start justify-between gap-3">
        <CatJar value={exam.progress ?? plan.overall.pct} auto={plan.overall.pct} label="How ready are you?" onSet={(v) => save({ ...exam, progress: v })} size={52} />
        <div className="min-w-0 flex-1">
          {showSubject && <p className="truncate text-[11px] font-medium text-app-ink-muted">{examSubjects(exam).map((id) => getSubject(id)?.title ?? id).join(" · ")}</p>}
          <h3 className="truncate font-display text-lg text-app-ink">{exam.name}</h3>
          <p className="text-xs text-app-ink-muted">
            {label}
            {exam.date && ` · ${new Date(exam.date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}`}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1">
          <span className="font-display text-2xl text-app-ink">{exam.progress ?? plan.overall.pct}%</span>
          <button
            type="button"
            aria-label={`Delete ${exam.name}`}
            title="Delete exam"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirm(true); }}
            className="rounded-full p-1.5 text-app-ink-muted opacity-60 hover:bg-red-500/10 hover:text-red-600 hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </span>
      </div>
      {confirm && (
        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex flex-wrap items-center gap-2 rounded-control border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-app-ink">
          <span className="flex-1">Delete this exam? Questions and scores stay.</span>
          <button type="button" onClick={() => setConfirm(false)} className="rounded-full px-2 py-1 text-app-ink-muted hover:text-app-ink">Cancel</button>
          <button type="button" onClick={() => remove(exam.id)} className="rounded-full bg-red-600 px-3 py-1 font-semibold text-white">Delete</button>
        </div>
      )}
      <Bar pct={plan.overall.pct} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-app-ink-muted">
        {plan.todayTasks.length > 0 ? (
          <span className="font-semibold text-[var(--color-accent)]">Today in Focus: {plan.todayTasks.filter((t) => t.done).length} of {plan.todayTasks.length} done</span>
        ) : plan.share.length > 0 && plan.phase !== "over" ? (
          <span className="font-semibold text-[var(--color-accent)]">{plan.share.length} for today</span>
        ) : plan.entries.length === 0 ? (
          <span className="font-semibold text-[var(--color-accent)]">Import questions to get a daily plan</span>
        ) : null}
        <span>{plan.notes.length} note{plan.notes.length === 1 ? "" : "s"}</span>
        <span>{plan.topicProg.done}/{plan.topicProg.total} mastered</span>
        <span className="ml-auto inline-flex items-center gap-0.5 font-medium text-app-ink group-hover:text-[var(--color-accent)]">Open plan <ChevronRight className="h-3.5 w-3.5" /></span>
      </div>
    </Link>
  );
}

export function ExamPanel({ subjectId, notes }: { subjectId: string; notes: VaultNote[] }) {
  const { exams } = useExams();
  const [form, setForm] = React.useState(false);
  const mine = exams
    .filter((e) => examSubjects(e).includes(subjectId) && (daysLeft(e.date) ?? 0) >= -3)
    .sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-app-ink">Exams</h2>
        <Button size="sm" variant="ghost" onClick={() => setForm(true)} disabled={notes.length === 0}>
          <Plus className="h-4 w-4" /> Add exam
        </Button>
      </div>
      {mine.length === 0 ? (
        <p className="text-sm text-app-ink-muted">
          {notes.length === 0 ? "Add notes first, then create an exam from them." : "Add an exam, tag the notes it covers, and get a day-by-day plan."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {mine.map((ex) => (
            <ExamCard key={ex.id} exam={ex} allNotes={notes} />
          ))}
        </div>
      )}
      {form && <ExamForm subjectId={subjectId} notes={notes} onClose={() => setForm(false)} />}
    </section>
  );
}
