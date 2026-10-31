"use client";

import * as React from "react";
import Link from "next/link";
import { Play, Plus, Search, ExternalLink, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lesson, LessonProgress, Course, Module, Topic } from "@/types/schemas";
import { formatSecondsToTime } from "@/lib/utils";

interface UnitVideoGalleryProps {
  course: Course;
  unit: Module;
  videos: Lesson[];
  progressList: LessonProgress[];
  topics: Topic[];
  onOpenAddVideos: () => void;
  className?: string;
}

export function UnitVideoGallery({
  course,
  unit,
  videos,
  progressList,
  topics,
  onOpenAddVideos,
  className = "",
}: UnitVideoGalleryProps) {
  const unitVideos = videos.filter(
    (v) => v.unitId === unit.id || v.moduleId === unit.id
  );

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${course.title} ${unit.title}`
  )}`;

  return (
    <div className={`academic-card p-4 sm:p-5 select-none ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]/70 mb-4">
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)] transition-colors"
            title="Search YouTube for recommended lectures on this unit"
          >
            <Search className="h-3 w-3 text-[var(--color-ink-muted)]" />
            <span className="hidden sm:inline">Find on YouTube</span>
          </a>

          <Button
            size="sm"
            onClick={onOpenAddVideos}
            className="text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Videos</span>
          </Button>
        </div>
      </div>

      {/* Video Cards Grid */}
      {unitVideos.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center border border-dashed border-[var(--color-border)] rounded-[10px] bg-[var(--color-surface-muted)]/30">
          <div className="h-10 w-10 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center text-[var(--color-ink-muted)] mb-2">
            <Play className="h-5 w-5 ml-0.5" />
          </div>
          <h4 className="font-serif text-sm font-bold text-[var(--color-ink)]">
            No Lectures Added to {unit.title}
          </h4>
          <p className="text-xs text-[var(--color-ink-muted)] max-w-sm mt-1 mb-4">
            Curate YouTube lectures by link to watch with verified progress and link directly to syllabus topics.
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {unitVideos.map((video) => {
            const prog = progressList.find((p) => p.lessonId === video.id || p.videoId === video.id);
            const isCompleted = prog?.isCompleted || (prog && prog.percentWatched >= 90);
            const percent = prog ? Math.round(prog.percentWatched) : 0;
            const duration = video.durationSeconds
              ? formatSecondsToTime(video.durationSeconds)
              : video.manualDuration || "Lecture";

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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  {/* Play overlay button */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/10 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white shadow-md">
                      <Play className="h-4 w-4 ml-0.5 fill-white" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-[4px] bg-black/80 font-mono text-[10px] font-semibold text-white tabular-nums">
                    {duration}
                  </span>

                  {/* 90% Completed Check Overlay */}
                  {isCompleted && (
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#1F7A4D]/90 text-white text-[10px] font-bold">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Completed</span>
                    </div>
                  )}

                  {/* Thin crimson progress bar across card bottom */}
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
                <div className="p-3 flex flex-col flex-1 justify-between">
                  <div>
                    <span className="text-[10px] text-[var(--color-ink-muted)] font-semibold truncate block">
                      {video.channelTitle}
                    </span>
                    <h4 className="font-serif text-xs font-bold text-[var(--color-ink)] line-clamp-2 mt-0.5 group-hover:text-[var(--color-accent)] transition-colors">
                      <Link href={`/courses/${course.id}/player/${video.id}`}>
                        {video.title}
                      </Link>
                    </h4>
                  </div>

                  {/* Action Link & Watch on YouTube fallback */}
                  <div className="mt-2.5 pt-2 border-t border-[var(--color-border)]/60 flex items-center justify-between text-[11px]">
                    <Link
                      href={`/courses/${course.id}/player/${video.id}`}
                      className="font-semibold text-[var(--color-accent)] hover:underline"
                    >
                      Watch in Player →
                    </Link>

                    <a
                      href={video.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] inline-flex items-center gap-0.5 text-[10px]"
                      title="Watch on YouTube (fallback)"
                    >
                      <span>YouTube</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
