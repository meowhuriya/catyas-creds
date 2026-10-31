"use client";

import * as React from "react";
import { Course, Assessment, Attempt, Submission } from "@/types/schemas";
import {
  calculateCourseGrades,
  calculateWhatIfRequirement,
  getGradeScaleMapping,
} from "@/lib/grading/grading-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, RotateCcw, Target, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

interface WhatIfCalculatorProps {
  course: Course;
  assessments: Assessment[];
  attempts: Attempt[];
  submissions: Submission[];
  lessonCompletionPercent: number;
  scale?: "10_point" | "4_point";
}

export function WhatIfCalculator({
  course,
  assessments,
  attempts,
  submissions,
  lessonCompletionPercent,
  scale = "10_point",
}: WhatIfCalculatorProps) {
  // Determine which assessments are already completed vs pending
  const assessmentStatus = React.useMemo(() => {
    return assessments.map((asm) => {
      let earned: number | null = null;
      if (asm.type === "assignment") {
        const sub = submissions.find((s) => s.assessmentId === asm.id);
        if (sub) earned = sub.finalScore;
      } else {
        const asmAtts = attempts.filter((a) => a.assessmentId === asm.id && a.isCompleted);
        if (asmAtts.length > 0) {
          earned = Math.max(...asmAtts.map((a) => a.score));
        }
      }
      return {
        assessment: asm,
        isCompleted: earned !== null,
        actualEarned: earned,
      };
    });
  }, [assessments, attempts, submissions]);

  // Hypothetical scores map: assessmentId -> hypothetical points
  const [hypotheticalScores, setHypotheticalScores] = React.useState<Record<string, number>>({});
  const [targetPercentage, setTargetPercentage] = React.useState<number>(
    scale === "10_point" ? 90 : 93
  );

  // Initialize or reset hypothetical scores
  const resetHypothetical = React.useCallback(() => {
    const defaults: Record<string, number> = {};
    assessmentStatus.forEach((item) => {
      if (!item.isCompleted) {
        defaults[item.assessment.id] = Math.round(item.assessment.maxPoints * 0.85); // default 85% projection
      }
    });
    setHypotheticalScores(defaults);
  }, [assessmentStatus]);

  React.useEffect(() => {
    resetHypothetical();
  }, [resetHypothetical]);

  // Combine actual + hypothetical data for simulation
  const simulatedAttempts = React.useMemo(() => {
    const list: Attempt[] = [...attempts];
    assessmentStatus.forEach((item) => {
      if (!item.isCompleted && item.assessment.type !== "assignment") {
        const hypoPts = hypotheticalScores[item.assessment.id] ?? 0;
        list.push({
          id: "hypo-att-" + item.assessment.id,
          userId: "hypo",
          assessmentId: item.assessment.id,
          courseId: course.id,
          answers: {},
          score: hypoPts,
          maxPoints: item.assessment.maxPoints,
          percentage: Math.round((hypoPts / item.assessment.maxPoints) * 100),
          startedAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          isCompleted: true,
        });
      }
    });
    return list;
  }, [attempts, assessmentStatus, hypotheticalScores, course.id]);

  const simulatedSubmissions = React.useMemo(() => {
    const list: Submission[] = [...submissions];
    assessmentStatus.forEach((item) => {
      if (!item.isCompleted && item.assessment.type === "assignment") {
        const hypoPts = hypotheticalScores[item.assessment.id] ?? 0;
        list.push({
          id: "hypo-sub-" + item.assessment.id,
          userId: "hypo",
          assessmentId: item.assessment.id,
          courseId: course.id,
          submissionType: "link",
          content: "hypothetical",
          selfAssessment: { criteriaMarks: [] },
          finalScore: hypoPts,
          gradedAt: new Date().toISOString(),
        });
      }
    });
    return list;
  }, [submissions, assessmentStatus, hypotheticalScores, course.id]);

  // Simulated Grade Result
  const simulatedGrade = React.useMemo(() => {
    return calculateCourseGrades(
      course,
      lessonCompletionPercent,
      assessments,
      simulatedAttempts,
      simulatedSubmissions,
      scale
    );
  }, [course, lessonCompletionPercent, assessments, simulatedAttempts, simulatedSubmissions, scale]);

  // Baseline Grade Result
  const baselineGrade = React.useMemo(() => {
    return calculateCourseGrades(
      course,
      lessonCompletionPercent,
      assessments,
      attempts,
      submissions,
      scale
    );
  }, [course, lessonCompletionPercent, assessments, attempts, submissions, scale]);

  // Target solver
  const targetRequirement = React.useMemo(() => {
    return calculateWhatIfRequirement(
      baselineGrade.projectedFinalGrade,
      targetPercentage,
      Math.max(0, 100 - baselineGrade.projectedFinalGrade)
    );
  }, [baselineGrade.projectedFinalGrade, targetPercentage]);

  const uncompletedCount = assessmentStatus.filter((i) => !i.isCompleted).length;

  return (
    <div className="rounded-card border border-app-border bg-app-surface p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-control bg-app-accent/10 text-app-accent">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-app-ink">
              What-If Grade Simulator & Target Solver
            </h3>
            <p className="text-xs text-app-ink-muted">
              Adjust hypothetical scores on remaining coursework to forecast your final standing.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={resetHypothetical}
          className="gap-1.5 text-xs"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset Scenarios</span>
        </Button>
      </div>

      {/* Forecast Output Comparison Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-control border border-app-border bg-app-surface-muted/30 p-3">
          <span className="text-[10px] font-semibold uppercase text-app-ink-muted block">
            Baseline Final Projection
          </span>
          <span className="font-serif text-2xl font-bold text-app-ink tabular-nums mt-0.5 block">
            {baselineGrade.projectedFinalGrade}%
          </span>
          <span className="text-[10px] text-app-ink-muted block mt-0.5">
            Grade: {baselineGrade.letter} ({baselineGrade.points.toFixed(1)} GP)
          </span>
        </div>

        <div className="rounded-control border border-app-accent/40 bg-app-accent/5 p-3">
          <span className="text-[10px] font-semibold uppercase text-app-accent block">
            Simulated Final Score
          </span>
          <span className="font-serif text-2xl font-bold text-app-accent tabular-nums mt-0.5 block">
            {simulatedGrade.projectedFinalGrade}%
          </span>
          <span className="text-[10px] text-app-accent font-medium block mt-0.5">
            Grade: {simulatedGrade.letter} ({simulatedGrade.points.toFixed(1)} GP)
          </span>
        </div>

        <div className="rounded-control border border-app-border bg-app-surface-muted/30 p-3">
          <span className="text-[10px] font-semibold uppercase text-app-ink-muted block">
            Net Score Uplift
          </span>
          <span className="font-serif text-2xl font-bold text-emerald-600 tabular-nums mt-0.5 block">
            +{(simulatedGrade.projectedFinalGrade - baselineGrade.projectedFinalGrade).toFixed(1)}%
          </span>
          <span className="text-[10px] text-app-ink-muted block mt-0.5">
            From hypothetical work
          </span>
        </div>

        <div className="rounded-control border border-app-border bg-app-surface-muted/30 p-3">
          <span className="text-[10px] font-semibold uppercase text-app-ink-muted block">
            Remaining Items
          </span>
          <span className="font-serif text-2xl font-bold text-app-ink tabular-nums mt-0.5 block">
            {uncompletedCount}
          </span>
          <span className="text-[10px] text-app-ink-muted block mt-0.5">
            of {assessments.length} assessments
          </span>
        </div>
      </div>

      {/* Target Grade Requirement Solver Box */}
      <div className="rounded-control border border-app-border bg-app-surface-muted/40 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-app-accent" />
            <span className="font-semibold text-xs text-app-ink">
              Target Grade Solver
            </span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-app-ink-muted font-medium">Desired Grade:</label>
            <select
              value={targetPercentage}
              onChange={(e) => setTargetPercentage(Number(e.target.value))}
              className="rounded-control border border-app-border bg-app-surface px-2.5 py-1 text-xs font-semibold text-app-ink"
            >
              {scale === "10_point" ? (
                <>
                  <option value={90}>Grade O (Outstanding &ge; 90%)</option>
                  <option value={80}>Grade A+ (Excellent &ge; 80%)</option>
                  <option value={70}>Grade A (Very Good &ge; 70%)</option>
                  <option value={60}>Grade B+ (Good &ge; 60%)</option>
                  <option value={50}>Grade B (Above Average &ge; 50%)</option>
                  <option value={40}>Grade P (Pass &ge; 40%)</option>
                </>
              ) : (
                <>
                  <option value={93}>Grade A (4.0 &ge; 93%)</option>
                  <option value={90}>Grade A- (3.7 &ge; 90%)</option>
                  <option value={87}>Grade B+ (3.3 &ge; 87%)</option>
                  <option value={83}>Grade B (3.0 &ge; 83%)</option>
                  <option value={80}>Grade B- (2.7 &ge; 80%)</option>
                  <option value={75}>Grade C+ (2.3 &ge; 75%)</option>
                  <option value={60}>Grade D (1.0 &ge; 60%)</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          {targetRequirement.achievable ? (
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                To secure a <strong className="font-semibold">{targetPercentage}%</strong> course final grade, you need an average of{" "}
                <strong className="font-mono font-bold tabular-nums">
                  {Math.round(targetRequirement.requiredScoreOnRemaining)}%
                </strong>{" "}
                across your {uncompletedCount} remaining uncompleted assessment items.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-app-danger">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>
                A target of <strong className="font-semibold">{targetPercentage}%</strong> requires an average of{" "}
                <strong className="font-mono font-bold tabular-nums">
                  {Math.round(targetRequirement.requiredScoreOnRemaining)}%
                </strong>{" "}
                on remaining items, which exceeds the 100% maximum points cap.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hypothetical Sliders & Controls */}
      <div className="space-y-4">
        <h4 className="font-semibold text-xs text-app-ink border-b border-app-border pb-1">
          Adjust Hypothetical Scores on Remaining Work
        </h4>

        {uncompletedCount === 0 ? (
          <p className="text-xs text-app-ink-muted py-2 italic">
            All coursework assessments for {course.code} are already completed.
          </p>
        ) : (
          <div className="space-y-3">
            {assessmentStatus
              .filter((i) => !i.isCompleted)
              .map(({ assessment: asm }) => {
                const hypoPts = hypotheticalScores[asm.id] ?? 0;
                const hypoPct = Math.round((hypoPts / asm.maxPoints) * 100);

                return (
                  <div
                    key={asm.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-control border border-app-border bg-app-surface p-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-app-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-app-accent">
                          {asm.type}
                        </span>
                        <span className="font-semibold text-app-ink">
                          {asm.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-app-ink-muted">
                        Max: {asm.maxPoints} pts • Category: {asm.type === "quiz" ? "Quizzes" : asm.type === "assignment" ? "Assignments" : "Exams"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Slider */}
                      <input
                        type="range"
                        min={0}
                        max={asm.maxPoints}
                        value={hypoPts}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setHypotheticalScores((prev) => ({ ...prev, [asm.id]: val }));
                        }}
                        className="w-36 accent-app-accent cursor-pointer"
                      />

                      {/* Numerical input */}
                      <div className="flex items-center gap-1 w-20">
                        <Input
                          type="number"
                          min={0}
                          max={asm.maxPoints}
                          value={hypoPts}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(asm.maxPoints, Number(e.target.value)));
                            setHypotheticalScores((prev) => ({ ...prev, [asm.id]: val }));
                          }}
                          className="font-mono tabular-nums text-center text-xs h-7"
                        />
                        <span className="text-app-ink-muted text-[11px]">pts</span>
                      </div>

                      <span className="font-mono text-xs font-bold text-app-ink tabular-nums w-12 text-right">
                        {hypoPct}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
