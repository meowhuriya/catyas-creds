"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Pause, Play } from "lucide-react";
import { findTask } from "@/lib/focus/store";
import { fmt, useFocusTimer } from "@/lib/focus/timer";

/** Small floating timer so a running session is never lost while you move around the app. */
export function MiniTimer() {
  const t = useFocusTimer();
  const pathname = usePathname();
  if (t.status === "idle" || pathname === "/focus" || pathname === "/login") return null;
  const task = findTask(t.taskId);
  return (
    <div className="fixed bottom-20 right-4 z-[90] flex items-center gap-2 rounded-full border border-app-border bg-app-surface/95 py-1.5 pl-3 pr-1.5 shadow-xl backdrop-blur md:bottom-6">
      <span className={`h-2 w-2 rounded-full ${t.phase === "focus" ? "bg-app-accent" : "bg-emerald-500"} ${t.status === "running" ? "animate-pulse" : ""}`} />
      <Link href="/focus" className="flex items-center gap-2">
        <span className="font-display text-sm font-semibold tabular-nums text-app-ink">{fmt(t.leftMs)}</span>
        <span className="hidden max-w-[160px] truncate text-xs text-app-ink-muted sm:inline">{t.phase === "focus" ? task?.title ?? "Focus" : "Break"}</span>
      </Link>
      <button onClick={t.status === "running" ? t.pause : t.start} aria-label={t.status === "running" ? "Pause" : "Resume"} className="rounded-full bg-app-accent p-1.5 text-white">
        {t.status === "running" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
