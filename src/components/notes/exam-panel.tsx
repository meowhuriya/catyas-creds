"use client";

import * as React from "react";
import { CalendarDays, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Exam, daysLeft, examProgress, examTopicProgress, progressOf, useExams, useNoteTopics } from "@/lib/notes/study";
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
  const [subj, setSubj] = React.useState(subjectId ?? exam?.subjectId ?? "");
  const subjectChoices = Array.from(new Set(notes.map((n) => n.courseId)));
  const shown = notes.filter((n) => n.courseId === subj);
  const { save } = useExams();
  const [name, setName] = React.useState(exam?.name ?? "");
  const [date, setDate] = React.useState(exam?.date ?? "");
  const [picked, setPicked] = React.useState<string[]>(exam?.noteIds ?? []);
  void shown;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !subj) return;
          save({ id: exam?.id, subjectId: subj, name: name.trim(), date, noteIds: picked, todos: exam?.todos });
          onClose();
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
          <p className="text-xs font-medium text-app-ink">Notes for this exam</p>
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

export function ExamPanel({
  subjectId,
  notes,
  onOpenNote,
  onPractice,
}: {
  subjectId: string;
  notes: VaultNote[];
  onOpenNote: (id: string) => void;
  onPractice: (notes: VaultNote[]) => void;
}) {
  const { exams, remove, addTodo, toggleTodo, removeTodo } = useExams();
  const [todoText, setTodoText] = React.useState<Record<string, string>>({});
  const { topics } = useNoteTopics();
  const [form, setForm] = React.useState<{ exam?: Exam } | null>(null);
  const mine = exams.filter((e) => e.subjectId === subjectId).sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-app-ink">Exams</h2>
        <Button size="sm" variant="ghost" onClick={() => setForm({})}><Plus className="h-4 w-4" /> Add exam</Button>
      </div>
      {mine.length === 0 ? (
        <p className="text-sm text-app-ink-muted">Add an exam, pick the notes it covers, and track your progress for it.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {mine.map((ex) => {
            const exNotes = ex.noteIds.map((id) => notes.find((n) => n.id === id)).filter(Boolean) as VaultNote[];
            const scoped = { ...ex, noteIds: exNotes.map((n) => n.id) };
            const p = examProgress(scoped, topics);
            const tp = examTopicProgress(scoped, topics);
            const dp = progressOf(ex.todos);
            const left = daysLeft(ex.date);
            return (
              <article key={ex.id} className="vc-tile space-y-3 p-4">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-lg text-app-ink">{ex.name}</h3>
                    <p className="text-xs text-app-ink-muted">
                      {left === null ? "No date set" : left > 0 ? `${left} day${left === 1 ? "" : "s"} left` : left === 0 ? "Today" : "Passed"}
                      {ex.date && ` · ${new Date(ex.date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}`}
                    </p>
                  </div>
                  <button onClick={() => setForm({ exam: ex })} aria-label="Edit exam"><Pencil className="h-3.5 w-3.5 text-app-ink-muted" /></button>
                  <button onClick={() => remove(ex.id)} aria-label="Delete exam"><Trash2 className="h-3.5 w-3.5 text-app-ink-muted" /></button>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs text-app-ink-muted"><span>Exam readiness · {p.done} of {p.total} done</span><span className="font-semibold text-app-ink">{p.pct}%</span></div>
                  <Bar pct={p.pct} />
                  {left !== null && left > 0 && p.total - p.done > 0 && (
                    <p className="mt-1 text-[11px] text-app-ink-muted">About {Math.max(1, Math.ceil((p.total - p.done) / left))} item{Math.ceil((p.total - p.done) / left) > 1 ? "s" : ""} a day to finish on time</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-[11px] text-app-ink-muted">
                  <div><div className="mb-0.5 flex justify-between"><span>Note topics</span><span>{tp.done}/{tp.total}</span></div><Bar pct={tp.pct} className="h-1" /></div>
                  <div><div className="mb-0.5 flex justify-between"><span>To-do</span><span>{dp.done}/{dp.total}</span></div><Bar pct={dp.pct} className="h-1" /></div>
                </div>
                <div className="space-y-1.5 border-t border-app-border pt-3">
                  <p className="text-xs font-semibold text-app-ink">To-do for this exam</p>
                  <form onSubmit={(e) => { e.preventDefault(); const t = todoText[ex.id] ?? ""; if (t.trim()) addTodo(ex.id, t); setTodoText((m) => ({ ...m, [ex.id]: "" })); }} className="flex gap-1.5">
                    <input value={todoText[ex.id] ?? ""} onChange={(e) => setTodoText((m) => ({ ...m, [ex.id]: e.target.value }))} placeholder="e.g. Solve 2022 paper, revise formulas"
                      className="min-w-0 flex-1 rounded-control border border-app-border bg-app-surface px-2.5 py-1.5 text-sm outline-none focus:border-app-accent" />
                    <button type="submit" aria-label="Add to-do" className="rounded-control bg-app-accent px-2 text-white"><Plus className="h-4 w-4" /></button>
                  </form>
                  <ul className="space-y-0.5">
                    {(ex.todos ?? []).map((t) => (
                      <li key={t.id} className="group/row flex items-center gap-2 rounded px-1 py-1 hover:bg-app-surface-muted">
                        <input type="checkbox" checked={t.done} onChange={() => toggleTodo(ex.id, t.id)} className="h-4 w-4 accent-[var(--accent)]" />
                        <span className={"flex-1 text-sm " + (t.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{t.text}</span>
                        <button onClick={() => removeTodo(ex.id, t.id)} aria-label="Remove to-do" className="opacity-0 group-hover/row:opacity-100"><Trash2 className="h-3.5 w-3.5 text-app-ink-muted" /></button>
                      </li>
                    ))}
                  </ul>
                </div>
                <ul className="space-y-1.5">
                  {exNotes.map((n) => {
                    const np = progressOf(topics[n.id]);
                    return (
                      <li key={n.id}>
                        <button onClick={() => onOpenNote(n.id)} className="w-full text-left">
                          <div className="flex justify-between text-xs"><span className="truncate text-app-ink">{n.title}</span><span className="shrink-0 text-app-ink-muted">{np.total ? `${np.done}/${np.total}` : "no topics yet"}</span></div>
                          <Bar pct={np.pct} className="mt-0.5 h-1" />
                        </button>
                      </li>
                    );
                  })}
                  {exNotes.length === 0 && <li className="text-xs text-app-ink-muted">No notes selected. Edit the exam to add some.</li>}
                </ul>
                {exNotes.length > 0 && (<Button size="sm" variant="ghost" onClick={() => onPractice(exNotes)}><Sparkles className="h-4 w-4" /> Practise these notes</Button>)}
              </article>
            );
          })}
        </div>
      )}
      {form && <ExamForm subjectId={subjectId} notes={notes} exam={form.exam} onClose={() => setForm(null)} />}
    </section>
  );
}
