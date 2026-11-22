"use client";

import * as React from "react";
import { Exam, PlanEntry, buildToday, examEntries, planPhase, sumProgress, progressOf, todayKey, useExams, useNoteTopics } from "@/lib/notes/study";
import { VaultNote } from "@/lib/notes/vault-types";

/** Everything the exam UI needs: progress, today's plan (kept stable for the day) and toggles. */
export function useExamPlan(exam: Exam | undefined, allNotes: VaultNote[]) {
  const { topics, toggle: toggleTopic } = useNoteTopics();
  const exams = useExams();
  const notes = React.useMemo(
    () => (exam ? (exam.noteIds.map((id) => allNotes.find((n) => n.id === id)).filter(Boolean) as VaultNote[]) : []),
    [exam, allNotes]
  );
  const entries = React.useMemo(() => (exam ? examEntries(exam, notes, topics) : []), [exam, notes, topics]);
  const byKey = React.useMemo(() => new Map(entries.map((e) => [e.key, e])), [entries]);
  const today = todayKey();

  // Freeze today's list once per day so ticking items doesn't reshuffle it.
  const stored = exam?.today;
  const storedValid = stored?.date === today ? stored.keys.filter((k) => byKey.has(k)) : null;
  const needsNew = !!exam && (storedValid === null || (storedValid.length === 0 && entries.some((e) => !e.done)));
  React.useEffect(() => {
    if (exam && needsNew) exams.setToday(exam.id, { date: today, keys: buildToday(exam, entries) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.id, needsNew, today]);

  const todayEntries: PlanEntry[] = (storedValid ?? (exam ? buildToday(exam, entries) : [])).map((k) => byKey.get(k)!).filter(Boolean);

  const planMore = () => {
    if (!exam) return;
    const have = new Set(todayEntries.map((e) => e.key));
    const extra = buildToday(exam, entries.filter((e) => !have.has(e.key)));
    exams.setToday(exam.id, { date: today, keys: [...have, ...extra] });
  };

  const toggle = (key: string) => {
    if (!exam) return;
    const [kind, a, b] = key.split(":");
    if (kind === "t") toggleTopic(a, b);
    else exams.toggleTodo(exam.id, a);
  };

  const topicProg = sumProgress(notes.map((n) => progressOf(topics[n.id])));
  const todoProg = progressOf(exam?.todos);
  const overall = sumProgress([topicProg, todoProg]);
  const todayDone = todayEntries.filter((e) => e.done).length;
  const remaining = entries.filter((e) => !e.done).length;

  return {
    notes,
    topics,
    entries,
    todayEntries,
    todayDone,
    remaining,
    overall,
    topicProg,
    todoProg,
    ...(exam ? planPhase(exam) : { phase: "nodate" as const, left: null, studyDaysLeft: 0 }),
    planMore,
    toggle,
  };
}
