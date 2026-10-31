import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  percentage: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  className?: string;
  color?: string; // Hex color for ring
}

export function ProgressRing({
  percentage,
  size = 52,
  strokeWidth = 4,
  showText = true,
  className,
  color,
}: ProgressRingProps) {
  const cleanPercentage = Math.min(100, Math.max(0, Math.round(percentage)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (cleanPercentage / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        className="rotate-[-90deg] transition-all duration-300"
        width={size}
        height={size}
      >
        <circle
          className="text-app-surface-muted"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke={color || "var(--color-accent)"}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {showText && (
        <span className="absolute font-serif text-xs font-semibold text-app-ink tabular-nums">
          {cleanPercentage}%
        </span>
      )}
    </div>
  );
}
