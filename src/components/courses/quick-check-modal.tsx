"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Topic } from "@/types/schemas";
import { useDataStore } from "@/lib/repository";
import { useToast } from "@/components/ui/toast";
import {
  getQuickCheckQuestionsForTopic,
  QuickCheckQuestion,
} from "@/lib/mastery/quick-check-questions";
import { calculateNextRevision } from "@/lib/mastery/spaced-revision";
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Plus,
  BookOpen,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

interface QuickCheckModalProps {
  topic: Topic | null;
  courseCode?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (updatedTopic: Topic) => void;
}

export function QuickCheckModal({
  topic,
  courseCode,
  open,
  onOpenChange,
  onSuccess,
}: QuickCheckModalProps) {
  const { dataStore, refreshData } = useDataStore();
  const toast = useToast();

  const [questions, setQuestions] = React.useState<QuickCheckQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<number, number>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"quiz" | "builder">("quiz");

  // Custom question builder inputs
  const [customQuestionText, setCustomQuestionText] = React.useState("");
  const [customOptions, setCustomOptions] = React.useState(["", "", "", ""]);
  const [customCorrectIdx, setCustomCorrectIdx] = React.useState(0);
  const [customExplanation, setCustomExplanation] = React.useState("");

  // Initialize questions when topic changes or modal opens
  React.useEffect(() => {
    if (topic && open) {
      const qList = getQuickCheckQuestionsForTopic(topic.title, courseCode);
      setQuestions(qList);
      setCurrentIdx(0);
      setSelectedAnswers({});
      setSubmitted(false);
      setActiveTab("quiz");
    }
  }, [topic, courseCode, open]);

  if (!topic) return null;

  const currentQ = questions[currentIdx];
  const totalQ = questions.length;

  const handleSelectOption = (optionIndex: number) => {
    if (submitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIdx < totalQ - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleSubmitCheck = async () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const percentCorrect = totalQ > 0 ? correctCount / totalQ : 0;
    const checkScore = Math.round(percentCorrect * 60);
    const watchScore = topic.watchScore || 0;
    const newTopicScore = Math.min(100, watchScore + checkScore);
    const isDone = newTopicScore >= 70;

    const now = new Date();
    const { nextDueDate } = calculateNextRevision(now, 0);

    setSubmitted(true);

    try {
      const updated = await dataStore.updateTopic(topic.id, {
        checkScore,
        topicScore: newTopicScore,
        isDone,
        lastRevisedAt: now.toISOString(),
        revisionDueAt: isDone ? nextDueDate : topic.revisionDueAt,
      });

      await dataStore.logAudit(
        "topic_checked",
        topic.id,
        `Quick Check on "${topic.title}": scored ${checkScore}/60 pts (${correctCount}/${totalQ} correct). Total: ${newTopicScore}/100.`
      );

      await refreshData();
      onSuccess?.(updated);

      toast.success(
        "Quick Check Completed",
        `Scored ${checkScore}/60 points! Total topic mastery is now ${newTopicScore}/100${
          isDone ? " — Topic Mastered (Done)!" : ""
        }`
      );
    } catch (err) {
      console.error("Failed to update quick check score:", err);
    }
  };

  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestionText.trim()) return;
    const validOptions = customOptions.map((o, idx) => o.trim() || `Option ${idx + 1}`);

    const newQ: QuickCheckQuestion = {
      id: "custom-" + Date.now(),
      question: customQuestionText.trim(),
      options: validOptions,
      correctIndex: customCorrectIdx,
      explanation: customExplanation.trim() || "Author verified definition and principle.",
    };

    setQuestions((prev) => [...prev, newQ]);
    setCustomQuestionText("");
    setCustomOptions(["", "", "", ""]);
    setCustomExplanation("");
    setActiveTab("quiz");
  };

  // Score calculations if submitted
  const correctCount = questions.reduce(
    (acc, q, idx) => (selectedAnswers[idx] === q.correctIndex ? acc + 1 : acc),
    0
  );
  const earnedCheckScore = Math.round((correctCount / totalQ) * 60);
  const totalMasteryScore = Math.min(100, (topic.watchScore || 0) + earnedCheckScore);
  const meetsDone = totalMasteryScore >= 70;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#C79A3B]" />
              <DialogTitle className="font-serif">Topic Quick Check</DialogTitle>
            </div>
            <span className="font-mono text-xs bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-[4px] border border-[var(--color-border)] text-[var(--color-ink-muted)]">
              Max 60 Points
            </span>
          </div>
          <DialogDescription className="line-clamp-1">
            {topic.title}
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher: Quick Check vs Add Question */}
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("quiz")}
            className={`font-semibold pb-1 border-b-2 transition-colors ${
              activeTab === "quiz"
                ? "border-[var(--color-accent)] text-[var(--color-ink)]"
                : "border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            Check Questions ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("builder")}
            className={`font-semibold pb-1 border-b-2 transition-colors ${
              activeTab === "builder"
                ? "border-[var(--color-accent)] text-[var(--color-ink)]"
                : "border-transparent text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            + Add Custom Question
          </button>
        </div>

        {activeTab === "quiz" ? (
          <div className="space-y-4 py-2 text-xs">
            {/* Header Status & Navigation Chips */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[var(--color-ink-muted)]">
                Question {currentIdx + 1} of {totalQ}
              </span>
              <div className="flex items-center gap-1">
                {questions.map((_, idx) => {
                  const isAnswered = selectedAnswers[idx] !== undefined;
                  const isCurrent = idx === currentIdx;
                  let bg = "bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)]";

                  if (submitted) {
                    const isRight = selectedAnswers[idx] === questions[idx].correctIndex;
                    bg = isRight
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold"
                      : "bg-red-500/20 text-red-700 dark:text-red-300 font-bold";
                  } else if (isCurrent) {
                    bg = "bg-[var(--color-accent)] text-white font-bold";
                  } else if (isAnswered) {
                    bg = "bg-[var(--color-ink)] text-[var(--color-bg)] font-semibold";
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-6 w-6 rounded-[4px] text-[10px] font-mono flex items-center justify-center transition-colors ${bg}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Card */}
            {currentQ && (
              <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
                <p className="font-serif text-sm font-bold text-[var(--color-ink)] leading-snug">
                  {currentQ.question}
                </p>

                {/* Option Choices */}
                <div className="space-y-2 pt-1">
                  {currentQ.options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentIdx] === optIdx;
                    const isCorrectAnswer = optIdx === currentQ.correctIndex;

                    let borderClass =
                      "border-[var(--color-border)] hover:border-[var(--color-accent)] bg-[var(--color-surface)]";

                    if (submitted) {
                      if (isCorrectAnswer) {
                        borderClass = "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-semibold";
                      } else if (isSelected) {
                        borderClass = "border-red-500 bg-red-500/10 text-red-900 dark:text-red-200 line-through";
                      } else {
                        borderClass = "border-[var(--color-border)] opacity-60";
                      }
                    } else if (isSelected) {
                      borderClass = "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold";
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        data-testid="option-choice"
                        disabled={submitted}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`flex w-full items-start gap-2.5 p-2.5 rounded-[6px] border text-left transition-colors text-xs ${borderClass}`}
                      >
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-surface-muted)] text-[var(--color-ink-muted)] shrink-0 mt-0.5">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1 leading-relaxed">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Banner (After Submission) */}
                {submitted && (
                  <div className="mt-3 p-3 rounded-[6px] bg-[var(--color-surface-muted)]/70 border border-[var(--color-border)] text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
                    <span className="font-bold text-[var(--color-ink)] block mb-0.5">
                      Academic Explanation:
                    </span>
                    {currentQ.explanation}
                  </div>
                )}
              </div>
            )}

            {/* Post-Submission Result Card */}
            {submitted && (
              <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#1F7A4D]" />
                    <span className="font-serif font-bold text-sm text-[var(--color-ink)]">
                      {correctCount} / {totalQ} Correct ({earnedCheckScore} / 60 Pts)
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--color-ink-muted)] mt-0.5">
                    Total Topic Mastery:{" "}
                    <strong>{totalMasteryScore}/100</strong> (Watch: {topic.watchScore || 0} + Check: {earnedCheckScore})
                  </p>
                </div>

                <div className="text-right">
                  {meetsDone ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1F7A4D]/15 text-[#1F7A4D] font-bold text-xs border border-[#1F7A4D]/30">
                      Topic Mastered (Done)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-500/30">
                      In Progress ({totalMasteryScore}/70 req)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentIdx === 0}
                onClick={handlePrev}
                className="gap-1 text-xs"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </Button>

              <div className="flex items-center gap-2">
                {currentIdx < totalQ - 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleNext}
                    className="gap-1 text-xs"
                  >
                    <span>Next</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : !submitted ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmitCheck}
                    disabled={Object.keys(selectedAnswers).length === 0}
                    className="gap-1.5 text-xs bg-[var(--color-accent)] hover:opacity-90 font-bold"
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>Submit & Grade Check</span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    className="text-xs"
                  >
                    Done & Close
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Custom Question Builder Form */
          <form onSubmit={handleAddCustomQuestion} className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-semibold text-[var(--color-ink)] block mb-1">
                Question Prompt
              </label>
              <textarea
                rows={2}
                placeholder="e.g. State the rank theorem condition for consistency..."
                value={customQuestionText}
                onChange={(e) => setCustomQuestionText(e.target.value)}
                required
                className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-xs outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>

            <div>
              <label className="font-semibold text-[var(--color-ink)] block mb-1">
                4 Options (select which one is correct)
              </label>
              <div className="space-y-1.5">
                {customOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correctIdx"
                      checked={customCorrectIdx === idx}
                      onChange={() => setCustomCorrectIdx(idx)}
                      className="accent-[var(--color-accent)] h-3.5 w-3.5 shrink-0"
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...customOptions];
                        next[idx] = e.target.value;
                        setCustomOptions(next);
                      }}
                      className="flex-1 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="font-semibold text-[var(--color-ink)] block mb-1">
                Explanation & Rationale
              </label>
              <textarea
                rows={2}
                placeholder="Why is this answer correct? Reference theorems or lecture timestamps..."
                value={customExplanation}
                onChange={(e) => setCustomExplanation(e.target.value)}
                className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 text-xs outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("quiz")}
              >
                Back to Check
              </Button>
              <Button type="submit" size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                <span>Save Question to Topic</span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
