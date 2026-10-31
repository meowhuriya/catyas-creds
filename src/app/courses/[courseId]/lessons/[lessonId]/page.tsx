"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDataStore } from "@/lib/repository";
import {
  Course,
  Lesson,
  LessonProgress,
  Note,
  NoteTimestamp,
} from "@/types/schemas";
import { Button } from "@/components/ui/button";
import { StatusChip } from "@/components/ui/status-chip";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatSecondsToTime, parseTimeToSeconds } from "@/lib/utils";
import { TOKENS, CourseTagKey } from "@/styles/tokens";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  BookmarkPlus,
  Play,
  RotateCcw,
  Edit2,
  FileText,
} from "lucide-react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function LessonPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  const { dataStore } = useDataStore();

  const [course, setCourse] = React.useState<Course | null>(null);
  const [lesson, setLesson] = React.useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = React.useState<Lesson[]>([]);
  const [progress, setProgress] = React.useState<LessonProgress | null>(null);
  const [note, setNote] = React.useState<Note | null>(null);
  const [noteText, setNoteText] = React.useState("");
  const [timestamps, setTimestamps] = React.useState<NoteTimestamp[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Manual duration modal state
  const [manualDurationInput, setManualDurationInput] = React.useState("");
  const [showDurationModal, setShowDurationModal] = React.useState(false);

  // Player refs and state
  const playerRef = React.useRef<any>(null);
  const playerContainerRef = React.useRef<HTMLDivElement>(null);
  const notesTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Watched tracking state refs
  const prevTimeRef = React.useRef<number>(0);
  const lastWallTimeRef = React.useRef<number>(0);
  const trackingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load lesson, course, and progress data
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [c, l, allL, prog, n] = await Promise.all([
        dataStore.getCourse(courseId),
        dataStore.getLesson(lessonId),
        dataStore.getLessons(courseId),
        dataStore.getLessonProgress(lessonId),
        dataStore.getNote(lessonId),
      ]);

      setCourse(c);
      setLesson(l);
      setAllLessons(allL);
      setProgress(prog);

      if (n) {
        setNote(n);
        setNoteText(n.content);
        setTimestamps(n.timestamps || []);
      }
    } catch (err) {
      console.error("Failed to load lesson:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId, lessonId, dataStore]);

  React.useEffect(() => {
    if (courseId && lessonId) {
      loadData();
    }
  }, [courseId, lessonId, loadData]);

  // Autosave notes with debouncing
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (lesson && (noteText !== (note?.content || "") || timestamps.length !== (note?.timestamps?.length || 0))) {
        const saved = await dataStore.saveNote(
          courseId,
          lesson.id,
          noteText,
          timestamps
        );
        setNote(saved);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [noteText, timestamps, courseId, lesson, note, dataStore]);

  // Load YouTube IFrame Player API
  React.useEffect(() => {
    if (!lesson || !lesson.canEmbed) return;

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      const startSeconds = progress?.lastPositionSeconds || lesson.startTimeSeconds || 0;

      playerRef.current = new window.YT.Player("youtube-player-mount", {
        videoId: lesson.youtubeVideoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          start: Math.floor(startSeconds),
        },
        events: {
          onReady: (event: any) => {
            const duration = event.target.getDuration();
            if (duration && (!lesson.durationSeconds || lesson.durationSeconds !== duration)) {
              dataStore.updateLesson(lesson.id, { durationSeconds: duration });
            }
          },
          onStateChange: handlePlayerStateChange,
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
    };
  }, [lesson?.id, lesson?.canEmbed]);

  /**
   * Watch Tracking Heuristic (User constraint #6):
   * Count watched time ONLY while playing, and ONLY when the time moves forward
   * by a small amount per second (factoring in playback speed).
   * Seeking or skipping forward adds zero watched time.
   */
  const handlePlayerStateChange = (event: any) => {
    const isPlaying = event.data === 1; // 1 = YT.PlayerState.PLAYING

    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    if (isPlaying) {
      prevTimeRef.current = playerRef.current?.getCurrentTime() || 0;
      lastWallTimeRef.current = Date.now();

      trackingIntervalRef.current = setInterval(async () => {
        if (!playerRef.current || !lesson) return;

        const currentTime = playerRef.current.getCurrentTime() || 0;
        const now = Date.now();
        const deltaWallSec = (now - lastWallTimeRef.current) / 1000;
        const playbackRate = playerRef.current.getPlaybackRate() || 1;
        const deltaVideoSec = currentTime - prevTimeRef.current;

        // Allowable forward delta with 25% jitter allowance
        const maxAllowedDelta = 1.25 * deltaWallSec * playbackRate;

        // Check if user watched forward normally
        if (deltaVideoSec > 0 && deltaVideoSec <= maxAllowedDelta) {
          const currentWatched = progress?.watchedSeconds || 0;
          const newWatched = currentWatched + deltaVideoSec;
          const totalDuration =
            lesson.durationSeconds || playerRef.current.getDuration() || 1;
          const percent = Math.min(100, (newWatched / totalDuration) * 100);
          const completed = percent >= 90;

          const updatedProg = await dataStore.updateLessonProgress({
            lessonId: lesson.id,
            courseId,
            watchedSeconds: Math.round(newWatched),
            totalDurationSeconds: Math.round(totalDuration),
            percentWatched: percent,
            isCompleted: completed,
            lastPositionSeconds: Math.round(currentTime),
            completedAt: completed ? new Date().toISOString() : progress?.completedAt,
          });

          setProgress(updatedProg);

          // Log audit entry if freshly completed
          if (completed && !progress?.isCompleted) {
            await dataStore.logAudit(
              "lesson_watched",
              lesson.id,
              `Verified 90%+ completion of "${lesson.title}" (${Math.round(
                newWatched
              )}s watched)`
            );
          }
        }

        // Update tracking anchor for next tick
        prevTimeRef.current = currentTime;
        lastWallTimeRef.current = now;
      }, 1000);
    }
  };

  // Keyboard navigation shortcuts: 'j' next, 'k' prev, 'n' focus notes
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA"].includes(target.tagName) ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "j") {
        e.preventDefault();
        navigateToNextLesson();
      } else if (e.key === "k") {
        e.preventDefault();
        navigateToPrevLesson();
      } else if (e.key === "n") {
        e.preventDefault();
        notesTextareaRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [allLessons, lessonId]);

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const navigateToPrevLesson = () => {
    if (prevLesson) {
      router.push(`/courses/${courseId}/lessons/${prevLesson.id}`);
    }
  };

  const navigateToNextLesson = () => {
    if (nextLesson) {
      router.push(`/courses/${courseId}/lessons/${nextLesson.id}`);
    }
  };

  const handleAddTimestamp = () => {
    const currentSeconds = Math.floor(playerRef.current?.getCurrentTime() || 0);
    const label = `Timestamp at ${formatSecondsToTime(currentSeconds)}`;
    setTimestamps((prev) => [...prev, { seconds: currentSeconds, label }]);
  };

  const handleSeekToTimestamp = (seconds: number) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(seconds, true);
    }
  };

  const handleSaveManualDuration = async () => {
    const parsed = parseTimeToSeconds(manualDurationInput);
    if (parsed && lesson) {
      await dataStore.updateLesson(lesson.id, {
        durationSeconds: parsed,
        manualDuration: manualDurationInput,
      });
      setShowDurationModal(false);
      await loadData();
    }
  };

  if (loading || !lesson) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-xs text-app-ink-muted">
        Loading lesson player...
      </div>
    );
  }

  const tagColor = course
    ? TOKENS.colors.courseTags[course.colorTag as CourseTagKey]?.hex
    : TOKENS.colors.courseTags.slate.hex;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Return to Course */}
      <div className="flex items-center justify-between border-b border-app-border pb-3">
        <Link
          href={`/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-app-ink-muted hover:text-app-ink transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {course?.code || "Course"} Classwork</span>
        </Link>

        {/* Next / Previous Shortcut Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!prevLesson}
            onClick={navigateToPrevLesson}
            className="text-xs h-7 gap-1"
            title="Shortcut: 'k'"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Prev (k)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!nextLesson}
            onClick={navigateToNextLesson}
            className="text-xs h-7 gap-1"
            title="Shortcut: 'j'"
          >
            <span className="hidden sm:inline">Next (j)</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main 2-Column Learning Layout: Player (Wide) + Sidebar Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Player, Video Info, Notes */}
        <div className="lg:col-span-2 space-y-5">
          {/* Official YouTube Embed Player / Fallback */}
          <div
            ref={playerContainerRef}
            className="relative aspect-video w-full overflow-hidden rounded-card border border-app-border bg-black shadow-sm"
          >
            {lesson.canEmbed ? (
              <div id="youtube-player-mount" className="h-full w-full" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-app-surface text-app-ink">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-app-warning mb-3">
                  <Play className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-base font-bold">
                  Embedding Restricted by Creator
                </h3>
                <p className="mt-1 max-w-sm text-xs text-app-ink-muted">
                  The author has disabled embedding for this lecture video. Please watch directly on YouTube.
                </p>
                <a
                  href={lesson.originalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-control bg-app-accent px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-app-accent-hover transition-colors"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Lesson Metadata & Verified Watch Tracking Status */}
          <div className="rounded-card border border-app-border bg-app-surface p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-app-border pb-3">
              <div>
                <h1 className="font-serif text-lg font-bold text-app-ink">
                  {lesson.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-app-ink-muted mt-1">
                  <span>Channel: <strong>{lesson.channelTitle}</strong></span>
                  <span>•</span>
                  <a
                    href={lesson.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline text-app-accent inline-flex items-center gap-1"
                  >
                    <span>Watch on YouTube</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <StatusChip
                  status={progress?.isCompleted ? "graded" : "in_progress"}
                  label={
                    progress?.isCompleted
                      ? "Completed (90%+)"
                      : `${Math.round(progress?.percentWatched || 0)}% Watched`
                  }
                />
              </div>
            </div>

            {/* Watch Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-app-ink-muted">
                <span>
                  Verified Watch Time:{" "}
                  <strong className="text-app-ink font-mono tabular-nums">
                    {formatSecondsToTime(progress?.watchedSeconds || 0)}
                  </strong>
                </span>
                <span className="font-mono tabular-nums">
                  Duration:{" "}
                  {lesson.durationSeconds
                    ? formatSecondsToTime(lesson.durationSeconds)
                    : lesson.manualDuration || "Duration pending"}
                  <button
                    onClick={() => setShowDurationModal(true)}
                    className="ml-2 text-app-ink-muted hover:text-app-ink underline text-[11px]"
                  >
                    (Edit)
                  </button>
                </span>
              </div>
              <ProgressBar value={progress?.percentWatched || 0} />
            </div>
          </div>

          {/* Timestamped Notes Section */}
          <div className="rounded-card border border-app-border bg-app-surface p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-app-accent" />
                <h3 className="font-serif text-base font-bold text-app-ink">
                  Lecture Notes & Timestamps
                </h3>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTimestamp}
                className="gap-1.5 text-xs h-7"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                <span>Timestamp Current Time</span>
              </Button>
            </div>

            {/* Clickable Timestamps list */}
            {timestamps.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {timestamps.map((ts, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSeekToTimestamp(ts.seconds)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-app-border bg-app-surface-muted px-2.5 py-1 text-xs font-mono text-app-accent hover:border-app-accent transition-colors"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>{formatSecondsToTime(ts.seconds)}</span>
                    <span className="text-app-ink-muted text-[10px] truncate max-w-[120px]">
                      {ts.label}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Notes Textarea */}
            <div>
              <textarea
                ref={notesTextareaRef}
                rows={6}
                placeholder="Take notes on key definitions, equations, and lecture concepts (autosaved automatically)... Press 'n' to focus."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full rounded-control border border-app-border bg-app-surface p-3 text-xs text-app-ink shadow-sm outline-none focus:ring-2 focus:ring-app-accent placeholder:text-app-ink-muted/60 leading-relaxed font-sans"
              />
              <span className="text-[11px] text-app-ink-muted block mt-1">
                Autosaved to your local academic registry.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Lesson Playlist Drawer */}
        <div className="rounded-card border border-app-border bg-app-surface overflow-hidden shadow-sm flex flex-col h-[750px]">
          <div className="border-b border-app-border bg-app-surface-muted/50 p-4">
            <h3 className="font-serif text-sm font-bold text-app-ink">
              Course Lecture Modules
            </h3>
            <span className="text-xs text-app-ink-muted">
              {currentIndex + 1} of {allLessons.length} lessons
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-app-border/70 p-2">
            {allLessons.map((item, idx) => {
              const isCurrent = item.id === lessonId;

              return (
                <Link
                  key={item.id}
                  href={`/courses/${courseId}/lessons/${item.id}`}
                  className={`flex items-start gap-2.5 p-2.5 rounded-control transition-colors ${
                    isCurrent
                      ? "bg-app-accent/10 border-l-2 border-app-accent font-semibold text-app-ink"
                      : "hover:bg-app-surface-muted/60 text-app-ink-muted"
                  }`}
                >
                  <span className="font-mono text-xs tabular-nums text-app-ink-muted/80 mt-0.5">
                    {idx + 1}.
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-xs truncate ${
                        isCurrent ? "text-app-accent font-bold" : "text-app-ink"
                      }`}
                    >
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-app-ink-muted block truncate mt-0.5">
                      {item.channelTitle}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Official YouTube Disclaimer Footer */}
          <div className="border-t border-app-border p-3 text-[11px] text-app-ink-muted bg-app-surface-muted/30 flex flex-col gap-1">
            <span className="font-semibold text-[10px] uppercase tracking-wider">
              Legal Compliance
            </span>
            <div className="flex items-center gap-2">
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                YouTube ToS
              </a>
              <span>•</span>
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Google Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Duration Modal */}
      {showDurationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-card border border-app-border bg-app-surface p-5 shadow-dialog">
            <h3 className="font-serif text-base font-bold text-app-ink">
              Set Manual Lesson Duration
            </h3>
            <p className="text-xs text-app-ink-muted mt-1">
              Enter duration as hh:mm:ss or mm:ss.
            </p>
            <div className="mt-3">
              <input
                type="text"
                placeholder="e.g. 01:15:30"
                value={manualDurationInput}
                onChange={(e) => setManualDurationInput(e.target.value)}
                className="w-full rounded-control border border-app-border bg-app-surface p-2 font-mono text-sm text-center tabular-nums"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDurationModal(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveManualDuration}>
                Save Duration
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
