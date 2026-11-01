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
import { AssessmentType, Course, Rubric } from "@/types/schemas";
import { Plus, Trash2, HelpCircle } from "lucide-react";

interface CreateAssessmentModalProps {
  course: Course;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateAssessmentModal({
  course,
  open,
  onOpenChange,
  onSuccess,
}: CreateAssessmentModalProps) {
  const { dataStore, refreshData } = useDataStore();

  const [type, setType] = React.useState<AssessmentType>("quiz");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [maxPoints, setMaxPoints] = React.useState(100);
  const [dueDate, setDueDate] = React.useState("");
  const [timeLimitMinutes, setTimeLimitMinutes] = React.useState<number | "">("");
  const [attemptLimit, setAttemptLimit] = React.useState<number | "">("");
  const [lockedThreshold, setLockedThreshold] = React.useState<number | "">("");
  const [loading, setLoading] = React.useState(false);

  // Rubric state for assignments
  const [rubricCriteria, setRubricCriteria] = React.useState<
    Array<{
      id: string;
      title: string;
      description: string;
      maxPoints: number;
    }>
  >([
    {
      id: "crit-1",
      title: "Content & Accuracy",
      description: "Demonstrates correct understanding and execution of concepts.",
      maxPoints: 50,
    },
    {
      id: "crit-2",
      title: "Methodology & Clarity",
      description: "Code or explanation is clean, well-structured, and documented.",
      maxPoints: 50,
    },
  ]);

  // Questions for quiz/exam
  const [initialQuestions, setInitialQuestions] = React.useState<
    Array<{
      prompt: string;
      type: "multiple_choice" | "multiple_select" | "short_answer";
      options: string[];
      correctAnswer: string;
      points: number;
      explanation: string;
    }>
  >([
    {
      prompt: "Example Question 1: What is the primary characteristic of this topic?",
      type: "multiple_choice",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      points: 25,
      explanation: "Option A is correct based on the lecture syllabus.",
    },
  ]);

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setMaxPoints(type === "assignment" ? 100 : 50);
      setDueDate("");
      if (type === "quiz") {
        setTimeLimitMinutes(20);
        setAttemptLimit(3);
        setLockedThreshold("");
      } else if (type === "midterm" || type === "final") {
        setTimeLimitMinutes(90);
        setAttemptLimit(1);
        setLockedThreshold(80);
      } else {
        setTimeLimitMinutes("");
        setAttemptLimit("");
        setLockedThreshold("");
      }
    }
  }, [open, type]);

  const handleAddQuestion = () => {
    setInitialQuestions((prev) => [
      ...prev,
      {
        prompt: `Question ${prev.length + 1}: `,
        type: "multiple_choice",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correctAnswer: "Option 1",
        points: 25,
        explanation: "Rationale for correct answer.",
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setInitialQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setLoading(true);

      const createdAsm = await dataStore.createAssessment({
        courseId: course.id,
        type,
        title: title.trim(),
        description: description.trim(),
        maxPoints: Number(maxPoints) || 100,
        dueDate: dueDate || undefined,
        timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
        attemptLimit: attemptLimit ? Number(attemptLimit) : undefined,
        lockedUntilLessonCompletionPercent: lockedThreshold ? Number(lockedThreshold) : undefined,
      });

      if (type === "assignment") {
        await dataStore.saveRubric({
          assessmentId: createdAsm.id,
          criteria: rubricCriteria.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description,
            maxPoints: c.maxPoints,
            levels: [
              { level: "Exemplary", points: c.maxPoints, description: "Flawless demonstration of criteria." },
              { level: "Proficient", points: Math.round(c.maxPoints * 0.8), description: "Good demonstration with minor omissions." },
              { level: "Developing", points: Math.round(c.maxPoints * 0.5), description: "Partial understanding with notable gaps." },
              { level: "Unacceptable", points: 0, description: "Fails to address basic requirements." },
            ],
          })),
        });
      } else if (initialQuestions.length > 0) {
        await dataStore.saveQuestions(
          createdAsm.id,
          initialQuestions.map((q) => ({
            courseId: course.id,
            assessmentId: createdAsm.id,
            prompt: q.prompt,
            type: q.type,
            options: q.options,
            correctAnswers: [q.correctAnswer],
            points: q.points,
            explanation: q.explanation,
          }))
        );
      }

      await refreshData();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Failed to create assessment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Course Assessment</DialogTitle>
          <DialogDescription>
            Create an academic quiz, assignment with rubrics, or locked examination for {course.code}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2 text-xs">
          {/* Assessment Type Selector */}
          <div>
            <label className="font-semibold text-app-ink block mb-1">Assessment Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(["quiz", "assignment", "midterm", "final"] as AssessmentType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-control border py-2 px-3 text-center capitalize transition-colors font-medium ${
                    type === t
                      ? "border-app-accent bg-app-accent/10 text-app-accent font-semibold"
                      : "border-app-border bg-app-surface text-app-ink-muted hover:border-app-ink-muted"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="font-medium text-app-ink block mb-1">Title *</label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === "quiz"
                    ? "e.g., Quiz 2: Boolean Arithmetic"
                    : type === "assignment"
                    ? "e.g., Problem Set 1: Logic Gates"
                    : "e.g., Midterm Comprehensive Examination"
                }
              />
            </div>

            <div>
              <label className="font-medium text-app-ink block mb-1">Instructions / Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Scope, guidelines, or required submission artifacts..."
                className="w-full rounded-control border border-app-border bg-app-surface p-2.5 text-xs text-app-ink focus:border-app-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Points, Dates & Limits */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-medium text-app-ink block mb-1">Max Points</label>
              <Input
                type="number"
                min={1}
                value={maxPoints}
                onChange={(e) => setMaxPoints(Number(e.target.value))}
                className="font-sans font-semibold tabular-nums"
              />
            </div>

            <div>
              <label className="font-medium text-app-ink block mb-1">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <label className="font-medium text-app-ink block mb-1">Timer (Minutes)</label>
              <Input
                type="number"
                min={0}
                placeholder="Untimed"
                value={timeLimitMinutes}
                onChange={(e) =>
                  setTimeLimitMinutes(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="font-sans font-semibold tabular-nums"
              />
            </div>

            <div>
              <label className="font-medium text-app-ink block mb-1">Attempts</label>
              <Input
                type="number"
                min={1}
                placeholder="Unlimited"
                value={attemptLimit}
                onChange={(e) =>
                  setAttemptLimit(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="font-sans font-semibold tabular-nums"
              />
            </div>
          </div>

          {/* Locked Threshold for Exams */}
          {(type === "midterm" || type === "final" || type === "quiz") && (
            <div className="rounded-control border border-app-border bg-app-surface-muted/40 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-app-ink block">
                    Lesson Completion Lock (%)
                  </span>
                  <span className="text-[11px] text-app-ink-muted">
                    Lock this assessment until student completes at least N% of course lessons.
                  </span>
                </div>
                <div className="flex items-center gap-1.5 w-24">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    value={lockedThreshold}
                    onChange={(e) =>
                      setLockedThreshold(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="text-center font-sans font-semibold tabular-nums"
                  />
                  <span className="text-app-ink-muted">%</span>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Rubric Builder */}
          {type === "assignment" ? (
            <div className="space-y-2 border-t border-app-border pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-app-ink">Marking Rubric Criteria</h4>
                  <p className="text-[11px] text-app-ink-muted">
                    Evaluated with 4 levels (Exemplary 100%, Proficient 80%, Developing 50%, Unacceptable 0%).
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRubricCriteria((prev) => [
                      ...prev,
                      {
                        id: `crit-${Date.now()}`,
                        title: `Criterion ${prev.length + 1}`,
                        description: "Evaluates standard performance requirements.",
                        maxPoints: 25,
                      },
                    ])
                  }
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Criterion</span>
                </Button>
              </div>

              <div className="space-y-2">
                {rubricCriteria.map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-2 rounded-control border border-app-border bg-app-surface p-2.5"
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Criterion title"
                          value={c.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRubricCriteria((prev) =>
                              prev.map((item, idx) => (idx === i ? { ...item, title: val } : item))
                            );
                          }}
                          className="font-medium"
                        />
                        <div className="flex items-center gap-1 w-28">
                          <Input
                            type="number"
                            min={1}
                            value={c.maxPoints}
                            onChange={(e) => {
                              const pts = Number(e.target.value);
                              setRubricCriteria((prev) =>
                                prev.map((item, idx) =>
                                  idx === i ? { ...item, maxPoints: pts } : item
                                )
                              );
                            }}
                            className="font-sans font-semibold tabular-nums text-center"
                          />
                          <span className="text-app-ink-muted text-[11px]">pts</span>
                        </div>
                      </div>
                      <Input
                        placeholder="Description of expectations..."
                        value={c.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRubricCriteria((prev) =>
                            prev.map((item, idx) => (idx === i ? { ...item, description: val } : item))
                          );
                        }}
                        className="text-[11px] text-app-ink-muted"
                      />
                    </div>
                    {rubricCriteria.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setRubricCriteria((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="h-8 w-8 p-0 text-app-danger hover:bg-app-danger/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Quiz / Exam Initial Questions */
            <div className="space-y-2 border-t border-app-border pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-app-ink">Question Bank ({initialQuestions.length})</h4>
                  <p className="text-[11px] text-app-ink-muted">
                    Instant auto-marking questions evaluated when taking this test.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddQuestion}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Question</span>
                </Button>
              </div>

              <div className="space-y-3">
                {initialQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded-control border border-app-border bg-app-surface p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-app-ink">Question {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setInitialQuestions((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, type: val } : item))
                            );
                          }}
                          className="rounded-control border border-app-border bg-app-surface px-2 py-1 text-xs font-medium"
                        >
                          <option value="multiple_choice">Multiple Choice</option>
                          <option value="multiple_select">Multiple Select</option>
                          <option value="short_answer">Short Answer</option>
                        </select>
                        <div className="flex items-center gap-1 w-20">
                          <Input
                            type="number"
                            min={1}
                            value={q.points}
                            onChange={(e) => {
                              const pts = Number(e.target.value);
                              setInitialQuestions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, points: pts } : item))
                              );
                            }}
                            className="font-sans font-semibold tabular-nums text-center"
                          />
                          <span className="text-app-ink-muted text-[11px]">pts</span>
                        </div>
                        {initialQuestions.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveQuestion(idx)}
                            className="h-7 w-7 p-0 text-app-danger hover:bg-app-danger/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <Input
                      placeholder="Enter question prompt..."
                      value={q.prompt}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInitialQuestions((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, prompt: val } : item))
                        );
                      }}
                    />

                    {q.type !== "short_answer" && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-1.5">
                            <input
                              type="radio"
                              name={`correct-${idx}`}
                              checked={q.correctAnswer === opt}
                              onChange={() => {
                                setInitialQuestions((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, correctAnswer: opt } : item
                                  )
                                );
                              }}
                              className="accent-app-accent"
                              title="Mark as correct answer"
                            />
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const newOpt = e.target.value;
                                setInitialQuestions((prev) =>
                                  prev.map((item, i) => {
                                    if (i !== idx) return item;
                                    const opts = [...item.options];
                                    const isCorrect = item.correctAnswer === opts[optIdx];
                                    opts[optIdx] = newOpt;
                                    return {
                                      ...item,
                                      options: opts,
                                      correctAnswer: isCorrect ? newOpt : item.correctAnswer,
                                    };
                                  })
                                );
                              }}
                              className="text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {q.type === "short_answer" && (
                      <div>
                        <label className="text-[11px] text-app-ink-muted block mb-0.5">
                          Correct Expected Answer (case-insensitive):
                        </label>
                        <Input
                          value={q.correctAnswer}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInitialQuestions((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, correctAnswer: val } : item))
                            );
                          }}
                          placeholder="Expected exact answer..."
                        />
                      </div>
                    )}

                    <Input
                      placeholder="Academic explanation for the answer..."
                      value={q.explanation}
                      onChange={(e) => {
                        const val = e.target.value;
                        setInitialQuestions((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, explanation: val } : item))
                        );
                      }}
                      className="text-[11px] text-app-ink-muted"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-app-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : "Create Assessment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
