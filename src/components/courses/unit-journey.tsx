"use client";

import * as React from "react";
import { Check, Circle } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Module, Topic } from "@/types/schemas";

interface UnitJourneyProps {
  units: Module[];
  topics: Topic[];
  activeUnitId?: string;
  onSelectUnit?: (unitId: string) => void;
  className?: string;
}

export function UnitJourney({
  units,
  topics,
  activeUnitId,
  onSelectUnit,
  className = "",
}: UnitJourneyProps) {
  if (units.length === 0) return null;

  // Calculate progress percent for each unit
  const unitsWithProgress = units.map((u, idx) => {
    const unitTopics = topics.filter((t) => t.unitId === u.id);
    const completedTopics = unitTopics.filter((t) => t.isDone);
    const percent =
      unitTopics.length > 0
        ? Math.round((completedTopics.length / unitTopics.length) * 100)
        : 0;
    const isFinished = percent === 100 && unitTopics.length > 0;
    const isActive = activeUnitId ? u.id === activeUnitId : idx === 0;

    return {
      ...u,
      displayNum: u.unitNumber || idx + 1,
      topicsCount: unitTopics.length,
      completedCount: completedTopics.length,
      percent,
      isFinished,
      isActive,
    };
  });

  return (
    <div className={`academic-card p-4 sm:p-5 select-none overflow-x-auto ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-accent)]">
            Curricular Roadmap
          </span>
          <h3 className="font-serif text-base font-bold text-[var(--color-ink)]">
            Unit Journey
          </h3>
        </div>
        <span className="text-xs text-[var(--color-ink-muted)]">
          {unitsWithProgress.filter((u) => u.isFinished).length} of {units.length} Units Finished
        </span>
      </div>

      {/* Horizontal roadmap with circles connected by a track line */}
      <div className="relative flex items-center min-w-max py-4 px-2">
        {/* Connecting Line Track */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[3px] bg-[var(--color-border)] rounded-full z-0" />

        <div className="relative z-10 flex items-center justify-between w-full gap-6 sm:gap-10">
          {unitsWithProgress.map((unit, index) => {
            return (
              <button
                key={unit.id}
                onClick={() => onSelectUnit?.(unit.id)}
                className="group flex flex-col items-center focus:outline-none cursor-pointer transition-transform hover:-translate-y-0.5"
                title={`Unit ${unit.displayNum}: ${unit.title} (${unit.percent}%)`}
              >
                {/* Circle Container */}
                <div className="relative flex items-center justify-center">
                  {/* Progress Ring wrapping the circle */}
                  <ProgressRing
                    percentage={unit.percent}
                    size={46}
                    strokeWidth={3.5}
                    color={unit.isFinished ? "#E5A358" : unit.isActive ? "var(--color-accent)" : "var(--color-ink-muted)"}
                    showText={false}
                  />

                  {/* Inner Status Circle */}
                  <div
                    className={`absolute inset-1 rounded-full flex items-center justify-center transition-all ${
                      unit.isFinished
                        ? "bg-[#E5A358] text-white shadow-sm"
                        : unit.isActive
                        ? "bg-[var(--color-accent)] text-white ring-2 ring-[var(--color-accent)]/30 shadow-sm"
                        : "bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border)] group-hover:border-[var(--color-ink-muted)]"
                    }`}
                  >
                    {unit.isFinished ? (
                      <Check className="h-4 w-4 stroke-[3] text-white drop-shadow-sm" />
                    ) : (
                      <span className="font-mono text-xs font-bold tabular-nums">
                        {unit.displayNum}
                      </span>
                    )}
                  </div>
                </div>

                {/* Unit Label & Percent below circle */}
                <span
                  className={`mt-2 font-mono text-[11px] font-semibold tracking-tight transition-colors ${
                    unit.isActive
                      ? "text-[var(--color-accent)] font-bold"
                      : "text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)]"
                  }`}
                >
                  Unit {unit.displayNum}
                </span>

                <span className="text-[10px] text-[var(--color-ink-muted)] tabular-nums">
                  {unit.percent}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
