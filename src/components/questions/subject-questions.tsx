"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, FileQuestion, Loader2, Plus, Target, Timer, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Bar } from "@/components/notes/exam-panel";
import { ScorePill } from "@/components/notes/topic-checklist";
import { NoteEditorDialog } from "@/components/notes/note-editor-dialog";
import { NoteReader } from "@/components/notes/note-reader";
import { Drill } from "@/components/prep/drill";
import { useFocusDay } from "@/lib/focus/store";
import { getSubject } from "@/lib/notes/curriculum";
import { QEntry, groupByChapter, qStats, questionEntries, smartOpen } from "@/lib/notes/questions";
import { daysLeft, useExams, useNoteTopics } from "@/lib/notes/study";
import { hasImportSource, useImportQuestions } from "@/lib/notes/use-import";
import { useVault } from "@/lib/notes/use-vault";
import { VaultNote } from "@/lib/notes/vault-types";
import { cn } from "@/lib/utils";

type Vault = ReturnType<typeof useVault>;

/**
 * Everything about one subject's questions in one place: Q-banks (import), progress, chapters,
 * test yourself, and send a chapter to today's Focus list. Used on the Notes subject page and the Course page.
 */
export function SubjectQuestions({ subjectId, vault }: { subjectId: string; vault: Vault }) {
  const subject = getSubject(subjectId);
  const title = subject?.title ?? subjectId;
  const nt = useNoteTopics();
  const { exams } = useExams();
  const focus = useFocusDay();
  const toast = useToast();
  const importer = useImportQuestions(title);

  const notes = vault.notes.filter((n) => n.courseId === subjectId);
  const qbanks = notes.filter((n) => n.section === "qbank");
  const entries = questionEntries(notes, nt.topics);
  const stats = qStats(entries);
  const chapters = groupByChapter(entries);
  const nextExam = exams
    .filter((e) => e.subjectId === subjectId && (daysLeft(e.date) ?? 1) >= 0)
    .sort((a, b) => (a.date || "9").localeCompare(b.date || "9"))[0];

  const [open, setOpen] = React.useState<string | null>(null);
  const [drill, setDrill] = React.useState<{ notes: VaultNote[]; only?: { noteId: string; itemId: string }[] } | null>(null);
  const [editor, setEditor] = React.useState<{ note: VaultNote | null } | null>(null);
  const [reading, setReading] = React.useState<string | null>(null);
  const reader = reading ? notes.find((n) => n.id === reading) : undefined;

  const toFocus = (list: QEntry[], label: string, chapter?: string) => {
    const pick = smartOpen(list).slice(0, 8);
    if (!pick.length) {
      toast.info("Nothing left here", "Every question in this chapter is mastered.");
      return;
    }
    focus.addTask({
      title: `${subject?.code ?? ""} · ${label}`.replace(/^ · /, ""),
      kind: "questions",
      subjectId,
      chapter,
      refs: pick.map((e) => ({ noteId: e.noteId, itemId: e.itemId })),
    });
    toast.success("Added to today's Focus", `${pick.length} question${pick.length > 1 ? "s" : ""} from ${label}.`);
  };

  return (
    <div className="space-y-5">
      {/* Summary */}
      <section className="vc-tile space-y-4 p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-app-ink">Questions</p>
            <p className="text-xs text-app-ink-muted">
              {stats.total ? `${stats.mastered} of ${stats.total} mastered` : "No questions yet"}
              {nextExam && (
                <>
                  {" · "}
                  <Link href={`/prep/${encodeURIComponent(nextExam.id)}`} className="font-medium text-[var(--color-accent)] hover:underline">
                    {nextExam.name} {daysLeft(nextExam.date) === 0 ? "today" : daysLeft(nextExam.date) !== null ? `in ${daysLeft(nextExam.date)}d` : ""}
                  </Link>
                </>
              )}
            </p>
          </div>
          {stats.total > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => toFocus(entries, "Mixed revision")}><Timer className="h-4 w-4" /> Add to Focus</Button>
              <Button size="sm" onClick={() => setDrill({ notes })}><Target className="h-4 w-4" /> Test me</Button>
            </div>
          )}
        </div>
        {stats.total > 0 && (
          <>
            <Bar pct={stats.pct} className="h-2" />
            <div className="grid grid-cols-4 gap-2 text-center">
              <Mini label="Mastered" value={stats.mastered} />
              <Mini label="Tried" value={stats.attempted} />
              <Mini label="Weak" value={stats.weak} warn />
              <Mini label="Not tried" value={stats.untried} />
            </div>
          </>
        )}

        {/* Q-banks */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-app-ink-muted">Question banks</p>
          <div className="flex flex-col gap-2">
            {qbanks.map((n) => {
              const count = (nt.topics[n.id] ?? []).length;
              const busy = importer.busy?.noteId === n.id;
              const msg = importer.msg?.noteId === n.id ? importer.msg.lines : null;
              return (
                <div key={n.id} className="rounded-control border border-app-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileQuestion className="h-4 w-4 shrink-0 text-app-accent" />
                    <button onClick={() => setReading(n.id)} className="min-w-0 flex-1 truncate text-left text-sm text-app-ink hover:underline">{n.title}</button>
                    {count > 0 ? (
                      <span className="shrink-0 text-xs text-app-ink-muted">{count} questions</span>
                    ) : hasImportSource(n) ? (
                      <button disabled={!!importer.busy} onClick={() => importer.run(n, "questions")} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-app-accent px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-50">
                        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null} {busy ? "Reading…" : "Get questions"}
                      </button>
                    ) : (
                      <button onClick={() => setEditor({ note: n })} className="shrink-0 text-[11px] font-medium text-[var(--color-accent)]">Add the file</button>
                    )}
                    {count > 0 && hasImportSource(n) && (
                      <button disabled={!!importer.busy} onClick={() => importer.run(n, "questions")} className="shrink-0 text-[11px] text-app-ink-muted hover:text-app-ink">
                        {busy ? "Importing…" : "Re-import"}
                      </button>
                    )}
                  </div>
                  {busy && <p className="mt-1 text-[11px] text-app-ink-muted">{importer.progress || "Reading the Q-bank…"}</p>}
                  {msg?.map((m, i) => (<p key={i} className="mt-1 text-[11px] text-app-ink-muted">{m}</p>))}
                  {msg && count === 0 && !busy && (
                    <button disabled={!!importer.busy} onClick={() => importer.run(n, "questions", { ai: true })} className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-app-accent hover:underline">
                      <Sparkles className="h-3 w-3" /> Use AI instead (for scans and photos)
                    </button>
                  )}
                </div>
              );
            })}
            <button onClick={() => setEditor({ note: null })} className="flex items-center justify-center gap-1.5 rounded-control border border-dashed border-app-border px-3 py-2 text-xs text-app-ink-muted hover:border-app-accent hover:text-app-ink">
              <Plus className="h-3.5 w-3.5" /> Add a Q-bank (PDF, Word, PPT or Drive link): questions are read automatically
            </button>
          </div>
        </div>
      </section>

      {/* Chapters */}
      {chapters.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm font-semibold text-app-ink">By chapter</p>
          {chapters.map((g) => {
            const s = qStats(g.entries);
            const name = g.chapter || "Other";
            const isOpen = open === name;
            return (
              <article key={name} className="vc-tile overflow-hidden">
                <button onClick={() => setOpen(isOpen ? null : name)} className="flex w-full items-center gap-3 px-4 py-3 text-left" aria-expanded={isOpen}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-app-ink">{name}</span>
                      <span className="shrink-0 text-xs text-app-ink-muted">
                        {s.mastered}/{s.total}{s.weak ? <span className="text-amber-600"> · {s.weak} weak</span> : null}
                      </span>
                    </div>
                    <Bar pct={s.pct} className="mt-1.5 h-1" />
                  </div>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-app-ink-muted transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t border-app-border px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setDrill({ notes, only: smartOpen(g.entries).slice(0, 10).map((e) => ({ noteId: e.noteId, itemId: e.itemId })) })} disabled={s.mastered === s.total}>
                        <Target className="h-4 w-4" /> Test me on this chapter
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toFocus(g.entries, name, g.chapter || undefined)}><Timer className="h-4 w-4" /> Focus on it today</Button>
                    </div>
                    <ul className="space-y-0.5">
                      {g.entries.map((e) => (
                        <li key={e.key} className="flex items-start gap-2 rounded px-1 py-1 hover:bg-app-surface-muted">
                          <input type="checkbox" checked={e.item.done} onChange={() => nt.toggle(e.noteId, e.itemId)} title="Mark as mastered" className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
                          <span className={cn("flex-1 text-sm leading-snug", e.item.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{e.item.text}</span>
                          {!!e.item.marks && <span className="shrink-0 rounded-full border border-app-border px-1.5 text-[10px] text-app-ink-muted">{e.item.marks}M</span>}
                          <ScorePill item={e.item} />
                          <button onClick={() => setDrill({ notes, only: [{ noteId: e.noteId, itemId: e.itemId }] })} className="shrink-0 rounded-full border border-app-border px-2 py-0.5 text-[11px] text-app-ink-muted hover:border-app-accent hover:text-app-ink">Answer</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}

      {drill && <Drill subjectTitle={title} notes={drill.notes} only={drill.only} onClose={() => setDrill(null)} />}
      {reader && (
        <NoteReader
          note={reader}
          onClose={() => setReading(null)}
          onEdit={() => { setEditor({ note: reader }); setReading(null); }}
          onPractice={() => { setDrill({ notes: [reader] }); setReading(null); }}
        />
      )}
      <NoteEditorDialog
        open={!!editor}
        onOpenChange={(o) => !o && setEditor(null)}
        courseId={subjectId}
        defaultSection="qbank"
        note={editor?.note ?? null}
        onSave={async (input) => {
          const saved = await vault.saveNote(input);
          // Adding a Q-bank reads its questions straight away, no extra button.
          if (saved.section === "qbank" && hasImportSource(saved) && !(nt.topics[saved.id] ?? []).length) importer.run(saved, "questions");
          return saved;
        }}
        onDelete={vault.removeNote}
        onAddImage={vault.addImage}
        onAddFile={vault.addFile}
      />
    </div>
  );
}

/** Same panel for pages that don't already load the vault (e.g. the Course page). */
export function SubjectQuestionsStandalone({ subjectId }: { subjectId: string }) {
  const vault = useVault();
  return <SubjectQuestions subjectId={subjectId} vault={vault} />;
}

function Mini({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-control bg-app-surface-muted px-2 py-2">
      <p className={cn("font-display text-lg leading-none", warn && value ? "text-amber-600" : "text-app-ink")}>{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-app-ink-muted">{label}</p>
    </div>
  );
}
