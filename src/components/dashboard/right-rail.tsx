"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  Calendar,
  RotateCcw,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Assessment, Course, Topic, Lesson } from "@/types/schemas";

interface RightRailProps {
  assessments: Assessment[];
  courses: Course[];
  topics: Topic[];
  lessons: Lesson[];
  className?: string;
}

export function RightRail({
  assessments,
  courses,
  topics,
  lessons,
  className = "",
}: RightRailProps) {
  const courseMap = React.useMemo(
    () => new Map<string, Course>(courses.map((c) => [c.id, c])),
    [courses]
  );

  // 1. Today tasks - real only
  const todayTasks = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      courseCode: string;
      type: "lecture" | "quiz" | "revision";
      href: string;
    }> = [];

    // Prioritize first active lesson if lessons exist
    if (lessons.length > 0) {
      const activeLesson = lessons[0];
      const c = courseMap.get(activeLesson.courseId);
      list.push({
        id: "task-lec",
        title: activeLesson.title,
        courseCode: c?.code || "COURSE",
        type: "lecture",
        href: `/courses/${activeLesson.courseId}/player/${activeLesson.id}`,
      });
    }

    // Pending assessments with valid future dueDate
    const pendingAsm = assessments.find((a) => a.dueDate);
    if (pendingAsm) {
      const c = courseMap.get(pendingAsm.courseId);
      list.push({
        id: "task-asm",
        title: pendingAsm.title,
        courseCode: c?.code || "ASSESSMENT",
        type: "quiz",
        href: `/courses/${pendingAsm.courseId}`,
      });
    }

    return list;
  }, [lessons, assessments, courseMap]);

  // 2. Upcoming Deadlines (real due dates only)
  const upcomingDeadlines = React.useMemo(() => {
    return assessments
      .filter((a) => a.dueDate)
      .slice(0, 3)
      .map((a) => ({
        ...a,
        course: courseMap.get(a.courseId),
      }));
  }, [assessments, courseMap]);

  // 3. Revision Due (real completed topics only)
  const revisionItems = React.useMemo(() => {
    return topics
      .filter((t) => t.isDone)
      .slice(0, 3)
      .map((t) => ({
        ...t,
        course: courseMap.get(t.courseId),
      }));
  }, [topics, courseMap]);

  return (
    <div className={`space-y-5 ${className}`}>
      {/* 1. Today Card */}
      <div className="academic-card p-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-border)]/70 mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--color-crimson)]" />
            <h3 className="font-serif text-sm font-bold text-[var(--color-ink)]">
              Today’s Priority
            </h3>
          </div>
          <Link
            href="/today"
            className="text-xs font-semibold text-[var(--color-crimson)] hover:underline inline-flex items-center gap-0.5"
          >
            <span>Open Today</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {todayTasks.length === 0 ? (
            <p className="text-sm text-[var(--color-secondary)] py-1">
              No active tasks today. Pick a course to start learning.
            </p>
          ) : (
            todayTasks.map((task) => (
              <Link
                key={task.id}
                href={task.href}
                className="group flex items-center justify-between p-2.5 rounded-[8px] bg-[var(--color-surface-muted)]/70 hover:bg-[var(--color-surface-muted)] transition-colors text-sm"
              >
                <div className="min-w-0 pr-2">
                  <span className="eyebrow-label block">
                    {task.courseCode}
                  </span>
                  <span className="font-medium text-[var(--color-ink)] truncate block group-hover:text-[var(--color-crimson)] transition-colors">
                    {task.title}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-[var(--color-secondary)] group-hover:text-[var(--color-crimson)] shrink-0 transition-colors" />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* 2. Upcoming Deadlines Card */}
      <div className="academic-card p-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-border)]/70 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#C62F3C]" />
            <h3 className="font-serif text-sm font-bold text-[var(--color-ink)]">
              Upcoming Deadlines
            </h3>
          </div>
          <Link
            href="/planner"
            className="text-xs font-semibold text-[var(--color-crimson)] hover:underline inline-flex items-center gap-0.5"
          >
            <span>Planner</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-[var(--color-secondary)] py-1">
              No upcoming deadlines scheduled.
            </p>
          ) : (
            upcomingDeadlines.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <div className="min-w-0 pr-2">
                  <span className="eyebrow-label block">
                    {item.course?.code || "COURSE"}
                  </span>
                  <p className="font-medium text-[var(--color-ink)] truncate">
                    {item.title}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#C62F3C] tabular-nums shrink-0">
                  {item.dueDate}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Spaced Revision Due */}
      <div className="academic-card p-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-border)]/70 mb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-[var(--color-teal)]" />
            <h3 className="font-serif text-sm font-bold text-[var(--color-ink)]">
              Revision Due
            </h3>
          </div>
          <span className="eyebrow-label">
            Spaced Retain
          </span>
        </div>

        <div className="space-y-2">
          {revisionItems.length === 0 ? (
            <p className="text-sm text-[var(--color-secondary)] py-1">
              No topics due for revision yet.
            </p>
          ) : (
            revisionItems.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-[6px] bg-[var(--color-surface-muted)]/50 border border-[var(--color-border)]/50 text-sm flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <span className="eyebrow-label block">
                    {item.course?.code}
                  </span>
                  <p className="font-medium text-[var(--color-ink)] truncate">
                    {item.title}
                  </p>
                </div>
                <Link
                  href={`/courses/${item.courseId}?topic=${item.id}&review=true`}
                  className="text-xs font-semibold text-[var(--color-crimson)] hover:underline shrink-0"
                >
                  Review
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
