import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Lesson, LessonProgress, Course } from "@/types/schemas";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatSecondsToTime } from "@/lib/utils";
import { Play, ExternalLink } from "lucide-react";
import { TOKENS, CourseTagKey } from "@/styles/tokens";

interface ContinueWatchingProps {
  lessons: Lesson[];
  progressList: LessonProgress[];
  courses: Course[];
}

export function ContinueWatchingStrip({
  lessons,
  progressList,
  courses,
}: ContinueWatchingProps) {
  // Find in-progress lessons (watchedSeconds > 0 && !isCompleted)
  const inProgressItems = progressList
    .filter((p) => !p.isCompleted && p.watchedSeconds > 0)
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
    .slice(0, 3);

  if (inProgressItems.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-lg font-bold text-app-ink">
          Continue Watching
        </h2>
        <span className="text-xs text-app-ink-muted">
          Resumes where you left off
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inProgressItems.map((prog) => {
          const lesson = lessons.find((l) => l.id === prog.lessonId);
          const course = courses.find((c) => c.id === prog.courseId);
          if (!lesson || !course) return null;

          const tagColor =
            TOKENS.colors.courseTags[course.colorTag as CourseTagKey]?.hex ||
            TOKENS.colors.courseTags.slate.hex;

          return (
            <div
              key={prog.id}
              className="flex flex-col rounded-card border border-app-border bg-app-surface overflow-hidden shadow-sm"
            >
              {/* Thumbnail with overlay duration & resume position */}
              <div className="relative aspect-video w-full bg-black/10 overflow-hidden">
                <Image
                  src={lesson.thumbnailUrl}
                  alt={lesson.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/20 hover:bg-black/30 transition-colors flex items-center justify-center group">
                  <Link
                    href={`/courses/${course.id}/lessons/${lesson.id}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-app-accent text-white shadow-md transition-transform group-hover:scale-105"
                  >
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  </Link>
                </div>
                <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] text-white tabular-nums">
                  {formatSecondsToTime(prog.lastPositionSeconds)} /{" "}
                  {formatSecondsToTime(
                    prog.totalDurationSeconds || lesson.durationSeconds || 0
                  )}
                </div>
              </div>

              {/* Progress bar directly underneath thumbnail */}
              <ProgressBar
                value={prog.percentWatched}
                className="h-1 rounded-none border-none"
              />

              {/* Lesson Metadata */}
              <div className="p-3.5 flex flex-col flex-1 justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: tagColor }}
                    />
                    <span className="font-mono text-app-accent uppercase">
                      {course.code}
                    </span>
                    <span className="text-app-ink-muted truncate">
                      • {course.title}
                    </span>
                  </div>

                  <h4 className="mt-1 font-serif text-sm font-semibold text-app-ink line-clamp-1">
                    <Link
                      href={`/courses/${course.id}/lessons/${lesson.id}`}
                      className="hover:text-app-accent transition-colors"
                    >
                      {lesson.title}
                    </Link>
                  </h4>

                  <span className="mt-0.5 block text-xs text-app-ink-muted">
                    Channel: {lesson.channelTitle}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-app-border flex items-center justify-between text-xs">
                  <Link
                    href={`/courses/${course.id}/lessons/${lesson.id}`}
                    className="font-semibold text-app-accent hover:underline inline-flex items-center gap-1"
                  >
                    <span>Resume</span>
                  </Link>

                  {/* Fallback "Watch on YouTube" per strict rule */}
                  <a
                    href={lesson.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-app-ink-muted hover:text-app-ink inline-flex items-center gap-1"
                  >
                    <span>Watch on YouTube</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
