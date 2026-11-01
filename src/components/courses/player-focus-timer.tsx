"use client";

import * as React from "react";
import { Play, Pause, RotateCcw, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDataStore } from "@/lib/repository";
import { useToast } from "@/components/ui/toast";
import { playCollegiateChime } from "@/components/today/focus-timer";

interface PlayerFocusTimerProps {
  courseId: string;
  courseCode?: string;
  className?: string;
}

type TimerPreset = "25m" | "50m" | "5m";

const PRESET_DURATIONS: Record<TimerPreset, number> = {
  "25m": 25 * 60,
  "50m": 50 * 60,
  "5m": 5 * 60,
};

export function PlayerFocusTimer({
  courseId,
  courseCode,
  className = "",
}: PlayerFocusTimerProps) {
  const { dataStore } = useDataStore();
  const toast = useToast();

  const [preset, setPreset] = React.useState<TimerPreset>("25m");
  const [secondsLeft, setSecondsLeft] = React.useState<number>(PRESET_DURATIONS["25m"]);
  const [isRunning, setIsRunning] = React.useState(false);

  // Interval timer tick
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && secondsLeft === 0) {
      setIsRunning(false);
      handleComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  const handleComplete = async () => {
    playCollegiateChime();
    const durationMins = Math.round(PRESET_DURATIONS[preset] / 60);

    try {
      await dataStore.logStudySession({
        courseId,
        durationMinutes: durationMins,
        mode: "custom",
        completedAt: new Date().toISOString(),
      });

      toast.success(
        "Focus Session Complete!",
        `Logged ${durationMins} minutes of study time for ${courseCode || "course"}.`
      );
    } catch (err) {
      console.error("Failed to log study session:", err);
    }

    setSecondsLeft(PRESET_DURATIONS[preset]);
  };

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(PRESET_DURATIONS[preset]);
  };

  const handleSelectPreset = (newPreset: TimerPreset) => {
    setIsRunning(false);
    setPreset(newPreset);
    setSecondsLeft(PRESET_DURATIONS[newPreset]);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div
      className={`inline-flex items-center gap-3 px-3 py-1.5 rounded-[12px] bg-white dark:bg-[#1A1214] border border-[#E4D9C0] dark:border-[#3D2D31] shadow-sm select-none ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-[#8A1627]" />
        <span className="font-serif text-lg font-bold text-[#14161F] dark:text-[#F6EBD3] tabular-nums tracking-wide">
          {timeFormatted}
        </span>
      </div>

      {/* Play/Pause & Reset buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggleRunning}
          className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors text-white ${
            isRunning
              ? "bg-[#D9A441] hover:bg-[#C29035]"
              : "bg-[#A51C30] hover:bg-[#8A1627]"
          }`}
          title={isRunning ? "Pause Timer" : "Start Focus Timer"}
        >
          {isRunning ? (
            <Pause className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="h-7 w-7 rounded-full flex items-center justify-center text-[#4B5160] hover:text-[#14161F] hover:bg-[#FBF6EC] dark:text-[#D1C7B7] dark:hover:bg-[#221A1C] transition-colors"
          title="Reset Timer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Preset pills */}
      <div className="hidden sm:flex items-center gap-1 border-l border-[#E4D9C0] dark:border-[#3D2D31] pl-2.5">
        {(["25m", "50m", "5m"] as TimerPreset[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => handleSelectPreset(p)}
            className={`px-2 py-0.5 rounded-[6px] text-[11px] font-sans font-semibold transition-colors ${
              preset === p
                ? "bg-[#8A1627] text-white"
                : "text-[#4B5160] dark:text-[#D1C7B7] hover:bg-[#FBF6EC] dark:hover:bg-[#221A1C]"
            }`}
          >
            {p === "5m" ? "5m Break" : p}
          </button>
        ))}
      </div>
    </div>
  );
}
