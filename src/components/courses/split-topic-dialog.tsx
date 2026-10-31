"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Topic } from "@/types/schemas";
import { Scissors } from "lucide-react";

interface SplitTopicDialogProps {
  topic: Topic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSplit: (topicId: string, title1: string, title2: string) => Promise<void>;
}

export function SplitTopicDialog({
  topic,
  open,
  onOpenChange,
  onSplit,
}: SplitTopicDialogProps) {
  const [part1, setPart1] = React.useState("");
  const [part2, setPart2] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (topic) {
      // Split by comma, colon, or semicolon if present
      const parts = topic.title.split(/[,:;]/);
      if (parts.length >= 2) {
        setPart1(parts[0].trim());
        setPart2(parts.slice(1).join(", ").trim());
      } else {
        setPart1(topic.title);
        setPart2(`${topic.title} (Part 2)`);
      }
    }
  }, [topic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !part1.trim() || !part2.trim()) return;

    try {
      setLoading(true);
      await onSplit(topic.id, part1.trim(), part2.trim());
      onOpenChange(false);
    } catch (err) {
      console.error("Split topic failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-[var(--color-accent)]" />
            <DialogTitle className="font-serif text-lg font-bold">
              Split Curricular Topic
            </DialogTitle>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Divide this topic into two distinct checklist items while preserving course progress.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <label className="text-xs font-semibold text-[var(--color-ink)] block mb-1">
              Part 1 (Current Topic)
            </label>
            <Input
              value={part1}
              onChange={(e) => setPart1(e.target.value)}
              placeholder="e.g. Overview and syntax elements"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--color-ink)] block mb-1">
              Part 2 (New Sub-topic)
            </label>
            <Input
              value={part2}
              onChange={(e) => setPart2(e.target.value)}
              placeholder="e.g. Branching and control structures"
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
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Splitting..." : "Split Topic"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
