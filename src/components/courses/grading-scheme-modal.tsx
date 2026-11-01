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
import { Course, CourseGradingScheme } from "@/types/schemas";
import {
  validateGradingScheme,
  isLabCourse,
  THEORY_GRADING_PRESET,
  LAB_GRADING_PRESET,
} from "@/lib/grading/grading-engine";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface GradingSchemeModalProps {
  course: Course;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GradingSchemeModal({
  course,
  open,
  onOpenChange,
  onSuccess,
}: GradingSchemeModalProps) {
  const { dataStore, refreshData } = useDataStore();

  const isLab = isLabCourse(course);
  const [scheme, setScheme] = React.useState<CourseGradingScheme>({
    ...course.gradingScheme,
  });
  const [passMark, setPassMark] = React.useState<number>(course.passMark || 40);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setScheme({ ...course.gradingScheme });
      setPassMark(course.passMark || 40);
    }
  }, [open, course]);

  const validation = validateGradingScheme(scheme);

  const handleUpdateWeight = (key: keyof CourseGradingScheme, val: number) => {
    const num = Math.max(0, Math.min(100, isNaN(val) ? 0 : val));
    setScheme((prev) => ({ ...prev, [key]: num }));
  };

  const applyPreset = (preset: CourseGradingScheme) => {
    setScheme({ ...preset });
  };

  const handleSave = async () => {
    if (!validation.isValid) return;

    try {
      setLoading(true);
      await dataStore.updateCourse(course.id, {
        gradingScheme: scheme,
        passMark,
      });

      await refreshData();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to update grading scheme:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="rounded bg-app-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-app-accent">
              {isLab ? "Lab Course" : "Theory Course"}
            </span>
            <DialogTitle>Edit Grading Scheme</DialogTitle>
          </div>
          <DialogDescription>
            Configure category weights for {course.code} ({course.title}). Weights live exclusively on course categories and must sum to exactly 100%.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Quick Presets */}
          <div className="rounded-control border border-app-border bg-app-surface-muted/30 p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-app-ink">
              <Sparkles className="h-3.5 w-3.5 text-app-accent" />
              <span>Standard Presets:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset(THEORY_GRADING_PRESET)}
                className="text-[11px] h-7 gap-1"
              >
                Theory Default (10/25/30/15/20)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset(LAB_GRADING_PRESET)}
                className="text-[11px] h-7 gap-1"
              >
                Lab Default (60/20/0/0/20)
              </Button>
            </div>
          </div>

          {/* Total Weight Counter Badge */}
          <div
            className={`flex items-center justify-between p-3 rounded-control border ${
              validation.isValid
                ? "border-emerald-500/30 bg-emerald-500/10 text-app-success"
                : "border-app-danger/30 bg-app-danger/10 text-app-danger"
            }`}
          >
            <div className="flex items-center gap-2">
              {validation.isValid ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}
              <span className="font-semibold">
                {validation.isValid
                  ? "Valid: Weights total exactly 100%"
                  : `Invalid: Weights total ${validation.total}% (must be 100%)`}
              </span>
            </div>
            <span className="font-sans font-semibold font-bold text-sm tabular-nums">
              {validation.total}%
            </span>
          </div>

          {/* 5 Category Weight Inputs with Domain Labels */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-app-ink block">
                  {isLab ? "Experiments Done" : "Study Progress"}
                </label>
                <span className="text-[10px] text-app-ink-muted">
                  Auto-calculated from Topic Mastery (0–100)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={scheme.lessonCompletion}
                  onChange={(e) =>
                    handleUpdateWeight("lessonCompletion", Number(e.target.value))
                  }
                  className="w-20 text-center font-sans font-semibold tabular-nums"
                />
                <span className="text-app-ink-muted">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-app-ink block">
                  {isLab ? "Quizzes or Viva" : "Quizzes"}
                </label>
                <span className="text-[10px] text-app-ink-muted">
                  Auto-marked quizzes & viva checks
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={scheme.quizzes}
                  onChange={(e) =>
                    handleUpdateWeight("quizzes", Number(e.target.value))
                  }
                  className="w-20 text-center font-sans font-semibold tabular-nums"
                />
                <span className="text-app-ink-muted">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-app-ink block">
                  {isLab ? "Lab Reports / Assignments" : "Assignments"}
                </label>
                <span className="text-[10px] text-app-ink-muted">
                  Rubric self-assessed coursework
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={scheme.assignments}
                  onChange={(e) =>
                    handleUpdateWeight("assignments", Number(e.target.value))
                  }
                  className="w-20 text-center font-sans font-semibold tabular-nums"
                />
                <span className="text-app-ink-muted">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-app-ink block">
                  {isLab ? "Midterm Lab Evaluation" : "Midterm Examination"}
                </label>
                <span className="text-[10px] text-app-ink-muted">
                  Timed mid-semester milestone
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={scheme.midterm}
                  onChange={(e) =>
                    handleUpdateWeight("midterm", Number(e.target.value))
                  }
                  className="w-20 text-center font-sans font-semibold tabular-nums"
                />
                <span className="text-app-ink-muted">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-app-ink block">
                  {isLab ? "Final Lab Test" : "Final Examination"}
                </label>
                <span className="text-[10px] text-app-ink-muted">
                  Comprehensive terminal exam
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={scheme.finalExam}
                  onChange={(e) =>
                    handleUpdateWeight("finalExam", Number(e.target.value))
                  }
                  className="w-20 text-center font-sans font-semibold tabular-nums"
                />
                <span className="text-app-ink-muted">%</span>
              </div>
            </div>
          </div>

          <div className="border-t border-app-border pt-3 flex items-center justify-between">
            <div>
              <label className="font-semibold text-app-ink block">
                Course Passing Mark
              </label>
              <span className="text-[10px] text-app-ink-muted">
                Official default pass mark is 40%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                max={100}
                value={passMark}
                onChange={(e) => setPassMark(Number(e.target.value))}
                className="w-20 text-center font-sans font-semibold tabular-nums"
              />
              <span className="text-app-ink-muted">%</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!validation.isValid || loading}
            onClick={handleSave}
          >
            {loading ? "Saving..." : "Save Scheme"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
