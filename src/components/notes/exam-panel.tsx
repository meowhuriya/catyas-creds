"use client";

import * as React from "react";
import { CalendarDays, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Exam, daysLeft, examProgress, progressOf, useExams, useNoteTopics } from "@/lib/notes/study";
import { VaultNote } from "@/lib/notes/vault-types";

export function Bar({ pct, className = "" }: { pct: number; className?: string }) {
  return (
    <div className={"h-1.5 overflow-hidden rounded-full bg-app-surface-muted " + className}>
      <div className="h-full rounded-full bg-app-accent transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function ExamForm({ subjectId, notes, exam, onClose }: { subjectId: string; notes: VaultNote[]; exam?: Exam; onClose: () => void }) {
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
          if (!name.trim()) return;
          save({ id: exam?.id, subjectId, name: name.trim(), date, noteIds: picked });
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
        <label className="flex items-center gap-2 text-xs text-app-ink-muted">
          <CalendarDays className="h-3.5 w-3.5" /> Exam date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-control border border-app-border bg-app-surface px-2 py-1 text-xs text-app-ink" />
        </label>
        <div className="space-y-1">
          <p className="text-xs font-medium text-app-ink">Notes for this exam</p>
          <div className="max-h-52 space-y-1 overflow-y-auto rounded-control border border-app-border p-2">
            {notes.length === 0 && <p className="text-xs text-app-ink-muted">Add some notes to this subject first.</p>}
            {notes.map((n) => (
              <label key={n.id} className="flex items-center gap-2 rounded px-1 py-1 text-sm text-app-ink hover:bg-app-surface-muted">
                <input type="checkbox" checked={picked.includes(n.id)} onChange={() => toggle(n.id)} className="h-4 w-4 accent-[var(--accent)]" />
                <span className="truncate">{n.title}</span>
              </label>
            ))}
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={!name.trim()}>Save exam</Button>
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
  const { exams, remove } = useExams();
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
            const p = examProgress({ ...ex, noteIds: exNotes.map((n) => n.id) }, topics);
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
                  <div className="mb-1 flex justify-between text-xs text-app-ink-muted"><span>{p.done} of {p.total} topics</span><span className="font-semibold text-app-ink">{p.pct}%</span></div>
                  <Bar pct={p.pct} />
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
