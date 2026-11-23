"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList, NotebookPen, Plus, Sprout, Target, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bar, ExamCard } from "@/components/notes/exam-panel";
import { Bloom } from "@/components/focus/flower";
import { useVault } from "@/lib/notes/use-vault";
import { daysLeft, progressOf, sumProgress, useExams, useNoteTopics } from "@/lib/notes/study";
import { getSubject, subjectsFor } from "@/lib/notes/curriculum";
import { bucketOf, partsProgress, useAssignments } from "@/lib/assignments/store";
import { useFocusDay, useFocusSettings } from "@/lib/focus/store";
import { useGarden } from "@/lib/focus/garden";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** Home: what's coming up and where to go next. Nothing else. */
export default function HomePage() {
  const { notes, ready } = useVault();
  const { exams } = useExams();
  const { topics } = useNoteTopics();
  const { assignments } = useAssignments();
  const focus = useFocusDay();
  const [settings] = useFocusSettings();
  const garden = useGarden();
  const [sem, setSem] = React.useState<{ year: number; sem: 1 | 2 }>({ year: 1, sem: 1 });
  React.useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("valeria_vault_view") || "null");
      if (v?.year && v?.sem) setSem(v);
    } catch {}
  }, []);

  const upcoming = exams.filter((e) => (daysLeft(e.date) ?? 1) >= 0).sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));
  const due = assignments
    .filter((a) => ["overdue", "week", "nodate"].includes(bucketOf(a)))
    .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"))
    .slice(0, 5);
  const minutes = focus.day.minutes;
  const goalPct = Math.min(100, Math.round((minutes / Math.max(1, settings.goalMin)) * 100));
  const openTasks = focus.day.tasks.filter((t) => !t.done);

  // Courses: this semester's, plus any other course you've added notes to.
  const withNotes = Array.from(new Set(notes.map((n) => n.courseId)));
  const courseIds = Array.from(new Set([...subjectsFor(sem.year, sem.sem).filter((s) => s.kind !== "elective").map((s) => s.id), ...withNotes]));
  const courseCard = (id: string) => {
    const mine = notes.filter((n) => n.courseId === id);
    const p = sumProgress(mine.filter((n) => n.section === "qbank").map((n) => progressOf(topics[n.id])));
    return { title: getSubject(id)?.title ?? id, code: getSubject(id)?.code, files: mine.length, p };
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-app-ink-muted">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.025em] text-app-ink">{greeting()}, Huriya</h1>
        </div>
        <Link href="/focus"><Button size="lg"><Timer className="h-4 w-4" /> Start focusing</Button></Link>
      </header>

      {/* Today at a glance */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/focus" className="vc-tile group space-y-2 p-4 hover:border-app-accent">
          <p className="flex items-center gap-1.5 text-xs font-medium text-app-ink-muted"><Timer className="h-3.5 w-3.5" /> Focus today</p>
          <p className="font-display text-2xl text-app-ink tabular-nums">{minutes} <span className="text-sm text-app-ink-muted">/ {settings.goalMin} min</span></p>
          <Bar pct={goalPct} />
        </Link>
        <Link href="/focus" className="vc-tile group space-y-2 p-4 hover:border-app-accent">
          <p className="flex items-center gap-1.5 text-xs font-medium text-app-ink-muted"><Sprout className="h-3.5 w-3.5" /> Garden</p>
          <div className="flex min-h-[32px] items-center gap-0.5">
            {garden.bloomed.length ? garden.bloomed.slice(0, 8).map((f) => <Bloom key={f.id} species={f.kind} size={32} />) : <span className="text-sm text-app-ink-muted">No flowers yet today</span>}
            {garden.bloomed.length > 8 && <span className="ml-1 text-xs text-app-ink-muted">+{garden.bloomed.length - 8}</span>}
          </div>
          <p className="text-xs text-app-ink-muted">{garden.bloomed.length} flower{garden.bloomed.length === 1 ? "" : "s"} · {garden.bouquets.length} bouquet{garden.bouquets.length === 1 ? "" : "s"} so far</p>
        </Link>
        <Link href="/focus" className="vc-tile group space-y-2 p-4 hover:border-app-accent">
          <p className="flex items-center gap-1.5 text-xs font-medium text-app-ink-muted"><ClipboardList className="h-3.5 w-3.5" /> Today&apos;s list</p>
          <p className="font-display text-2xl text-app-ink tabular-nums">{focus.day.tasks.length - openTasks.length} <span className="text-sm text-app-ink-muted">/ {focus.day.tasks.length} done</span></p>
          <p className="truncate text-xs text-app-ink-muted">{openTasks[0] ? `Next: ${openTasks[0].title}` : "Nothing planned. Add something in Focus."}</p>
        </Link>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Exams */}
        <section className="space-y-3">
          <SectionHead icon={Target} title="Upcoming exams" href="/prep" link="All exams" />
          {upcoming.length ? (
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((e) => <ExamCard key={e.id} exam={e} allNotes={notes} showSubject />)}
            </div>
          ) : (
            <EmptyRow text={ready && notes.length === 0 ? "Add a Q-bank to a course first, then create an exam." : "No exams coming up."} href="/prep" cta="Create an exam" />
          )}
        </section>

        {/* Assignments */}
        <section className="space-y-3">
          <SectionHead icon={ClipboardList} title="Assignments due" href="/assignments" link="All assignments" />
          {due.length ? (
            <ul className="vc-tile divide-y divide-app-border">
              {due.map((a) => {
                const d = daysLeft(a.due);
                const p = partsProgress(a);
                return (
                  <li key={a.id}>
                    <Link href="/assignments" className="flex items-center gap-3 px-4 py-3 hover:bg-app-surface-muted">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-app-ink">{a.title}</span>
                        <span className="block truncate text-xs text-app-ink-muted">{getSubject(a.subjectId)?.title ?? a.subjectId}{p.total ? ` · ${p.done}/${p.total} parts` : ""}</span>
                      </span>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", d === null ? "bg-app-surface-muted text-app-ink-muted" : d < 0 ? "bg-red-500/10 text-red-600" : d <= 2 ? "bg-amber-500/15 text-amber-700" : "bg-[var(--accent-soft)] text-[var(--color-accent)]")}>
                        {d === null ? "No date" : d < 0 ? `${-d}d late` : d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${d} days`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyRow text="Nothing due this week." href="/assignments" cta="Add an assignment" />
          )}
        </section>
      </div>

      {/* Courses */}
      <section className="space-y-3">
        <SectionHead icon={NotebookPen} title="Your courses" href="/notes" link="All courses" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courseIds.map((id) => {
            const c = courseCard(id);
            return (
              <Link key={id} href={`/notes/${encodeURIComponent(id)}`} className="vc-tile group space-y-3 p-4 hover:border-app-accent">
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    {c.code && <span className="block text-[11px] font-medium text-app-ink-muted">{c.code}</span>}
                    <span className="block truncate font-medium text-app-ink">{c.title}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-app-ink-muted group-hover:text-app-ink" />
                </div>
                <div className="space-y-1">
                  <Bar pct={c.p.pct} />
                  <p className="text-xs text-app-ink-muted">{c.p.total ? `${c.p.done}/${c.p.total} questions mastered` : "No questions yet"} · {c.files} file{c.files === 1 ? "" : "s"}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SectionHead({ icon: Icon, title, href, link }: { icon: React.ElementType; title: string; href: string; link: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-app-ink"><Icon className="h-4 w-4 text-app-ink-muted" /> {title}</h2>
      <Link href={href} className="text-xs font-medium text-[var(--color-accent)] hover:underline">{link} →</Link>
    </div>
  );
}

function EmptyRow({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-app-border px-4 py-5 text-sm">
      <span className="flex items-center gap-2 text-app-ink-muted"><CalendarDays className="h-4 w-4" /> {text}</span>
      <Link href={href} className="inline-flex shrink-0 items-center gap-1 font-medium text-[var(--color-accent)]"><Plus className="h-4 w-4" /> {cta}</Link>
    </div>
  );
}
