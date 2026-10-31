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
import { validateGradingScheme } from "@/lib/grading/grading-engine";
import { CheckCircle2, AlertCircle } from "lucide-react";

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
          <DialogTitle>Edit Course Grading Scheme</DialogTitle>
          <DialogDescription>
            Configure category weights for {course.code}. Weights must sum to exactly 100%.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
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
            <span className="font-mono font-bold text-sm tabular-nums">
              {validation.total}%
            </span>
          </div>

          {/* 5 Category Weight Inputs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-medium text-app-ink">
                Lesson Watch Completion
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={scheme.lessonCompletion}
                  onChange={(e) =>
                    handleUpdateWeight("lessonCompletion", Number(e.target.value))
                  }
                  className="w-20 text-center font-mono tabular-nums"
                />
                <span className="text-app-ink-muted">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="font-medium text-app-ink">Quizzes</label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={scheme.quizzes}
                  onChange={(e) =>
                    handleUpdateWeight("quizzes", Number(e.target.value))
                  }
                  className="w-20 text-center font-mono tabular-nums"
                />
                <span className="text-app-ink-muted">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="font-medium text-app-ink">Assignments</label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={scheme.assignments}
                  onChange={(e) =>
                    handleUpdateWeight("assignments", Number(e.target.value))
                  }
                  className="w-20 text-center font-mono tabular-nums"
                />
                <span className="text-app-ink-muted">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="font-medium text-app-ink">Midterm Examination</label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={scheme.midterm}
                  onChange={(e) =>
                    handleUpdateWeight("midterm", Number(e.target.value))
                  }
                  className="w-20 text-center font-mono tabular-nums"
                />
                <span className="text-app-ink-muted">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="font-medium text-app-ink">Final Examination</label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={scheme.finalExam}
                  onChange={(e) =>
                    handleUpdateWeight("finalExam", Number(e.target.value))
                  }
                  className="w-20 text-center font-mono tabular-nums"
                />
                <span className="text-app-ink-muted">%</span>
              </div>
            </div>
          </div>

          <div className="border-t border-app-border pt-3 flex items-center justify-between">
            <label className="font-semibold text-app-ink">
              Course Passing Mark
            </label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={0}
                max={100}
                value={passMark}
                onChange={(e) => setPassMark(Number(e.target.value))}
                className="w-20 text-center font-mono tabular-nums"
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
