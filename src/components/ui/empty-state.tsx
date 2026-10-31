import * as React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-card border border-dashed border-app-border bg-app-surface/50",
        className
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-control bg-app-surface-muted border border-app-border/80 text-app-ink-muted mb-3">
          <Icon className="h-6 w-6 stroke-[1.5]" />
        </div>
      )}
      <h3 className="font-serif text-lg font-semibold text-app-ink">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-app-ink-muted">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button onClick={onAction} size="sm">
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
