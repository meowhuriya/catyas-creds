"use client";

import * as React from "react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { StudySession } from "@/types/schemas";

interface StudyHeatmapProps {
  sessions?: StudySession[];
  className?: string;
}

export function StudyHeatmap({ sessions = [], className = "" }: StudyHeatmapProps) {
  // Generate 84 days (12 weeks) ending today
  const days = React.useMemo(() => {
    const today = new Date();
    const intervalDays = eachDayOfInterval({
      start: subDays(today, 83),
      end: today,
    });

    // Compute minutes map per day YYYY-MM-DD
    const minutesByDate: Record<string, number> = {};
    sessions.forEach((s) => {
      const dateKey = s.completedAt.split("T")[0];
      minutesByDate[dateKey] = (minutesByDate[dateKey] || 0) + s.durationMinutes;
    });

    return intervalDays.map((d) => {
      const dateKey = format(d, "yyyy-MM-dd");
      const minutes = minutesByDate[dateKey] || 0;
      let level = 0;
      if (minutes > 120) level = 4;
      else if (minutes > 60) level = 3;
      else if (minutes > 30) level = 2;
      else if (minutes > 0) level = 1;

      return {
        date: d,
        dateKey,
        minutes,
        hours: (minutes / 60).toFixed(1),
        level,
      };
    });
  }, [sessions]);

  // Group into 12 columns of 7 days
  const weeks = React.useMemo(() => {
    const w: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      w.push(days.slice(i, i + 7));
    }
    return w;
  }, [days]);

  // Color mapping based on intensity levels
  const levelColors = [
    "bg-[var(--color-surface-muted)] dark:bg-[var(--color-surface-muted)] border border-[var(--color-border)]/50",
    "bg-[#C79A3B]/30 border border-[#C79A3B]/40",
    "bg-[#C79A3B]/60 border border-[#C79A3B]/70",
    "bg-[#A51C30]/75 border border-[#A51C30]/80",
    "bg-[#A51C30] border border-[#A51C30]",
  ];

  const totalHours = (
    days.reduce((acc, d) => acc + d.minutes, 0) / 60
  ).toFixed(1);

  return (
    <div className={`academic-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
            12-Week Study Matrix
          </h3>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Daily lecture study and focused retention density
          </p>
        </div>
        <div className="text-right">
          <span className="font-serif text-lg font-bold text-[var(--color-accent)] tabular-nums">
            {totalHours} hrs
          </span>
          <span className="block text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider">
            84 Days Total
          </span>
        </div>
      </div>

      {/* Grid of Weeks */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-1.5 min-w-full">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1.5">
              {week.map((day) => (
                <div
                  key={day.dateKey}
                  title={`${day.dateKey}: ${day.hours} hours studied`}
                  className={`h-3 w-3 rounded-[3px] transition-transform hover:scale-125 cursor-pointer ${
                    levelColors[day.level]
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--color-ink-muted)] border-t border-[var(--color-border)]/60 pt-2.5">
        <span>Less active</span>
        <div className="flex items-center gap-1.5">
          {levelColors.map((colorClass, idx) => (
            <span
              key={idx}
              className={`h-2.5 w-2.5 rounded-[2px] ${colorClass}`}
            />
          ))}
        </div>
        <span>High focus</span>
      </div>
    </div>
  );
}
