"use client";

import * as React from "react";
import Link from "next/link";
import { Play, Sparkles, Flame, Clock, ArrowRight, Award } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
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

export function BentoHero({
  studentName = "Valeria",
  currentTerm,
  coursesCount,
  totalCredits,
  overallProgressPercent,
  streakDays = 5,
  continueLesson,
}: BentoHeroProps) {
  const firstName = studentName.split(" ")[0] || "Valeria";

  return (
    <div className="relative overflow-hidden rounded-[14px] border-t border-[#FFE8C4]/50 bg-gradient-to-br from-[#3D141D] to-[#6B2332] text-white shadow-card p-6 md:p-8 select-none">
      {/* Background Architectural Grid Pattern */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="hero-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#FFE8C4" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: Academic Greeting & Term Stats */}
        <div className="space-y-3 max-w-xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 text-white border border-white/15 backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-[#FFE8C4]" />
              <span>{currentTerm ? currentTerm.name : "Semester 1 (AY 2025-2026)"}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FFE8C4]/20 text-[#FFE8C4] border border-[#FFE8C4]/30">
              <Flame className="h-3.5 w-3.5 text-[#FFE8C4]" />
              <span>{streakDays} Day Study Streak</span>
            </span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
            Welcome back, {firstName}.
          </h1>

          <p className="text-sm text-white/80 leading-relaxed font-sans">
            You are enrolled in <span className="font-semibold text-white">{coursesCount} courses</span> totaling{" "}
            <span className="font-semibold text-white">{totalCredits} credits</span> this term. Your curricular progression and mastery are verified in real time.
          </p>
        </div>

        {/* Right: Semester Progress Ring & Continue Learning Quick Card */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
          {/* Progress Ring Card */}
          <div className="flex items-center gap-4 p-4 rounded-[12px] bg-black/25 border border-white/10 backdrop-blur-md shrink-0">
            <div className="relative">
              <ProgressRing
                percentage={overallProgressPercent}
                size={68}
                strokeWidth={6}
                color="#FFE8C4"
                showText={false}
              />
              <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-[#FFE8C4] tabular-nums">
                {Math.round(overallProgressPercent)}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-white/60">
                Term Completion
              </span>
              <span className="font-serif text-base font-bold text-white">
                Semester Progress
              </span>
              <span className="text-[11px] text-[#FFE8C4] font-medium">
                Target: 100% Mastery
              </span>
            </div>
          </div>

          {/* Continue Learning Strip */}
          {continueLesson && continueLesson.lesson && (
            <div className="flex items-center gap-3.5 p-3 rounded-[12px] bg-black/25 border border-white/10 backdrop-blur-md max-w-sm">
              <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-[8px] bg-black/40 border border-white/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={continueLesson.lesson.thumbnailUrl}
                  alt={continueLesson.lesson.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="h-4 w-4 fill-white text-white drop-shadow" />
                </div>
              </div>

              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#E5B85C] truncate">
                  {continueLesson.course?.code || "Course"} • Resume
                </span>
                <span className="text-xs font-medium text-white line-clamp-1">
                  {continueLesson.lesson.title}
                </span>
                <Link
                  href={`/courses/${continueLesson.lesson.courseId}/player/${continueLesson.lesson.id}`}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-white hover:text-[#FFE8C4] transition-colors"
                >
                  <span>Continue watching</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
