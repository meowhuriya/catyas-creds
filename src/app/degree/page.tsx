"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Stat } from "@/components/ui/stat";

export default function DegreePage() {
  const { courses } = useDataStore();
  const earnedCredits = courses.reduce((a, c) => a + c.credits, 0);
  const targetCredits = 120;
  const pct = Math.round((earnedCredits / targetCredits) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-app-border pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-app-ink">
            Degree Audit & Academic Progress
          </h1>
          <p className="text-xs text-app-ink-muted mt-0.5">
            Bachelor of Science equivalent curriculum audit (120 Total Credits)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat label="Total Credits Completed" value={earnedCredits} unit={`/ ${targetCredits}`} subtext={`${pct}% of degree completed`} />
        <Stat label="Remaining Requirements" value={targetCredits - earnedCredits} unit="cr" subtext="Upper and lower division coursework" />
        <Stat label="Estimated Graduation" value="Spring 2028" subtext="At 15 credits / semester pace" />
      </div>

      <div className="rounded-card border border-app-border bg-app-surface p-6 space-y-4">
        <h3 className="font-serif text-base font-bold text-app-ink">
          Core Curriculum Audit
        </h3>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-app-ink">Overall Degree Completion</span>
              <span className="font-mono tabular-nums text-app-ink">{earnedCredits} / {targetCredits} cr ({pct}%)</span>
            </div>
            <ProgressBar value={pct} />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-app-ink">Computer Science Core (48 Target)</span>
              <span className="font-mono tabular-nums text-app-ink">4 / 48 cr</span>
            </div>
            <ProgressBar value={(4 / 48) * 100} />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-app-ink">Mathematics & Quantitative Reasoning (24 Target)</span>
              <span className="font-mono tabular-nums text-app-ink">4 / 24 cr</span>
            </div>
            <ProgressBar value={(4 / 24) * 100} />
          </div>
        </div>
      </div>
    </div>
  );
}
