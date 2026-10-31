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
import { Lesson, Module } from "@/types/schemas";

interface GroupModulesDialogProps {
  courseId: string;
  lessons: Lesson[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GroupModulesDialog({
  courseId,
  lessons,
  open,
  onOpenChange,
  onSuccess,
}: GroupModulesDialogProps) {
  const { dataStore, refreshData } = useDataStore();
  const [chunkSize, setChunkSize] = React.useState<number>(3);
  const [loading, setLoading] = React.useState(false);

  const handleGroup = async () => {
    if (lessons.length === 0 || chunkSize <= 0) return;

    try {
      setLoading(true);

      const totalModules = Math.ceil(lessons.length / chunkSize);
      const newModules: Module[] = [];

      for (let i = 0; i < totalModules; i++) {
        const mod = await dataStore.createModule({
          courseId,
          title: `Module ${i + 1}: Unit Topics ${i * chunkSize + 1}–${Math.min(
            (i + 1) * chunkSize,
            lessons.length
          )}`,
          order: i,
          isCollapsed: false,
        });
        newModules.push(mod);
      }

      // Reassign lessons to new modules
      const lessonUpdates: { id: string; order: number; moduleId: string }[] = [];
      lessons.forEach((lesson, index) => {
        const modIndex = Math.floor(index / chunkSize);
        const targetMod = newModules[modIndex];
        if (targetMod) {
          lessonUpdates.push({
            id: lesson.id,
            order: index % chunkSize,
            moduleId: targetMod.id,
          });
        }
      });

      await dataStore.updateLessonOrder(lessonUpdates);
      await refreshData();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to group modules:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Group Lessons into Modules</DialogTitle>
          <DialogDescription>
            Automatically partition your course videos into sequential syllabus modules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <label className="font-semibold text-app-ink block">
            Lessons per Module (N)
          </label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              max={50}
              value={chunkSize}
              onChange={(e) => setChunkSize(Number(e.target.value))}
              className="w-24 text-center font-mono tabular-nums"
            />
            <span className="text-app-ink">
              lessons per module
            </span>
          </div>
          <p className="text-[11px] text-app-ink-muted">
            Total {lessons.length} lessons will be partitioned into{" "}
            <strong className="text-app-ink">
              {Math.ceil(lessons.length / (chunkSize || 1))} modules
            </strong>.
          </p>
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
            disabled={loading || lessons.length === 0}
            onClick={handleGroup}
          >
            {loading ? "Grouping..." : "Apply Module Grouping"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
