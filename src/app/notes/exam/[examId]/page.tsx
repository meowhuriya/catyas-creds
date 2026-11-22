"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, ChevronDown, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bar, ExamForm } from "@/components/notes/exam-panel";
import { NoteReader } from "@/components/notes/note-reader";
import { NoteEditorDialog } from "@/components/notes/note-editor-dialog";
import { PracticeDialog } from "@/components/notes/practice-dialog";
import { TopicChecklist } from "@/components/notes/topic-checklist";
import { getSubject } from "@/lib/notes/curriculum";
import { REVISION_DAYS, progressOf, useExams, useNoteTopics, useStudy } from "@/lib/notes/study";
import { useExamPlan } from "@/lib/notes/use-exam-plan";
import { useVault } from "@/lib/notes/use-vault";
import { VaultNote } from "@/lib/notes/vault-types";
import { cn } from "@/lib/utils";

export default function ExamPlanPage() {
  const params = useParams<{ examId: string }>();
  const examId = decodeURIComponent(params?.examId ?? "");
  const router = useRouter();
  const vault = useVault();
  const exams = useExams();
  const exam = exams.exams.find((e) => e.id === examId);
  const subjectNotes = vault.notes.filter((n) => n.courseId === exam?.subjectId);
  const plan = useExamPlan(exam, vault.notes);
  const noteTopics = useNoteTopics();
  const study = useStudy(exam?.subjectId ?? "");
  const subject = exam ? getSubject(exam.subjectId) : undefined;

  const [open, setOpen] = React.useState<string | null>(null);
  const [reading, setReading] = React.useState<string | null>(null);
  const [editingNote, setEditingNote] = React.useState<VaultNote | null>(null);
  const [practice, setPractice] = React.useState<{ noteId?: string } | null>(null);
  const [editExam, setEditExam] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [todo, setTodo] = React.useState("");

  if (!exam) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="font-display text-2xl text-app-ink">{vault.ready ? "Exam not found" : "Loading…"}</p>
        <Link href="/notes" className="text-sm font-semibold text-app-accent hover:underline">Back to the Notes Vault</Link>
      </div>
    );
  }

  const dateLabel = exam.date ? new Date(exam.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : "No date set";
  const countdown =
    plan.phase === "nodate" ? "Set a date" : plan.phase === "over" ? "Done" : plan.phase === "examday" ? "Today" : `${plan.left}`;
  const todayTitle =
    plan.phase === "revision" ? "Revision day" : plan.phase === "examday" ? "Exam day: quick look at weak spots" : plan.phase === "over" ? "This exam is over" : "Today's plan";
  const todayHint =
    plan.phase === "study"
      ? `${plan.remaining} item${plan.remaining === 1 ? "" : "s"} left over ${plan.studyDaysLeft} study day${plan.studyDaysLeft === 1 ? "" : "s"}, then ${REVISION_DAYS} revision days before the exam.`
      : plan.phase === "revision"
        ? "No new topics now. Finish what's left, go over weak spots and practise."
        : plan.phase === "nodate"
          ? "Add the exam date so the plan can spread topics across the days."
          : "";
  const reader = reading ? vault.notes.find((n) => n.id === reading) : undefined;
  const firstTime = plan.entries.length === 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href={`/notes/${encodeURIComponent(exam.subjectId)}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-app-ink-muted hover:text-app-ink">
        <ArrowLeft className="h-4 w-4" /> {subject?.title ?? "Subject"}
      </Link>

      {/* Header */}
      <header className="vc-tile flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--color-accent)]">
          <span className="font-display text-3xl leading-none">{countdown}</span>
          {plan.phase === "study" || plan.phase === "revision" ? <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">days left</span> : null}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-medium text-app-ink-muted">{subject?.code} · {subject?.title}</p>
          <h1 className="font-display text-3xl leading-tight text-app-ink">{exam.name}</h1>
          <p className="flex items-center gap-1.5 text-xs text-app-ink-muted"><CalendarDays className="h-3.5 w-3.5" /> {dateLabel}</p>
          <div className="pt-1">
            <div className="mb-1 flex justify-between text-xs text-app-ink-muted">
              <span>Ready · {plan.overall.done} of {plan.overall.total} done</span>
              <span className="font-semibold text-app-ink">{plan.overall.pct}%</span>
            </div>
            <Bar pct={plan.overall.pct} className="h-2" />
          </div>
        </div>
        <div className="flex shrink-0 gap-2 sm:flex-col">
          <Button onClick={() => setPractice({})} disabled={plan.notes.length === 0}><Sparkles className="h-4 w-4" /> Practise</Button>
          <Button variant="ghost" onClick={() => setEditExam(true)}><Pencil className="h-4 w-4" /> Edit</Button>
        </div>
      </header>

      {firstTime && plan.notes.length > 0 && (
        <div className="rounded-2xl border border-dashed border-app-border p-5 text-sm text-app-ink">
          <p className="font-semibold">Set up in 2 steps</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-app-ink-muted">
            <li>Open each note below and press <b>Pull topics with AI</b>, or <b>It&apos;s a Q-bank</b> to list every question. You can also type or paste your own.</li>
            <li>Come back here each day and tick off <b>Today&apos;s plan</b>. It spreads everything across the days before your exam and keeps the last {REVISION_DAYS} days for revision.</li>
          </ol>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        {/* Left: today + to-do */}
        <div className="space-y-6">
          <section className="vc-tile space-y-3 p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-app-ink">{todayTitle}</h2>
              {plan.todayEntries.length > 0 && <span className="text-xs text-app-ink-muted">{plan.todayDone}/{plan.todayEntries.length}</span>}
            </div>
            {todayHint && <p className="text-xs text-app-ink-muted">{todayHint}</p>}
            {plan.todayEntries.length === 0 ? (
              <p className="text-sm text-app-ink-muted">{firstTime ? "Your plan appears here once your notes have topics." : plan.remaining === 0 ? "Everything is ticked off. Use Practise to test yourself." : "Nothing planned for today."}</p>
            ) : (
              <ul className="space-y-1">
                {plan.todayEntries.map((e) => (
                  <li key={e.key}>
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-control px-1.5 py-1.5 hover:bg-app-surface-muted">
                      <input type="checkbox" checked={e.done} onChange={() => plan.toggle(e.key)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm leading-snug", e.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{e.text}</span>
                        <span className="block text-[11px] text-app-ink-muted">{e.noteTitle ?? "To-do"}{e.weak ? " · weak spot" : ""}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {plan.todayEntries.length > 0 && plan.todayDone === plan.todayEntries.length && plan.remaining > 0 && (
              <div className="flex items-center justify-between rounded-control bg-[var(--accent-soft)] px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 text-app-ink"><CheckCircle2 className="h-4 w-4 text-app-success" /> Today done.</span>
                <button onClick={plan.planMore} className="text-xs font-semibold text-[var(--color-accent)]">Get ahead: add more</button>
              </div>
            )}
          </section>

          <section className="vc-tile space-y-3 p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-app-ink">To-do</h2>
              <span className="text-xs text-app-ink-muted">{plan.todoProg.done}/{plan.todoProg.total}</span>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (todo.trim()) exams.addTodo(exam.id, todo); setTodo(""); }} className="flex gap-1.5">
              <input value={todo} onChange={(e) => setTodo(e.target.value)} placeholder="e.g. Solve last year's paper, get lab record signed"
                className="min-w-0 flex-1 rounded-control border border-app-border bg-app-surface px-2.5 py-1.5 text-sm outline-none focus:border-app-accent" />
              <button type="submit" disabled={!todo.trim()} aria-label="Add to-do" className="rounded-control bg-app-accent px-2 text-white disabled:opacity-40"><Plus className="h-4 w-4" /></button>
            </form>
            <ul className="space-y-0.5">
              {(exam.todos ?? []).map((t) => (
                <li key={t.id} className="group/row flex items-center gap-2 rounded px-1 py-1 hover:bg-app-surface-muted">
                  <input type="checkbox" checked={t.done} onChange={() => exams.toggleTodo(exam.id, t.id)} className="h-4 w-4 accent-[var(--accent)]" />
                  <span className={cn("flex-1 text-sm", t.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{t.text}</span>
                  <button onClick={() => exams.removeTodo(exam.id, t.id)} aria-label="Remove to-do" className="opacity-0 group-hover/row:opacity-100 focus:opacity-100"><Trash2 className="h-3.5 w-3.5 text-app-ink-muted" /></button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right: notes to master */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-app-ink">Notes to master</h2>
            <span className="text-xs text-app-ink-muted">{plan.topicProg.done}/{plan.topicProg.total} topics</span>
          </div>
          {plan.notes.length === 0 && (
            <div className="vc-tile p-5 text-sm text-app-ink-muted">
              No notes tagged yet. <button onClick={() => setEditExam(true)} className="font-semibold text-[var(--color-accent)]">Tag notes</button>
            </div>
          )}
          {plan.notes.map((n) => {
            const p = progressOf(plan.topics[n.id]);
            const isOpen = open === n.id;
            return (
              <article key={n.id} className="vc-tile overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : n.id)} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={isOpen}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-app-ink">{n.title}</span>
                      <span className="shrink-0 text-xs text-app-ink-muted">{p.total ? `${p.done}/${p.total}` : "no topics yet"}</span>
                    </div>
                    <Bar pct={p.pct} className="mt-1.5 h-1" />
                  </div>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-app-ink-muted transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t border-app-border p-4">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setReading(n.id)}><BookOpen className="h-4 w-4" /> Open note</Button>
                      <Button size="sm" variant="ghost" onClick={() => setPractice({ noteId: n.id })}><Sparkles className="h-4 w-4" /> Practise this note</Button>
                    </div>
                    <TopicChecklist note={n} subjectTitle={subject?.title} showHeader={false} />
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>

      <div className="flex justify-end">
        {confirmDelete ? (
          <span className="flex items-center gap-2 text-sm text-app-ink-muted">
            Delete this exam? Your notes and topics stay.
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { exams.remove(exam.id); router.push("/notes"); }}>Delete</Button>
          </span>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1 text-xs text-app-ink-muted hover:text-app-ink"><Trash2 className="h-3.5 w-3.5" /> Delete exam</button>
        )}
      </div>

      {reader && (
        <NoteReader
          note={reader}
          onClose={() => setReading(null)}
          onEdit={() => { setEditingNote(reader); setReading(null); }}
          onPractice={() => { setPractice({ noteId: reader.id }); setReading(null); }}
        />
      )}
      {practice && (
        <PracticeDialog
          subjectTitle={subject?.title ?? exam.name}
          notes={plan.notes}
          startNoteId={practice.noteId}
          onClose={() => setPractice(null)}
          onAddWeak={(items) =>
            items.forEach(({ topic, noteId }) =>
              noteId ? noteTopics.add(noteId, [`Revise: ${topic}`], true) : study.addItems([`Revise: ${topic}`], true)
            )
          }
        />
      )}
      {editExam && <ExamForm subjectId={exam.subjectId} notes={subjectNotes} exam={exam} onClose={() => setEditExam(false)} />}
      <NoteEditorDialog
        open={!!editingNote}
        onOpenChange={(o) => !o && setEditingNote(null)}
        courseId={exam.subjectId}
        defaultSection={editingNote?.section ?? "exam"}
        note={editingNote}
        onSave={vault.saveNote}
        onDelete={vault.removeNote}
        onAddImage={vault.addImage}
        onAddFile={vault.addFile}
      />
    </div>
  );
}
