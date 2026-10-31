"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, Search, Award, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Topic, Course } from "@/types/schemas";

interface WeakestTopicsProps {
  topics: Topic[];
  courses: Course[];
  onStartQuickCheck?: (topic: Topic) => void;
  className?: string;
}

export function WeakestTopics({
  topics,
  courses,
  onStartQuickCheck,
  className = "",
}: WeakestTopicsProps) {
  const courseMap = React.useMemo(
    () => new Map<string, Course>(courses.map((c) => [c.id, c])),
    [courses]
  );

  // Lowest scoring unfinished topics
  const weakest = React.useMemo(() => {
    return topics
      .filter((t) => !t.isDone)
      .sort((a, b) => a.topicScore - b.topicScore)
      .slice(0, 4)
      .map((t) => ({
        ...t,
        course: courseMap.get(t.courseId),
      }));
  }, [topics, courseMap]);

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
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)]/70">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
            Weakest Topics (Priority Focus)
          </h3>
        </div>
        <span className="text-[11px] text-[var(--color-ink-muted)] font-mono">
          Mastery &lt; 70%
        </span>
      </div>

      <div className="space-y-2.5">
        {weakest.map((item) => {
          const searchQuery = encodeURIComponent(
            `${item.course?.title || "lecture"} ${item.title}`
          );

          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] bg-[var(--color-surface-muted)]/70 border border-[var(--color-border)]/60 text-xs hover:bg-[var(--color-surface-muted)] transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-[10px] font-semibold text-[var(--color-accent)] uppercase">
                    {item.course?.code || "COURSE"}
                  </span>
                  <span>•</span>
                  <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                    Score: {item.topicScore}/100
                  </span>
                </div>
                <p className="font-medium text-[var(--color-ink)] truncate font-serif text-xs">
                  {item.title}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Find Videos on YouTube button */}
                <a
                  href={`https://www.youtube.com/results?search_query=${searchQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)] transition-colors inline-flex items-center gap-1 shadow-xs"
                  title="Search lectures on YouTube"
                >
                  <Search className="h-3 w-3 text-[var(--color-ink-muted)]" />
                  <span className="hidden sm:inline">Find Videos</span>
                </a>

                {/* Quick Check button */}
                <Button
                  size="sm"
                  onClick={() => onStartQuickCheck?.(item)}
                  className="text-xs h-7 gap-1 shadow-xs"
                  title="Take 3-5 question Quick Check"
                >
                  <Award className="h-3 w-3" />
                  <span>Check</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
