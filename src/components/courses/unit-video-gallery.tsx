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
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Lesson, LessonProgress, Course, Module, Topic } from "@/types/schemas";
import { formatSecondsToTime, cleanSyllabusTitle, getYoutubeSearchUrl } from "@/lib/utils";
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

  // Filter lessons belonging to this unit with resilient ID & unitNumber matching
  const unitVideos = React.useMemo(() => {
    const uId = (unit.id || "").toLowerCase();
    const uNum = unit.unitNumber;

    return videos
      .filter((v) => {
        const vUnit = (v.unitId || "").toLowerCase();
        const vMod = (v.moduleId || "").toLowerCase();

        // 1. Exact match on unitId or moduleId
        if (vUnit === uId || vMod === uId) return true;

        // 2. Unit number match (e.g. 5, "5", "unit-5", "u5", "-u5")
        if (uNum !== undefined && uNum !== null) {
          const numStr = String(uNum);
          if (
            vUnit === numStr ||
            vMod === numStr ||
            vUnit === `unit-${numStr}` ||
            vMod === `unit-${numStr}` ||
            vUnit.endsWith(`-u${numStr}`) ||
            vMod.endsWith(`-u${numStr}`) ||
            vUnit.includes(`-u${numStr}-`) ||
            vMod.includes(`-u${numStr}-`)
          ) {
            return true;
          }
        }

        // 3. Fallback: check if any linked topic belongs to this unit
        if (v.linkedTopicIds && v.linkedTopicIds.length > 0 && topics.length > 0) {
          const unitTopicIds = new Set(
            topics.filter((t) => (t.unitId || "").toLowerCase() === uId).map((t) => t.id)
          );
          if (v.linkedTopicIds.some((tId) => unitTopicIds.has(tId))) {
            return true;
          }
        }

        return false;
      })
      .sort((a, b) => a.order - b.order);
  }, [videos, unit.id, unit.unitNumber, topics]);

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

  const searchUrl = getYoutubeSearchUrl(course.title, cleanSyllabusTitle(unit.title));

  return (
    <div className={`academic-card p-4 sm:p-5 select-none ${className}`}>
      {/* Header: One heading "Lectures" with count; two buttons in one row that never wrap */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#E5D5C5]/70 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-lg font-bold text-[#14161F] dark:text-[#F6EBD3]">
            Lectures
          </h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#F6EBD3] text-[#8A1627] border border-[#E5D5C5] tabular-nums">
            {unitVideos.length}
          </span>
        </div>

        {/* Two buttons in one row that never wrap or get cut off */}
        <div className="flex items-center gap-2 shrink-0 flex-nowrap">
          <a
            href={searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            title="Search YouTube for recommended lectures on this unit"
          >
            <Search className="h-3.5 w-3.5 text-[#4B5160]" />
            <span>Find videos</span>
          </a>

          <button
            type="button"
            onClick={onOpenAddVideos}
            className="btn-primary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add videos</span>
          </button>
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
                ? "bg-[#14161F] text-white font-semibold shadow-xs"
                : "bg-[var(--color-surface-muted)] text-[#4B5160] hover:text-[#14161F]"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("not_started")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              activeFilter === "not_started"
                ? "bg-[#14161F] text-white font-semibold shadow-xs"
                : "bg-[var(--color-surface-muted)] text-[#4B5160] hover:text-[#14161F]"
            }`}
          >
            Not Started ({counts.notStarted})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("in_progress")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              activeFilter === "in_progress"
                ? "bg-[#14161F] text-white font-semibold shadow-xs"
                : "bg-[var(--color-surface-muted)] text-[#4B5160] hover:text-[#14161F]"
            }`}
          >
            In Progress ({counts.inProgress})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("completed")}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              activeFilter === "completed"
                ? "bg-[#14161F] text-white font-semibold shadow-xs"
                : "bg-[var(--color-surface-muted)] text-[#4B5160] hover:text-[#14161F]"
            }`}
          >
            Completed ({counts.completed})
          </button>
        </div>
      )}

      {/* Compact Empty State */}
      {unitVideos.length === 0 ? (
        <div className="p-4 text-center border border-dashed border-[#E5D5C5] rounded-[10px] bg-[#FAF7F2]/60 dark:bg-[#251A1D]/30">
          <p className="text-sm font-medium text-[#14161F] dark:text-[#F6EBD3]">
            No lectures added yet.
          </p>
          <p className="text-xs text-[#4B5160] dark:text-[#CFC8BB] mt-0.5 mb-3">
            Search YouTube or paste lecture URLs to start learning.
          </p>
          <div className="flex items-center justify-center gap-2">
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-1 px-3 inline-flex items-center gap-1"
            >
              <Search className="h-3 w-3" />
              <span>Find videos</span>
            </a>
            <button
              type="button"
              onClick={onOpenAddVideos}
              className="btn-primary text-xs py-1 px-3 inline-flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Add videos</span>
            </button>
          </div>
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="py-6 text-center text-xs text-[#4B5160]">
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

            const linkedTopics = unitTopics.filter((t) =>
              video.linkedTopicIds?.includes(t.id)
            );

            return (
              <div
                key={video.id}
                className="group relative flex flex-col overflow-hidden rounded-[10px] border border-[#E5D5C5] bg-white dark:bg-[#1E1416] hover:border-[#14161F]/40 transition-all shadow-sm"
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
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-[4px] bg-black/80 font-sans text-xs font-semibold text-white tabular-nums">
                    {duration}
                  </span>

                  {/* 90% Completed Check Overlay */}
                  {isCompleted && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#5E7B5B] text-white text-xs font-bold shadow-xs">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Completed</span>
                    </div>
                  )}

                  {/* Thin crimson watch-progress bar along the bottom */}
                  {percent > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                      <div
                        className="h-full bg-[#A51C30] transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </Link>

                {/* Card Info */}
                <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                  <div>
                    <span className="text-xs text-[#4B5160] font-medium truncate block">
                      {video.channelTitle}
                    </span>

                    <h4 className="font-serif text-sm font-bold text-[#14161F] dark:text-[#F6EBD3] line-clamp-2 mt-0.5 group-hover:text-[#A51C30] transition-colors">
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
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#A51C30]/10 text-[#A51C30] text-xs font-medium border border-[#A51C30]/20 truncate max-w-[140px]"
                            title={top.title}
                          >
                            <Tag className="h-3 w-3 shrink-0" />
                            <span className="truncate">{cleanSyllabusTitle(top.title)}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#4B5160] italic">
                          No topics linked
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditingLessonForTopics(video)}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[4px] bg-[var(--color-surface-muted)] text-[#4B5160] hover:text-[#14161F] text-xs font-medium border border-[var(--color-border)] transition-colors"
                        title="Link or edit syllabus topics for this video"
                      >
                        <span>{linkedTopics.length > 0 ? "Edit" : "+ Link Topics"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-2 border-t border-[#E5D5C5]/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/courses/${course.id}/player/${video.id}`}
                        className="font-semibold text-[#A51C30] hover:underline flex items-center gap-1"
                      >
                        <span>Open Player</span>
                        <span>→</span>
                      </Link>
                      {percent > 0 && !isCompleted && (
                        <span className="text-xs tabular-nums text-[#4B5160]">
                          ({percent}%)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(video.id, "up")}
                        disabled={idx === 0}
                        className="rounded p-0.5 text-[#4B5160] hover:text-[#14161F] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveOrder(video.id, "down")}
                        disabled={idx === filteredVideos.length - 1}
                        className="rounded p-0.5 text-[#4B5160] hover:text-[#14161F] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      <a
                        href={video.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4B5160] hover:text-[#14161F] inline-flex items-center gap-0.5 text-xs ml-1"
                        title="Watch on YouTube (external fallback)"
                      >
                        <span>YouTube</span>
                        <ExternalLink className="h-3 w-3" />
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
