"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Topic } from "@/types/schemas";
import { GitMerge } from "lucide-react";

interface MergeTopicDialogProps {
  topic: Topic | null;
  nextTopic: Topic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerge: (primaryId: string, secondaryId: string, combinedTitle: string) => Promise<void>;
}

export function MergeTopicDialog({
  topic,
  nextTopic,
  open,
  onOpenChange,
  onMerge,
}: MergeTopicDialogProps) {
  const [combinedTitle, setCombinedTitle] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (topic && nextTopic) {
      setCombinedTitle(`${topic.title} & ${nextTopic.title}`);
    } else if (topic) {
      setCombinedTitle(topic.title);
    }
  }, [topic, nextTopic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !nextTopic || !combinedTitle.trim()) return;

    try {
      setLoading(true);
      await onMerge(topic.id, nextTopic.id, combinedTitle.trim());
      onOpenChange(false);
    } catch (err) {
      console.error("Merge topics failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <GitMerge className="h-4 w-4 text-[var(--color-accent)]" />
            <DialogTitle className="font-serif text-lg font-bold">
              Merge Adjacent Topics
            </DialogTitle>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Combine these two related topics into a single mastery item.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="p-3 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-xs space-y-1.5">
            <div>
              <span className="font-semibold text-[var(--color-ink-muted)] uppercase text-[10px]">
                Topic A (Retained ID):
              </span>
              <p className="font-medium text-[var(--color-ink)] truncate">
                {topic?.title}
              </p>
            </div>
            <div>
              <span className="font-semibold text-[var(--color-ink-muted)] uppercase text-[10px]">
                Topic B (To be merged):
              </span>
              <p className="font-medium text-[var(--color-ink)] truncate">
                {nextTopic?.title}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--color-ink)] block mb-1">
              Combined Topic Title
            </label>
            <Input
              value={combinedTitle}
              onChange={(e) => setCombinedTitle(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !nextTopic}>
              {loading ? "Merging..." : "Confirm Merge"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
