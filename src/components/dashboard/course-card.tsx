"use client";

import * as React from "react";
import Link from "next/link";
import { Course, LessonProgress, Assessment, Module, Topic, CourseAttendance, ExamDate } from "@/types/schemas";
import { AlgorithmicCover } from "@/components/dashboard/algorithmic-cover";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ArrowRight, BookOpen, AlertTriangle, Calendar } from "lucide-react";
import { cleanSyllabusTitle } from "@/lib/utils";
import { calculateAttendanceStats } from "@/lib/attendance/attendance-engine";

interface CourseCardProps {
  course: Course;
  progressList?: LessonProgress[];
  assessments?: Assessment[];
  modules?: Module[];
  topics?: Topic[];
  attendance?: CourseAttendance;
  examDate?: ExamDate;
}

export function CourseCard({
  course,
  progressList = [],
  assessments = [],
  modules = [],
  topics = [],
  attendance,
  examDate,
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

  const attStats = attendance && attendance.classesHeld > 0
    ? calculateAttendanceStats(attendance.classesHeld, attendance.classesAttended, attendance.minimumPercentage)
    : null;

  const daysUntilExam = examDate?.date
    ? Math.ceil(
        (new Date(examDate.date + "T00:00:00").getTime() -
          new Date(new Date().toDateString()).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

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
          {/* Header row: Course Code & Credits Chip & Attendance Badge (No monospace font) */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              {course.code}
            </span>
            <div className="flex items-center gap-1.5">
              {daysUntilExam !== null && daysUntilExam >= 0 && (
                <span
                  title={`${examDate?.examTitle || "Exam"} in ${daysUntilExam} days (${examDate?.date})`}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#A51C30]/10 border border-[#A51C30]/30 text-[11px] font-sans font-semibold text-[#A51C30]"
                >
                  <Calendar className="h-2.5 w-2.5" />
                  <span>{daysUntilExam === 0 ? "Exam Today" : `Exam: ${daysUntilExam}d`}</span>
                </span>
              )}
              {attStats && (
                attStats.isBelowLimit ? (
                  <span
                    title={`Attendance is ${attStats.currentPercentage}% - below required ${attStats.minimumPercentage}%`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#C62F3C]/10 border border-[#C62F3C]/30 text-[11px] font-sans font-semibold text-[#C62F3C]"
                  >
                    <AlertTriangle className="h-2.5 w-2.5" />
                    <span>{attStats.currentPercentage}% Att.</span>
                  </span>
                ) : (
                  <span
                    title={`Attendance is ${attStats.currentPercentage}% (${attStats.statusSentence})`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#5E7B5B]/10 border border-[#5E7B5B]/30 text-[11px] font-sans font-semibold text-[#3E5C3C] dark:text-[#78A875]"
                  >
                    <span>{attStats.currentPercentage}% Att.</span>
                  </span>
                )
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-xs font-sans font-semibold text-[var(--color-ink)] tabular-nums">
                {course.credits} Credits
              </span>
            </div>
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
