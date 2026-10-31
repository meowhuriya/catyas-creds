"use client";

import * as React from "react";
import Link from "next/link";
import {
  Clock,
  Calendar,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Play,
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

  // 1. Today tasks
  const todayTasks = React.useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      courseCode: string;
      type: "lecture" | "quiz" | "revision";
      href: string;
    }> = [];

    // Prioritize first active lesson
    if (lessons.length > 0) {
      const l = lessons[0];
      const c = courseMap.get(l.courseId);
      list.push({
        id: "task-lec",
        title: l.title,
        courseCode: c?.code || "CS105ES",
        type: "lecture",
        href: `/courses/${l.courseId}/player/${l.id}`,
      });
    }

    // Next pending assessment
    const pendingAsm = assessments.find((a) => a.dueDate);
    if (pendingAsm) {
      const c = courseMap.get(pendingAsm.courseId);
      list.push({
        id: "task-asm",
        title: pendingAsm.title,
        courseCode: c?.code || "MA101BS",
        type: "quiz",
        href: `/courses/${pendingAsm.courseId}`,
      });
    }

    return list;
  }, [lessons, assessments, courseMap]);

  // 2. Upcoming Deadlines
  const upcomingDeadlines = React.useMemo(() => {
    return assessments
      .filter((a) => a.dueDate)
      .slice(0, 3)
      .map((a) => ({
        ...a,
        course: courseMap.get(a.courseId),
      }));
  }, [assessments, courseMap]);

  // 3. Revision Due (Topics completed 1, 3, 7, 21 days ago)
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
            <Clock className="h-4 w-4 text-[var(--color-accent)]" />
            <h3 className="font-serif text-sm font-bold text-[var(--color-ink)]">
              Today’s Priority
            </h3>
          </div>
          <Link
            href="/today"
            className="text-[11px] font-semibold text-[var(--color-accent)] hover:underline inline-flex items-center gap-0.5"
          >
            <span>Open Today</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2">
          {todayTasks.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-muted)]">
              All tasks for today are completed.
            </p>
          ) : (
            todayTasks.map((task) => (
              <Link
                key={task.id}
                href={task.href}
                className="group flex items-center justify-between p-2.5 rounded-[8px] bg-[var(--color-surface-muted)]/70 hover:bg-[var(--color-surface-muted)] transition-colors text-xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-mono text-[10px] font-semibold text-[var(--color-accent)] uppercase block">
                    {task.courseCode}
                  </span>
                  <span className="font-medium text-[var(--color-ink)] truncate block group-hover:text-[var(--color-accent)] transition-colors">
                    {task.title}
                  </span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[var(--color-ink-muted)] group-hover:text-[var(--color-accent)] shrink-0 transition-colors" />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* 2. Upcoming Deadlines Card */}
      <div className="academic-card p-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--color-border)]/70 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#B7791F]" />
            <h3 className="font-serif text-sm font-bold text-[var(--color-ink)]">
              Upcoming Deadlines
            </h3>
          </div>
          <Link
            href="/planner"
            className="text-[11px] font-semibold text-[var(--color-accent)] hover:underline inline-flex items-center gap-0.5"
          >
            <span>Planner</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {upcomingDeadlines.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-muted)]">
              No upcoming assessments scheduled.
            </p>
          ) : (
            upcomingDeadlines.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-mono text-[10px] font-semibold text-[var(--color-ink-muted)] uppercase block">
                    {item.course?.code || "COURSE"}
                  </span>
                  <p className="font-medium text-[var(--color-ink)] truncate">
                    {item.title}
                  </p>
                </div>
                <span className="font-mono text-[11px] font-semibold text-[#B7791F] tabular-nums shrink-0">
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
            <RotateCcw className="h-4 w-4 text-[var(--color-info)]" />
            <h3 className="font-serif text-sm font-bold text-[var(--color-ink)]">
              Revision Due
            </h3>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
            Spaced Retain
          </span>
        </div>

        <div className="space-y-2">
          {revisionItems.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-muted)]">
              No topics due for spaced revision today.
            </p>
          ) : (
            revisionItems.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-[6px] bg-[var(--color-surface-muted)]/50 border border-[var(--color-border)]/50 text-xs flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <span className="font-mono text-[10px] text-[var(--color-ink-muted)] uppercase block">
                    {item.course?.code}
                  </span>
                  <p className="font-medium text-[var(--color-ink)] truncate">
                    {item.title}
                  </p>
                </div>
                <Link
                  href={`/courses/${item.courseId}?topic=${item.id}&review=true`}
                  className="text-[11px] font-semibold text-[var(--color-accent)] hover:underline shrink-0"
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
