"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Flame, Play } from "lucide-react";

import { FlyingButterflies } from "@/components/brand/flying-butterflies";
import { Lesson, LessonProgress, Course, Term } from "@/types/schemas";

interface BentoHeroProps {
  studentName?: string;
  currentTerm?: Term | null;
  coursesCount: number;
  totalCredits: number;
  overallProgressPercent: number;
  streakDays?: number;
  continueLesson?: {
    lesson: Lesson;
    progress?: LessonProgress;
    course?: Course;
  } | null;
}

function greetingFor(h: number) {
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function BentoHero({
  studentName = "",
  currentTerm,
  coursesCount,
  totalCredits,
  overallProgressPercent,
  streakDays = 0,
  continueLesson,
}: BentoHeroProps) {
  const firstName = studentName ? studentName.split(" ")[0] : "";
  const pct = Math.round(overallProgressPercent);
  const [greeting, setGreeting] = React.useState("Welcome back");
  React.useEffect(() => setGreeting(greetingFor(new Date().getHours())), []);
  const resuming =
    continueLesson?.lesson && continueLesson.progress && continueLesson.progress.watchedSeconds > 0
      ? continueLesson
      : null;

  return (
    <section className="pro-hero relative isolate overflow-hidden rounded-3xl px-7 py-10 md:px-12 md:py-12 select-none">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-28 -z-10 h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,var(--orb-a),transparent)] blur-2xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 left-1/4 -z-10 h-[360px] w-[360px] rounded-full bg-[radial-gradient(closest-side,var(--orb-b),transparent)] blur-2xl" />

      <div className="grid items-center gap-10 md:grid-cols-[1fr_auto]">
        <div className="max-w-xl">
          <p className="text-[13px] font-medium text-[var(--color-ink-muted)]">
            {currentTerm ? currentTerm.name : "Semester 1 (AY 2025-2026)"}
          </p>
          <h1 className="mt-3 font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--color-ink)] md:text-[44px]">
            {greeting}
            {firstName && (
              <>
                ,{" "}
                <span className="pro-name-gradient">{firstName}</span>
              </>
            )}
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[var(--color-ink-muted)]">
            {coursesCount} courses and {totalCredits} credits this term. Pick up right where you left off.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hair)] bg-[var(--wash)] px-3 py-1 text-[12px] font-medium text-[var(--color-ink-muted)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" /> {pct}% term mastery
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--hair)] bg-[var(--wash)] px-3 py-1 text-[12px] font-medium text-[var(--color-ink-muted)]">
              <Flame className="h-3.5 w-3.5 text-[#E879F9]" /> {streakDays}-day streak
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={resuming ? `/courses/${resuming.lesson.courseId}/player/${resuming.lesson.id}` : "/courses"}
              className="pro-btn-solid inline-flex h-11 items-center gap-2 rounded-full px-5 text-[14px] font-semibold transition"
            >
              {resuming ? (
                <>
                  <Play className="h-4 w-4 fill-current" /> Resume {resuming.course?.code ?? "lecture"}
                </>
              ) : (
                <>
                  Add your first lecture <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Link>
            <Link
              href="/notes"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--hair)] px-5 text-[14px] font-medium text-[var(--color-ink)] transition hover:border-[var(--hair-strong)] hover:bg-[var(--wash)]"
            >
              Open Notes Vault <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto hidden h-[290px] w-[290px] items-center justify-center md:flex">
          <div aria-hidden className="absolute inset-10 rounded-full blur-2xl" style={{ background: "radial-gradient(closest-side, rgb(var(--accent-rgb) / 0.3), transparent)" }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/butterfly-real-512.png"
            alt=""
            aria-hidden
            draggable={false}
            className="pro-butterfly relative mx-auto h-[250px] w-[250px] select-none drop-shadow-[0_16px_24px_rgba(20,17,31,0.22)]"
          />
        </div>
      </div>
      <FlyingButterflies />
    </section>
  );
}
