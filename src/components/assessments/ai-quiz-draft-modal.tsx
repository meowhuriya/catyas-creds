"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Course, Lesson, Note, Question } from "@/types/schemas";
import { Sparkles, CheckCircle2, AlertCircle, FileText, Plus } from "lucide-react";

interface AiQuizDraftModalProps {
  course: Course;
  lessons: Lesson[];
  notes: Note[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AiQuizDraftModal({
  course,
  lessons,
  notes,
  open,
  onOpenChange,
  onSuccess,
}: AiQuizDraftModalProps) {
  const { dataStore, refreshData } = useDataStore();

  const [aiEnabled, setAiEnabled] = React.useState<boolean | null>(null);
  const [selectedLessonId, setSelectedLessonId] = React.useState<string>("");
  const [questionCount, setQuestionCount] = React.useState<number>(3);
  const [drafting, setDrafting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Generated questions
  const [generatedQuestions, setGeneratedQuestions] = React.useState<
    Array<{
      prompt: string;
      type: "multiple_choice" | "multiple_select" | "short_answer";
      options: string[];
      correctAnswers: string[];
      points: number;
      explanation: string;
      selected: boolean;
    }>
  >([]);

  // Find lessons that actually have notes
  const lessonsWithNotes = React.useMemo(() => {
    return lessons.filter((l) => {
      const n = notes.find((note) => note.lessonId === l.id);
      return n && n.content && n.content.trim().length > 10;
    });
  }, [lessons, notes]);

  // Check AI availability on open
  React.useEffect(() => {
    if (open) {
      setError(null);
      setGeneratedQuestions([]);
      fetch("/api/ai/draft-quiz")
        .then((res) => res.json())
        .then((data) => setAiEnabled(Boolean(data.enabled)))
        .catch(() => setAiEnabled(false));

      if (lessonsWithNotes.length > 0 && !selectedLessonId) {
        setSelectedLessonId(lessonsWithNotes[0].id);
      }
    }
  }, [open, lessonsWithNotes, selectedLessonId]);

  const activeLesson = lessons.find((l) => l.id === selectedLessonId);
  const activeNote = notes.find((n) => n.lessonId === selectedLessonId);

  const handleDraft = async () => {
    if (!activeNote || !activeNote.content) {
      setError("Please select a lesson with substantial lecture notes.");
      return;
    }

    try {
      setDrafting(true);
      setError(null);

      const res = await fetch("/api/ai/draft-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonTitle: activeLesson?.title || "Lecture",
          notesContent: activeNote.content,
          count: questionCount,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate questions from notes.");
      }

      const qs = (data.questions || []).map((q: any) => ({
        ...q,
        selected: true,
      }));

      setGeneratedQuestions(qs);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error generating quiz";
      setError(message);
    } finally {
      setDrafting(false);
    }
  };

  const handleSaveToCourse = async () => {
    const selected = generatedQuestions.filter((q) => q.selected);
    if (selected.length === 0) return;

    try {
      setSaving(true);
      // Create a new Quiz assessment with these questions
      const createdAsm = await dataStore.createAssessment({
        courseId: course.id,
        type: "quiz",
        title: `Quiz: ${activeLesson?.title || "Lecture Concepts"}`,
        description: `Auto-drafted from student notes for ${activeLesson?.title || "Lecture"}.`,
        maxPoints: selected.reduce((acc, q) => acc + q.points, 0),
        timeLimitMinutes: 20,
        attemptLimit: 3,
      });

      await dataStore.saveQuestions(
        createdAsm.id,
        selected.map((q) => ({
          courseId: course.id,
          assessmentId: createdAsm.id,
          prompt: q.prompt,
          type: q.type,
          options: q.options || [],
          correctAnswers: q.correctAnswers || [],
          points: q.points || 10,
          explanation: q.explanation || "",
        }))
      );

      await refreshData();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to save drafted quiz:", err);
      setError("Failed to persist questions to course question bank.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="rounded bg-app-accent/10 p-1 text-app-accent">
              <Sparkles className="h-4 w-4" />
            </span>
            <DialogTitle>AI Note-to-Quiz Drafter</DialogTitle>
          </div>
          <DialogDescription>
            Automatically synthesise rigorous academic questions from your timestamped lecture notes.
          </DialogDescription>
        </DialogHeader>

        {aiEnabled === false ? (
          <div className="rounded-card border border-app-border bg-app-surface-muted/50 p-6 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-app-ink-muted mx-auto" />
            <h4 className="font-serif font-bold text-base text-app-ink">
              Gemini API Not Configured
            </h4>
            <p className="text-xs text-app-ink-muted max-w-md mx-auto">
              To activate the AI Note-to-Quiz Drafter, set <code className="bg-app-surface px-1 py-0.5 rounded border border-app-border font-sans font-semibold text-[11px]">GEMINI_API_KEY</code> in your environment or <code className="bg-app-surface px-1 py-0.5 rounded border border-app-border font-sans font-semibold text-[11px]">.env.local</code>. You can still manually author quizzes and question banks via the standard New Assessment button.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-2 text-xs">
            {/* Step 1: Select Lesson */}
            <div className="space-y-2">
              <label className="font-semibold text-app-ink block">
                Select Lecture with Notes ({lessonsWithNotes.length} available)
              </label>

              {lessonsWithNotes.length === 0 ? (
                <div className="rounded-control border border-app-border bg-app-surface-muted/40 p-4 text-center text-app-ink-muted">
                  No lessons have notes yet. Take notes in the lesson player to enable automatic quiz drafting.
                </div>
              ) : (
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full rounded-control border border-app-border bg-app-surface p-2 text-xs font-medium text-app-ink"
                >
                  {lessonsWithNotes.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} ({l.channelTitle})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Note Snippet Preview */}
            {activeNote && (
              <div className="rounded-control border border-app-border bg-app-surface-muted/30 p-3 space-y-1">
                <span className="font-medium text-[11px] text-app-ink-muted flex items-center gap-1.5">
                  <FileText className="h-3 w-3" />
                  Source Notes Preview ({activeNote.content.length} characters)
                </span>
                <p className="text-xs text-app-ink font-sans font-semibold line-clamp-3 whitespace-pre-wrap">
                  {activeNote.content}
                </p>
              </div>
            )}

            {/* Question count selector & action button */}
            {lessonsWithNotes.length > 0 && generatedQuestions.length === 0 && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-app-ink font-medium">Questions to draft:</label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="rounded-control border border-app-border bg-app-surface px-2 py-1 text-xs"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={4}>4 Questions</option>
                    <option value={5}>5 Questions</option>
                  </select>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleDraft}
                  disabled={drafting || !activeNote}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{drafting ? "Synthesising..." : "Draft Questions"}</span>
                </Button>
              </div>
            )}

            {error && (
              <div className="rounded-control border border-app-danger/30 bg-app-danger/10 p-3 text-xs text-app-danger">
                {error}
              </div>
            )}

            {/* Step 2: Review Generated Questions */}
            {generatedQuestions.length > 0 && (
              <div className="space-y-3 border-t border-app-border pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-app-ink">
                      Review Drafted Questions ({generatedQuestions.filter((q) => q.selected).length} selected)
                    </h4>
                    <p className="text-[11px] text-app-ink-muted">
                      Uncheck or modify any items before adding to the course question bank.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDraft}
                    disabled={drafting}
                    className="gap-1 text-xs"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Regenerate</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {generatedQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className={`rounded-control border p-3 transition-colors space-y-2 ${
                        q.selected
                          ? "border-app-border bg-app-surface"
                          : "border-app-border/40 bg-app-surface-muted/30 opacity-60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={q.selected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setGeneratedQuestions((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, selected: checked } : item
                                )
                              );
                            }}
                            className="accent-app-accent"
                          />
                          <span className="font-semibold text-app-ink">
                            {idx + 1}. {q.prompt}
                          </span>
                        </div>
                        <span className="rounded bg-app-surface-muted px-2 py-0.5 font-sans font-semibold text-[10px] text-app-ink-muted capitalize">
                          {q.type.replace("_", " ")}
                        </span>
                      </div>

                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 pl-6">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`rounded px-2 py-1 text-xs border ${
                                q.correctAnswers.includes(opt)
                                  ? "border-emerald-500/40 bg-emerald-500/10 font-medium text-app-ink"
                                  : "border-app-border/40 text-app-ink-muted"
                              }`}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}

                      {q.explanation && (
                        <p className="text-[11px] text-app-ink-muted pl-6 italic">
                          Rationale: {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-2 border-t border-app-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Close
          </Button>

          {generatedQuestions.length > 0 && (
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveToCourse}
              disabled={saving || generatedQuestions.filter((q) => q.selected).length === 0}
            >
              {saving ? "Saving to Bank..." : "Save to Course Question Bank"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
