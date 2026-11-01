import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  indicatorClassName,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-[#E4D9C0] dark:bg-[#3D2D31] border border-[#CFC8BB]/50",
        className
      )}
    >
      <div
        className={cn(
          "h-full bg-[#A51C30] transition-all duration-300 ease-out",
          indicatorClassName
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
