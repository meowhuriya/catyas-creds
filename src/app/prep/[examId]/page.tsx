"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, ChevronDown, Pencil, Plus, Target, Timer, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Bar, ExamForm } from "@/components/notes/exam-panel";
import { NoteReader } from "@/components/notes/note-reader";
import { NoteEditorDialog } from "@/components/notes/note-editor-dialog";
import { TopicChecklist, ScorePill } from "@/components/notes/topic-checklist";
import { Drill } from "@/components/prep/drill";
import { getSubject } from "@/lib/notes/curriculum";
import { REVISION_DAYS, progressOf, useExams } from "@/lib/notes/study";
import { useExamPlan } from "@/lib/notes/use-exam-plan";
import { useVault } from "@/lib/notes/use-vault";
import { VaultNote } from "@/lib/notes/vault-types";
import { cn } from "@/lib/utils";

export default function ExamPrepPage() {
  const params = useParams<{ examId: string }>();
  const examId = decodeURIComponent(params?.examId ?? "");
  const router = useRouter();
  const vault = useVault();
  const exams = useExams();
  const exam = exams.exams.find((e) => e.id === examId);
  const subjectNotes = vault.notes.filter((n) => n.courseId === exam?.subjectId);
  const plan = useExamPlan(exam, vault.notes);
  const subject = exam ? getSubject(exam.subjectId) : undefined;
  const toast = useToast();

  const [open, setOpen] = React.useState<string | null>(null);
  const [reading, setReading] = React.useState<string | null>(null);
  const [editingNote, setEditingNote] = React.useState<VaultNote | null>(null);
  const [drill, setDrill] = React.useState<{ notes: VaultNote[]; only?: { noteId: string; itemId: string }[] } | null>(null);
  const [editExam, setEditExam] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [todo, setTodo] = React.useState("");

  if (!exam) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="font-display text-2xl text-app-ink">{vault.ready ? "Exam not found" : "Loading…"}</p>
        <Link href="/prep" className="text-sm font-semibold text-app-accent hover:underline">Back to Exam Prep</Link>
      </div>
    );
  }

  const dateLabel = exam.date ? new Date(exam.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : "No date set";
  const countdown = plan.phase === "nodate" ? "–" : plan.phase === "over" ? "✓" : plan.phase === "examday" ? "0" : `${plan.left}`;
  const todayTitle =
    plan.phase === "revision" ? "Revision day" : plan.phase === "examday" ? "Exam day: last look at weak spots" : plan.phase === "over" ? "This exam is over" : "Today's plan";
  const todayHint =
    plan.phase === "study"
      ? `${plan.remaining} left to master over ${plan.studyDaysLeft} study day${plan.studyDaysLeft === 1 ? "" : "s"}, then ${REVISION_DAYS} revision days.`
      : plan.phase === "revision"
        ? "No new material. Test yourself on what's left and your weak ones."
        : plan.phase === "nodate"
          ? "Add the exam date so the plan can spread questions across the days."
          : "";
  const reader = reading ? vault.notes.find((n) => n.id === reading) : undefined;
  const totalItems = plan.entries.filter((e) => e.key.startsWith("t:")).length;
  const tried = plan.notes.flatMap((n) => plan.topics[n.id] ?? []).filter((i) => i.attempts).length;
  const weakCount = plan.notes.flatMap((n) => plan.topics[n.id] ?? []).filter((i) => i.weak && !i.done).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/prep" className="inline-flex items-center gap-1.5 text-sm font-medium text-app-ink-muted hover:text-app-ink">
        <ArrowLeft className="h-4 w-4" /> Exam Prep
      </Link>

      {/* 1. Where you stand */}
      <header className="vc-tile space-y-5 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--color-accent)]">
            <span className="font-display text-3xl leading-none">{countdown}</span>
            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">{plan.phase === "over" ? "done" : "days left"}</span>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-xs font-medium text-app-ink-muted">{subject?.code} · {subject?.title}</p>
            <h1 className="font-display text-3xl leading-tight text-app-ink">{exam.name}</h1>
            <p className="flex items-center gap-1.5 text-xs text-app-ink-muted"><CalendarDays className="h-3.5 w-3.5" /> {dateLabel}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button size="lg" onClick={() => setDrill({ notes: plan.notes })} disabled={totalItems === 0}><Target className="h-4 w-4" /> Test me</Button>
            <Button variant="ghost" size="lg" onClick={() => setEditExam(true)} aria-label="Edit exam"><Pencil className="h-4 w-4" /></Button>
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-app-ink-muted">
            <span>Exam readiness</span>
            <span className="font-semibold text-app-ink">{plan.overall.pct}%</span>
          </div>
          <Bar pct={plan.overall.pct} className="h-2" />
          <div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <Stat label="Mastered" value={`${plan.topicProg.done}/${plan.topicProg.total}`} />
            <Stat label="Attempted" value={`${tried}`} />
            <Stat label="Weak" value={`${weakCount}`} tone={weakCount ? "warn" : undefined} />
            <Stat label="To-dos done" value={`${plan.todoProg.done}/${plan.todoProg.total}`} />
          </div>
        </div>
      </header>

      {plan.notes.length === 0 ? (
        <div className="vc-tile space-y-2 p-6 text-sm">
          <p className="font-semibold text-app-ink">Tag the Q-banks and notes for this exam</p>
          <p className="text-app-ink-muted">Upload your Q-bank in the Notes Vault (Question Banks section), then add it here.</p>
          <Button size="sm" onClick={() => setEditExam(true)}>Choose notes</Button>
        </div>
      ) : totalItems === 0 ? (
        <div className="rounded-2xl border border-dashed border-app-border p-5 text-sm text-app-ink">
          <p className="font-semibold">One step left: import your questions</p>
          <p className="mt-1 text-app-ink-muted">
            Open a Q-bank below and press <b>Import every question</b>. AI reads the file (PDF, Word, PowerPoint, photos or a Drive link) and lists every question by unit and marks.
            Then you get a daily plan and can start testing yourself.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-6">
          {/* 2. Today (lives in Focus, the one daily plan for every subject) */}
          <section className="vc-tile space-y-3 p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-app-ink">{todayTitle}</h2>
              <Link href="/focus" className="text-xs font-medium text-[var(--color-accent)]">Open Focus →</Link>
            </div>
            {todayHint && <p className="text-xs text-app-ink-muted">{todayHint}</p>}
            {plan.todayTasks.length > 0 && (
              <ul className="space-y-1.5">
                {plan.todayTasks.map((t) => {
                  const items = (t.refs ?? []).map((r) => plan.topics[r.noteId]?.find((x) => x.id === r.itemId)).filter(Boolean);
                  const m = items.filter((x) => x!.done).length;
                  return (
                    <li key={t.id} className="flex items-center gap-2 rounded-control border border-app-border px-3 py-2">
                      <span className={cn("min-w-0 flex-1 truncate text-sm", t.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{t.title}</span>
                      <span className="shrink-0 text-xs text-app-ink-muted">{m}/{items.length}</span>
                      {!t.done && (
                        <button onClick={() => setDrill({ notes: plan.notes, only: (t.refs ?? []).filter((r) => !plan.topics[r.noteId]?.find((x) => x.id === r.itemId)?.done) })} className="shrink-0 rounded-full border border-app-border px-2 py-0.5 text-[11px] text-app-ink-muted hover:border-app-accent hover:text-app-ink">
                          Test
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {plan.share.length > 0 ? (
              <Button className="w-full" variant={plan.todayTasks.length ? "outline" : "primary"} onClick={() => { const n = plan.addShareToFocus(); if (n) toast.success("Added to Focus", `${n} question${n > 1 ? "s" : ""} for today.`); }}>
                <Timer className="h-4 w-4" /> {plan.todayTasks.length ? `Add ${plan.share.length} more to today` : `Add today's ${plan.share.length} to Focus`}
              </Button>
            ) : (
              <p className="text-sm text-app-ink-muted">
                {totalItems === 0 ? "Import your Q-bank questions to get a daily share." : plan.remaining === 0 ? "Everything is mastered. Keep testing yourself to stay sharp." : "Today's share is already in Focus."}
              </p>
            )}
          </section>

          {/* 4. To-do */}
          <section className="vc-tile space-y-3 p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-app-ink">To-do</h2>
              <span className="text-xs text-app-ink-muted">{plan.todoProg.done}/{plan.todoProg.total}</span>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if (todo.trim()) exams.addTodo(exam.id, todo); setTodo(""); }} className="flex gap-1.5">
              <input value={todo} onChange={(e) => setTodo(e.target.value)} placeholder="e.g. Solve 2024 paper, get record signed"
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

        {/* 3. Q-banks & notes */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-app-ink">Q-banks &amp; notes</h2>
            <button onClick={() => setEditExam(true)} className="text-xs font-medium text-[var(--color-accent)]">Add / remove</button>
          </div>
          {plan.notes.map((n) => {
            const p = progressOf(plan.topics[n.id]);
            const isOpen = open === n.id || (plan.notes.length === 1 && open === null);
            return (
              <article key={n.id} className="vc-tile overflow-hidden">
                <button onClick={() => setOpen(isOpen ? "__none" : n.id)} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={isOpen}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        {n.section === "qbank" && <span className="shrink-0 rounded bg-[var(--accent-soft)] px-1.5 text-[10px] font-semibold text-[var(--color-accent)]">Q-BANK</span>}
                        <span className="truncate font-medium text-app-ink">{n.title}</span>
                      </span>
                      <span className="shrink-0 text-xs text-app-ink-muted">{p.total ? `${p.done}/${p.total}` : "not imported"}</span>
                    </div>
                    <Bar pct={p.pct} className="mt-1.5 h-1" />
                  </div>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-app-ink-muted transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t border-app-border p-4">
                    <button onClick={() => setReading(n.id)} className="inline-flex items-center gap-1.5 text-xs font-medium text-app-ink-muted hover:text-app-ink"><BookOpen className="h-3.5 w-3.5" /> Open the file / note</button>
                    <TopicChecklist note={n} subjectTitle={subject?.title} showHeader={false} onDrill={() => setDrill({ notes: [n] })} />
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
            Delete this exam? Your notes and scores stay.
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { exams.remove(exam.id); router.push("/prep"); }}>Delete</Button>
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
          onPractice={() => { setDrill({ notes: [reader] }); setReading(null); }}
        />
      )}
      {drill && <Drill subjectTitle={subject?.title ?? exam.name} notes={drill.notes} only={drill.only} onClose={() => setDrill(null)} />}
      {editExam && <ExamForm subjectId={exam.subjectId} notes={subjectNotes} exam={exam} onClose={() => setEditExam(false)} />}
      <NoteEditorDialog
        open={!!editingNote}
        onOpenChange={(o) => !o && setEditingNote(null)}
        courseId={exam.subjectId}
        defaultSection={editingNote?.section ?? "qbank"}
        note={editingNote}
        onSave={vault.saveNote}
        onDelete={vault.removeNote}
        onAddImage={vault.addImage}
        onAddFile={vault.addFile}
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="rounded-control bg-app-surface-muted px-2 py-2">
      <p className={cn("font-display text-lg leading-none", tone === "warn" ? "text-amber-600" : "text-app-ink")}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-app-ink-muted">{label}</p>
    </div>
  );
}
