"use client";

import * as React from "react";
import { Exam, REVISION_DAYS, examEntries, planPhase, progressOf, sumProgress, useExams, useNoteTopics } from "@/lib/notes/study";
import { questionEntries, refKey, smartOpen } from "@/lib/notes/questions";
import { useFocusDay } from "@/lib/focus/store";
import { VaultNote } from "@/lib/notes/vault-types";

/** Progress for one exam, plus its share of today's Focus list (the single daily plan for the whole app). */
export function useExamPlan(exam: Exam | undefined, allNotes: VaultNote[]) {
  const { topics, toggle: toggleTopic } = useNoteTopics();
  const exams = useExams();
  const focus = useFocusDay();
  const notes = React.useMemo(
    () => (exam ? (exam.noteIds.map((id) => allNotes.find((n) => n.id === id)).filter(Boolean) as VaultNote[]) : []),
    [exam, allNotes]
  );
  const entries = React.useMemo(() => (exam ? examEntries(exam, notes, topics) : []), [exam, notes, topics]);
  const questions = React.useMemo(() => questionEntries(notes, topics), [notes, topics]);
  const phase = exam ? planPhase(exam) : { phase: "nodate" as const, left: null, studyDaysLeft: 0 };

  const noteIds = new Set(notes.map((n) => n.id));
  const todayTasks = focus.day.tasks.filter((t) => (t.refs ?? []).some((r) => noteIds.has(r.noteId)));
  const planned = new Set(focus.day.tasks.filter((t) => !t.done).flatMap((t) => (t.refs ?? []).map(refKey)));
  const open = smartOpen(questions);
  const shareSize =
    phase.phase === "study" ? Math.max(1, Math.ceil(open.length / Math.max(1, phase.studyDaysLeft)))
    : phase.phase === "nodate" ? Math.min(8, open.length)
    : phase.phase === "revision" || phase.phase === "examday" ? Math.min(12, open.length)
    : 0;
  const share = open.filter((e) => !planned.has(e.key)).slice(0, Math.max(0, shareSize - todayTasks.reduce((a, t) => a + (t.refs?.length ?? 0), 0)));

  /** Put today's share of this exam's questions into the Focus list. */
  const addShareToFocus = () => {
    if (!exam || !share.length) return 0;
    focus.addTask({
      title: `${exam.name} · today's share`,
      kind: "questions",
      subjectId: exam.subjectId,
      refs: share.map((e) => ({ noteId: e.noteId, itemId: e.itemId })),
    });
    return share.length;
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
  const remaining = entries.filter((e) => !e.done).length;

  return {
    notes,
    topics,
    entries,
    remaining,
    overall,
    topicProg,
    todoProg,
    todayTasks,
    share,
    addShareToFocus,
    revisionDays: REVISION_DAYS,
    ...phase,
    toggle,
  };
}
