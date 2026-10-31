"use client";

import * as React from "react";
import { Play, Pause, RotateCcw, Clock, Bell, Volume2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Course } from "@/types/schemas";
import { useDataStore } from "@/lib/repository";
import { useToast } from "@/components/ui/toast";

interface FocusTimerProps {
  courses: Course[];
  className?: string;
  onSessionComplete?: () => void;
}

type TimerMode = "pomodoro" | "short_break" | "long_break" | "custom";

const MODE_DURATIONS: Record<TimerMode, number> = {
  pomodoro: 25 * 60,
  short_break: 5 * 60,
  long_break: 15 * 60,
  custom: 45 * 60,
};

function playCollegiateChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Polite chime: Harmonic chord (587.33Hz D5 ascending to 880Hz A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch {
    // AudioContext blocked or not supported
  }
}

export function FocusTimer({
  courses,
  className = "",
  onSessionComplete,
}: FocusTimerProps) {
  const { dataStore, refreshData } = useDataStore();
  const toast = useToast();

  const [mode, setMode] = React.useState<TimerMode>("pomodoro");
  const [selectedCourseId, setSelectedCourseId] = React.useState<string>(
    courses[0]?.id || ""
  );
  const [secondsLeft, setSecondsLeft] = React.useState(MODE_DURATIONS.pomodoro);
  const [isRunning, setIsRunning] = React.useState(false);
  const [customMinutes, setCustomMinutes] = React.useState(45);

  // Keep selected course aligned if courses array loads after mount
  React.useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const totalDurationSeconds =
    mode === "custom" ? customMinutes * 60 : MODE_DURATIONS[mode];

  // Tick timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      setIsRunning(false);
      handleTimerComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  const handleTimerComplete = async () => {
    playCollegiateChime();

    const loggedMinutes = Math.round(totalDurationSeconds / 60);
    const courseObj = courses.find((c) => c.id === selectedCourseId);
    const courseLabel = courseObj ? `${courseObj.code}` : "Independent Study";

    try {
      await dataStore.logStudySession({
        courseId: selectedCourseId || undefined,
        durationMinutes: loggedMinutes,
        mode,
        completedAt: new Date().toISOString(),
      });

      await dataStore.logAudit(
        "session_completed",
        selectedCourseId || "study",
        `Focus timer completed: logged ${loggedMinutes} mins for ${courseLabel}.`
      );

      await refreshData();
      onSessionComplete?.();

      toast.success(
        "Study Session Logged!",
        `${loggedMinutes} minutes recorded for ${courseLabel}. Keep up the steady momentum!`
      );
    } catch (err) {
      console.error("Failed to log study session:", err);
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === "custom") {
      setSecondsLeft(customMinutes * 60);
    } else {
      setSecondsLeft(MODE_DURATIONS[newMode]);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(totalDurationSeconds);
  };

  const handleCustomChange = (mins: number) => {
    const clean = Math.max(1, Math.min(180, mins));
    setCustomMinutes(clean);
    if (mode === "custom") {
      setIsRunning(false);
      setSecondsLeft(clean * 60);
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((totalDurationSeconds - secondsLeft) / totalDurationSeconds) * 100)
  );

  return (
    <div className={`academic-card p-4 sm:p-5 select-none ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]/70 mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-accent)]">
            Focus & Discipline
          </span>
          <h3 className="font-serif text-base font-bold text-[var(--color-ink)] flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[var(--color-accent)]" />
            <span>Collegiate Focus Timer</span>
          </h3>
        </div>

        {/* Chime indicator badge */}
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] text-[10px] font-mono border border-[var(--color-border)]"
          title="Gentle acoustic chime plays upon timer completion"
        >
          <Volume2 className="h-3 w-3" />
          <span>Chime active</span>
        </span>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-[8px] bg-[var(--color-surface-muted)] text-xs mb-4">
        <button
          type="button"
          onClick={() => switchMode("pomodoro")}
          className={`flex-1 py-1 rounded-[6px] font-semibold transition-colors ${
            mode === "pomodoro"
              ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs"
              : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          25m Focus
        </button>
        <button
          type="button"
          onClick={() => switchMode("short_break")}
          className={`flex-1 py-1 rounded-[6px] font-semibold transition-colors ${
            mode === "short_break"
              ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs"
              : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          5m Break
        </button>
        <button
          type="button"
          onClick={() => switchMode("long_break")}
          className={`flex-1 py-1 rounded-[6px] font-semibold transition-colors ${
            mode === "long_break"
              ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs"
              : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          15m Rest
        </button>
        <button
          type="button"
          onClick={() => switchMode("custom")}
          className={`flex-1 py-1 rounded-[6px] font-semibold transition-colors ${
            mode === "custom"
              ? "bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs"
              : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
          }`}
        >
          Custom
        </button>
      </div>

      {/* Main Clock Face & Progress */}
      <div className="text-center py-4 relative">
        <div className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-[var(--color-ink)] tabular-nums">
          {timeFormatted}
        </div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-ink-muted)] block mt-1">
          {isRunning
            ? "Session in Progress"
            : secondsLeft === 0
            ? "Session Completed"
            : "Ready to Start"}
        </span>

        {/* Thin crimson progress hairline */}
        <div className="w-full max-w-xs mx-auto h-1.5 rounded-full bg-[var(--color-surface-muted)] overflow-hidden mt-4 border border-[var(--color-border)]">
          <div
            className="h-full bg-[var(--color-accent)] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Custom Duration Input (When in Custom Mode) */}
      {mode === "custom" && (
        <div className="flex items-center justify-center gap-2 mb-4 text-xs">
          <span className="text-[var(--color-ink-muted)]">Target Minutes:</span>
          <input
            type="number"
            min={1}
            max={180}
            value={customMinutes}
            onChange={(e) => handleCustomChange(parseInt(e.target.value) || 25)}
            className="w-16 h-7 rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] text-center font-mono font-bold text-xs"
          />
        </div>
      )}

      {/* Course Tagging Dropdown */}
      <div className="mb-4">
        <label className="block text-[11px] font-semibold text-[var(--color-ink-muted)] mb-1">
          Tag Study Session to Course:
        </label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="flex h-8 w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-ink)] shadow-xs outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} — {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Play / Pause / Reset Controls */}
      <div className="flex items-center justify-center gap-2.5 pt-1">
        <Button
          size="sm"
          onClick={() => setIsRunning(!isRunning)}
          className={`gap-1.5 px-6 font-semibold shadow-xs ${
            isRunning
              ? "bg-amber-600 hover:bg-amber-700 text-white"
              : "bg-[var(--color-accent)] hover:opacity-90 text-white"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="h-4 w-4" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 ml-0.5" />
              <span>{secondsLeft === totalDurationSeconds ? "Start Focus" : "Resume"}</span>
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="gap-1.5 text-xs"
          title="Reset timer to beginning"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset</span>
        </Button>
      </div>
    </div>
  );
}
