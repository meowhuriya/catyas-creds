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

interface WeeklyHoursChartProps {
  className?: string;
}

export function WeeklyHoursChart({ className = "" }: WeeklyHoursChartProps) {
  // 7 days of the current week (Mon-Sun)
  const data = [
    { day: "Mon", hours: 2.8, target: 3.0 },
    { day: "Tue", hours: 3.5, target: 3.0 },
    { day: "Wed", hours: 1.5, target: 3.0 },
    { day: "Thu", hours: 4.2, target: 3.0 },
    { day: "Fri", hours: 3.0, target: 3.0 },
    { day: "Sat", hours: 5.1, target: 3.0 },
    { day: "Sun", hours: 2.4, target: 3.0 },
  ];

  const totalWeekHours = data.reduce((acc, d) => acc + d.hours, 0).toFixed(1);

  return (
    <div className={`academic-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
            Weekly Study Hours
          </h3>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Verified lecture time & focus session logs
          </p>
        </div>
        <div className="text-right">
          <span className="font-serif text-lg font-bold text-[var(--color-accent)] tabular-nums">
            {totalWeekHours} hrs
          </span>
          <span className="block text-[10px] text-[var(--color-ink-muted)] uppercase tracking-wider">
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
              tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-ink-muted)", fontSize: 11 }}
              tickFormatter={(v) => `${v}h`}
            />
            <Tooltip
              cursor={{ fill: "var(--color-surface-muted)", opacity: 0.5 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1.5 shadow-sm text-xs">
                      <span className="font-semibold text-[var(--color-ink)]">
                        {item.day}: {item.hours} hours
                      </span>
                      <span className="block text-[10px] text-[#E5A358]">
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
                  fill={entry.hours >= entry.target ? "#D85870" : "#E5A358"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--color-ink-muted)] border-t border-[var(--color-border)]/60 pt-2.5">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#D85870]" /> Met Daily Target
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#E5A358]" /> Under Target
        </span>
      </div>
    </div>
  );
}
