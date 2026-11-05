"use client";

import * as React from "react";
import { useAiStatus } from "@/lib/ai/use-ai-status";
import {
  TopicChatExplainOutput,
  TopicChatTestOutput,
  TopicChatFlashcardsOutput,
} from "@/lib/ai/ai-schemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  CreditCard,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
} from "lucide-react";

interface TopicAiChatModalProps {
  topicTitle: string;
  courseTitle?: string;
  notesContext?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TopicAiChatModal({
  topicTitle,
  courseTitle,
  notesContext,
  open,
  onOpenChange,
}: TopicAiChatModalProps) {
  const { configured, unconfiguredMessage } = useAiStatus();

  const [activeTab, setActiveTab] = React.useState<"explain" | "test" | "flashcards">("explain");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Results
  const [explainResult, setExplainResult] = React.useState<TopicChatExplainOutput | null>(null);
  const [testResult, setTestResult] = React.useState<TopicChatTestOutput | null>(null);
  const [flashcardsResult, setFlashcardsResult] = React.useState<TopicChatFlashcardsOutput | null>(null);

  // Interactive Test State
  const [selectedAnswer, setSelectedAnswer] = React.useState<number | null>(null);
  const [showHint, setShowHint] = React.useState(false);

  // Interactive Flashcards State
  const [flippedCards, setFlippedCards] = React.useState<Record<number, boolean>>({});

  const handleFetchAction = React.useCallback(
    async (action: "explain" | "test" | "flashcards") => {
      try {
        setLoading(true);
        setError(null);
        setSelectedAnswer(null);
        setShowHint(false);

        const res = await fetch("/api/ai/topic-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicTitle,
            action,
            context: notesContext,
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || `Failed to generate ${action} response`);
        }

        if (action === "explain") {
          setExplainResult(data.result);
        } else if (action === "test") {
          setTestResult(data.result);
        } else {
          setFlashcardsResult(data.result);
          setFlippedCards({});
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error generating AI response";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [topicTitle, notesContext]
  );

  React.useEffect(() => {
    if (open) {
      if (activeTab === "explain" && !explainResult) {
        handleFetchAction("explain");
      } else if (activeTab === "test" && !testResult) {
        handleFetchAction("test");
      } else if (activeTab === "flashcards" && !flashcardsResult) {
        handleFetchAction("flashcards");
      }
    }
  }, [open, activeTab, explainResult, testResult, flashcardsResult, handleFetchAction]);

  const toggleCardFlip = (idx: number) => {
    setFlippedCards((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="rounded bg-app-accent/10 p-1 text-app-accent">
              <Sparkles className="h-4 w-4" />
            </span>
            <DialogTitle>Topic AI Assistant: {topicTitle}</DialogTitle>
          </div>
          <DialogDescription>
            {courseTitle ? `${courseTitle} — ` : ""}Conceptual breakdown, quick self-diagnostic checks, and spaced-repetition flashcards.
          </DialogDescription>
        </DialogHeader>


        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 border-b border-app-border pb-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("explain")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-control transition-colors ${
              activeTab === "explain"
                ? "bg-app-accent text-white font-semibold"
                : "text-app-ink-muted hover:text-app-ink hover:bg-app-surface-muted/50"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Explain Simply</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("test")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-control transition-colors ${
              activeTab === "test"
                ? "bg-app-accent text-white font-semibold"
                : "text-app-ink-muted hover:text-app-ink hover:bg-app-surface-muted/50"
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Test Me</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("flashcards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-control transition-colors ${
              activeTab === "flashcards"
                ? "bg-app-accent text-white font-semibold"
                : "text-app-ink-muted hover:text-app-ink hover:bg-app-surface-muted/50"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Flashcards</span>
          </button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleFetchAction(activeTab)}
            disabled={loading}
            className="ml-auto h-7 text-[10px] gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{loading ? "Generating..." : "Regenerate"}</span>
          </Button>
        </div>

        {/* Content Pane */}
        <div className="py-2 text-xs min-h-[220px]">
          {loading && (
            <div className="flex flex-col items-center justify-center p-8 space-y-2 text-app-ink-muted">
              <Sparkles className="h-6 w-6 animate-spin text-app-accent" />
              <span>Synthesising academic insights for {topicTitle}...</span>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-control border border-app-danger/30 bg-app-danger/10 p-3 text-xs text-app-danger">
              {error}
            </div>
          )}

          {/* Tab 1: Explain Simply */}
          {activeTab === "explain" && explainResult && !loading && (
            <div className="space-y-4">
              <div className="rounded-control border border-app-border bg-app-surface p-3.5 space-y-2">
                <span className="font-semibold text-app-ink text-sm block">Conceptual Summary</span>
                <p className="text-app-ink leading-relaxed whitespace-pre-wrap">{explainResult.summary}</p>
              </div>

              {explainResult.keyPoints && explainResult.keyPoints.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-app-ink uppercase tracking-wider text-[10px] block">
                    Core Principles
                  </span>
                  <div className="space-y-1.5">
                    {explainResult.keyPoints.map((pt, i) => (
                      <div key={i} className="flex items-start gap-2 text-app-ink">
                        <span className="h-1.5 w-1.5 rounded-full bg-app-accent mt-1.5 shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {explainResult.realWorldAnalogy && (
                <div className="rounded-control border border-app-border/80 bg-app-surface-muted/40 p-3 space-y-1 text-app-ink">
                  <span className="flex items-center gap-1.5 font-semibold text-app-accent text-xs">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Intuitive Mental Model
                  </span>
                  <p className="text-[11px] text-app-ink-muted italic leading-relaxed">
                    {explainResult.realWorldAnalogy}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Test Me */}
          {activeTab === "test" && testResult && !loading && (
            <div className="space-y-4">
              <div className="rounded-control border border-app-border bg-app-surface p-3.5 space-y-3">
                <span className="font-semibold text-app-ink text-sm block">Diagnostic Question</span>
                <p className="font-medium text-app-ink">{testResult.question}</p>

                <div className="space-y-2 pt-1">
                  {testResult.options.map((opt, i) => {
                    const isSelected = selectedAnswer === i;
                    const isCorrect = opt === testResult.correctAnswer;
                    const showFeedback = selectedAnswer !== null;

                    let btnStyle = "border-app-border bg-app-surface text-app-ink hover:bg-app-surface-muted/40";
                    if (showFeedback) {
                      if (isCorrect) {
                        btnStyle = "border-emerald-500 bg-emerald-500/10 font-bold text-emerald-800 dark:text-emerald-300";
                      } else if (isSelected) {
                        btnStyle = "border-app-danger bg-app-danger/10 text-app-danger";
                      }
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedAnswer(i)}
                        className={`w-full text-left p-2.5 rounded-control border text-xs flex items-center justify-between transition-colors ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {showFeedback && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                        {showFeedback && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-app-danger shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hint & Explanation */}
              <div className="flex items-center justify-between">
                {testResult.hint && !showHint && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHint(true)}
                    className="text-[10px] h-6 text-app-ink-muted"
                  >
                    Need a hint?
                  </Button>
                )}

                {showHint && testResult.hint && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-control border border-amber-200 dark:border-amber-900 w-full">
                    💡 Hint: {testResult.hint}
                  </div>
                )}
              </div>

              {selectedAnswer !== null && (
                <div className="rounded-control border border-app-border bg-app-surface-muted/40 p-3 space-y-1">
                  <span className="font-semibold text-app-ink text-xs block">Academic Explanation</span>
                  <p className="text-[11px] text-app-ink-muted leading-relaxed">{testResult.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Flashcards */}
          {activeTab === "flashcards" && flashcardsResult && !loading && (
            <div className="space-y-3">
              <span className="text-[11px] text-app-ink-muted block">
                Click any flashcard to flip between conceptual question and formal answer.
              </span>

              <div className="space-y-2.5">
                {flashcardsResult.flashcards.map((card, i) => {
                  const isFlipped = Boolean(flippedCards[i]);

                  return (
                    <div
                      key={i}
                      onClick={() => toggleCardFlip(i)}
                      className={`cursor-pointer rounded-control border p-3.5 transition-all text-xs space-y-2 ${
                        isFlipped
                          ? "border-app-accent/60 bg-app-accent/5 ring-1 ring-app-accent/30"
                          : "border-app-border bg-app-surface hover:border-app-ink-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-sans font-semibold text-app-ink-muted uppercase">
                        <span>Card {i + 1} of {flashcardsResult.flashcards.length}</span>
                        <span className="text-app-accent font-semibold">{isFlipped ? "Answer / Solution" : "Front Prompt"}</span>
                      </div>

                      <p className="text-app-ink text-sm font-medium leading-relaxed">
                        {isFlipped ? card.back : card.front}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-app-border">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
