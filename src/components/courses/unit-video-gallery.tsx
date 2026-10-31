"use client";

import * as React from "react";
import Link from "next/link";
import {
  Play,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  Tag,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lesson, LessonProgress, Course, Module, Topic } from "@/types/schemas";
import { formatSecondsToTime } from "@/lib/utils";
import { YouTubeThumbnail } from "@/components/courses/youtube-thumbnail";
import { LinkTopicsModal } from "@/components/courses/link-topics-modal";
import { useDataStore } from "@/lib/repository";

interface UnitVideoGalleryProps {
  course: Course;
  unit: Module;
  videos: Lesson[];
  progressList: LessonProgress[];
  topics: Topic[];
  onOpenAddVideos: () => void;
  className?: string;
}

type FilterStatus = "all" | "not_started" | "in_progress" | "completed";

export function UnitVideoGallery({
  course,
  unit,
  videos,
  progressList,
  topics,
  onOpenAddVideos,
  className = "",
}: UnitVideoGalleryProps) {
  const { dataStore, refreshData } = useDataStore();

  const [activeFilter, setActiveFilter] = React.useState<FilterStatus>("all");
  const [editingLessonForTopics, setEditingLessonForTopics] = React.useState<Lesson | null>(null);

  // Filter lessons belonging to this unit
  const unitVideos = React.useMemo(() => {
    return videos
      .filter((v) => v.unitId === unit.id || v.moduleId === unit.id)
      .sort((a, b) => a.order - b.order);
  }, [videos, unit.id]);

  // Unit topics
  const unitTopics = React.useMemo(() => {
    return topics.filter((t) => t.unitId === unit.id);
  }, [topics, unit.id]);

  // Apply status filter
  const filteredVideos = React.useMemo(() => {
    return unitVideos.filter((video) => {
      const prog = progressList.find((p) => p.lessonId === video.id || p.videoId === video.id);
      const percent = prog ? Math.round(prog.percentWatched) : 0;
      const isCompleted = prog?.isCompleted || percent >= 90;

      if (activeFilter === "not_started") return percent === 0;
      if (activeFilter === "in_progress") return percent > 0 && !isCompleted;
      if (activeFilter === "completed") return isCompleted;
      return true;
    });
  }, [unitVideos, progressList, activeFilter]);

  // Counts for filter pills
  const counts = React.useMemo(() => {
    let notStarted = 0;
    let inProgress = 0;
    let completed = 0;

    for (const v of unitVideos) {
      const prog = progressList.find((p) => p.lessonId === v.id || p.videoId === v.id);
      const percent = prog ? Math.round(prog.percentWatched) : 0;
      const isDone = prog?.isCompleted || percent >= 90;

      if (isDone) completed++;
      else if (percent > 0) inProgress++;
      else notStarted++;
    }

    return { all: unitVideos.length, notStarted, inProgress, completed };
  }, [unitVideos, progressList]);

  // Reorder up / down
  const handleMoveOrder = async (lessonId: string, direction: "up" | "down") => {
    const idx = unitVideos.findIndex((v) => v.id === lessonId);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === unitVideos.length - 1) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const current = unitVideos[idx];
    const target = unitVideos[swapIdx];

    const updates = [
      { id: current.id, order: target.order, moduleId: unit.id },
      { id: target.id, order: current.order, moduleId: unit.id },
    ];

    await dataStore.updateLessonOrder(updates);
    await refreshData();
  };

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${course.title} ${unit.title}`
  )}`;

  return (
    <div className={`academic-card p-4 sm:p-5 select-none ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]/70 mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-accent)]">
            Verified Lecture Gallery
          </span>
          <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
            Unit Lectures & Media
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)] transition-colors shadow-xs"
            title="Search YouTube for recommended lectures on this unit"
          >
            <Search className="h-3 w-3 text-[var(--color-ink-muted)]" />
            <span className="hidden sm:inline">Find on YouTube</span>
          </a>

          <Button
            size="sm"
            onClick={onOpenAddVideos}
            className="text-xs gap-1.5 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Videos</span>
          </Button>
        </div>
      </div>

      {/* Filter Chips Bar (All, Not started, In progress, Completed) */}
      {unitVideos.length > 0 && (
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-[var(--color-ink)] text-[var(--color-bg)] font-semibold shadow-xs"
                : "bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("not_started")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              activeFilter === "not_started"
                ? "bg-[var(--color-ink)] text-[var(--color-bg)] font-semibold shadow-xs"
                : "bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            Not Started ({counts.notStarted})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("in_progress")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              activeFilter === "in_progress"
                ? "bg-[var(--color-ink)] text-[var(--color-bg)] font-semibold shadow-xs"
                : "bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            In Progress ({counts.inProgress})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("completed")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              activeFilter === "completed"
                ? "bg-[var(--color-ink)] text-[var(--color-bg)] font-semibold shadow-xs"
                : "bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            Completed ({counts.completed})
          </button>
        </div>
      )}

      {/* Empty State */}
      {unitVideos.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center border border-dashed border-[var(--color-border)] rounded-[10px] bg-[var(--color-surface-muted)]/30">
          <div className="h-10 w-10 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center text-[var(--color-ink-muted)] mb-2">
            <Play className="h-5 w-5 ml-0.5" />
          </div>
          <h4 className="font-serif text-sm font-bold text-[var(--color-ink)]">
            No Lectures Added to {unit.title}
          </h4>
          <p className="text-xs text-[var(--color-ink-muted)] max-w-sm mt-1 mb-4">
            Add YouTube lectures by pasting links to track verified watch duration and connect videos to syllabus topics.
          </p>
          <div className="flex items-center gap-2.5">
            <Button size="sm" onClick={onOpenAddVideos} className="text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              <span>Paste YouTube Links</span>
            </Button>
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)]"
            >
              <span>Search YouTube</span>
              <ExternalLink className="h-3 w-3 ml-0.5 text-[var(--color-ink-muted)]" />
            </a>
          </div>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--color-ink-muted)]">
          No videos match the selected filter &ldquo;{activeFilter.replace("_", " ")}&rdquo;.
        </div>
      ) : (
        /* Video Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredVideos.map((video, idx) => {
            const prog = progressList.find((p) => p.lessonId === video.id || p.videoId === video.id);
            const isCompleted = prog?.isCompleted || (prog && prog.percentWatched >= 90);
            const percent = prog ? Math.round(prog.percentWatched) : 0;
            const duration = video.durationSeconds
              ? formatSecondsToTime(video.durationSeconds)
              : video.manualDuration || "Lecture";

            // Find linked topic names
            const linkedTopics = unitTopics.filter((t) =>
              video.linkedTopicIds?.includes(t.id)
            );

            return (
              <div
                key={video.id}
                className="group relative flex flex-col overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-ink-muted)]/50 transition-all shadow-sm"
              >
                {/* 16:9 Thumbnail Container */}
                <Link
                  href={`/courses/${course.id}/player/${video.id}`}
                  className="relative aspect-video w-full overflow-hidden bg-black/60 focus:outline-none block"
                >
                  <YouTubeThumbnail
                    videoId={video.youtubeVideoId}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />

                  {/* Play overlay button on hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white shadow-md">
                      <Play className="h-4 w-4 ml-0.5 fill-white" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-[4px] bg-black/80 font-mono text-[10px] font-semibold text-white tabular-nums">
                    {duration}
                  </span>

                  {/* 90% Completed Check Overlay */}
                  {isCompleted && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#1F7A4D]/90 text-white text-[10px] font-bold shadow-xs">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Completed</span>
                    </div>
                  )}

                  {/* Thin crimson watch-progress bar along the bottom */}
                  {percent > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                      <div
                        className="h-full bg-[var(--color-accent)] transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </Link>

                {/* Card Info */}
                <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                  <div>
                    {/* Channel name in muted ink */}
                    <span className="text-[10px] text-[var(--color-ink-muted)] font-semibold truncate block">
                      {video.channelTitle}
                    </span>

                    {/* Title in 2 lines */}
                    <h4 className="font-serif text-xs font-bold text-[var(--color-ink)] line-clamp-2 mt-0.5 group-hover:text-[var(--color-accent)] transition-colors">
                      <Link href={`/courses/${course.id}/player/${video.id}`}>
                        {video.title}
                      </Link>
                    </h4>

                    {/* Chips for linked topics */}
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {linkedTopics.length > 0 ? (
                        linkedTopics.map((top) => (
                          <span
                            key={top.id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-medium border border-[var(--color-accent)]/20 truncate max-w-[140px]"
                            title={top.title}
                          >
                            <Tag className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{top.title}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-[var(--color-ink-muted)] italic">
                          No topics linked
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingLessonForTopics(video)}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] text-[10px] font-medium border border-[var(--color-border)] transition-colors"
                        title="Link or edit syllabus topics for this video"
                      >
                        <span>{linkedTopics.length > 0 ? "Edit" : "+ Link Topics"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Footer & Actions: Player link, Reorder arrows, Watch on YouTube fallback */}
                  <div className="pt-2 border-t border-[var(--color-border)]/60 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/courses/${course.id}/player/${video.id}`}
                        className="font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1"
                      >
                        <span>Open Player</span>
                        <span className="text-xs">→</span>
                      </Link>
                      {percent > 0 && !isCompleted && (
                        <span className="text-[10px] font-mono tabular-nums text-[var(--color-ink-muted)]">
                          ({percent}%)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Reorder Up/Down */}
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(video.id, "up")}
                        disabled={idx === 0}
                        className="rounded p-0.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Move up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(video.id, "down")}
                        disabled={idx === filteredVideos.length - 1}
                        className="rounded p-0.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Move down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>

                      <a
                        href={video.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] inline-flex items-center gap-0.5 text-[10px] ml-1"
                        title="Watch on YouTube (external fallback)"
                      >
                        <span>YouTube</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Link Topics Modal */}
      <LinkTopicsModal
        lesson={editingLessonForTopics}
        unitTopics={unitTopics}
        open={Boolean(editingLessonForTopics)}
        onOpenChange={(open) => {
          if (!open) setEditingLessonForTopics(null);
        }}
        onSuccess={() => {
          setEditingLessonForTopics(null);
        }}
      />
    </div>
  );
}
