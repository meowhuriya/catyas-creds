"use client";

import * as React from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/repository";
import {
  Course,
  Topic,
  Lesson,
  LessonProgress,
  StudySession,
  PlannerEvent,
  Module,
} from "@/types/schemas";
import { FocusTimer } from "@/components/today/focus-timer";
import { QuickCheckModal } from "@/components/courses/quick-check-modal";
import { YouTubeThumbnail } from "@/components/courses/youtube-thumbnail";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { formatSecondsToTime } from "@/lib/utils";
import { isRevisionDue } from "@/lib/mastery/spaced-revision";
import {
  Clock,
  Flame,
  Play,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Award,
  Search,
  BookOpen,
  ChevronRight,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function TodayPage() {
  const { dataStore } = useDataStore();

  const [courses, setCourses] = React.useState<Course[]>([]);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [progressList, setProgressList] = React.useState<LessonProgress[]>([]);
  const [studySessions, setStudySessions] = React.useState<StudySession[]>([]);
  const [plannerEvents, setPlannerEvents] = React.useState<PlannerEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Quick Check modal state
  const [quickCheckTopic, setQuickCheckTopic] = React.useState<Topic | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const cList = await dataStore.getCourses();
      setCourses(cList);

      // Load data across active courses
      const allMods: Module[] = [];
      const allTops: Topic[] = [];
      const allLess: Lesson[] = [];
      const allProg: LessonProgress[] = [];

      for (const c of cList) {
        const [m, t, l] = await Promise.all([
          dataStore.getModules(c.id),
          dataStore.getTopics(c.id),
          dataStore.getLessons(c.id),
        ]);
        allMods.push(...m);
        allTops.push(...t);
        allLess.push(...l);

        for (const lessonItem of l) {
          const prog = await dataStore.getLessonProgress(lessonItem.id);
          if (prog) allProg.push(prog);
        }
      }

      const [sessions, events] = await Promise.all([
        dataStore.getStudySessions(),
        dataStore.getPlannerEvents(),
      ]);

      setModules(allMods);
      setTopics(allTops);
      setLessons(allLess);
      setProgressList(allProg);
      setStudySessions(sessions);
      setPlannerEvents(events);
    } catch (err) {
      console.error("Failed to load Today page data:", err);
    } finally {
      setLoading(false);
    }
  }, [dataStore]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // 1. Spaced Revision Queue: Topics due for revision today
  const dueRevisions = React.useMemo(() => {
    const now = new Date();
    return topics
      .filter((t) => t.isDone && isRevisionDue(t.revisionDueAt, now))
      .sort((a, b) => (a.revisionDueAt || "").localeCompare(b.revisionDueAt || ""));
  }, [topics]);

  // 2. Continue Watching Queue: in-progress videos (>0% and <90%)
  const continueWatching = React.useMemo(() => {
    return progressList
      .filter((p) => p.percentWatched > 0 && !p.isCompleted && p.percentWatched < 90)
      .map((p) => {
        const lesson = lessons.find((l) => l.id === p.lessonId);
        const course = courses.find((c) => c.id === p.courseId);
        return { progress: p, lesson, course };
      })
      .filter((item) => item.lesson !== undefined)
      .sort((a, b) => b.progress.percentWatched - a.progress.percentWatched);
  }, [progressList, lessons, courses]);

  // 3. Suggested Focus Topic:
  // Prioritize earliest due revision, or lowest scoring unfinished topic
  const suggestedFocusTopic = React.useMemo(() => {
    if (dueRevisions.length > 0) {
      return dueRevisions[0];
    }
    const unfinished = topics
      .filter((t) => !t.isDone)
      .sort((a, b) => a.topicScore - b.topicScore);
    return unfinished.length > 0 ? unfinished[0] : null;
  }, [dueRevisions, topics]);

  // 4. Weakest Topics Across Active Courses (up to 5 lowest scoring)
  const weakestTopics = React.useMemo(() => {
    return topics
      .filter((t) => !t.isDone)
      .sort((a, b) => a.topicScore - b.topicScore)
      .slice(0, 5);
  }, [topics]);

  // 5. Today's study stats & streak calculation
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = studySessions.filter((s) => s.completedAt.startsWith(todayStr));
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const todayHours = (todayMinutes / 60).toFixed(1);

  // Daily study streak
  const streakDays = React.useMemo(() => {
    const activeDates = new Set(studySessions.map((s) => s.completedAt.split("T")[0]));
    // Include today if there is a session or baseline streak
    let streak = 0;
    const checkDate = new Date();
    for (let i = 0; i < 60; i++) {
      const dStr = checkDate.toISOString().split("T")[0];
      if (activeDates.has(dStr) || i === 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return Math.max(1, streak);
  }, [studySessions]);

  // Upcoming deadlines (next 7 days)
  const upcomingEvents = React.useMemo(() => {
    return plannerEvents
      .filter((e) => !e.isDone && e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
  }, [plannerEvents, todayStr]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-xs text-[var(--color-ink-muted)]">
        Loading today&apos;s academic study plan...
      </div>
    );
  }

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const focusCourse = courses.find((c) => c.id === suggestedFocusTopic?.courseId);

  return (
    <div className="space-y-6">
      {/* Top Academic Hero Banner */}
      <div className="relative overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-sm">
        <div className="h-[2px] absolute top-0 left-0 right-0 bg-gradient-to-r from-[var(--color-accent)] via-[#FFE8C4] to-[var(--color-accent)]" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-accent)] font-bold">
              {todayFormatted}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--color-ink)] tracking-tight">
              Welcome to Today&apos;s Study Block, Valeria
            </h1>
            <p className="text-xs text-[var(--color-ink-muted)] max-w-xl leading-relaxed">
              Maintain your academic cadence with verified video study, spaced topic revisions, and focused study blocks.
            </p>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            {/* Streak Chip */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 shadow-xs">
              <Flame className="h-4 w-4 text-amber-600 fill-amber-500" />
              <div>
                <span className="font-serif text-sm font-bold block leading-none">
                  {streakDays}-Day
                </span>
                <span className="text-[9px] uppercase font-mono tracking-wider opacity-80">
                  Study Streak
                </span>
              </div>
            </div>

            {/* Today Focus Hours */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-[var(--color-ink)] shadow-xs">
              <Clock className="h-4 w-4 text-[var(--color-accent)]" />
              <div>
                <span className="font-serif text-sm font-bold block leading-none">
                  {todayHours} hrs
                </span>
                <span className="text-[9px] uppercase font-mono tracking-wider text-[var(--color-ink-muted)]">
                  Today Logged
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Academic Grid: Left (Coursework) + Right (Tools & Schedule) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Focus Topic, Continue Watching, Spaced Revision */}
        <div className="lg:col-span-2 space-y-5">
          {/* 1. Suggested Focus Topic of the Day */}
          {suggestedFocusTopic && (
            <div className="academic-card p-5 relative overflow-hidden border-[#FFE8C4] bg-[var(--color-surface)] shadow-sm">
              <div className="h-[2px] absolute top-0 left-0 right-0 bg-gradient-to-r from-[var(--color-accent)] via-[#FFE8C4] to-transparent" />

              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]/70 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#E5A358]" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-accent)]">
                    Recommended Focus Topic
                  </span>
                </div>
                {focusCourse && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/20">
                    {focusCourse.code}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-serif text-base sm:text-lg font-bold text-[var(--color-ink)]">
                  {suggestedFocusTopic.title}
                </h3>

                {/* Mastery Breakdown */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
                    <span>
                      Current Mastery:{" "}
                      <strong className="text-[var(--color-ink)] font-mono tabular-nums">
                        {suggestedFocusTopic.topicScore}/100
                      </strong>{" "}
                      (Watch: {suggestedFocusTopic.watchScore}/40 • Check: {suggestedFocusTopic.checkScore}/60)
                    </span>
                    <span className="font-mono text-[11px]">
                      {suggestedFocusTopic.isDone ? "Done (>= 70)" : "Learning"}
                    </span>
                  </div>
                  <ProgressBar value={suggestedFocusTopic.topicScore} />
                </div>

                {/* Actions: Quick Check, Find Videos, Go to Course */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => setQuickCheckTopic(suggestedFocusTopic)}
                    className="gap-1.5 text-xs bg-[var(--color-accent)] hover:opacity-90 text-white font-semibold shadow-xs"
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>Take Quick Check (3-5 Questions)</span>
                  </Button>

                  {focusCourse && (
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                        `${focusCourse.title} ${suggestedFocusTopic.title}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)] transition-colors shadow-xs"
                    >
                      <Search className="h-3 w-3 text-[var(--color-ink-muted)]" />
                      <span>Find Videos</span>
                    </a>
                  )}

                  {focusCourse && (
                    <Link
                      href={`/courses/${focusCourse.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)] transition-colors"
                    >
                      <span>Open Course</span>
                      <ArrowRight className="h-3 w-3 ml-0.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. Continue Watching Queue */}
          <div className="academic-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]/70">
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-[var(--color-accent)]" />
                <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
                  Continue Watching
                </h3>
              </div>
              <span className="text-xs text-[var(--color-ink-muted)] font-mono">
                {continueWatching.length} in progress
              </span>
            </div>

            {continueWatching.length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--color-ink-muted)]">
                No videos in progress. Open any course lecture to start watching with verified tracking.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {continueWatching.map(({ progress, lesson, course }) => {
                  if (!lesson) return null;
                  const percent = Math.round(progress.percentWatched);

                  return (
                    <div
                      key={lesson.id}
                      className="group flex flex-col overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs hover:border-[var(--color-ink-muted)]/50 transition-all"
                    >
                      <Link
                        href={`/courses/${course?.id}/player/${lesson.id}`}
                        className="relative aspect-video w-full overflow-hidden bg-black/60 block"
                      >
                        <YouTubeThumbnail
                          videoId={lesson.youtubeVideoId}
                          alt={lesson.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-[4px] bg-black/80 font-mono text-[10px] font-semibold text-white tabular-nums">
                          {formatSecondsToTime(progress.lastPositionSeconds || 0)}
                        </span>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                          <div
                            className="h-full bg-[var(--color-accent)]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </Link>

                      <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-[var(--color-ink-muted)]">
                            <span className="font-semibold">{lesson.channelTitle}</span>
                            <span className="font-mono tabular-nums">{percent}% watched</span>
                          </div>
                          <h4 className="font-serif text-xs font-bold text-[var(--color-ink)] line-clamp-2 mt-0.5 group-hover:text-[var(--color-accent)] transition-colors">
                            {lesson.title}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-[var(--color-border)]/60 flex items-center justify-between">
                          <Link
                            href={`/courses/${course?.id}/player/${lesson.id}`}
                            className="text-xs font-semibold text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
                          >
                            <span>Resume</span>
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                          {course && (
                            <span className="text-[10px] font-mono text-[var(--color-ink-muted)]">
                              {course.code}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Topics Due for Spaced Revision */}
          <div className="academic-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]/70">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-[var(--color-accent)]" />
                <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
                  Spaced Revision Queue
                </h3>
              </div>
              <span className="text-xs text-[var(--color-ink-muted)] font-mono">
                {dueRevisions.length} due
              </span>
            </div>

            {dueRevisions.length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--color-ink-muted)]">
                You are completely up to date on all spaced revisions. Retention is verified and active!
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]/60 border rounded-[8px] border-[var(--color-border)] bg-[var(--color-surface)]">
                {dueRevisions.map((t) => {
                  const course = courses.find((c) => c.id === t.courseId);

                  return (
                    <div
                      key={t.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-[var(--color-surface-muted)]/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {course && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] border border-[var(--color-border)]">
                              {course.code}
                            </span>
                          )}
                          <span className="text-[10px] uppercase font-bold text-[var(--color-accent)]">
                            Revision Due
                          </span>
                        </div>
                        <h4 className="font-serif text-xs font-bold text-[var(--color-ink)] truncate mt-0.5">
                          {t.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                          <span>Mastery: {t.topicScore}/100</span>
                          <span>•</span>
                          <span>Due: {t.revisionDueAt || "Today"}</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => setQuickCheckTopic(t)}
                        className="gap-1 text-xs shrink-0 bg-[var(--color-accent)] text-white hover:opacity-90 font-semibold shadow-xs"
                      >
                        <Award className="h-3 w-3" />
                        <span>Re-check</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Weakest Topics Across All Active Courses */}
          <div className="academic-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]/70">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
                  Weakest Topics (Priority Practice)
                </h3>
              </div>
              <span className="text-xs text-[var(--color-ink-muted)]">
                Lowest Mastery Score
              </span>
            </div>

            <div className="divide-y divide-[var(--color-border)]/60 border rounded-[8px] border-[var(--color-border)] bg-[var(--color-surface)]">
              {weakestTopics.map((top) => {
                const c = courses.find((course) => course.id === top.courseId);

                return (
                  <div
                    key={top.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-[var(--color-surface-muted)]/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {c && (
                          <span className="text-[10px] font-mono font-bold text-[var(--color-ink-muted)]">
                            {c.code}
                          </span>
                        )}
                        <span className="text-[10px] font-mono font-semibold text-amber-700 dark:text-amber-400">
                          {top.topicScore}/100 Pts
                        </span>
                      </div>
                      <h4 className="font-serif text-xs font-bold text-[var(--color-ink)] truncate mt-0.5">
                        {top.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {c && (
                        <a
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                            `${c.title} ${top.title}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-muted)] transition-colors inline-flex items-center gap-1 shadow-xs"
                          title="Search lectures on YouTube"
                        >
                          <Search className="h-3 w-3 text-[var(--color-ink-muted)]" />
                          <span className="hidden sm:inline">Find Videos</span>
                        </a>
                      )}

                      <Button
                        size="sm"
                        onClick={() => setQuickCheckTopic(top)}
                        className="text-xs h-7 gap-1"
                      >
                        <Award className="h-3 w-3" />
                        <span>Quick Check</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Focus Timer & Schedule */}
        <div className="space-y-5">
          {/* 1. Collegiate Focus Timer Widget */}
          <FocusTimer courses={courses} onSessionComplete={loadData} />

          {/* 2. Upcoming Academic Milestones */}
          <div className="academic-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]/70">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--color-accent)]" />
                <h3 className="font-serif text-sm font-bold text-[var(--color-ink)]">
                  Upcoming Milestones
                </h3>
              </div>
              <Link
                href="/planner"
                className="text-[11px] font-semibold text-[var(--color-accent)] hover:underline"
              >
                Planner →
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="py-4 text-center text-xs text-[var(--color-ink-muted)]">
                No deadlines due in the next 7 days.
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent)] font-bold block">
                        {evt.type.replace("_", " ")}
                      </span>
                      <h4 className="font-serif text-xs font-bold text-[var(--color-ink)] truncate mt-0.5">
                        {evt.title}
                      </h4>
                      <span className="text-[11px] text-[var(--color-ink-muted)] block mt-0.5 font-mono">
                        Date: {evt.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Daily Study Discipline Summary */}
          <div className="academic-card p-5 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]/70">
              <BookOpen className="h-4 w-4 text-[var(--color-accent)]" />
              <h3 className="font-serif text-sm font-bold text-[var(--color-ink)]">
                Daily Discipline
              </h3>
            </div>

            <div className="text-xs space-y-2 text-[var(--color-ink-muted)]">
              <div className="flex justify-between">
                <span>Daily Target:</span>
                <span className="font-mono font-semibold text-[var(--color-ink)]">
                  2.0 Hours
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hours Logged Today:</span>
                <span className="font-mono font-bold text-[var(--color-accent)]">
                  {todayHours} Hours
                </span>
              </div>
              <div className="flex justify-between">
                <span>Completed Sessions:</span>
                <span className="font-mono font-semibold text-[var(--color-ink)]">
                  {todaySessions.length} sessions
                </span>
              </div>
              <div className="flex justify-between">
                <span>Active Study Streak:</span>
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                  {streakDays} days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Check Modal */}
      <QuickCheckModal
        topic={quickCheckTopic}
        open={Boolean(quickCheckTopic)}
        onOpenChange={(open) => {
          if (!open) setQuickCheckTopic(null);
        }}
        onSuccess={loadData}
      />
    </div>
  );
}
