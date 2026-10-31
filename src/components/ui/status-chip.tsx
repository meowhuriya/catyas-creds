import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusChipType =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "graded"
  | "overdue";

interface StatusChipProps {
  status: StatusChipType;
  label?: string;
  className?: string;
}

const STATUS_CONFIG: Record<
  StatusChipType,
  { label: string; bg: string; text: string; dot: string }
> = {
  not_started: {
    label: "Not started",
    bg: "bg-app-surface-muted",
    text: "text-app-ink-muted",
    dot: "bg-app-ink-muted",
  },
  in_progress: {
    label: "In progress",
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-app-warning",
    dot: "bg-app-warning",
  },
  submitted: {
    label: "Submitted",
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-app-info",
    dot: "bg-app-info",
  },
  graded: {
    label: "Graded",
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-app-success",
    dot: "bg-app-success",
  },
  overdue: {
    label: "Overdue",
    bg: "bg-red-500/10 dark:bg-red-500/20",
    text: "text-app-danger",
    dot: "bg-app-danger",
  },
};

export function StatusChip({ status, label, className }: StatusChipProps) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_started;
  const text = label || cfg.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border border-transparent",
        cfg.bg,
        cfg.text,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
      {text}
    </span>
  );
}
