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
import { Lesson, Topic } from "@/types/schemas";
import { CheckSquare, Square, Tag, Loader2 } from "lucide-react";

interface LinkTopicsModalProps {
  lesson: Lesson | null;
  unitTopics: Topic[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LinkTopicsModal({
  lesson,
  unitTopics,
  open,
  onOpenChange,
  onSuccess,
}: LinkTopicsModalProps) {
  const { dataStore, refreshData } = useDataStore();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    if (lesson && open) {
      setSelectedIds(lesson.linkedTopicIds || []);
    }
  }, [lesson, open]);

  if (!lesson) return null;

  const toggleTopic = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await dataStore.updateLesson(lesson.id, {
        linkedTopicIds: selectedIds,
      });
      await refreshData();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to update linked topics:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-[var(--color-accent)]" />
            <DialogTitle className="font-serif">Link Syllabus Topics</DialogTitle>
          </div>
          <DialogDescription className="line-clamp-2">
            Connect topics to &ldquo;{lesson.title}&rdquo;. When this video is 90% completed, linked topics earn 40 watch mastery points.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {unitTopics.length === 0 ? (
            <div className="py-6 text-center text-xs text-[var(--color-ink-muted)]">
              No topics found in this unit. Add topics in the Unit Checklist first.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-[var(--color-border)]/60 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)]">
              {unitTopics.map((top) => {
                const isSelected = selectedIds.includes(top.id);
                return (
                  <button
                    key={top.id}
                    type="button"
                    onClick={() => toggleTopic(top.id)}
                    className="flex w-full items-start gap-2.5 p-3 text-left transition-colors hover:bg-[var(--color-surface-muted)]/40"
                  >
                    <div className="mt-0.5 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-[var(--color-accent)]" />
                      ) : (
                        <Square className="h-4 w-4 text-[var(--color-ink-muted)]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs ${
                          isSelected
                            ? "font-semibold text-[var(--color-ink)]"
                            : "text-[var(--color-ink-muted)]"
                        }`}
                      >
                        {top.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
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
            disabled={isSaving}
            onClick={handleSave}
            className="gap-1.5"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Save Topic Links ({selectedIds.length})</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
