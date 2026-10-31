import * as React from "react";
import Link from "next/link";
import { Course, LessonProgress, Assessment } from "@/types/schemas";
import { ProgressRing } from "@/components/ui/progress-ring";
import { TOKENS, CourseTagKey } from "@/styles/tokens";
import { ArrowRight, Calendar, BookOpen } from "lucide-react";

interface CourseCardProps {
  course: Course;
  progressList: LessonProgress[];
  assessments: Assessment[];
}

export function CourseCard({ course, progressList, assessments }: CourseCardProps) {
  const tagColor =
    TOKENS.colors.courseTags[course.colorTag as CourseTagKey]?.hex ||
    TOKENS.colors.courseTags.slate.hex;

  // Compute lesson completion percentage
  const totalLessons = progressList.length;
  const completedLessons = progressList.filter((p) => p.isCompleted).length;
  const percentComplete =
    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  // Find next due assessment
  const upcomingAssessments = assessments
    .filter((a) => a.dueDate)
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1));
  const nextDue = upcomingAssessments[0];

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-card border border-app-border bg-app-surface transition-all duration-150 hover:border-app-ink-muted/40 shadow-sm">
      {/* 4px Thin Course Color Tag Bar at top (strictly 4px, not a big block) */}
      <div
        className="h-1 w-full shrink-0"
        style={{ backgroundColor: tagColor }}
      />

      <div className="flex flex-col p-5">
        {/* Department & Level Pill */}
        <div className="flex items-center justify-between gap-2 text-xs text-app-ink-muted">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: tagColor }}
            />
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {course.department}
            </span>
            <span>•</span>
            <span className="font-mono text-[11px]">Level {course.level}</span>
          </div>
          <span className="font-mono text-xs font-semibold tabular-nums text-app-ink">
            {course.credits} Credits
          </span>
        </div>

        {/* Course Code & Title */}
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="flex-1">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-app-accent">
              {course.code}
            </span>
            <h3 className="font-serif text-lg font-bold leading-snug text-app-ink group-hover:text-app-accent transition-colors">
              <Link href={`/courses/${course.id}`} className="focus:outline-none">
                {course.title}
              </Link>
            </h3>
          </div>

          <ProgressRing
            percentage={percentComplete}
            size={48}
            strokeWidth={4}
            color={tagColor}
          />
        </div>

        {/* Description snippet */}
        <p className="mt-2 text-xs text-app-ink-muted line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        {/* Next Due Item */}
        <div className="mt-4 rounded-control border border-app-border/80 bg-app-surface-muted/50 p-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold uppercase tracking-wider text-app-ink-muted">
              Next Due
            </span>
            {nextDue?.dueDate && (
              <span className="font-mono text-[11px] text-app-ink tabular-nums">
                {nextDue.dueDate}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-app-ink font-medium truncate">
            <Calendar className="h-3 w-3 text-app-accent shrink-0" />
            <span className="truncate">
              {nextDue ? nextDue.title : "No upcoming assignments due"}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer Link */}
      <div className="border-t border-app-border bg-app-surface-muted/30 px-5 py-2.5 flex items-center justify-between text-xs">
        <span className="text-app-ink-muted tabular-nums">
          {completedLessons}/{totalLessons} lessons completed
        </span>
        <Link
          href={`/courses/${course.id}`}
          className="inline-flex items-center gap-1 font-semibold text-app-accent hover:text-app-accent-hover transition-colors"
        >
          <span>Open Classwork</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
