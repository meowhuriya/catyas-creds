"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Exam, daysLeft, useExams } from "@/lib/notes/study";
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
  const [subj, setSubj] = React.useState(subjectId ?? exam?.subjectId ?? "");
  const subjectChoices = Array.from(new Set(notes.map((n) => n.courseId)));
  const shown = notes.filter((n) => n.courseId === subj);
  const { save } = useExams();
  const [name, setName] = React.useState(exam?.name ?? "");
  const [date, setDate] = React.useState(exam?.date ?? "");
  const [picked, setPicked] = React.useState<string[]>(exam?.noteIds ?? []);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !subj) return;
          const id = save({ id: exam?.id, subjectId: subj, name: name.trim(), date, noteIds: picked, todos: exam?.todos, today: undefined });
          onClose();
          if (!exam) router.push(`/prep/${encodeURIComponent(id)}`);
        }}
        className="w-full max-w-md space-y-4 rounded-2xl border border-app-border bg-app-surface p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-app-ink">{exam ? "Edit exam" : "New exam"}</h3>
          <button type="button" onClick={onClose} aria-label="Close"><X className="h-4 w-4 text-app-ink-muted" /></button>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mid-1, Internals, Semester exam" autoFocus
          className="w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm outline-none focus:border-app-accent" />
        {!subjectId && (
          <select value={subj} onChange={(e) => { setSubj(e.target.value); setPicked([]); }} className="w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm">
            <option value="">Choose subject…</option>
            {subjectChoices.map((id) => (<option key={id} value={id}>{getSubject(id)?.title ?? id}</option>))}
          </select>
        )}
        <label className="flex items-center gap-2 text-xs text-app-ink-muted">
          <CalendarDays className="h-3.5 w-3.5" /> Exam date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-control border border-app-border bg-app-surface px-2 py-1 text-xs text-app-ink" />
        </label>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-app-ink">Notes and Q-banks to study ({picked.length})</p>
            {shown.length > 0 && (
              <button type="button" onClick={() => setPicked(picked.length === shown.length ? [] : shown.map((n) => n.id))} className="text-[11px] font-medium text-[var(--color-accent)]">
                {picked.length === shown.length ? "Clear" : "Select all"}
              </button>
            )}
          </div>
          <div className="max-h-52 space-y-1 overflow-y-auto rounded-control border border-app-border p-2">
            {shown.length === 0 && <p className="text-xs text-app-ink-muted">{subj ? "Add some notes to this subject first." : "Choose a subject to see its notes."}</p>}
            {shown.map((n) => (
              <label key={n.id} className="flex items-center gap-2 rounded px-1 py-1 text-sm text-app-ink hover:bg-app-surface-muted">
                <input type="checkbox" checked={picked.includes(n.id)} onChange={() => toggle(n.id)} className="h-4 w-4 accent-[var(--accent)]" />
                <span className="truncate">{n.title}</span>
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={!name.trim() || !subj}>Save exam</Button>
      </form>
    </div>
  );
}

export function ExamCard({ exam, allNotes, showSubject = false }: { exam: Exam; allNotes: VaultNote[]; showSubject?: boolean }) {
  const plan = useExamPlan(exam, allNotes);
  const label =
    plan.phase === "nodate" ? "No date set" : plan.phase === "over" ? "Finished" : plan.phase === "examday" ? "Exam today" : `${plan.left} day${plan.left === 1 ? "" : "s"} left`;
  return (
    <Link href={`/prep/${encodeURIComponent(exam.id)}`} className="vc-tile group block space-y-3 p-4 transition-colors hover:border-app-accent">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {showSubject && <p className="truncate text-[11px] font-medium text-app-ink-muted">{getSubject(exam.subjectId)?.title}</p>}
          <h3 className="truncate font-display text-lg text-app-ink">{exam.name}</h3>
          <p className="text-xs text-app-ink-muted">
            {label}
            {exam.date && ` · ${new Date(exam.date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}`}
          </p>
        </div>
        <span className="font-display text-2xl text-app-ink">{plan.overall.pct}%</span>
      </div>
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
    .filter((e) => e.subjectId === subjectId && (daysLeft(e.date) ?? 0) >= -3)
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
