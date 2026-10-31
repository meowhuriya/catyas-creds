"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, ArrowRight } from "lucide-react";
import { Topic } from "@/types/schemas";

interface TidyTopicsDialogProps {
  courseCode: string;
  courseTitle: string;
  topics: Topic[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyTidy: (cleanedTopics: { id: string; title: string }[]) => Promise<void>;
}

export function TidyTopicsDialog({
  courseCode,
  courseTitle,
  topics,
  open,
  onOpenChange,
  onApplyTidy,
}: TidyTopicsDialogProps) {
  const [loading, setLoading] = React.useState(false);

  // Generate cleaned titles (removing lecture hour fragments, trailing punctuation, formatting)
  const previews = React.useMemo(() => {
    return topics.slice(0, 5).map((t) => {
      let cleaned = t.title
        .replace(/^\d+\.\s*/, "") // remove leading "1. "
        .replace(/^[a-z]\)\s*/i, "") // remove "a) "
        .replace(/\s+\d+\s*L.*$/i, "") // remove "8 L"
        .replace(/[;:]+$/, "") // remove trailing punctuation
        .trim();
      if (cleaned.length > 2 && cleaned.charAt(0) !== cleaned.charAt(0).toUpperCase()) {
        cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
      return {
        id: t.id,
        original: t.title,
        cleaned: cleaned || t.title,
      };
    });
  }, [topics]);

  const handleApply = async () => {
    try {
      setLoading(true);
      const allCleaned = topics.map((t) => {
        let cleaned = t.title
          .replace(/^\d+\.\s*/, "")
          .replace(/^[a-z]\)\s*/i, "")
          .replace(/\s+\d+\s*L.*$/i, "")
          .replace(/[;:]+$/, "")
          .trim();
        if (cleaned.length > 2 && cleaned.charAt(0) !== cleaned.charAt(0).toUpperCase()) {
          cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        }
        return { id: t.id, title: cleaned || t.title };
      });
      await onApplyTidy(allCleaned);
      onOpenChange(false);
    } catch (err) {
      console.error("Tidy topics error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
            <DialogTitle className="font-serif text-lg font-bold">
              Tidy Topics with Academic AI
            </DialogTitle>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Automatically refine raw syllabus strings into concise, professional academic lesson titles for <span className="font-semibold text-[var(--color-ink)]">{courseCode}</span>.
          </p>
        </DialogHeader>

        <div className="py-2 space-y-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
            Preview Refinements (First 5 Topics):
          </span>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {previews.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-xs space-y-1"
              >
                <div className="text-[11px] text-[var(--color-ink-muted)] line-through">
                  {item.original}
                </div>
                <div className="flex items-center gap-1.5 font-medium text-[var(--color-ink)]">
                  <ArrowRight className="h-3 w-3 text-[var(--color-accent)] shrink-0" />
                  <span>{item.cleaned}</span>
                </div>
              </div>
            ))}
          </div>
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
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={loading}
            className="gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            <span>{loading ? "Applying..." : "Apply Clean Titles"}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
