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
  Module,
  Topic,
} from "@/types/schemas";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatSecondsToTime, parseTimeToSeconds } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { YouTubeThumbnail } from "@/components/courses/youtube-thumbnail";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  BookmarkPlus,
  Play,
  Clock,
  Edit2,
  FileText,
  Tag,
  AlertCircle,
  Volume2,
} from "lucide-react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const videoParam = params.videoId as string;
  const toast = useToast();

  const { dataStore, refreshData } = useDataStore();

  const [course, setCourse] = React.useState<Course | null>(null);
  const [lesson, setLesson] = React.useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = React.useState<Lesson[]>([]);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [progress, setProgress] = React.useState<LessonProgress | null>(null);
  const [note, setNote] = React.useState<Note | null>(null);
  const [noteText, setNoteText] = React.useState("");
  const [timestamps, setTimestamps] = React.useState<NoteTimestamp[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Manual duration modal
  const [showDurationModal, setShowDurationModal] = React.useState(false);
  const [manualDurationInput, setManualDurationInput] = React.useState("");

  // Refs for tracking
  const playerRef = React.useRef<any>(null);
  const notesTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const prevTimeRef = React.useRef<number>(0);
  const lastWallTimeRef = React.useRef<number>(0);
  const trackingIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredCompletionToast = React.useRef<boolean>(false);

  // Load course, lesson (by id or youtubeVideoId), and associated records
  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [c, allL, mods, tops] = await Promise.all([
        dataStore.getCourse(courseId),
        dataStore.getLessons(courseId),
        dataStore.getModules(courseId),
        dataStore.getTopics(courseId),
      ]);

      setCourse(c);
      setAllLessons(allL);
      setModules(mods);
      setTopics(tops);

      // Find the lesson by ID or by youtubeVideoId
      let targetLesson = allL.find((l) => l.id === videoParam || l.youtubeVideoId === videoParam);
      if (!targetLesson && allL.length > 0) {
        targetLesson = allL[0];
      }

      if (targetLesson) {
        setLesson(targetLesson);
        const [prog, n] = await Promise.all([
          dataStore.getLessonProgress(targetLesson.id),
          dataStore.getNote(targetLesson.id),
        ]);

        setProgress(prog);
        if (prog?.isCompleted) {
          hasTriggeredCompletionToast.current = true;
        }

        if (n) {
          setNote(n);
          setNoteText(n.content);
          setTimestamps(n.timestamps || []);
        }

        // Freshness re-check: if cachedAt older than 30 days, re-fetch oEmbed metadata
        const cachedDate = new Date(targetLesson.cachedAt || 0).getTime();
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (cachedDate < thirtyDaysAgo) {
          fetch(`/api/youtube/oembed?id=${targetLesson.youtubeVideoId}`)
            .then((res) => res.json())
            .then((data) => {
              if (data && data.title && data.title !== targetLesson?.title) {
                dataStore.updateLesson(targetLesson!.id, {
                  title: data.title,
                  channelTitle: data.author_name || targetLesson?.channelTitle,
                  cachedAt: new Date().toISOString(),
                });
              }
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error("Failed to load player data:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId, videoParam, dataStore]);

  React.useEffect(() => {
    if (courseId && videoParam) {
      loadData();
    }
  }, [courseId, videoParam, loadData]);

  // Autosave notes with debouncing
  React.useEffect(() => {
    const timer = setTimeout(async () => {
      if (
        lesson &&
        (noteText !== (note?.content || "") ||
          timestamps.length !== (note?.timestamps?.length || 0))
      ) {
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

  // Initialize YouTube IFrame Player API
  React.useEffect(() => {
    if (!lesson || !lesson.canEmbed) return;

    let isMounted = true;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player || !document.getElementById("youtube-player-mount")) {
        return;
      }

      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }

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
            if (!isMounted) return;
            const duration = event.target.getDuration();
            if (duration && (!lesson.durationSeconds || lesson.durationSeconds !== duration)) {
              dataStore.updateLesson(lesson.id, { durationSeconds: Math.round(duration) });
            }
          },
          onStateChange: handlePlayerStateChange,
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      isMounted = false;
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, [lesson?.id, lesson?.canEmbed]);

  /**
   * Watch Tracking Algorithm (Strict brief compliance):
   * Count real watched seconds through the IFrame API: only while playing,
   * only small forward movement per second adjusted for playback speed.
   * Seeking or skipping adds zero.
   * At 90 percent the video is Completed (toast + awards 40 points to linked topics).
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

        try {
          const currentTime = playerRef.current.getCurrentTime() || 0;
          const now = Date.now();
          const deltaWallSec = (now - lastWallTimeRef.current) / 1000;
          const playbackRate = playerRef.current.getPlaybackRate() || 1;
          const deltaVideoSec = currentTime - prevTimeRef.current;

          // Allow forward movement with small 25% jitter allowance
          const maxAllowedDelta = 1.25 * deltaWallSec * playbackRate;

          // Check if video made legitimate forward progress
          if (deltaVideoSec > 0 && deltaVideoSec <= maxAllowedDelta) {
            const currentWatched = progress?.watchedSeconds || 0;
            const newWatched = currentWatched + deltaVideoSec;
            const totalDuration =
              lesson.durationSeconds || playerRef.current.getDuration() || 1;
            const percent = Math.min(100, (newWatched / totalDuration) * 100);
            const isCompleted = percent >= 90;

            const updatedProg = await dataStore.updateLessonProgress({
              lessonId: lesson.id,
              courseId,
              watchedSeconds: Math.round(newWatched),
              totalDurationSeconds: Math.round(totalDuration),
              percentWatched: percent,
              isCompleted,
              lastPositionSeconds: Math.round(currentTime),
              completedAt: isCompleted ? new Date().toISOString() : progress?.completedAt,
            });

            setProgress(updatedProg);

            // Trigger celebration toast on first 90% crossing
            if (isCompleted && !hasTriggeredCompletionToast.current) {
              hasTriggeredCompletionToast.current = true;
              toast.success(
                "Lecture Completed!",
                `Verified 90%+ watch time for "${lesson.title}". 40 mastery points awarded to linked syllabus topics.`
              );
              await dataStore.logAudit(
                "lesson_watched",
                lesson.id,
                `Verified 90%+ completion of "${lesson.title}" (${Math.round(newWatched)}s watched)`
              );
              await refreshData();
            }
          }

          prevTimeRef.current = currentTime;
          lastWallTimeRef.current = now;
        } catch {
          // Player state changed or detached
        }
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
  }, [allLessons, lesson?.id]);

  // Lessons belonging to current unit
  const currentUnitId = lesson?.unitId || lesson?.moduleId;
  const unitLessons = React.useMemo(() => {
    return allLessons.filter(
      (l) => l.unitId === currentUnitId || l.moduleId === currentUnitId
    );
  }, [allLessons, currentUnitId]);

  const playlistLessons = unitLessons.length > 0 ? unitLessons : allLessons;
  const currentIndex = playlistLessons.findIndex((l) => l.id === lesson?.id);
  const prevLesson = currentIndex > 0 ? playlistLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < playlistLessons.length - 1 ? playlistLessons[currentIndex + 1] : null;

  const navigateToPrevLesson = () => {
    if (prevLesson) {
      router.push(`/courses/${courseId}/player/${prevLesson.id}`);
    }
  };

  const navigateToNextLesson = () => {
    if (nextLesson) {
      router.push(`/courses/${courseId}/player/${nextLesson.id}`);
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
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-xs text-[var(--color-ink-muted)]">
        Loading verified lecture player...
      </div>
    );
  }

  const currentUnit = modules.find((m) => m.id === currentUnitId);
  const linkedTopics = topics.filter((t) => lesson.linkedTopicIds?.includes(t.id));
  const percentWatched = Math.round(progress?.percentWatched || 0);
  const isCompleted = progress?.isCompleted || percentWatched >= 90;

  return (
    <div className="space-y-6">
      {/* Top Bar: Return to Course + Next / Prev Buttons */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to {course?.code || "Course"} Syllabus</span>
          </Link>

          {currentUnit && (
            <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-[4px] bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] border border-[var(--color-border)]">
              {currentUnit.title}
            </span>
          )}
        </div>

        {/* Shortcuts: j (next), k (prev) */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!prevLesson}
            onClick={navigateToPrevLesson}
            className="text-xs h-7 gap-1"
            title="Keyboard shortcut: 'k'"
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
            title="Keyboard shortcut: 'j'"
          >
            <span className="hidden sm:inline">Next (j)</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Main 2-Column Academic Layout: Player (Wide Left) + Unit Video List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Player, Metadata, Notes */}
        <div className="lg:col-span-2 space-y-5">
          {/* Official YouTube IFrame Player (Wide) */}
          <div className="relative aspect-video w-full overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-black shadow-sm">
            {lesson.canEmbed ? (
              <div id="youtube-player-mount" className="h-full w-full" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-[var(--color-surface)] text-[var(--color-ink)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 mb-3">
                  <Play className="h-6 w-6 ml-0.5" />
                </div>
                <h3 className="font-serif text-base font-bold">
                  Embedding Restricted by YouTube Creator
                </h3>
                <p className="mt-1 max-w-sm text-xs text-[var(--color-ink-muted)] leading-relaxed">
                  The author has restricted external embedding for this video. Please open it directly on YouTube to watch the lecture.
                </p>
                <a
                  href={lesson.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--color-accent)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                >
                  <span>Watch on YouTube</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Under Player: Live "63% watched", metadata, fallback link, channel */}
          <div className="academic-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-[var(--color-border)]/70 pb-3">
              <div className="min-w-0 flex-1">
                <h1 className="font-serif text-lg font-bold text-[var(--color-ink)] leading-snug">
                  {lesson.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-[var(--color-ink-muted)] mt-1.5">
                  <span>Channel: <strong className="text-[var(--color-ink)]">{lesson.channelTitle}</strong></span>
                  <span>•</span>
                  <a
                    href={lesson.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-[var(--color-accent)] font-semibold inline-flex items-center gap-1"
                    title="Watch on official YouTube site"
                  >
                    <span>Watch on YouTube</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Linked Topics chips */}
                {linkedTopics.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-[var(--color-ink-muted)] uppercase tracking-wider">
                      Linked Topics:
                    </span>
                    {linkedTopics.map((top) => (
                      <span
                        key={top.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-medium border border-[var(--color-accent)]/20"
                      >
                        <Tag className="h-2.5 w-2.5" />
                        <span>{top.title}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="shrink-0 flex items-center gap-2">
                {isCompleted ? (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1F7A4D]/15 text-[#1F7A4D] text-xs font-bold border border-[#1F7A4D]/30">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Completed (90%+)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-surface-muted)] text-[var(--color-ink)] text-xs font-semibold border border-[var(--color-border)]">
                    <Clock className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                    <span>{percentWatched}% Watched</span>
                  </div>
                )}
              </div>
            </div>

            {/* Watch Progress Details & Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[var(--color-ink-muted)]">
                <span>
                  Verified Watch Time:{" "}
                  <strong className="text-[var(--color-ink)] font-sans font-semibold tabular-nums">
                    {formatSecondsToTime(progress?.watchedSeconds || 0)}
                  </strong>
                </span>
                <span className="font-sans font-semibold tabular-nums">
                  Duration:{" "}
                  {lesson.durationSeconds
                    ? formatSecondsToTime(lesson.durationSeconds)
                    : lesson.manualDuration || "Capturing..."}
                  <button
                    onClick={() => {
                      setManualDurationInput(
                        lesson.manualDuration ||
                          (lesson.durationSeconds
                            ? formatSecondsToTime(lesson.durationSeconds)
                            : "")
                      );
                      setShowDurationModal(true);
                    }}
                    className="ml-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] underline text-[11px]"
                  >
                    (Edit duration)
                  </button>
                </span>
              </div>
              <ProgressBar value={percentWatched} />
              <div className="flex justify-between text-[11px] text-[var(--color-ink-muted)] pt-0.5">
                <span>
                  {isCompleted
                    ? "Verified 40 mastery points awarded to linked syllabus topics."
                    : "Reach 90% verified watch time to unlock 40 mastery points."}
                </span>
                <span className="font-sans font-semibold tabular-nums">{percentWatched}%</span>
              </div>
            </div>
          </div>

          {/* Timestamped Notes (Autosaved) */}
          <div className="academic-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--color-accent)]" />
                <h3 className="font-serif text-sm font-bold text-[var(--color-ink)]">
                  Lecture Notes & Timestamps
                </h3>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddTimestamp}
                className="gap-1.5 text-xs h-7"
                title="Save current playback position as a clickable timestamp"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                <span>Timestamp Current Time</span>
              </Button>
            </div>

            {/* Clickable Timestamps */}
            {timestamps.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {timestamps.map((ts, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSeekToTimestamp(ts.seconds)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)]/70 px-2.5 py-1 text-xs font-sans font-semibold text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
                    title={`Seek to ${formatSecondsToTime(ts.seconds)}`}
                  >
                    <Play className="h-2.5 w-2.5 fill-current" />
                    <span>{formatSecondsToTime(ts.seconds)}</span>
                    <span className="text-[var(--color-ink-muted)] text-[10px] truncate max-w-[120px]">
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
                rows={5}
                placeholder="Type lecture notes, formulas, theorems, and questions here... (Autosaved automatically; press 'n' to focus)."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs text-[var(--color-ink)] shadow-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)] placeholder:text-[var(--color-ink-muted)]/50 leading-relaxed font-sans"
              />
              <span className="text-[10px] text-[var(--color-ink-muted)] block mt-1">
                Autosaved to your student registry. Press <kbd className="px-1 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] font-sans font-semibold text-[9px]">n</kbd> anywhere to focus notes.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Unit Video Playlist Drawer */}
        <div className="academic-card overflow-hidden shadow-sm flex flex-col h-[740px]">
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 p-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-accent)]">
              {currentUnit ? currentUnit.title : "Course Lectures"}
            </span>
            <h3 className="font-serif text-sm font-bold text-[var(--color-ink)]">
              Unit Playlist
            </h3>
            <span className="text-xs text-[var(--color-ink-muted)]">
              {currentIndex + 1} of {playlistLessons.length} lectures
            </span>
          </div>

          {/* Playlist items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border)]/60 p-2">
            {playlistLessons.map((item, idx) => {
              const isCurrent = item.id === lesson.id;

              return (
                <Link
                  key={item.id}
                  href={`/courses/${courseId}/player/${item.id}`}
                  className={`flex items-start gap-2.5 p-2.5 rounded-[6px] transition-colors ${
                    isCurrent
                      ? "bg-[var(--color-accent)]/10 border-l-2 border-[var(--color-accent)] font-semibold text-[var(--color-ink)]"
                      : "hover:bg-[var(--color-surface-muted)]/60 text-[var(--color-ink-muted)]"
                  }`}
                >
                  {/* Mini Thumbnail */}
                  <div className="relative h-10 w-16 shrink-0 rounded-[4px] overflow-hidden bg-black/20 border border-[var(--color-border)]">
                    <YouTubeThumbnail
                      videoId={item.youtubeVideoId}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-xs line-clamp-2 ${
                        isCurrent ? "text-[var(--color-accent)] font-bold" : "text-[var(--color-ink)]"
                      }`}
                    >
                      {idx + 1}. {item.title}
                    </h4>
                    <span className="text-[10px] text-[var(--color-ink-muted)] block truncate mt-0.5">
                      {item.channelTitle}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Mandatory YouTube & Privacy Legal Footer */}
          <div className="border-t border-[var(--color-border)] p-3 text-[11px] text-[var(--color-ink-muted)] bg-[var(--color-surface-muted)]/30 flex flex-col gap-1">
            <span className="font-semibold text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)]">
              Legal Compliance
            </span>
            <div className="flex items-center gap-2">
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                YouTube Terms of Service
              </a>
              <span>•</span>
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                Google Privacy Policy
              </a>
            </div>
            <span className="text-[10px] text-[var(--color-ink-muted)]/80 italic mt-0.5">
              Official YouTube IFrame Player.
            </span>
          </div>
        </div>
      </div>

      {/* Manual Duration Modal */}
      {showDurationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg">
            <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
              Edit Lecture Duration
            </h3>
            <p className="text-xs text-[var(--color-ink-muted)] mt-1">
              Set the duration in hh:mm:ss or mm:ss format.
            </p>
            <div className="mt-3">
              <input
                type="text"
                placeholder="e.g. 45:30 or 01:15:00"
                value={manualDurationInput}
                onChange={(e) => setManualDurationInput(e.target.value)}
                className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 font-sans font-semibold text-xs text-center tabular-nums text-[var(--color-ink)]"
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
