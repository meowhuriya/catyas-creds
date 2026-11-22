"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Cloud, CloudOff, Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteCard } from "@/components/notes/note-parts";
import { NoteReader } from "@/components/notes/note-reader";
import { PracticeDialog } from "@/components/notes/practice-dialog";
import { daysLeft, useExams, useNoteTopics } from "@/lib/notes/study";
import { ExamForm } from "@/components/notes/exam-panel";
import { Drill } from "@/components/prep/drill";
import { SubjectQuestions } from "@/components/questions/subject-questions";
import { NoteEditorDialog } from "@/components/notes/note-editor-dialog";
import { useVault } from "@/lib/notes/use-vault";
import { YEAR_LABELS, getSubject, subjectColor } from "@/lib/notes/curriculum";
import { VAULT_SECTIONS, VaultNote, VaultSection } from "@/lib/notes/vault-types";
import { cn } from "@/lib/utils";
import { Butterfly } from "@/components/brand/butterfly";
import { SubjectArt } from "@/components/brand/subject-art";

export default function SubjectNotesPage() {
  const params = useParams<{ subjectId: string }>();
  const subjectId = decodeURIComponent(params?.subjectId ?? "");
  const subject = getSubject(subjectId);
  const vault = useVault();
  const [section, setSection] = React.useState<VaultSection>("qbank");
  const pickedSection = React.useRef(false);
  const [editing, setEditing] = React.useState<VaultNote | null>(null);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [readingId, setReadingId] = React.useState<string | null>(null);
  const [practice, setPractice] = React.useState<{ noteId?: string } | null>(null);
  const [view, setView] = React.useState<"questions" | "files">("questions");
  const [drillNote, setDrillNote] = React.useState<VaultNote | null>(null);
  const [examForm, setExamForm] = React.useState(false);
  const noteTopics = useNoteTopics();
  const { exams } = useExams();

  const mine = vault.notes.filter((n) => n.courseId === subjectId);
  const subjectExams = exams
    .filter((e) => e.subjectId === subjectId && (daysLeft(e.date) ?? 1) >= 0)
    .sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));

  const questionCount = mine.reduce((n, note) => n + (noteTopics.topics[note.id]?.length ?? 0), 0);

  // Land on the first section that has something in it.
  React.useEffect(() => {
    if (pickedSection.current || !vault.ready) return;
    pickedSection.current = true;
    const first = VAULT_SECTIONS.find((s) => mine.some((n) => n.section === s.key));
    if (first) setSection(first.key);
    if (questionCount === 0 && mine.length > 0) setView("files");
  }, [vault.ready, mine]);
  const visible = mine
    .filter((n) => n.section === section)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  const reading = mine.find((n) => n.id === readingId) ?? null;
  const active = VAULT_SECTIONS.find((s) => s.key === section)!;

  if (!subject) {
    return (
      <div className="space-y-3 py-10 text-center">
        <h1 className="font-serif text-2xl font-semibold text-app-ink">Subject not found</h1>
        <Link href="/notes" className="text-sm font-semibold text-app-accent hover:underline">
          Back to the Notes Vault
        </Link>
      </div>
    );
  }

  const color = subjectColor(subject);
  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      <Link href="/notes" className="inline-flex items-center gap-1.5 text-sm font-medium text-app-ink-muted transition-colors hover:text-app-ink">
        <ArrowLeft className="h-4 w-4" /> All subjects
      </Link>

      <header className="group vc-tile relative overflow-hidden">
        <SubjectArt code={subject.code} title={subject.title} hue={color} height={120} label={subject.slot} />
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color }}>
              {subject.code} · {YEAR_LABELS[subject.year]} · Sem {subject.sem}
              {subject.slot ? ` · ${subject.slot}` : ""}
            </p>
            <h1 className="font-display text-4xl font-normal leading-[1.05] text-app-ink md:text-5xl">{subject.title}</h1>
            <p className="text-xs text-app-ink-muted">
              {subject.credits} credit{subject.credits > 1 ? "s" : ""} · {mine.length} note{mine.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button onClick={openNew} size="lg" className="shrink-0">
            <Plus className="h-4 w-4" /> Add to {active.short}
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Target className="h-4 w-4 text-app-accent" />
        <span className="text-sm font-semibold text-app-ink">Exams</span>
        {subjectExams.map((e) => {
          const d = daysLeft(e.date);
          return (
            <Link key={e.id} href={`/prep/${encodeURIComponent(e.id)}`} className="rounded-full border border-app-border bg-app-surface px-3 py-1 text-xs text-app-ink hover:border-app-accent">
              {e.name} <span className="text-app-ink-muted">· {d === null ? "no date" : d === 0 ? "today" : `${d}d`}</span>
            </Link>
          );
        })}
        <button onClick={() => setExamForm(true)} disabled={mine.length === 0} className="rounded-full border border-dashed border-app-border px-3 py-1 text-xs text-app-ink-muted hover:border-app-accent hover:text-app-ink disabled:opacity-40">
          + Add exam
        </button>
      </div>

      <div className="flex gap-1 rounded-control border border-app-border bg-app-surface p-1" role="tablist" aria-label="View">
        {([["questions", "Questions"], ["files", "Files & notes"]] as const).map(([v, label]) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={cn("flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors", view === v ? "bg-app-accent text-white" : "text-app-ink-muted hover:text-app-ink")}
          >
            {label}
            {v === "questions" && questionCount > 0 && <span className="ml-1.5 opacity-70">{questionCount}</span>}
            {v === "files" && <span className="ml-1.5 opacity-70">{mine.length}</span>}
          </button>
        ))}
      </div>

      {view === "questions" ? (
        <SubjectQuestions subjectId={subjectId} vault={vault} />
      ) : (
        <>
        <div className="flex gap-6 overflow-x-auto border-b border-[rgba(60,40,110,0.08)]" role="tablist" aria-label="Sections">
          {VAULT_SECTIONS.map((s) => {
            const count = mine.filter((n) => n.section === s.key).length;
            return (
              <button
                key={s.key}
                role="tab"
                aria-selected={section === s.key}
                onClick={() => setSection(s.key)}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 pb-3 pt-1 font-display text-[15px] font-semibold uppercase tracking-[0.12em] transition-colors",
                  section === s.key
                    ? "text-app-ink after:absolute after:inset-x-0 after:-bottom-px after:h-[2px] after:bg-gradient-to-r after:from-[#CDBBFF] after:via-[#F2B4D8] after:to-[#A6E3E4] "
                    : "text-app-ink-muted hover:text-app-ink"
                )}
              >
                {s.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px]",
                    section === s.key ? "text-[var(--color-eyebrow)]" : "text-app-ink-muted/70"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-sm text-app-ink-muted">{active.hint}</p>

        {!vault.ready ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-card bg-app-surface-muted" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Butterfly size={56} className="opacity-90" />
            <p className="font-display text-2xl font-normal tracking-[-0.01em] text-app-ink">Nothing in {active.label} yet</p>
            <p className="max-w-sm text-sm text-app-ink-muted">{active.hint}.</p>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Add the first one
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                progress={noteTopics.progress(n.id)}
                onOpen={() => setReadingId(n.id)}
                onEdit={() => {
                  setEditing(n);
                  setEditorOpen(true);
                }}
              />
            ))}
          </div>
        )}

        </>
      )}

      <p className="flex items-center gap-1.5 text-xs text-app-ink-muted">
        {vault.signedIn && vault.syncState !== "error" ? <Cloud className="h-3.5 w-3.5 text-app-success" /> : <CloudOff className="h-3.5 w-3.5" />}
        {vault.syncState === "error"
          ? `Sync problem: ${vault.syncError ?? "unknown"}`
          : vault.signedIn
            ? "Synced with your Google account"
            : "Saved on this device only. Sign in to sync."}
      </p>

      {reading && (
        <NoteReader
          note={reading}
          onClose={() => setReadingId(null)}
          onEdit={() => {
            setEditing(reading);
            setReadingId(null);
            setEditorOpen(true);
          }}
          onPractice={() => {
            if ((noteTopics.topics[reading.id] ?? []).length) setDrillNote(reading);
            else setPractice({ noteId: reading.id });
            setReadingId(null);
          }}
        />
      )}
      {practice && (
        <PracticeDialog
          subjectTitle={subject.title}
          notes={mine}
          startNoteId={practice.noteId}
          onClose={() => setPractice(null)}
          onAddWeak={(items) =>
            items.forEach(({ topic, noteId }) => {
              const target = noteId ?? practice.noteId ?? mine[0]?.id;
              if (target) noteTopics.add(target, [`Revise: ${topic}`], true);
            })
          }
        />
      )}
      {drillNote && <Drill subjectTitle={subject.title} notes={[drillNote]} onClose={() => setDrillNote(null)} />}
      {examForm && <ExamForm subjectId={subjectId} notes={mine} onClose={() => setExamForm(false)} />}

      <NoteEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        courseId={subjectId}
        defaultSection={section}
        note={editing}
        onSave={vault.saveNote}
        onDelete={vault.removeNote}
        onAddImage={vault.addImage}
        onAddFile={vault.addFile}
      />
    </div>
  );
}
