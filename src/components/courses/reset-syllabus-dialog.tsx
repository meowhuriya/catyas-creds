"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, AlertTriangle } from "lucide-react";

interface ResetSyllabusDialogProps {
  courseCode: string;
  courseTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function ResetSyllabusDialog({
  courseCode,
  courseTitle,
  open,
  onOpenChange,
  onConfirm,
}: ResetSyllabusDialogProps) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      console.error("Reset syllabus failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-[#B7791F]" />
            <DialogTitle className="font-serif text-lg font-bold">
              Reset to Original Syllabus
            </DialogTitle>
          </div>
          <p className="text-xs text-[var(--color-ink-muted)]">
            Restore the pristine units, topics, and experiments from the JNTUH R25 curriculum seed for <span className="font-semibold text-[var(--color-ink)]">{courseCode}: {courseTitle}</span>.
          </p>
        </DialogHeader>

        <div className="p-3 rounded-[8px] bg-[#B7791F]/10 border border-[#B7791F]/30 text-xs text-[#8A5A12] space-y-1">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>Curricular Reset Warning</span>
          </div>
          <p>
            Any custom topics or manual renames in this course will be replaced with the official syllabus structure. Videos and submissions linked to standard topics are preserved.
          </p>
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
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Resetting..." : "Reset Course Syllabus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
