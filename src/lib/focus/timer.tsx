"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { SoundEngine } from "@/lib/sound-engine";
import { getSubject } from "@/lib/notes/curriculum";
import { randomEgg } from "@/lib/rewards/catalog";
import { layEgg } from "@/lib/rewards/pantry";
import { findTask, logFocus, readSettings } from "@/lib/focus/store";

export type Phase = "focus" | "short" | "long";
type Status = "idle" | "running" | "paused";

interface TimerState {
  phase: Phase;
  status: Status;
  endsAt?: number; // when running
  remainingMs: number; // when idle/paused
  startedAt?: number; // start of the current focus stretch (for partial logging)
  focusedMs: number; // focused time already counted in this phase before a pause
  taskId?: string;
  cycle: number; // focus sessions finished in the current set
  species?: string; // the egg being kept warm in this focus session (egg id)
}

interface TimerApi extends TimerState {
  leftMs: number;
  totalMs: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  setPhase: (p: Phase) => void;
  setTask: (id: string | undefined) => void;
}

const KEY = "vc_timer_v1"; // per device, not synced
const Ctx = React.createContext<TimerApi | null>(null);

function durMs(p: Phase) {
  const s = readSettings();
  return (p === "focus" ? s.focusMin : p === "short" ? s.shortMin : s.longMin) * 60_000;
}

function load(): TimerState {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null");
    if (v && v.phase) return v;
  } catch {}
  return { phase: "focus", status: "idle", remainingMs: durMs("focus"), focusedMs: 0, cycle: 0 };
}

/** Leaving a focus session early after a few minutes leaves a wilted flower. */
function wiltIfEarly(s: TimerState) {
  if (s.phase !== "focus") return;
  const ms = s.focusedMs + (s.startedAt ? Date.now() - s.startedAt : 0);
  void ms; // leaving early: the egg just goes back to the nest, nothing hatches
}

/** Bloom chord when a focus session ends, a calm nudge when a break ends (respects the sound settings). */
function chime(kind: "bloom" | "nudge" = "bloom") {
  const e = SoundEngine.getInstance();
  if (kind === "bloom") e.playBloom();
  else e.playNudge();
}

function notify(title: string, body: string) {
  try {
    if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.visibilityState !== "visible") {
      new Notification(title, { body, icon: "/brand/butterfly-real-180.png" });
    }
  } catch {}
}

export function FocusTimerProvider({ children }: { children: React.ReactNode }) {
  const { dataStore } = useDataStore();
  const [st, setSt] = React.useState<TimerState>({ phase: "focus", status: "idle", remainingMs: 25 * 60_000, focusedMs: 0, cycle: 0 });
  const [now, setNow] = React.useState(() => Date.now());
  const loaded = React.useRef(false);
  const stRef = React.useRef(st);
  stRef.current = st;
  // Side effects (logging, sounds) happen here, never inside a state updater, so they run exactly once.
  const apply = (next: TimerState) => {
    stRef.current = next;
    setSt(next);
  };

  React.useEffect(() => {
    setSt(load());
    loaded.current = true;
  }, []);
  React.useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch {}
  }, [st]);

  React.useEffect(() => {
    if (st.status !== "running") return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [st.status]);

  /** Count focused minutes into today's log, the task, the subject and the dashboard's study hours. */
  const record = React.useCallback(
    (ms: number, taskId: string | undefined, pomo: boolean) => {
      const minutes = Math.round(ms / 60_000);
      if (minutes < 1) return;
      const task = findTask(taskId);
      logFocus(minutes, { taskId, subjectId: task?.subjectId, pomo });
      const subj = task?.subjectId ? getSubject(task.subjectId) : undefined;
      dataStore
        ?.logStudySession({
          courseId: subj && subj.year === 1 ? `course-${subj.code.toLowerCase()}` : undefined,
          durationMinutes: minutes,
          mode: "pomodoro",
          completedAt: new Date().toISOString(),
        })
        .catch(() => {});
    },
    [dataStore]
  );

  const finish = React.useCallback(
    (s: TimerState): TimerState => {
      const settings = readSettings();
      if (s.phase === "focus") {
        const fms = s.focusedMs + (s.startedAt ? Date.now() - s.startedAt : 0);
        record(fms, s.taskId, true);
        layEgg({ eggId: s.species, minutes: Math.max(1, Math.round(fms / 60_000)), title: findTask(s.taskId)?.title });
        const cycle = s.cycle + 1;
        const next: Phase = cycle % settings.longEvery === 0 ? "long" : "short";
        chime();
        notify("Focus session done", next === "long" ? "Take a long break." : "Take a short break.");
        const total = durMs(next);
        return settings.autoBreak
          ? { ...s, phase: next, status: "running", endsAt: Date.now() + total, remainingMs: total, startedAt: undefined, focusedMs: 0, cycle, species: undefined }
          : { ...s, phase: next, status: "idle", endsAt: undefined, remainingMs: total, startedAt: undefined, focusedMs: 0, cycle, species: undefined };
      }
      chime("nudge");
      notify("Break over", "Ready for the next focus session?");
      return { ...s, phase: "focus", status: "idle", endsAt: undefined, remainingMs: durMs("focus"), startedAt: undefined, focusedMs: 0, cycle: s.phase === "long" ? 0 : s.cycle };
    },
    [record]
  );

  // Phase finished (also catches up if the tab was closed while running).
  React.useEffect(() => {
    const s = stRef.current;
    if (s.status === "running" && s.endsAt && Date.now() >= s.endsAt) apply(finish(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, st.status, st.endsAt, finish]);

  const api: TimerApi = {
    ...st,
    totalMs: durMs(st.phase),
    leftMs: st.status === "running" && st.endsAt ? Math.max(0, st.endsAt - now) : st.status === "idle" ? durMs(st.phase) : st.remainingMs,
    start: () => {
      try {
        if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
      } catch {}
      const s = stRef.current;
      if (s.status === "running") return;
      const rem = s.status === "idle" ? durMs(s.phase) : s.remainingMs;
      apply({ ...s, status: "running", endsAt: Date.now() + rem, remainingMs: rem, startedAt: s.phase === "focus" ? Date.now() : undefined, species: s.phase === "focus" ? s.species ?? randomEgg().id : s.species });
      setNow(Date.now());
    },
    pause: () => {
      const s = stRef.current;
      if (s.status !== "running" || !s.endsAt) return;
      apply({ ...s, status: "paused", remainingMs: Math.max(0, s.endsAt - Date.now()), endsAt: undefined, focusedMs: s.focusedMs + (s.startedAt ? Date.now() - s.startedAt : 0), startedAt: undefined });
    },
    reset: () => {
      const s = stRef.current;
      if (s.phase === "focus") record(s.focusedMs + (s.startedAt ? Date.now() - s.startedAt : 0), s.taskId, false);
      wiltIfEarly(s);
      apply({ ...s, status: "idle", endsAt: undefined, remainingMs: durMs(s.phase), startedAt: undefined, focusedMs: 0, species: undefined });
    },
    skip: () => {
      const s = stRef.current;
      if (s.phase === "focus") {
        record(s.focusedMs + (s.startedAt ? Date.now() - s.startedAt : 0), s.taskId, false);
        wiltIfEarly(s);
        const next: Phase = (s.cycle + 1) % readSettings().longEvery === 0 ? "long" : "short";
        apply({ ...s, phase: next, status: "idle", endsAt: undefined, remainingMs: durMs(next), startedAt: undefined, focusedMs: 0, species: undefined });
      } else {
        apply({ ...s, phase: "focus", status: "idle", endsAt: undefined, remainingMs: durMs("focus"), startedAt: undefined, focusedMs: 0 });
      }
    },
    setPhase: (p) => {
      const s = stRef.current;
      if (s.phase === "focus" && s.status !== "idle") { record(s.focusedMs + (s.startedAt ? Date.now() - s.startedAt : 0), s.taskId, false); wiltIfEarly(s); }
      apply({ ...s, phase: p, status: "idle", endsAt: undefined, remainingMs: durMs(p), startedAt: undefined, focusedMs: 0, species: undefined });
    },
    setTask: (id) => {
      const s = stRef.current;
      // Time already focused counts toward the task you were on.
      if (s.phase === "focus" && s.status === "running" && s.startedAt && s.taskId !== id) {
        record(s.focusedMs + (Date.now() - s.startedAt), s.taskId, false);
        apply({ ...s, taskId: id, startedAt: Date.now(), focusedMs: 0 });
      } else apply({ ...s, taskId: id });
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useFocusTimer(): TimerApi {
  const v = React.useContext(Ctx);
  if (!v) throw new Error("useFocusTimer must be used inside FocusTimerProvider");
  return v;
}

export function fmt(ms: number) {
  const sec = Math.ceil(ms / 1000);
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}
