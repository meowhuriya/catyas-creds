"use client";

import * as React from "react";
import { Check, Pause, Play, RotateCcw, Settings2, SkipForward, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScorePill } from "@/components/notes/topic-checklist";
import { FocusTask, useFocusSettings } from "@/lib/focus/store";
import { Phase, fmt, useFocusTimer } from "@/lib/focus/timer";
import { EggProgress } from "@/components/rewards/egg";
import { HatchOverlay } from "@/components/rewards/hatch-overlay";
import { usePantry } from "@/lib/rewards/pantry";
import { QEntry } from "@/lib/notes/questions";
import { useNoteTopics } from "@/lib/notes/study";
import { cn } from "@/lib/utils";

const PHASES: [Phase, string][] = [["focus", "Focus"], ["short", "Short break"], ["long", "Long break"]];

export function TimerCard({
  task,
  taskEntries,
  onPickTask,
  onTest,
  onMarkDone,
}: {
  task?: FocusTask;
  taskEntries: QEntry[];
  onPickTask: () => void;
  onTest: (entries: QEntry[]) => void;
  onMarkDone: () => void;
}) {
  const t = useFocusTimer();
  const nt = useNoteTopics();
  const [settings, setSettings] = useFocusSettings();
  const [showSettings, setShowSettings] = React.useState(false);
  const pantry = usePantry();
  const [hatching, setHatching] = React.useState(false);
  const pct = t.totalMs ? 1 - t.leftMs / t.totalMs : 0;
  const R = 118;
  const C = 2 * Math.PI * R;
  const mastered = taskEntries.filter((e) => e.item.done).length;
  const isBreak = t.phase !== "focus";

  return (
    <section className="vc-tile relative flex flex-col overflow-hidden p-5 sm:p-7">
      {/* Phase + settings */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1 rounded-full border border-app-border p-1">
          {PHASES.map(([p, label]) => (
            <button key={p} onClick={() => t.setPhase(p)} className={cn("flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors", t.phase === p ? "bg-app-accent text-white" : "text-app-ink-muted hover:text-app-ink")}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowSettings((v) => !v)} aria-label="Timer settings" className={cn("rounded-full border border-app-border p-2 text-app-ink-muted hover:text-app-ink", showSettings && "border-app-accent text-app-ink")}>
          <Settings2 className="h-4 w-4" />
        </button>
      </div>

      {showSettings && (
        <div className="mt-3 grid grid-cols-2 gap-3 rounded-control border border-app-border p-3 text-xs sm:grid-cols-3">
          {([["focusMin", "Focus (min)", 1, 240], ["shortMin", "Short break", 1, 60], ["longMin", "Long break", 1, 120], ["longEvery", "Long break every", 1, 12], ["goalMin", "Daily goal (min)", 1, 1440]] as const).map(([k, label, min, max]) => (
            <SettingNumber key={k} label={label} value={settings[k]} min={min} max={max} onChange={(v) => setSettings({ [k]: v })} />
          ))}
          <label className="flex items-center gap-2 self-end pb-2 text-app-ink-muted">
            <input type="checkbox" checked={settings.autoBreak} onChange={(e) => setSettings({ autoBreak: e.target.checked })} className="accent-[var(--accent)]" /> Start breaks automatically
          </label>
        </div>
      )}

      {/* Ring */}
      <div className="relative mx-auto my-6 h-[260px] w-[260px]">
        <svg viewBox="0 0 260 260" className="h-full w-full -rotate-90">
          <circle cx="130" cy="130" r={R} fill="none" stroke="currentColor" strokeWidth="10" className="text-app-surface-muted" />
          <circle cx="130" cy="130" r={R} fill="none" strokeWidth="10" strokeLinecap="round" stroke={isBreak ? "#10B981" : "var(--accent)"}
            strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: "stroke-dashoffset 0.5s linear" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {!isBreak && <EggProgress eggId={t.species} progress={t.status === "idle" ? 0 : pct} size={92} className="-mt-2 mb-2" />}
          {isBreak && pantry.waiting.length > 0 && (
            <EggProgress eggId={pantry.waiting[pantry.waiting.length - 1].eggId} progress={1} ready size={92} className="-mt-2 mb-2" onTap={() => setHatching(true)} />
          )}
          <span className={cn("font-display font-semibold leading-none tracking-tight text-app-ink tabular-nums", isBreak && !pantry.waiting.length ? "text-[64px]" : "text-[44px]")}>{fmt(t.leftMs)}</span>
          <span className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-app-ink-muted">
            {t.status === "paused" ? "Paused" : isBreak ? (t.phase === "long" ? "Long break" : "Short break") : "Focus"}
          </span>
          <div className="mt-3 flex gap-1.5" aria-label={`${t.cycle % settings.longEvery} of ${settings.longEvery} sessions before a long break`}>
            {Array.from({ length: settings.longEvery }, (_, i) => (
              <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i < t.cycle % settings.longEvery ? "bg-app-accent" : "bg-app-surface-muted")} />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={t.reset} aria-label="Reset" className="rounded-full border border-app-border p-3 text-app-ink-muted hover:text-app-ink"><RotateCcw className="h-4 w-4" /></button>
        <button onClick={t.status === "running" ? t.pause : t.start} aria-label={t.status === "running" ? "Pause" : "Start"}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-app-accent text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
          {t.status === "running" ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
        </button>
        <button onClick={t.skip} aria-label="Skip to next" className="rounded-full border border-app-border p-3 text-app-ink-muted hover:text-app-ink"><SkipForward className="h-4 w-4" /></button>
      </div>

      {/* What you're on */}
      <div className="mt-6 border-t border-app-border pt-4">
        {task ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-app-ink-muted">Focusing on</p>
                <p className="truncate font-medium text-app-ink">{task.title}</p>
                <p className="text-xs text-app-ink-muted">
                  {task.kind === "questions" ? `${mastered}/${taskEntries.length} mastered · ` : ""}
                  {task.minutes} min · {task.pomos} session{task.pomos === 1 ? "" : "s"}
                </p>
              </div>
              <button onClick={onPickTask} className="shrink-0 text-xs font-medium text-[var(--color-accent)]">Change</button>
            </div>
            {task.kind === "questions" ? (
              <>
                <ul className="max-h-64 space-y-0.5 overflow-y-auto">
                  {taskEntries.map((e) => (
                    <li key={e.key} className="flex items-start gap-2 rounded px-1 py-1 hover:bg-app-surface-muted">
                      <input type="checkbox" checked={e.item.done} onChange={() => nt.toggle(e.noteId, e.itemId)} title="Mark as mastered" className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
                      <span className={cn("flex-1 text-sm leading-snug", e.item.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{e.item.text}</span>
                      {!!e.item.marks && <span className="shrink-0 rounded-full border border-app-border px-1.5 text-[10px] text-app-ink-muted">{e.item.marks}M</span>}
                      <ScorePill item={e.item} />
                    </li>
                  ))}
                  {taskEntries.length === 0 && <li className="text-xs text-app-ink-muted">These questions were removed from the Q-bank.</li>}
                </ul>
                <Button className="w-full" onClick={() => onTest(taskEntries.filter((e) => !e.item.done))} disabled={mastered === taskEntries.length}>
                  <Target className="h-4 w-4" /> Test me on these
                </Button>
              </>
            ) : (
              !task.done && <Button variant="ghost" className="w-full" onClick={onMarkDone}><Check className="h-4 w-4" /> Mark done</Button>
            )}
          </div>
        ) : (
          <button onClick={onPickTask} className="flex w-full items-center justify-center gap-2 rounded-control border border-dashed border-app-border px-4 py-3 text-sm text-app-ink-muted hover:border-app-accent hover:text-app-ink">
            <Target className="h-4 w-4" /> Pick one thing to focus on
          </button>
        )}
      </div>
      {hatching && pantry.waiting.length > 0 && <HatchOverlay items={pantry.waiting} onClose={() => setHatching(false)} />}
    </section>
  );
}


/** A number box you can clear and retype freely; it only checks the limits when you leave it. */
function SettingNumber({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const [text, setText] = React.useState(String(value));
  React.useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const n = Math.round(Number(text));
    if (!text.trim() || !Number.isFinite(n)) return setText(String(value));
    const v = Math.max(min, Math.min(max, n));
    setText(String(v));
    if (v !== value) onChange(v);
  };
  return (
    <label className="space-y-1 text-app-ink-muted">
      <span className="block">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={(e) => {
          const t = e.target.value.replace(/[^0-9]/g, "");
          setText(t);
          const n = Number(t);
          if (t && n >= min && n <= max) onChange(n);
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        className="w-full rounded-control border border-app-border bg-app-surface px-2 py-1.5 text-sm text-app-ink"
      />
    </label>
  );
}
