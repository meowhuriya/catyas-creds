"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, CloudOff, Cloud, Paperclip, Search, Target } from "lucide-react";
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
import { daysLeft, useExams } from "@/lib/notes/study";
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
  const { exams } = useExams();
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.025em] text-app-ink">Courses</h1>
          <p className="text-sm text-app-ink-muted">Open a course to see its questions, class notes, assignments and files.</p>
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
