"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardList, NotebookPen, Plus, Sprout, Target, Timer } from "lucide-react";
import { useDataStore } from "@/lib/repository";
import { Bar, ExamCard } from "@/components/notes/exam-panel";
import { useVault } from "@/lib/notes/use-vault";
import { daysLeft, progressOf, sumProgress, useExams, useNoteTopics } from "@/lib/notes/study";
import { getSubject, subjectColor, subjectsFor } from "@/lib/notes/curriculum";
import { courseBannerSvg } from "@/components/brand/course-banner-art";
import { CourseBadge } from "@/components/rewards/rank-up";
import { bucketOf, partsProgress, useAssignments } from "@/lib/assignments/store";
import { useFocusDay, useFocusSettings } from "@/lib/focus/store";
import { usePantry } from "@/lib/rewards/pantry";
import { foodById } from "@/lib/rewards/catalog";
import { cn } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/** Home: what's coming up and where to go next. Nothing else. */
export default function HomePage() {
  const { notes, ready } = useVault();
  const { currentUser, firebaseUser } = useDataStore();
  const firstName = (currentUser?.displayName || firebaseUser?.displayName || "Huriya").split(" ")[0];
  const [hello, setHello] = React.useState("Welcome back");
  React.useEffect(() => setHello(greeting()), []);
  const { exams } = useExams();
  const { topics } = useNoteTopics();
  const { assignments } = useAssignments();
  const focus = useFocusDay();
  const [settings] = useFocusSettings();
  const pantry = usePantry();
  const foodsToday = pantry.today.filter((i) => i.foodId);
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
      <section className="pro-hero relative isolate overflow-hidden rounded-3xl px-7 py-9 md:px-12 md:py-11">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 -z-10 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,var(--orb-a),transparent)] blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/4 -z-10 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,var(--orb-b),transparent)] blur-2xl" />
        <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div className="max-w-xl">
            <p className="text-[13px] font-medium text-[var(--color-ink-muted)]">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="mt-3 font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--color-ink)] md:text-[44px]">
              {hello}, <span className="pro-name-gradient">{firstName}</span>
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--color-ink-muted)]">
              {upcoming[0]
                ? `${upcoming[0].name} is ${daysLeft(upcoming[0].date) === 0 ? "today" : daysLeft(upcoming[0].date) === null ? "coming up" : `in ${daysLeft(upcoming[0].date)} day${daysLeft(upcoming[0].date) === 1 ? "" : "s"}`}.`
                : "No exams coming up."}{" "}
              {due.length ? `${due.length} assignment${due.length === 1 ? "" : "s"} due soon.` : "Nothing due this week."}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/focus" className="pro-btn-solid inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-semibold transition">
                <Timer className="h-4 w-4" /> Start focusing
              </Link>
              <Link href={upcoming[0] ? `/prep/${encodeURIComponent(upcoming[0].id)}` : "/notes"} className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--hair)] px-5 text-[14px] font-medium text-[var(--color-ink)] transition hover:border-[var(--hair-strong)] hover:bg-[var(--wash)]">
                {upcoming[0] ? `Open ${upcoming[0].name}` : "Open courses"} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="relative mx-auto hidden h-[260px] w-[260px] items-center justify-center md:flex">
            <div aria-hidden className="absolute inset-10 rounded-full blur-2xl" style={{ background: "radial-gradient(closest-side, rgb(var(--accent-rgb) / 0.3), transparent)" }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/butterfly-real-512.png" alt="" aria-hidden draggable={false} className="pro-butterfly relative mx-auto h-[230px] w-[230px] select-none drop-shadow-[0_16px_24px_rgba(20,17,31,0.22)]" />
          </div>
        </div>
      </section>

      {/* Today at a glance */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/focus" className="vc-tile group space-y-2 p-4 hover:border-app-accent">
          <p className="flex items-center gap-1.5 text-xs font-medium text-app-ink-muted"><Timer className="h-3.5 w-3.5" /> Focus today</p>
          <p className="font-display text-2xl text-app-ink tabular-nums">{minutes} <span className="text-sm text-app-ink-muted">/ {settings.goalMin} min</span></p>
          <Bar pct={goalPct} />
        </Link>
        <Link href="/focus" className="vc-tile group space-y-2 p-4 hover:border-app-accent">
          <p className="flex items-center gap-1.5 text-xs font-medium text-app-ink-muted"><Sprout className="h-3.5 w-3.5" /> Today&apos;s pantry</p>
          <div className="flex min-h-[36px] items-center gap-0.5">
            {foodsToday.length ? foodsToday.slice(0, 7).map((it) => {
              const f = foodById(it.foodId);
              // eslint-disable-next-line @next/next/no-img-element
              return f ? <img key={it.id} src={f.src} alt={f.name} title={f.name} className="h-9 w-9 object-contain" /> : null;
            }) : <span className="text-sm text-app-ink-muted">No food yet today</span>}
            {foodsToday.length > 7 && <span className="ml-1 text-xs text-app-ink-muted">+{foodsToday.length - 7}</span>}
          </div>
          <p className="text-xs text-app-ink-muted">{pantry.waiting.length ? `${pantry.waiting.length} egg${pantry.waiting.length === 1 ? "" : "s"} waiting to hatch` : `${pantry.foodCount} dishes collected so far`}</p>
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
              <Link key={id} href={`/notes/${encodeURIComponent(id)}`} className="vc-tile group overflow-hidden hover:border-app-accent">
                {getSubject(id) && (
                  <div className="relative h-16 w-full">
                    <div aria-hidden className="absolute inset-0" dangerouslySetInnerHTML={{ __html: courseBannerSvg({ code: getSubject(id)!.code, title: getSubject(id)!.title, hue: subjectColor(getSubject(id)!), uid: `h${id}` }) }} />
                    <span className="absolute bottom-1.5 right-2"><CourseBadge courseId={id} size={28} /></span>
                  </div>
                )}
                <div className="space-y-3 p-4">
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
