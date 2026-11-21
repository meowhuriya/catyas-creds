"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, CloudOff, Cloud, Paperclip, Search } from "lucide-react";
import { useVault } from "@/lib/notes/use-vault";
import {
  SUBJECTS,
  Subject,
  YEAR_LABELS,
  getSubject,
  subjectColor,
  subjectsFor,
} from "@/lib/notes/curriculum";
import { VAULT_SECTIONS, VaultNote } from "@/lib/notes/vault-types";
import { cn } from "@/lib/utils";
import { Bar, ExamForm } from "@/components/notes/exam-panel";
import { daysLeft, examProgress, examTopicProgress, progressOf, sumProgress, useExams, useNoteTopics } from "@/lib/notes/study";
import { Butterfly, Diamond } from "@/components/brand/butterfly";
import { SubjectArt } from "@/components/brand/subject-art";

const VIEW_KEY = "valeria_vault_view";

function loadView(): { year: 1 | 2 | 3 | 4; sem: 1 | 2 } {
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY) || "null");
    if ([1, 2, 3, 4].includes(v?.year) && [1, 2].includes(v?.sem)) return v;
  } catch {}
  return { year: 1, sem: 1 };
}

export default function NotesVaultPage() {
  const { notes, ready, syncState, syncError, signedIn } = useVault();
  const [view, setView] = React.useState<{ year: 1 | 2 | 3 | 4; sem: 1 | 2 }>({ year: 1, sem: 1 });
  const [query, setQuery] = React.useState("");
  const { topics } = useNoteTopics();
  const { exams } = useExams();
  const overall = sumProgress(notes.map((n) => progressOf(topics[n.id])));
  const [examForm, setExamForm] = React.useState<boolean>(false);
  const upcoming = exams
    .filter((e) => (daysLeft(e.date) ?? 1) >= 0)
    .sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));

  React.useEffect(() => {
    setView(loadView());
  }, []);

  const updateView = (next: Partial<typeof view>) => {
    const merged = { ...view, ...next };
    setView(merged);
    try {
      localStorage.setItem(VIEW_KEY, JSON.stringify(merged));
    } catch {}
  };

  const subjects = subjectsFor(view.year, view.sem);
  const core = subjects.filter((s) => s.kind !== "elective");
  const electiveSlots = React.useMemo(() => {
    const map = new Map<string, Subject[]>();
    subjects.filter((s) => s.kind === "elective").forEach((s) => map.set(s.slot!, [...(map.get(s.slot!) ?? []), s]));
    return Array.from(map.entries());
  }, [subjects]);

  const countsFor = React.useCallback(
    (id: string) => {
      const mine = notes.filter((n) => n.courseId === id);
      return { total: mine.length, bySection: VAULT_SECTIONS.map((s) => mine.filter((n) => n.section === s.key).length) };
    },
    [notes]
  );

  const q = query.trim().toLowerCase();
  const results: VaultNote[] = q
    ? notes
        .filter((n) => `${n.title} ${n.body}`.toLowerCase().includes(q))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 30)
    : [];

  return (
    <div className="space-y-6">
      <header className="pro-hero relative isolate flex flex-col gap-6 overflow-hidden rounded-3xl px-7 py-9 sm:flex-row sm:items-end sm:justify-between md:px-10">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 -z-10 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,var(--orb-a),transparent)] blur-2xl" />
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-[var(--color-ink-muted)]">Notes Vault</p>
          <h1 className="relative mt-2 flex items-center gap-3 font-display text-[34px] font-semibold leading-tight tracking-[-0.025em] text-[var(--color-ink)] md:text-[40px]">
            Your <span className="pro-name-gradient">vault</span>
            <Butterfly size={40} className="hidden sm:block" />
          </h1>
          <p className="relative mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-muted)]">
            Pick your year, open a subject and keep exam-important points, viva questions, assignments, your submissions,
            photos and links together. No more scrolling through WhatsApp.
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <div className="relative">
            <select
              value={view.year}
              onChange={(e) => updateView({ year: Number(e.target.value) as 1 | 2 | 3 | 4 })}
              aria-label="Select year"
              className="h-10 appearance-none rounded-lg border border-[var(--hair)] bg-[var(--wash)] pl-3.5 pr-9 text-[13px] font-medium text-[var(--color-ink)] normal-case tracking-normal font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-app-ink transition-colors hover:border-app-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
            >
              {([1, 2, 3, 4] as const).map((y) => (
                <option key={y} value={y}>
                  {YEAR_LABELS[y]}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-app-ink-muted" />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-[var(--hair)] bg-[var(--wash)] p-1" role="tablist" aria-label="Semester">
            {([1, 2] as const).map((sem) => (
              <button
                key={sem}
                role="tab"
                aria-selected={view.sem === sem}
                onClick={() => updateView({ sem })}
                className={cn(
                  "relative h-8 text-[13px] font-medium transition-colors",
                  view.sem === sem
                    ? "rounded-md bg-[var(--wash-strong)] px-3 text-[var(--color-ink)]"
                    : "px-3 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                )}
              >
                Sem {sem}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-app-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all your notes"
            aria-label="Search notes"
            className="h-10 w-full rounded-control border border-app-border bg-app-surface pl-9 pr-3 text-sm text-app-ink shadow-sm placeholder:text-app-ink-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
          />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-app-ink-muted">
          {signedIn && syncState !== "error" ? <Cloud className="h-3.5 w-3.5 text-app-success" /> : <CloudOff className="h-3.5 w-3.5" />}
          {syncState === "error"
            ? `Sync problem: ${syncError ?? "unknown"}`
            : signedIn
              ? "Synced with your Google account"
              : "Saved on this device only. Sign in to sync."}
        </p>
      </div>

      {!q && (
        <section className="space-y-3" aria-label="Study progress">
          <div className="vc-tile flex flex-wrap items-center gap-5 p-5">
            <div className="min-w-[200px] flex-1 space-y-2">
              <p className="text-sm font-semibold text-app-ink">Overall progress</p>
              <p className="font-display text-4xl text-app-ink">{overall.pct}%</p>
              <Bar pct={overall.pct} />
              <p className="text-xs text-app-ink-muted">{overall.done} of {overall.total} topics done across all your notes</p>
            </div>
            <button onClick={() => setExamForm(true)} disabled={notes.length === 0} className="rounded-control bg-app-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">+ Add exam</button>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-app-ink-muted">No exams yet. Add one, tag the notes you need to study, and track it here.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {upcoming.map((e) => {
                const exNotes = e.noteIds.map((id) => notes.find((n) => n.id === id)).filter(Boolean) as VaultNote[];
                const scoped = { ...e, noteIds: exNotes.map((n) => n.id) };
                const p = examProgress(scoped, topics);
                const tp = examTopicProgress(scoped, topics);
                const dp = progressOf(e.todos);
                const left = daysLeft(e.date);
                return (
                  <article key={e.id} className="vc-tile space-y-3 p-4">
                    <Link href={`/notes/${encodeURIComponent(e.subjectId)}`} className="block">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-display text-lg text-app-ink">{getSubject(e.subjectId)?.title} · {e.name}</p>
                          <p className="text-xs text-app-ink-muted">{left === null ? "No date" : left === 0 ? "Today" : `${left} day${left === 1 ? "" : "s"} left`}{e.date && ` · ${new Date(e.date + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" })}`}</p>
                        </div>
                        <span className="font-display text-2xl text-app-ink">{p.pct}%</span>
                      </div>
                      <Bar pct={p.pct} className="mt-2" />
                      <p className="mt-1 text-[11px] text-app-ink-muted">Topics {tp.done}/{tp.total} · To-do {dp.done}/{dp.total}</p>
                    </Link>
                    <ul className="space-y-1.5 border-t border-app-border pt-2">
                      {exNotes.map((n) => {
                        const np = progressOf(topics[n.id]);
                        return (
                          <li key={n.id}>
                            <Link href={`/notes/${encodeURIComponent(n.courseId)}`} className="block">
                              <div className="flex justify-between text-xs"><span className="truncate text-app-ink">{n.title}</span><span className="shrink-0 text-app-ink-muted">{np.total ? `${np.done}/${np.total}` : "no topics yet"}</span></div>
                              <Bar pct={np.pct} className="mt-0.5 h-1" />
                            </Link>
                          </li>
                        );
                      })}
                      {exNotes.length === 0 && <li className="text-xs text-app-ink-muted">No notes tagged yet. Open the subject and edit this exam.</li>}
                    </ul>
                  </article>
                );
              })}
            </div>
          )}
          {examForm && <ExamForm notes={notes} onClose={() => setExamForm(false)} />}
        </section>
      )}

      {q ? (
        <section aria-live="polite" className="space-y-2">
          <h2 className="text-sm font-semibold text-app-ink">
            {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
          </h2>
          {results.map((n) => {
            const subj = getSubject(n.courseId);
            return (
              <Link
                key={n.id}
                href={`/notes/${encodeURIComponent(n.courseId)}`}
                className="flex flex-col gap-1 rounded-card border border-app-border bg-app-surface p-3 transition-colors hover:border-app-accent"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-app-ink-muted">
                  {subj?.code} · {subj?.title} · {VAULT_SECTIONS.find((s) => s.key === n.section)?.label}
                </span>
                <span className="font-serif font-semibold text-app-ink">{n.title}</span>
                {n.body && <span className="line-clamp-2 text-sm text-app-ink-muted">{n.body}</span>}
              </Link>
            );
          })}
        </section>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Subjects">
            {core.map((s) => (
              <SubjectCard key={s.id} subject={s} counts={ready ? countsFor(s.id) : null} />
            ))}
          </section>

          {electiveSlots.length > 0 && (
            <section className="space-y-2">
              <h2 className="font-display text-2xl font-normal tracking-[-0.01em] text-app-ink">Electives</h2>
              <p className="text-xs text-app-ink-muted">Open the slot, then pick the elective you chose.</p>
              {electiveSlots.map(([slot, list]) => (
                <details key={slot} className="group rounded-card border border-app-border bg-app-surface p-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-app-ink">
                    {slot}
                    <ChevronDown className="h-4 w-4 text-app-ink-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {list.map((s) => (
                      <SubjectCard key={s.id} subject={s} counts={ready ? countsFor(s.id) : null} />
                    ))}
                  </div>
                </details>
              ))}
            </section>
          )}

          {SUBJECTS.length > 0 && subjects.length === 0 && (
            <p className="text-sm text-app-ink-muted">No subjects listed for this semester.</p>
          )}
        </>
      )}
    </div>
  );
}

function SubjectCard({
  subject,
  counts,
}: {
  subject: Subject;
  counts: { total: number; bySection: number[] } | null;
}) {
  const color = subjectColor(subject);
  return (
    <Link
      href={`/notes/${encodeURIComponent(subject.id)}`}
      className="group vc-tile relative flex flex-col overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent"
    >
      <SubjectArt code={subject.code} title={subject.title} hue={color} height={96} label={subject.slot ?? `${subject.kind === "lab" ? "Lab" : subject.kind === "project" ? "Project" : subject.kind === "skill" ? "Skill course" : "Theory"}`} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="min-w-0">
          <h3 className="font-display text-xl leading-snug text-app-ink line-clamp-2">{subject.title}</h3>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.12em] text-app-ink-muted">
            {subject.code} · {subject.credits} credit{subject.credits > 1 ? "s" : ""}
          </p>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-app-ink-muted">
          {counts && counts.total === 0 && <span>No notes yet</span>}
          {counts &&
            VAULT_SECTIONS.map((sec, i) =>
              counts.bySection[i] > 0 ? (
                <span key={sec.key} className="inline-flex items-center gap-1 rounded-full border border-[rgba(60,40,110,0.12)] bg-white/60 px-2 py-0.5 text-app-ink">
                  {sec.key === "submission" && <Paperclip className="h-3 w-3" />}
                  {sec.short} {counts.bySection[i]}
                </span>
              ) : null
            )}
        </div>
      </div>
    </Link>
  );
}
