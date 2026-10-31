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
import { TOKENS, CourseTagKey } from "@/styles/tokens";
import { CourseColorTag, CourseLevel } from "@/types/schemas";

interface CreateCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (courseId: string) => void;
}

const COLOR_KEYS = Object.keys(TOKENS.colors.courseTags) as CourseTagKey[];
const LEVELS: CourseLevel[] = ["100", "200", "300", "400"];

export function CreateCourseDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCourseDialogProps) {
  const { terms, currentTerm, dataStore, refreshData } = useDataStore();

  const [title, setTitle] = React.useState("");
  const [code, setCode] = React.useState("");
  const [department, setDepartment] = React.useState("Computer Science");
  const [level, setLevel] = React.useState<CourseLevel>("100");
  const [termId, setTermId] = React.useState<string>(currentTerm?.id || "");
  const [credits, setCredits] = React.useState<number>(4);
  const [description, setDescription] = React.useState("");
  const [colorTag, setColorTag] = React.useState<CourseColorTag>("slate");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (currentTerm && !termId) {
      setTermId(currentTerm.id);
    }
  }, [currentTerm, termId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim() || !department.trim()) {
      setError("Please complete all required fields (Course Title, Code, Department).");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const targetTermId = termId || terms[0]?.id || "term-default";

      const newCourse = await dataStore.createCourse({
        termId: targetTermId,
        code: code.trim().toUpperCase(),
        title: title.trim(),
        department: department.trim(),
        level,
        credits: Number(credits),
        description: description.trim(),
        colorTag,
        gradingScheme: {
          lessonCompletion: 10,
          quizzes: 25,
          assignments: 30,
          midterm: 15,
          finalExam: 20,
        },
        passMark: 40,
      });

      // Create a default initial module for the course
      await dataStore.createModule({
        courseId: newCourse.id,
        title: "Module 1: Foundations & Overview",
        order: 0,
        isCollapsed: false,
      });

      await refreshData();
      onOpenChange(false);
      onSuccess?.(newCourse.id);
    } catch (err: any) {
      setError(err.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create Academic Course</DialogTitle>
            <DialogDescription>
              Register a credit-bearing course with lecture modules, grading criteria, and color tag.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-control border border-app-danger/30 bg-app-danger/10 p-2.5 text-xs text-app-danger">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="font-semibold text-app-ink block mb-1">
                Course Title *
              </label>
              <Input
                placeholder="e.g. Introduction to Computer Systems"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-semibold text-app-ink block mb-1">
                Course Code *
              </label>
              <Input
                placeholder="e.g. CS 101"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono uppercase font-semibold"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-app-ink block mb-1">
                Academic Term
              </label>
              <select
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
                className="flex h-9 w-full rounded-control border border-app-border bg-app-surface px-3 py-1 text-xs text-app-ink shadow-sm outline-none focus:ring-2 focus:ring-app-accent"
              >
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.isCurrent ? "(Current)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-app-ink block mb-1">
                Department *
              </label>
              <Input
                placeholder="e.g. Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-semibold text-app-ink block mb-1">
                Course Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as CourseLevel)}
                className="flex h-9 w-full rounded-control border border-app-border bg-app-surface px-3 py-1 text-xs text-app-ink shadow-sm outline-none focus:ring-2 focus:ring-app-accent"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Level {lvl} (Undergraduate)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-app-ink block mb-1">
                Credits Assigned
              </label>
              <Input
                type="number"
                min={0.5}
                max={12}
                step={0.5}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className="font-mono tabular-nums"
                required
              />
              <span className="text-[11px] text-app-ink-muted mt-1 block">
                Default: 15 lecture watch hours = 1 credit
              </span>
            </div>

            <div>
              <label className="font-semibold text-app-ink block mb-1">
                Course Color Tag
              </label>
              <div className="flex items-center gap-1.5 pt-1.5">
                {COLOR_KEYS.map((k) => {
                  const tag = TOKENS.colors.courseTags[k];
                  const isSelected = colorTag === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setColorTag(k as CourseColorTag)}
                      title={tag.label}
                      className={`h-6 w-6 rounded-full transition-transform flex items-center justify-center ${
                        isSelected ? "scale-110 ring-2 ring-offset-2 ring-app-ink" : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: tag.hex }}
                    >
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-app-ink block mb-1">
                Course Description & Objectives
              </label>
              <textarea
                rows={3}
                placeholder="Brief academic description of the syllabus, topics, and objectives..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-xs text-app-ink shadow-sm outline-none focus:ring-2 focus:ring-app-accent placeholder:text-app-ink-muted/70"
              />
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
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Creating..." : "Save Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
