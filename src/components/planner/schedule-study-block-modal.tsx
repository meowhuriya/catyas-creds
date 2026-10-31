"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { Course, PlannerEvent } from "@/types/schemas";
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
import { Calendar, Clock, BookOpen } from "lucide-react";

interface ScheduleStudyBlockModalProps {
  courses: Course[];
  initialDate?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ScheduleStudyBlockModal({
  courses,
  initialDate,
  open,
  onOpenChange,
  onSuccess,
}: ScheduleStudyBlockModalProps) {
  const { dataStore } = useDataStore();

  const [courseId, setCourseId] = React.useState<string>(courses[0]?.id || "");
  const [title, setTitle] = React.useState<string>("");
  const [date, setDate] = React.useState<string>(
    initialDate || new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = React.useState<string>("14:00");
  const [durationMinutes, setDurationMinutes] = React.useState<number>(90);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (open) {
      if (initialDate) setDate(initialDate);
      if (courses.length > 0 && !courseId) {
        setCourseId(courses[0].id);
      }
      setTitle("");
      setStartTime("14:00");
      setDurationMinutes(90);
    }
  }, [open, initialDate, courses, courseId]);

  // Calculate end time
  const calculateEndTime = (start: string, duration: number) => {
    const [h, m] = start.split(":").map(Number);
    const totalMins = (h || 0) * 60 + (m || 0) + duration;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    return `${endH < 10 ? "0" : ""}${endH}:${endM < 10 ? "0" : ""}${endM}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    try {
      setLoading(true);
      const endTime = calculateEndTime(startTime, durationMinutes);

      await dataStore.createPlannerEvent({
        title: title.trim(),
        date,
        startTime,
        endTime,
        type: "study_block",
        courseId: courseId || undefined,
        isDone: false,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to schedule study block:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="rounded bg-app-accent/10 p-1 text-app-accent">
              <Clock className="h-4 w-4" />
            </span>
            <DialogTitle>Schedule Dedicated Study Block</DialogTitle>
          </div>
          <DialogDescription>
            Block focused time for lecture review, problem sets, or revision.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Course Selection */}
          <div>
            <label className="font-semibold text-app-ink block mb-1">Course Target</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-control border border-app-border bg-app-surface p-2 text-xs font-medium text-app-ink focus:border-app-accent focus:outline-none"
            >
              <option value="">General Academic Review</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Session Focus / Title */}
          <div>
            <label className="font-semibold text-app-ink block mb-1">Focus Topic / Objective *</label>
            <Input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., ALU Ripple Carry Timing & Synthesis Practice"
            />
          </div>

          {/* Date & Start Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-app-ink block mb-1">Date</label>
              <Input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label className="font-semibold text-app-ink block mb-1">Start Time</label>
              <Input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-app-ink">Duration</label>
              <span className="text-[11px] text-app-ink-muted font-mono">
                Ends at {calculateEndTime(startTime, durationMinutes)}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`rounded-control border py-2 text-center font-mono font-medium text-xs transition-colors ${
                    durationMinutes === mins
                      ? "border-app-accent bg-app-accent/10 text-app-accent font-bold"
                      : "border-app-border bg-app-surface text-app-ink-muted hover:border-app-ink-muted"
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-app-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading || !title.trim()}>
              {loading ? "Scheduling..." : "Schedule Block"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
