"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Topic, Course } from "@/types/schemas";

interface WeakestTopicsProps {
  topics: Topic[];
  courses: Course[];
  className?: string;
}

export function WeakestTopics({ topics, courses, className = "" }: WeakestTopicsProps) {
  // Find topics that have some activity but score < 70, or lowest scoring topics
  const weakest = React.useMemo(() => {
    const courseMap = new Map<string, Course>(courses.map((c) => [c.id, c]));

    const scoredTopics = topics
      .filter((t) => !t.isDone)
      .sort((a, b) => a.topicScore - b.topicScore)
      .slice(0, 4);

    return scoredTopics.map((t) => ({
      ...t,
      course: courseMap.get(t.courseId),
    }));
  }, [topics, courses]);

  if (weakest.length === 0) {
    return (
      <div className={`academic-card p-5 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />
          <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
            Mastery Diagnostics
          </h3>
        </div>
        <p className="text-xs text-[var(--color-ink-muted)]">
          All active curricular topics are currently on track. No critical retention gaps detected.
        </p>
      </div>
    );
  }

  return (
    <div className={`academic-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[#B7791F]" />
          <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
            Topics Needing Review
          </h3>
        </div>
        <span className="text-[11px] text-[var(--color-ink-muted)] font-medium">
          Mastery &lt; 70%
        </span>
      </div>

      <div className="space-y-2.5">
        {weakest.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2.5 rounded-[8px] bg-[var(--color-surface-muted)]/70 border border-[var(--color-border)]/60 text-xs"
          >
            <div className="min-w-0 pr-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-mono text-[10px] font-semibold text-[var(--color-accent)] uppercase">
                  {item.course?.code || "COURSE"}
                </span>
                <span>•</span>
                <span className="text-[10px] text-[var(--color-ink-muted)]">
                  Score: {item.topicScore}/100
                </span>
              </div>
              <p className="font-medium text-[var(--color-ink)] truncate">
                {item.title}
              </p>
            </div>

            <Link
              href={`/courses/${item.courseId}?topic=${item.id}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[var(--color-surface)] border border-[var(--color-border)] font-semibold text-[11px] text-[var(--color-accent)] hover:bg-[var(--color-surface-muted)] transition-colors shrink-0"
            >
              <span>Practice</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
