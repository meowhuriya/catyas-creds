"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { StudySession, Lesson } from "@/types/schemas";

interface WeeklyHoursChartProps {
  sessions?: StudySession[];
  lessons?: Lesson[];
  className?: string;
}

export function WeeklyHoursChart({
  sessions = [],
  className = "",
}: WeeklyHoursChartProps) {
  // Real study sessions calculated for 7 days of the current week (Mon-Sun)
  const data = React.useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMon = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon);
    monday.setHours(0, 0, 0, 0);

    return days.map((day, idx) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + idx);
      const yyyyMmDd = dayDate.toISOString().split("T")[0];

      const dayMinutes = (sessions || [])
        .filter((s) => s.completedAt && s.completedAt.startsWith(yyyyMmDd))
        .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

      const hours = Number((dayMinutes / 60).toFixed(1));
      return {
        day,
        hours,
        target: 3.0,
      };
    });
  }, [sessions]);

  const totalWeekHours = data.reduce((acc, d) => acc + d.hours, 0).toFixed(1);

  return (
    <div className={`academic-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
            Weekly Study Hours
          </h3>
          <p className="text-sm text-[var(--color-secondary)]">
            Verified lecture time & focus session logs
          </p>
        </div>
        <div className="text-right">
          <span className="font-serif text-lg font-bold text-[var(--color-crimson)] tabular-nums">
            {totalWeekHours} hrs
          </span>
          <span className="block eyebrow-label">
            This Week
          </span>
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              tick={{ fill: "var(--color-secondary)", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-secondary)", fontSize: 12 }}
              tickFormatter={(v) => `${v}h`}
            />
            <Tooltip
              cursor={{ fill: "var(--color-surface-muted)", opacity: 0.5 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-sm text-sm">
                      <span className="font-medium text-[var(--color-ink)]">
                        {item.day}: {item.hours} hours
                      </span>
                      <span className="block text-xs text-[#D9A441] font-semibold mt-0.5">
                        Target: {item.target}h
                      </span>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.hours >= entry.target ? "#5E7B5B" : "#C62F3C"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-secondary)] border-t border-[var(--color-border)]/60 pt-2.5">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#5E7B5B]" />
          Target met (≥ 3h)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#C62F3C]" />
          Under target
        </span>
      </div>
    </div>
  );
}
