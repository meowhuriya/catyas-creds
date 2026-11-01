import * as React from "react";
import Link from "next/link";
import { Assessment, Course, Attempt, Submission } from "@/types/schemas";
import { StatusChip, StatusChipType } from "@/components/ui/status-chip";
import { Calendar, ChevronRight } from "lucide-react";
import { TOKENS, CourseTagKey } from "@/styles/tokens";

interface TodoListProps {
  assessments: Assessment[];
  courses: Course[];
  attempts: Attempt[];
  submissions: Submission[];
}

export function TodoList({
  assessments,
  courses,
  attempts,
  submissions,
}: TodoListProps) {
  // Determine status of each assessment
  const itemsWithStatus = assessments
    .filter((a) => a.dueDate)
    .map((asm) => {
      const course = courses.find((c) => c.id === asm.courseId);
      const isQuiz = asm.type === "quiz" || asm.type === "midterm" || asm.type === "final";
      const hasAttempt = attempts.some((att) => att.assessmentId === asm.id);
      const hasSub = submissions.some((sub) => sub.assessmentId === asm.id);

      let status: StatusChipType = "not_started";
      if (hasAttempt || hasSub) {
        status = "graded";
      } else if (asm.dueDate && new Date(asm.dueDate) < new Date()) {
        status = "overdue";
      }

      return {
        ...asm,
        course,
        status,
      };
    })
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1));

  const pendingItems = itemsWithStatus.filter((i) => i.status !== "graded");
  const completedItems = itemsWithStatus.filter((i) => i.status === "graded");

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active To-Do List */}
      <div className="rounded-card border border-app-border bg-app-surface p-5">
        <div className="flex items-center justify-between pb-3 border-b border-app-border">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-bold text-app-ink">
              To-Do & Upcoming Deadlines
            </h3>
            <span className="rounded-full bg-app-surface-muted px-2 py-0.5 font-sans font-semibold text-xs font-semibold text-app-ink tabular-nums">
              {pendingItems.length}
            </span>
          </div>
          <Link
            href="/planner"
            className="text-xs font-semibold text-app-accent hover:underline inline-flex items-center gap-1"
          >
            <span>View Planner</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {pendingItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-app-ink-muted">
            All coursework and deadlines are up to date.
          </div>
        ) : (
          <div className="divide-y divide-app-border/70 mt-1">
            {pendingItems.slice(0, 5).map((item) => {
              const tagColor = item.course
                ? TOKENS.colors.courseTags[item.course.colorTag as CourseTagKey]?.hex
                : TOKENS.colors.courseTags.slate.hex;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 hover:bg-app-surface-muted/30 px-1 rounded-control transition-colors"
                >
                  <div className="flex flex-col gap-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: tagColor }}
                      />
                      <span className="font-sans font-semibold text-xs font-bold text-app-ink uppercase">
                        {item.course?.code}
                      </span>
                      <span className="text-xs font-medium text-app-ink truncate">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-app-ink-muted">
                      <Calendar className="h-3 w-3 text-app-ink-muted/70" />
                      <span className="font-sans font-semibold tabular-nums">
                        Due: {item.dueDate}
                      </span>
                      <span>•</span>
                      <span>{item.type.toUpperCase()}</span>
                      <span>•</span>
                      <span className="font-sans font-semibold tabular-nums">
                        {item.maxPoints} pts
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <StatusChip status={item.status} />
                    <Link
                      href={`/courses/${item.courseId}`}
                      className="rounded-control border border-app-border bg-app-surface px-2.5 py-1 text-xs font-semibold text-app-ink hover:bg-app-surface-muted transition-colors"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed & Graded Work */}
      <div className="rounded-card border border-app-border bg-app-surface p-5">
        <div className="flex items-center justify-between pb-3 border-b border-app-border">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-bold text-app-ink">
              Recent Submissions & Graded Work
            </h3>
            <span className="rounded-full bg-app-surface-muted px-2 py-0.5 font-sans font-semibold text-xs font-semibold text-app-ink tabular-nums">
              {completedItems.length}
            </span>
          </div>
          <Link
            href="/grades"
            className="text-xs font-semibold text-app-accent hover:underline inline-flex items-center gap-1"
          >
            <span>View Gradebook</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {completedItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-app-ink-muted">
            No graded submissions completed yet.
          </div>
        ) : (
          <div className="divide-y divide-app-border/70 mt-1">
            {completedItems.slice(0, 5).map((item) => {
              const tagColor = item.course
                ? TOKENS.colors.courseTags[item.course.colorTag as CourseTagKey]?.hex
                : TOKENS.colors.courseTags.slate.hex;

              const attempt = attempts.find((a) => a.assessmentId === item.id);
              const submission = submissions.find((s) => s.assessmentId === item.id);
              const score = attempt ? attempt.score : submission ? submission.finalScore : 0;
              const max = item.maxPoints;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 hover:bg-app-surface-muted/30 px-1 rounded-control transition-colors"
                >
                  <div className="flex flex-col gap-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: tagColor }}
                      />
                      <span className="font-sans font-semibold text-xs font-bold text-app-ink uppercase">
                        {item.course?.code}
                      </span>
                      <span className="text-xs font-medium text-app-ink truncate">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-app-ink-muted">
                      <span>Recorded Grade:</span>
                      <span className="font-sans font-semibold font-semibold text-app-success tabular-nums">
                        {score}/{max} ({Math.round((score / max) * 100)}%)
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <StatusChip status="graded" />
                    <Link
                      href={`/courses/${item.courseId}`}
                      className="rounded-control border border-app-border bg-app-surface px-2.5 py-1 text-xs font-semibold text-app-ink hover:bg-app-surface-muted transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
