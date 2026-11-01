"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Assessment, Question, Attempt } from "@/types/schemas";
import {
  Timer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Award,
  ShieldAlert,
  Clock,
  Play,
  FileCheck,
} from "lucide-react";
import { getGradeScaleMapping } from "@/lib/grading/grading-engine";

interface QuizRunnerModalProps {
  assessment: Assessment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function QuizRunnerModal({
  assessment,
  open,
  onOpenChange,
  onSuccess,
}: QuizRunnerModalProps) {
  const { dataStore, refreshData, currentUser } = useDataStore();

  const isExam = assessment.type === "midterm" || assessment.type === "final";
  const [questions, setQuestions] = React.useState<Question[]>([]);
  const [attempts, setAttempts] = React.useState<Attempt[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  // Runner state
  const [answers, setAnswers] = React.useState<Record<string, string | string[]>>({});
  const [startedAt, setStartedAt] = React.useState<string>("");
  const [secondsRemaining, setSecondsRemaining] = React.useState<number | null>(null);
  const [isReviewing, setIsReviewing] = React.useState(false);
  const [activeAttempt, setActiveAttempt] = React.useState<Attempt | null>(null);
  const [hasStartedExam, setHasStartedExam] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [qs, atts] = await Promise.all([
        dataStore.getQuestions(assessment.id),
        dataStore.getAttempts(assessment.id),
      ]);
      setQuestions(qs);
      setAttempts(atts);

      if (atts.length > 0) {
        // If has attempts, default to reviewing the best / latest attempt
        const latest = atts[atts.length - 1];
        setActiveAttempt(latest);
        setIsReviewing(true);
        setHasStartedExam(true);
      } else {
        if (isExam) {
          setHasStartedExam(false);
          setIsReviewing(false);
          setActiveAttempt(null);
        } else {
          startNewAttempt();
        }
      }
    } catch (err) {
      console.error("Failed to load quiz runner data:", err);
    } finally {
      setLoading(false);
    }
  }, [assessment.id, isExam, dataStore]);

  const startNewAttempt = React.useCallback(() => {
    setAnswers({});
    setStartedAt(new Date().toISOString());
    setIsReviewing(false);
    setActiveAttempt(null);
    setHasStartedExam(true);
    if (assessment.timeLimitMinutes && assessment.timeLimitMinutes > 0) {
      setSecondsRemaining(assessment.timeLimitMinutes * 60);
    } else {
      setSecondsRemaining(null);
    }
  }, [assessment.timeLimitMinutes]);

  React.useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  // Timer countdown
  React.useEffect(() => {
    if (isReviewing || secondsRemaining === null || secondsRemaining <= 0 || !hasStartedExam) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isReviewing, secondsRemaining, hasStartedExam]);

  const handleSelectAnswer = (qId: string, val: string, isMulti: boolean) => {
    if (isReviewing) return;

    if (isMulti) {
      const current = (answers[qId] as string[]) || [];
      const updated = current.includes(val)
        ? current.filter((item) => item !== val)
        : [...current, val];
      setAnswers((prev) => ({ ...prev, [qId]: updated }));
    } else {
      setAnswers((prev) => ({ ...prev, [qId]: val }));
    }
  };

  const handleTextAnswer = (qId: string, text: string) => {
    if (isReviewing) return;
    setAnswers((prev) => ({ ...prev, [qId]: text }));
  };

  const calculateResults = () => {
    let earned = 0;
    let totalPossible = 0;

    questions.forEach((q) => {
      totalPossible += q.points;
      const ans = answers[q.id];

      if (q.type === "multiple_choice") {
        if (ans && q.correctAnswers.includes(ans as string)) {
          earned += q.points;
        }
      } else if (q.type === "multiple_select") {
        const selected = (ans as string[]) || [];
        const correct = q.correctAnswers;
        const allCorrectSelected =
          correct.every((c) => selected.includes(c)) &&
          selected.every((s) => correct.includes(s));
        if (allCorrectSelected) {
          earned += q.points;
        } else {
          // Partial credit: proportion of correct choices minus penalty for false positives
          const truePositives = selected.filter((s) => correct.includes(s)).length;
          const falsePositives = selected.filter((s) => !correct.includes(s)).length;
          const fraction = Math.max(
            0,
            (truePositives - falsePositives) / correct.length
          );
          earned += Math.round(fraction * q.points);
        }
      } else if (q.type === "short_answer") {
        const studentText = ((ans as string) || "").trim().toLowerCase();
        const matches = q.correctAnswers.some(
          (c) => c.trim().toLowerCase() === studentText
        );
        if (matches) {
          earned += q.points;
        }
      }
    });

    const maxPts = totalPossible > 0 ? totalPossible : assessment.maxPoints;
    const percentage = Math.round((earned / maxPts) * 100);

    return { earned, maxPts, percentage };
  };

  const handleSubmit = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      const { earned, maxPts, percentage } = calculateResults();

      const createdAttempt = await dataStore.submitAttempt({
        assessmentId: assessment.id,
        courseId: assessment.courseId,
        answers,
        score: earned,
        maxPoints: maxPts,
        percentage,
        startedAt: startedAt || new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        isCompleted: true,
      });

      setAttempts((prev) => [...prev, createdAttempt]);
      setActiveAttempt(createdAttempt);
      setIsReviewing(true);
      await refreshData();
      onSuccess?.();
    } catch (err) {
      console.error("Failed to submit attempt:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const effectiveLimit = isExam ? 1 : assessment.attemptLimit;
  const hasExceededAttempts = Boolean(
    effectiveLimit && attempts.length >= effectiveLimit
  );

  const scale = currentUser?.settings?.gradeScale || "10_point";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                    isExam
                      ? "bg-app-accent text-white"
                      : "bg-app-accent/10 text-app-accent"
                  }`}
                >
                  {isExam ? `Official ${assessment.type} Exam` : assessment.type}
                </span>
                <DialogTitle>{assessment.title}</DialogTitle>
              </div>
              <DialogDescription className="mt-1">
                {assessment.description || "Complete all questions below."}
              </DialogDescription>
            </div>

            {/* Timer Header Indicator */}
            {!isReviewing && hasStartedExam && secondsRemaining !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-control border font-sans font-semibold text-xs font-bold tabular-nums ${
                  secondsRemaining < 60
                    ? "border-app-danger/40 bg-app-danger/10 text-app-danger animate-pulse"
                    : "border-app-border bg-app-surface text-app-ink"
                }`}
              >
                <Timer className="h-3.5 w-3.5" />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-xs text-app-ink-muted">
            Loading examination questions...
          </div>
        ) : isExam && !hasStartedExam && !isReviewing ? (
          /* Official Exam Pre-Flight Briefing */
          <div className="space-y-5 py-4 text-xs">
            <div className="rounded-card border border-app-accent/30 bg-app-accent/5 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-app-accent text-white shrink-0">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-app-ink">
                    Official Proctored Examination Mode
                  </h3>
                  <p className="text-xs text-app-ink-muted">
                    Please review examination rules carefully before beginning.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-app-accent/15 pt-3">
                <div className="rounded-control border border-app-border bg-app-surface p-2.5">
                  <span className="text-[10px] font-semibold uppercase text-app-ink-muted block">
                    Total Time Allowed
                  </span>
                  <div className="flex items-center gap-1 font-sans font-semibold font-bold text-app-ink mt-0.5">
                    <Clock className="h-3.5 w-3.5 text-app-accent" />
                    <span>{assessment.timeLimitMinutes || 90} Minutes</span>
                  </div>
                </div>

                <div className="rounded-control border border-app-border bg-app-surface p-2.5">
                  <span className="text-[10px] font-semibold uppercase text-app-ink-muted block">
                    Attempt Policy
                  </span>
                  <span className="font-sans font-semibold font-bold text-app-ink block mt-0.5">
                    Strictly 1 Attempt
                  </span>
                </div>

                <div className="rounded-control border border-app-border bg-app-surface p-2.5">
                  <span className="text-[10px] font-semibold uppercase text-app-ink-muted block">
                    Assessment Questions
                  </span>
                  <span className="font-sans font-semibold font-bold text-app-ink block mt-0.5">
                    {questions.length} Items ({assessment.maxPoints} pts)
                  </span>
                </div>
              </div>

              <div className="rounded-control bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-semibold">Important Examination Notice:</p>
                <p>
                  Once you begin, the timer starts immediately and cannot be paused. Your answers will be automatically marked and saved upon timer expiration or early submission.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={startNewAttempt}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                <span>Begin Examination Now</span>
              </Button>
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-8 text-center text-xs text-app-ink-muted space-y-2">
            <p>No questions have been configured for this assessment yet.</p>
          </div>
        ) : (
          <div className="space-y-6 py-2 text-xs">
            {/* Review Mode Banner / Score Summary */}
            {isReviewing && activeAttempt && (
              <div className="rounded-card border border-app-border bg-app-surface-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-app-accent/10 text-app-accent">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase text-app-ink-muted">
                        Attempt Result (
                        {attempts.findIndex((a) => a.id === activeAttempt.id) + 1} of{" "}
                        {effectiveLimit || "unlimited"})
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-serif text-2xl font-bold text-app-ink tabular-nums">
                          {activeAttempt.score} / {activeAttempt.maxPoints} pts
                        </span>
                        <span className="font-sans font-semibold text-sm font-semibold text-app-accent tabular-nums">
                          ({activeAttempt.percentage}%)
                        </span>
                        <span className="rounded bg-app-surface px-1.5 py-0.5 text-[11px] font-serif font-bold text-app-ink border border-app-border">
                          Grade {getGradeScaleMapping(activeAttempt.percentage, scale).letter}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!hasExceededAttempts && !isExam && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startNewAttempt}
                      className="gap-1.5 text-xs"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Retake Quiz</span>
                    </Button>
                  )}
                </div>

                {hasExceededAttempts && (
                  <p className="text-[11px] text-app-ink-muted italic">
                    Maximum attempt limit reached ({effectiveLimit}/
                    {effectiveLimit}).
                  </p>
                )}
              </div>
            )}

            {/* Questions List */}
            <div className="space-y-5">
              {questions.map((q, idx) => {
                const reviewAnswers = isReviewing
                  ? activeAttempt?.answers || {}
                  : answers;
                const studentAns = reviewAnswers[q.id];

                let isCorrect = false;
                if (isReviewing) {
                  if (q.type === "multiple_choice") {
                    isCorrect = studentAns === q.correctAnswers[0];
                  } else if (q.type === "multiple_select") {
                    const sel = (studentAns as string[]) || [];
                    isCorrect =
                      q.correctAnswers.every((c) => sel.includes(c)) &&
                      sel.every((s) => q.correctAnswers.includes(s));
                  } else if (q.type === "short_answer") {
                    const txt = ((studentAns as string) || "").trim().toLowerCase();
                    isCorrect = q.correctAnswers.some(
                      (c) => c.trim().toLowerCase() === txt
                    );
                  }
                }

                return (
                  <div
                    key={q.id}
                    className={`rounded-card border p-4 transition-colors space-y-3 ${
                      isReviewing
                        ? isCorrect
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-app-danger/30 bg-app-danger/5"
                        : "border-app-border bg-app-surface"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-semibold font-bold text-app-ink-muted text-xs">
                          {idx + 1}.
                        </span>
                        <span className="font-semibold text-app-ink text-sm">
                          {q.prompt}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-sans font-semibold text-[11px] text-app-ink-muted tabular-nums">
                          {q.points} pts
                        </span>
                        {isReviewing && (
                          isCorrect ? (
                            <CheckCircle2 className="h-4 w-4 text-app-success" />
                          ) : (
                            <XCircle className="h-4 w-4 text-app-danger" />
                          )
                        )}
                      </div>
                    </div>

                    {/* Choices for Multiple Choice */}
                    {q.type === "multiple_choice" && (
                      <div className="space-y-1.5 pl-4">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = studentAns === opt;
                          const isRightAnswer = q.correctAnswers.includes(opt);

                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-2.5 p-2 rounded-control border text-xs cursor-pointer transition-colors ${
                                isReviewing
                                  ? isRightAnswer
                                    ? "border-emerald-500/40 bg-emerald-500/10 font-medium text-app-ink"
                                    : isSelected && !isRightAnswer
                                    ? "border-app-danger/40 bg-app-danger/10 text-app-danger line-through"
                                    : "border-app-border/40 text-app-ink-muted opacity-70"
                                  : isSelected
                                  ? "border-app-accent bg-app-accent/5 text-app-ink font-medium"
                                  : "border-app-border hover:bg-app-surface-muted/40"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                disabled={isReviewing}
                                checked={isSelected}
                                onChange={() => handleSelectAnswer(q.id, opt, false)}
                                className="accent-app-accent"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Choices for Multiple Select */}
                    {q.type === "multiple_select" && (
                      <div className="space-y-1.5 pl-4">
                        <span className="text-[11px] text-app-ink-muted italic block mb-1">
                          Select all that apply:
                        </span>
                        {q.options.map((opt, optIdx) => {
                          const selList = (studentAns as string[]) || [];
                          const isSelected = selList.includes(opt);
                          const isRightAnswer = q.correctAnswers.includes(opt);

                          return (
                            <label
                              key={optIdx}
                              className={`flex items-center gap-2.5 p-2 rounded-control border text-xs cursor-pointer transition-colors ${
                                isReviewing
                                  ? isRightAnswer
                                    ? "border-emerald-500/40 bg-emerald-500/10 font-medium text-app-ink"
                                    : isSelected && !isRightAnswer
                                    ? "border-app-danger/40 bg-app-danger/10 text-app-danger line-through"
                                    : "border-app-border/40 text-app-ink-muted opacity-70"
                                  : isSelected
                                  ? "border-app-accent bg-app-accent/5 text-app-ink font-medium"
                                  : "border-app-border hover:bg-app-surface-muted/40"
                              }`}
                            >
                              <input
                                type="checkbox"
                                disabled={isReviewing}
                                checked={isSelected}
                                onChange={() => handleSelectAnswer(q.id, opt, true)}
                                className="accent-app-accent"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Short Answer Input */}
                    {q.type === "short_answer" && (
                      <div className="pl-4 space-y-1.5">
                        <Input
                          disabled={isReviewing}
                          value={(studentAns as string) || ""}
                          onChange={(e) => handleTextAnswer(q.id, e.target.value)}
                          placeholder="Type your response..."
                          className="max-w-md"
                        />
                        {isReviewing && !isCorrect && (
                          <div className="text-[11px] text-app-ink-muted">
                            Expected answer:{" "}
                            <span className="font-semibold text-app-ink">
                              {q.correctAnswers.join(" or ")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation in review mode */}
                    {isReviewing && q.explanation && (
                      <div className="mt-2 rounded-control bg-app-surface-muted/60 p-2.5 text-[11px] text-app-ink-muted border border-app-border/60">
                        <span className="font-semibold text-app-ink block mb-0.5">
                          Academic Explanation:
                        </span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-app-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {isReviewing ? "Close" : "Cancel"}
          </Button>

          {!isReviewing && hasStartedExam && (
            <Button
              type="button"
              variant="primary"
              disabled={submitting || questions.length === 0}
              onClick={handleSubmit}
            >
              {submitting ? "Grading..." : isExam ? "Submit Final Examination" : "Submit Answers"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
