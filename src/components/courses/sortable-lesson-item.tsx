"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lesson, LessonProgress } from "@/types/schemas";
import { StatusChip } from "@/components/ui/status-chip";
import { formatSecondsToTime } from "@/lib/utils";
import { GripVertical, Play, ExternalLink, Clock, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableLessonItemProps {
  lesson: Lesson;
  progress?: LessonProgress;
  courseId: string;
  onDelete: (lessonId: string) => void;
  selected?: boolean;
  onToggleSelect?: (lessonId: string) => void;
}

export function SortableLessonItem({
  lesson,
  progress,
  courseId,
  onDelete,
  selected = false,
  onToggleSelect,
}: SortableLessonItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCompleted = progress?.isCompleted || false;
  const watchedSec = progress?.watchedSeconds || 0;
  const durationSec = progress?.totalDurationSeconds || lesson.durationSeconds;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-control border border-app-border bg-app-surface p-2.5 transition-colors select-none",
        isDragging && "opacity-50 ring-2 ring-app-accent z-20",
        selected && "border-app-accent bg-app-accent/5",
        "hover:border-app-ink-muted/40"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Bulk select checkbox */}
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(lesson.id)}
            className="h-3.5 w-3.5 rounded border-app-border text-app-accent focus:ring-app-accent"
          />
        )}

        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-app-ink-muted/60 hover:text-app-ink p-1 rounded transition-colors"
          title="Drag to reorder lesson"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Video Thumbnail */}
        <div className="relative h-11 w-20 shrink-0 rounded bg-black/10 overflow-hidden border border-app-border/40">
          <Image
            src={lesson.thumbnailUrl}
            alt={lesson.title}
            fill
            className="object-cover"
            sizes="80px"
          />
          <Link
            href={`/courses/${courseId}/lessons/${lesson.id}`}
            className="absolute inset-0 bg-black/20 group-hover:bg-black/35 flex items-center justify-center transition-colors"
          >
            <Play className="h-4 w-4 fill-white text-white opacity-80 group-hover:opacity-100" />
          </Link>
        </div>

        {/* Lesson Details */}
        <div className="min-w-0 flex-1">
          <Link
            href={`/courses/${courseId}/lessons/${lesson.id}`}
            className="font-serif text-sm font-semibold text-app-ink group-hover:text-app-accent transition-colors truncate block"
          >
            {lesson.title}
          </Link>

          <div className="flex items-center gap-2 text-xs text-app-ink-muted mt-0.5">
            <span className="truncate max-w-[150px]">
              Channel: {lesson.channelTitle}
            </span>
            <span>•</span>
            <div className="flex items-center gap-1 font-sans font-semibold text-[11px] tabular-nums">
              <Clock className="h-3 w-3 text-app-ink-muted/70" />
              {durationSec ? (
                <span>{formatSecondsToTime(durationSec)}</span>
              ) : (
                <span className="italic text-app-ink-muted/70">
                  {lesson.manualDuration || "Duration pending"}
                </span>
              )}
            </div>
            {lesson.startTimeSeconds ? (
              <>
                <span>•</span>
                <span className="font-sans font-semibold text-[11px] tabular-nums">
                  Starts at {formatSecondsToTime(lesson.startTimeSeconds)}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right Actions & Status */}
      <div className="flex items-center gap-2 shrink-0">
        <StatusChip
          status={
            isCompleted
              ? "graded"
              : watchedSec > 0
              ? "in_progress"
              : "not_started"
          }
          label={
            isCompleted
              ? "Completed"
              : watchedSec > 0
              ? `${Math.round(progress?.percentWatched || 0)}%`
              : "Not started"
          }
        />

        {/* Fallback "Watch on YouTube" */}
        <a
          href={lesson.originalUrl}
          target="_blank"
          rel="noreferrer"
          className="text-app-ink-muted hover:text-app-ink p-1.5 rounded transition-colors"
          title="Watch on YouTube (external)"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <button
          onClick={() => onDelete(lesson.id)}
          className="text-app-ink-muted/60 hover:text-app-danger p-1.5 rounded transition-colors"
          title="Delete lesson"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
