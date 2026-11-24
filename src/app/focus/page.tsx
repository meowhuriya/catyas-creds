"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Flame, ListPlus, Loader2, Plus, Sparkles, Timer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Bar } from "@/components/notes/exam-panel";
import { Drill } from "@/components/prep/drill";
import { QuestionPicker, PickResult } from "@/components/focus/question-picker";
import { PantryCard } from "@/components/rewards/pantry-card";
import { TimerCard } from "@/components/focus/timer-card";
import { blocksToTasks, fallbackBlocks, planInput, PlanBlock } from "@/lib/focus/plan";
import { FocusTask, dateKey, readSettings, streak, useFocusDay, useFocusDays, useFocusSettings } from "@/lib/focus/store";
import { useFocusTimer } from "@/lib/focus/timer";
import { getSubject } from "@/lib/notes/curriculum";
import { QEntry, questionEntries, refKey } from "@/lib/notes/questions";
import { todayKey, useExams, useNoteTopics } from "@/lib/notes/study";
import { useVault } from "@/lib/notes/use-vault";
import { cn } from "@/lib/utils";

export default function FocusPage() {
  const vault = useVault();
  const nt = useNoteTopics();
  const { exams } = useExams();
  const timer = useFocusTimer();
  const today = useFocusDay();
  const days = useFocusDays();
  const [settings] = useFocusSettings();
  const toast = useToast();

  const entries = React.useMemo(() => questionEntries(vault.notes, nt.topics), [vault.notes, nt.topics]);
  const byKey = React.useMemo(() => new Map(entries.map((e) => [e.key, e])), [entries]);
  const entriesOf = React.useCallback((t?: FocusTask) => (t?.refs ?? []).map((r) => byKey.get(refKey(r))).filter(Boolean) as QEntry[], [byKey]);

  const tasks = today.day.tasks;
  const active = tasks.find((t) => t.id === timer.taskId);
  const [picker, setPicker] = React.useState(false);
  const [drill, setDrill] = React.useState<QEntry[] | null>(null);
  const [newTodo, setNewTodo] = React.useState("");
  const [planning, setPlanning] = React.useState(false);
  const [planMsg, setPlanMsg] = React.useState("");

  // A question block is done once every question in it is mastered.
  React.useEffect(() => {
    for (const t of tasks) {
      if (t.kind !== "questions" || t.done) continue;
      const es = entriesOf(t);
      if (es.length && es.every((e) => e.item.done)) today.updateTask(t.id, { done: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, entriesOf]);

  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dateKey(d);
  })();
  const carry = (days[yesterday]?.tasks ?? []).filter((t) => !t.done && !tasks.some((x) => x.title === t.title));

  const plannedKeys = new Set(tasks.flatMap((t) => (t.done ? [] : (t.refs ?? []).map(refKey))));

  const planDay = async () => {
    setPlanning(true);
    setPlanMsg("");
    const budget = Math.max(30, readSettings().goalMin - today.day.minutes);
    const open = entries.filter((e) => !plannedKeys.has(e.key));
    const input = planInput(open, exams);
    if (!input.length) {
      setPlanning(false);
      setPlanMsg("Nothing left to plan: import questions into your Q-banks first, or everything is mastered.");
      return;
    }
    // Planned on this device (no AI): closer exams and weak questions first.
    const blocks: PlanBlock[] = fallbackBlocks(input, budget);
    const message = "";
    const fresh = blocksToTasks(blocks, open, plannedKeys);
    today.replaceAuto(fresh);
    setPlanMsg(message || `Planned ${fresh.length} block${fresh.length === 1 ? "" : "s"} for about ${budget} minutes.`);
    setPlanning(false);
  };

  const onPick = (r: PickResult, focusNow: boolean) => {
    const s = getSubject(r.subjectId);
    const id = today.addTask({
      title: `${s?.code ?? r.subjectId} · ${r.chapter || "Selected questions"}`,
      kind: "questions",
      subjectId: r.subjectId,
      chapter: r.chapter || undefined,
      refs: r.entries.map((e) => ({ noteId: e.noteId, itemId: e.itemId })),
    });
    if (focusNow) timer.setTask(id);
    setPicker(false);
  };

  const focusOn = (t: FocusTask) => {
    timer.setTask(t.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (timer.status === "idle" && timer.phase === "focus") toast.info("Ready", "Press play when you're set.");
  };

  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-app-ink-muted">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.025em] text-app-ink">Focus</h1>
        </div>
        <HoursStrip todayMin={today.day.minutes} goal={settings.goalMin} pomos={today.day.pomos} streakDays={streak(days)} />
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <TimerCard
          task={active}
          taskEntries={entriesOf(active)}
          onPickTask={() => setPicker(true)}
          onTest={(es) => setDrill(es)}
          onMarkDone={() => active && today.updateTask(active.id, { done: true })}
        />

        {/* Today's to-do */}
        <section className="vc-tile flex flex-col p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-app-ink">Today</h2>
              <p className="text-xs text-app-ink-muted">{tasks.length ? `${doneCount} of ${tasks.length} done` : "Nothing planned yet"}</p>
            </div>
            <Button size="sm" onClick={planDay} disabled={planning}>
              {planning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {tasks.some((t) => t.auto) ? "Re-plan" : "Plan my day"}
            </Button>
          </div>
          {tasks.length > 0 && <Bar pct={tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0} className="mt-3" />}
          <p className="mt-2 text-[11px] text-app-ink-muted">
            {planMsg || "Plan my day spreads your un-mastered questions across all subjects, putting closer exams and weak questions first."}
          </p>

          {carry.length > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-control bg-[var(--accent-soft)] px-3 py-2 text-xs text-app-ink">
              <span className="flex-1">{carry.length} unfinished from yesterday.</span>
              <button onClick={() => carry.forEach((t) => today.addTask({ ...t, id: undefined, done: false, minutes: 0, pomos: 0, auto: false }))} className="font-semibold text-[var(--color-accent)]">Bring them over</button>
              <button onClick={() => today.dismissFrom(yesterday)} className="text-app-ink-muted hover:text-app-ink">Dismiss</button>
            </div>
          )}

          <ul className="mt-3 flex-1 space-y-1.5">
            {tasks.map((t, i) => {
              const es = entriesOf(t);
              const m = es.filter((e) => e.item.done).length;
              const isActive = t.id === timer.taskId;
              return (
                <li key={t.id} className={cn("group/row rounded-control border px-3 py-2.5 transition-colors", isActive ? "border-app-accent bg-[var(--accent-soft)]" : "border-app-border")}>
                  <div className="flex items-start gap-2.5">
                    <input type="checkbox" checked={t.done} onChange={() => today.updateTask(t.id, { done: !t.done })} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-sm leading-snug", t.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{t.title}</p>
                      <p className="text-[11px] text-app-ink-muted">
                        {t.kind === "questions" ? `${m}/${es.length} mastered` : "To-do"}
                        {t.minutes ? ` · ${t.minutes} min` : ""}
                        {t.pomos ? ` · ${t.pomos} 🍅` : ""}
                        {t.why ? ` · ${t.why}` : ""}
                      </p>
                    </div>
                    {!t.done && !isActive && (
                      <button onClick={() => focusOn(t)} className="shrink-0 rounded-full border border-app-border px-2.5 py-0.5 text-[11px] font-medium text-app-ink-muted hover:border-app-accent hover:text-app-ink">
                        <Timer className="mr-1 inline h-3 w-3" />Focus
                      </button>
                    )}
                    {isActive && <span className="shrink-0 text-[11px] font-semibold text-[var(--color-accent)]">Now</span>}
                  </div>
                  <div className="mt-1 flex justify-end gap-2 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
                    <button onClick={() => today.moveTask(t.id, -1)} disabled={i === 0} aria-label="Move up" className="text-app-ink-muted disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button onClick={() => today.moveTask(t.id, 1)} disabled={i === tasks.length - 1} aria-label="Move down" className="text-app-ink-muted disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { if (isActive) timer.setTask(undefined); today.removeTask(t.id); }} aria-label="Remove" className="text-app-ink-muted"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </li>
              );
            })}
          </ul>

          <form onSubmit={(e) => { e.preventDefault(); if (newTodo.trim()) today.addTask({ title: newTodo.trim(), kind: "custom" }); setNewTodo(""); }} className="mt-3 flex gap-1.5">
            <input value={newTodo} onChange={(e) => setNewTodo(e.target.value)} placeholder="Add a to-do"
              className="min-w-0 flex-1 rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm outline-none focus:border-app-accent" />
            <button type="submit" disabled={!newTodo.trim()} aria-label="Add to-do" className="rounded-control border border-app-border px-2.5 text-app-ink disabled:opacity-40"><Plus className="h-4 w-4" /></button>
            <button type="button" onClick={() => setPicker(true)} className="inline-flex items-center gap-1 rounded-control border border-app-border px-3 text-xs font-medium text-app-ink hover:border-app-accent">
              <ListPlus className="h-4 w-4" /> Questions
            </button>
          </form>
        </section>
      </div>

      <PantryCard />
      <HoursChart days={days} goal={settings.goalMin} />

      {picker && <QuestionPicker entries={entries} initialSubject={active?.subjectId} onClose={() => setPicker(false)} onPick={onPick} />}
      {drill && (
        <Drill
          subjectTitle={getSubject(drill[0]?.subjectId ?? "")?.title ?? "Questions"}
          notes={vault.notes.filter((n) => drill.some((e) => e.noteId === n.id))}
          only={drill.map((e) => ({ noteId: e.noteId, itemId: e.itemId }))}
          onClose={() => setDrill(null)}
        />
      )}
    </div>
  );
}

function HoursStrip({ todayMin, goal, pomos, streakDays }: { todayMin: number; goal: number; pomos: number; streakDays: number }) {
  const pct = Math.min(100, Math.round((todayMin / goal) * 100));
  return (
    <div className="flex items-center gap-5 rounded-2xl border border-app-border bg-app-surface px-4 py-2.5">
      <div className="min-w-[140px]">
        <div className="flex items-baseline justify-between text-xs text-app-ink-muted">
          <span><b className="font-display text-lg text-app-ink">{(todayMin / 60).toFixed(1)}</b> / {(goal / 60).toFixed(goal % 60 ? 1 : 0)} h today</span>
        </div>
        <Bar pct={pct} className="mt-1 h-1.5" />
      </div>
      <div className="text-center">
        <p className="font-display text-lg leading-none text-app-ink">{pomos}</p>
        <p className="text-[10px] uppercase tracking-wide text-app-ink-muted">sessions</p>
      </div>
      <div className="text-center">
        <p className="flex items-center gap-1 font-display text-lg leading-none text-app-ink"><Flame className="h-4 w-4 text-amber-500" />{streakDays}</p>
        <p className="text-[10px] uppercase tracking-wide text-app-ink-muted">day streak</p>
      </div>
    </div>
  );
}

function HoursChart({ days, goal }: { days: Record<string, { minutes: number; bySubject?: Record<string, number> }>; goal: number }) {
  const list = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const k = dateKey(d);
    return { k, d, min: days[k]?.minutes ?? 0 };
  });
  const max = Math.max(goal, ...list.map((x) => x.min), 60);
  const week = list.slice(-7).reduce((a, x) => a + x.min, 0);
  const todaySubjects = Object.entries(days[todayKey()]?.bySubject ?? {}).sort((a, b) => b[1] - a[1]);
  return (
    <section className="vc-tile grid gap-6 p-5 md:grid-cols-[1fr_240px]">
      <div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-app-ink">Study hours</h2>
          <span className="text-xs text-app-ink-muted">{(week / 60).toFixed(1)} h this week</span>
        </div>
        <div className="relative mt-4 flex h-40 items-end gap-1.5">
          <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-app-border" style={{ bottom: `${(goal / max) * 100}%` }}>
            <span className="absolute -top-4 right-0 text-[10px] text-app-ink-muted">goal</span>
          </div>
          {list.map((x, i) => (
            <div key={x.k} className="group/bar flex h-full flex-1 flex-col justify-end">
              <div
                title={`${x.d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}: ${(x.min / 60).toFixed(1)} h`}
                className={cn("w-full rounded-t-md transition-colors", i === 13 ? "bg-app-accent" : x.min >= goal ? "bg-[rgb(var(--accent-rgb)/0.55)]" : "bg-[rgb(var(--accent-rgb)/0.25)]")}
                style={{ height: `${Math.max(2, (x.min / max) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          {list.map((x, i) => (
            <span key={x.k} className={cn("flex-1 text-center text-[10px]", i === 13 ? "font-semibold text-app-ink" : "text-app-ink-muted")}>
              {x.d.toLocaleDateString(undefined, { weekday: "narrow" })}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-app-ink">Today by subject</p>
        {todaySubjects.length === 0 ? (
          <p className="text-xs text-app-ink-muted">Pick a question block or subject before you start the timer and your time is counted here.</p>
        ) : (
          todaySubjects.map(([id, min]) => (
            <div key={id} className="flex justify-between text-xs">
              <span className="truncate text-app-ink">{getSubject(id)?.title ?? id}</span>
              <span className="shrink-0 text-app-ink-muted">{min} min</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
