"use client";

import * as React from "react";
import Link from "next/link";
import { Course, LessonProgress, Assessment, Module, Topic } from "@/types/schemas";
import { AlgorithmicCover } from "@/components/dashboard/algorithmic-cover";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ArrowRight, BookOpen } from "lucide-react";
import { cleanSyllabusTitle } from "@/lib/utils";

interface CourseCardProps {
  course: Course;
  progressList?: LessonProgress[];
  assessments?: Assessment[];
  modules?: Module[];
  topics?: Topic[];
}

export function CourseCard({
  course,
  progressList = [],
  assessments = [],
  modules = [],
  topics = [],
}: CourseCardProps) {
  // Compute course mastery / progress percentage
  const courseTopics = topics.filter((t) => t.courseId === course.id);
  const doneTopics = courseTopics.filter((t) => t.isDone);
  const percentComplete =
    courseTopics.length > 0
      ? Math.round((doneTopics.length / courseTopics.length) * 100)
      : progressList.length > 0
      ? Math.round(
          (progressList.filter((p) => p.isCompleted).length / progressList.length) * 100
        )
      : 0;

  // Next unit calculation
  const courseModules = modules
    .filter((m) => m.courseId === course.id)
    .sort((a, b) => a.order - b.order);
  const nextUnit = courseModules[0];
  const nextUnitTitle = nextUnit
    ? `Unit ${nextUnit.unitNumber || 1}: ${cleanSyllabusTitle(nextUnit.title)}`
    : "Unit 1: Foundations & Core Concepts";

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden academic-card academic-card-hover select-none">
      {/* Top Algorithmic Cover Art (96px height) */}
      <Link href={`/courses/${course.id}`} className="block focus:outline-none">
        <AlgorithmicCover
          courseCode={course.code}
          courseTitle={cleanSyllabusTitle(course.title)}
          department={course.department}
          colorTag={course.colorTag}
          height={96}
        />
      </Link>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-5 justify-between">
        <div>
          {/* Header row: Course Code & Credits Chip (No monospace font) */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              {course.code}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-xs font-sans font-semibold text-[var(--color-ink)] tabular-nums">
              {course.credits} Credits
            </span>
          </div>

          {/* Course Title (Fraunces, max 2 lines) */}
          <h3 className="font-heading text-lg font-bold leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
            <Link href={`/courses/${course.id}`} className="focus:outline-none">
              {cleanSyllabusTitle(course.title)}
            </Link>
          </h3>

          {/* Description snippet */}
          {course.description && (
            <p className="mt-1.5 text-xs text-[var(--color-ink-muted)] line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          )}
        </div>

        {/* Progress Section & Next Unit Pointer */}
        <div className="mt-4 pt-3 border-t border-[var(--color-border)]/70 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-xs font-medium text-[var(--color-ink-muted)]">
              Curricular Mastery
            </span>
            <span className="font-sans text-xs font-semibold text-[var(--color-ink)] tabular-nums">
              {percentComplete}%
            </span>
          </div>

          <ProgressBar
            value={percentComplete}
            max={100}
            className="h-1.5"
          />

          {/* Next Unit Due Badge */}
          <div className="flex items-center justify-between text-xs text-[var(--color-ink-muted)] pt-1">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <BookOpen className="h-3 w-3 text-[var(--color-accent)] shrink-0" />
              <span className="font-medium text-[var(--color-ink)] truncate text-xs">
                Next: {nextUnitTitle}
              </span>
            </div>
            <Link
              href={`/courses/${course.id}`}
              className="inline-flex items-center gap-0.5 font-semibold text-[var(--color-accent)] hover:underline shrink-0 text-xs"
            >
              <span>View</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
