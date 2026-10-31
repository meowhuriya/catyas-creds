"use client";

import * as React from "react";
import { Award, CheckCircle2, ChevronRight, X } from "lucide-react";
import Link from "next/link";

interface MilestoneBannerProps {
  title: string;
  subtitle: string;
  type?: "unit" | "course" | "semester";
  actionLabel?: string;
  actionHref?: string;
  onDismiss?: () => void;
  className?: string;
}

export function MilestoneBanner({
  title,
  subtitle,
  type = "unit",
  actionLabel,
  actionHref,
  onDismiss,
  className = "",
}: MilestoneBannerProps) {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={`relative overflow-hidden rounded-[10px] border border-[#C79A3B]/40 bg-[var(--color-surface)] shadow-sm ${className}`}
    >
      {/* Top Hairline Gold Rule */}
      <div className="h-[2px] bg-gradient-to-r from-[#A51C30] via-[#C79A3B] to-[#A51C30]" />

      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-full bg-[#C79A3B]/15 border border-[#C79A3B]/30 flex items-center justify-center text-[#C79A3B] shrink-0 mt-0.5">
            <Award className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#A51C30] font-bold">
                {type === "semester"
                  ? "Academic Term Completed"
                  : type === "course"
                  ? "Course Mastered"
                  : "Unit Completed"}
              </span>
              <span className="text-[10px] text-[#C79A3B] font-bold">•</span>
              <span className="text-[10px] text-[var(--color-ink-muted)] font-mono">
                Verified Progress
              </span>
            </div>

            <h3 className="font-serif text-base sm:text-lg font-bold text-[var(--color-ink)] leading-snug">
              {title}
            </h3>

            <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-[#A51C30] hover:bg-[#8B1627] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>{actionLabel}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
            title="Dismiss milestone"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bottom Subtle Crimson Double Hairline */}
      <div className="border-b border-[#A51C30]/20" />
    </div>
  );
}
