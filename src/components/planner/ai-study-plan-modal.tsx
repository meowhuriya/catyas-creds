"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { useAiStatus } from "@/lib/ai/use-ai-status";
import { StudyPlanOutput } from "@/lib/ai/ai-schemas";
import { Course } from "@/types/schemas";
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
import {
  Sparkles,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Target,
  RotateCcw,
} from "lucide-react";

interface AiStudyPlanModalProps {
  courses: Course[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AiStudyPlanModal({
  courses,
  open,
  onOpenChange,
  onSuccess,
}: AiStudyPlanModalProps) {
  const { dataStore, refreshData } = useDataStore();
  const { configured, unconfiguredMessage } = useAiStatus();

  const [selectedCourseId, setSelectedCourseId] = React.useState<string>("");
  const [examDate, setExamDate] = React.useState<string>("");
  const [currentScore, setCurrentScore] = React.useState<number>(65);
  const [weakTopicsInput, setWeakTopicsInput] = React.useState<string>("");

  const [drafting, setDrafting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Draft plan
  const [plan, setPlan] = React.useState<StudyPlanOutput | null>(null);

  React.useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
    if (!examDate) {
      // Default to 4 weeks from today
      const d = new Date();
      d.setDate(d.getDate() + 28);
      setExamDate(d.toISOString().split("T")[0]);
    }
  }, [courses, selectedCourseId, examDate]);

  const activeCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];

  const handleDraftPlan = async () => {
    if (!activeCourse) return;

    try {
      setDrafting(true);
      setError(null);

      const weakTopics = weakTopicsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/ai/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: `${activeCourse.code}: ${activeCourse.title}`,
          examDate,
          currentScore: Number(currentScore) || 50,
          weakTopics,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate study timetable");
      }

      setPlan(data.plan);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error drafting plan";
      setError(msg);
    } finally {
      setDrafting(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!plan || !activeCourse) return;

    try {
      setSaving(true);
      setError(null);

      // Create planner events for each week milestone and tasks
      const baseDate = new Date();

      for (let i = 0; i < plan.weeks.length; i++) {
        const wk = plan.weeks[i];
        const eventDate = new Date(baseDate);
        eventDate.setDate(eventDate.getDate() + (i * 7) + 3);

        const dateStr = eventDate.toISOString().split("T")[0];

        await dataStore.createPlannerEvent({
          courseId: activeCourse.id,
          title: `Week ${wk.weekNumber} Milestone: ${wk.milestone}`,
          date: dateStr,
          type: "study_block",
          isDone: false,
        });
      }

      await refreshData();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to persist study plan to calendar";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="rounded bg-app-accent/10 p-1 text-app-accent">
              <Sparkles className="h-4 w-4" />
            </span>
            <DialogTitle>AI Exam Study Plan Drafter</DialogTitle>
          </div>
          <DialogDescription>
            Generate a targeted, week-by-week study schedule calibrated to your upcoming exam date and current mastery diagnostics.
          </DialogDescription>
        </DialogHeader>

        {configured === false && (
          <div className="rounded-card border border-app-border bg-app-surface-muted/50 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-app-ink font-semibold">
              <AlertCircle className="h-4 w-4 text-app-accent" />
              <span>{unconfiguredMessage}</span>
            </div>
            <p className="text-app-ink-muted text-[11px]">
              Set GEMINI_API_KEY to draft automatic study schedules. You can still manually schedule study blocks via the standard "Schedule Study Block" button.
            </p>
          </div>
        )}

        <div className="space-y-4 py-2 text-xs">
          {!plan ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-app-ink block mb-1">Target Course</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full rounded-control border border-app-border bg-app-surface p-2 text-xs font-medium text-app-ink"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-app-ink block mb-1">Target Exam Date</label>
                  <Input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-app-ink block mb-1">
                    Current Score / Readiness (%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={currentScore}
                    onChange={(e) => setCurrentScore(Number(e.target.value))}
                    className="h-8 text-xs font-mono w-24"
                  />
                </div>

                <div>
                  <label className="font-semibold text-app-ink block mb-1">
                    Weak Topics to Emphasize (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Eigenvalues, Cayley-Hamilton"
                    value={weakTopicsInput}
                    onChange={(e) => setWeakTopicsInput(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-control border border-app-danger/30 bg-app-danger/10 p-2.5 text-xs text-app-danger">
                  {error}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleDraftPlan}
                  disabled={drafting || configured === false}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{drafting ? "Synthesising Timetable..." : "Draft Week-by-Week Plan"}</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Review & Approve Plan Screen */
            <div className="space-y-4">
              <div className="rounded-control border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    Study timetable drafted for {plan.courseTitle} (Target: {plan.targetDate}, ~{plan.estimatedHoursNeeded} total hours).
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPlan(null)}
                  className="h-6 text-[10px] gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </Button>
              </div>

              {/* Weeks List */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {plan.weeks.map((wk, i) => (
                  <div
                    key={i}
                    className="rounded-control border border-app-border bg-app-surface p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-semibold text-app-ink">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-app-accent text-white font-mono text-[10px] px-1.5 py-0.5">
                          Week {wk.weekNumber}
                        </span>
                        <span>{wk.focusTheme}</span>
                      </div>
                      <span className="font-mono text-[11px] text-app-ink-muted flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {wk.plannedHours} hrs
                      </span>
                    </div>

                    <div className="text-[11px] text-app-accent font-medium flex items-center gap-1.5 pt-0.5">
                      <Target className="h-3 w-3 shrink-0" />
                      <span>Milestone: {wk.milestone}</span>
                    </div>

                    <div className="pl-4 space-y-0.5 pt-1">
                      {wk.tasks.map((task, tIdx) => (
                        <div key={tIdx} className="text-[11px] text-app-ink-muted flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-app-ink-muted shrink-0" />
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="rounded-control border border-app-danger/30 bg-app-danger/10 p-2.5 text-xs text-app-danger">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-app-border">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>

          {plan && (
            <Button
              type="button"
              variant="primary"
              onClick={handleApprovePlan}
              disabled={saving}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{saving ? "Scheduling Events..." : "Approve & Add to Planner"}</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
