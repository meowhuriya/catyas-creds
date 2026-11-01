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
import { Assessment, Rubric, Submission, SelfAssessmentMark } from "@/types/schemas";
import {
  FileText,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface AssignmentSubmissionModalProps {
  assessment: Assessment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AssignmentSubmissionModal({
  assessment,
  open,
  onOpenChange,
  onSuccess,
}: AssignmentSubmissionModalProps) {
  const { dataStore, refreshData } = useDataStore();

  const [rubric, setRubric] = React.useState<Rubric | null>(null);
  const [submission, setSubmission] = React.useState<Submission | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  // Form state
  const [submissionType, setSubmissionType] = React.useState<"text" | "link">("link");
  const [content, setContent] = React.useState("");
  const [criteriaMarks, setCriteriaMarks] = React.useState<
    Record<string, { level: string; points: number; justification: string }>
  >({});

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [r, s] = await Promise.all([
        dataStore.getRubric(assessment.id),
        dataStore.getSubmission(assessment.id),
      ]);

      const activeRubric = r || {
        id: "default-rubric-" + assessment.id,
        userId: "system",
        assessmentId: assessment.id,
        criteria: [
          {
            id: "crit-quality",
            title: "Implementation & Technical Quality",
            description: "Demonstrates rigorous adherence to specifications and technical completeness.",
            maxPoints: Math.round(assessment.maxPoints * 0.5),
            levels: [
              { level: "Exemplary", points: Math.round(assessment.maxPoints * 0.5), description: "Exceeds expectations with robust edge case handling." },
              { level: "Proficient", points: Math.round(assessment.maxPoints * 0.4), description: "Meets specifications with minor stylistic omissions." },
              { level: "Developing", points: Math.round(assessment.maxPoints * 0.25), description: "Functional but lacks completeness or clarity." },
              { level: "Unacceptable", points: 0, description: "Fails basic requirements or does not run." },
            ],
          },
          {
            id: "crit-reflection",
            title: "Documentation & Analysis",
            description: "Clarity of write-up, academic reasoning, and methodological explanation.",
            maxPoints: Math.round(assessment.maxPoints * 0.5),
            levels: [
              { level: "Exemplary", points: Math.round(assessment.maxPoints * 0.5), description: "Thorough, structured, and insightful commentary." },
              { level: "Proficient", points: Math.round(assessment.maxPoints * 0.4), description: "Clear explanation with adequate detail." },
              { level: "Developing", points: Math.round(assessment.maxPoints * 0.25), description: "Brief or partially vague explanation." },
              { level: "Unacceptable", points: 0, description: "No documentation or substantive analysis." },
            ],
          },
        ],
      };

      setRubric(activeRubric);
      setSubmission(s);

      if (s) {
        setSubmissionType(s.submissionType);
        setContent(s.content);
        const marksMap: Record<string, { level: string; points: number; justification: string }> = {};
        s.selfAssessment.criteriaMarks.forEach((m) => {
          marksMap[m.criterionId] = {
            level: m.level,
            points: m.points,
            justification: m.justification,
          };
        });
        setCriteriaMarks(marksMap);
      } else {
        setContent("");
        setCriteriaMarks({});
      }
    } catch (err) {
      console.error("Failed to load assignment submission data:", err);
    } finally {
      setLoading(false);
    }
  }, [assessment.id, assessment.maxPoints, dataStore]);

  React.useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  const handleSelectLevel = (
    critId: string,
    levelName: string,
    points: number
  ) => {
    setCriteriaMarks((prev) => ({
      ...prev,
      [critId]: {
        ...(prev[critId] || { justification: "" }),
        level: levelName,
        points,
      },
    }));
  };

  const handleJustificationChange = (critId: string, justification: string) => {
    setCriteriaMarks((prev) => ({
      ...prev,
      [critId]: {
        ...(prev[critId] || { level: "", points: 0 }),
        justification,
      },
    }));
  };

  // Validation
  const criteriaList = rubric?.criteria || [];
  const allCriteriaAnswered =
    criteriaList.length > 0 &&
    criteriaList.every((c) => {
      const mark = criteriaMarks[c.id];
      return Boolean(
        mark &&
        mark.level &&
        mark.justification &&
        mark.justification.trim().length >= 10
      );
    });

  const totalCalculatedPoints = criteriaList.reduce((acc, c) => {
    const mark = criteriaMarks[c.id];
    return acc + (mark?.points || 0);
  }, 0);

  const isValidToSubmit = Boolean(content.trim()) && allCriteriaAnswered;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidToSubmit || submitting) return;

    try {
      setSubmitting(true);
      const structuredMarks: SelfAssessmentMark[] = criteriaList.map((c) => {
        const mark = criteriaMarks[c.id];
        return {
          criterionId: c.id,
          level: mark.level,
          points: mark.points,
          justification: mark.justification.trim(),
        };
      });

      const updatedSub = await dataStore.submitAssignment({
        assessmentId: assessment.id,
        courseId: assessment.courseId,
        submissionType,
        content: content.trim(),
        selfAssessment: {
          criteriaMarks: structuredMarks,
        },
        finalScore: totalCalculatedPoints,
        gradedAt: new Date().toISOString(),
      });

      setSubmission(updatedSub);
      await refreshData();
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to submit assignment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="rounded bg-app-accent/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-app-accent">
              Assignment & Rubric
            </span>
            <DialogTitle>{assessment.title}</DialogTitle>
          </div>
          <DialogDescription className="mt-1">
            {assessment.description ||
              "Submit your work and complete the structured rubric self-assessment."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center text-xs text-app-ink-muted">
            Loading assignment requirements and grading rubric...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 py-2 text-xs">
            {/* Artifact Submission Input */}
            <div className="space-y-3 rounded-card border border-app-border bg-app-surface p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-app-ink">
                  1. Submission Artifact
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSubmissionType("link")}
                    className={`flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium border transition-colors ${
                      submissionType === "link"
                        ? "border-app-accent bg-app-accent/10 text-app-accent"
                        : "border-app-border bg-app-surface text-app-ink-muted"
                    }`}
                  >
                    <LinkIcon className="h-3 w-3" />
                    <span>URL Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmissionType("text")}
                    className={`flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-medium border transition-colors ${
                      submissionType === "text"
                        ? "border-app-accent bg-app-accent/10 text-app-accent"
                        : "border-app-border bg-app-surface text-app-ink-muted"
                    }`}
                  >
                    <FileText className="h-3 w-3" />
                    <span>Text Response</span>
                  </button>
                </div>
              </div>

              {submissionType === "link" ? (
                <div>
                  <label className="text-[11px] text-app-ink-muted block mb-1">
                    Public or repository link (e.g., GitHub repo, Google Drive folder, Colab):
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="url"
                      required
                      placeholder="https://github.com/..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                    />
                    {content && (
                      <a
                        href={content}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-control border border-app-border hover:bg-app-surface-muted/50 text-app-ink-muted"
                        title="Open external link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] text-app-ink-muted block mb-1">
                    Academic text submission:
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Enter your problem set solutions, analysis, and conclusions..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full rounded-control border border-app-border bg-app-surface p-2.5 text-xs text-app-ink focus:border-app-accent focus:outline-none font-sans font-semibold"
                  />
                </div>
              )}
            </div>

            {/* Rubric Structured Self-Assessment */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-app-border pb-2">
                <div>
                  <span className="font-semibold text-app-ink text-sm">
                    2. Structured Rubric Self-Assessment
                  </span>
                  <p className="text-[11px] text-app-ink-muted">
                    Select your performance level for each criterion and justify your rating (min 10 characters).
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-app-ink-muted uppercase block">
                    Calculated Score
                  </span>
                  <span className="font-serif text-lg font-bold text-app-accent tabular-nums">
                    {totalCalculatedPoints} / {assessment.maxPoints} pts
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {criteriaList.map((crit) => {
                  const currentMark = criteriaMarks[crit.id];
                  const justificationLength =
                    currentMark?.justification?.trim().length || 0;
                  const isJustificationValid = justificationLength >= 10;

                  return (
                    <div
                      key={crit.id}
                      className="rounded-card border border-app-border bg-app-surface p-4 space-y-3"
                    >
                      {/* Criterion Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-app-ink text-sm">
                            {crit.title}
                          </h4>
                          <p className="text-xs text-app-ink-muted">
                            {crit.description}
                          </p>
                        </div>
                        <span className="font-sans font-semibold text-xs font-bold text-app-ink-muted shrink-0 tabular-nums">
                          Max {crit.maxPoints} pts
                        </span>
                      </div>

                      {/* Performance Level Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {crit.levels.map((lvl) => {
                          const isSelected = currentMark?.level === lvl.level;

                          return (
                            <button
                              key={lvl.level}
                              type="button"
                              onClick={() =>
                                handleSelectLevel(crit.id, lvl.level, lvl.points)
                              }
                              className={`flex flex-col text-left p-2.5 rounded-control border transition-all ${
                                isSelected
                                  ? "border-app-accent bg-app-accent/5 ring-1 ring-app-accent"
                                  : "border-app-border bg-app-surface hover:bg-app-surface-muted/40"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-xs text-app-ink">
                                  {lvl.level}
                                </span>
                                <span className="font-sans font-semibold font-bold text-xs text-app-accent tabular-nums">
                                  {lvl.points} pts
                                </span>
                              </div>
                              <p className="text-[11px] text-app-ink-muted leading-relaxed line-clamp-3">
                                {lvl.description}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      {/* Mandatory Justification */}
                      <div className="pt-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-medium text-app-ink">
                            Criterion Justification (Required, &ge; 10 chars) *
                          </label>
                          <span
                            className={`font-sans font-semibold text-[10px] tabular-nums ${
                              isJustificationValid
                                ? "text-app-success"
                                : "text-app-ink-muted"
                            }`}
                          >
                            {justificationLength} / 10 chars min
                          </span>
                        </div>
                        <textarea
                          required
                          rows={2}
                          value={currentMark?.justification || ""}
                          onChange={(e) =>
                            handleJustificationChange(crit.id, e.target.value)
                          }
                          placeholder="Provide concrete evidence or file references supporting this rating..."
                          className={`w-full rounded-control border p-2 text-xs focus:outline-none ${
                            currentMark?.level && !isJustificationValid
                              ? "border-app-danger/50 focus:border-app-danger"
                              : "border-app-border focus:border-app-accent"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Validation notice if cannot submit yet */}
            {!allCriteriaAnswered && (
              <div className="flex items-center gap-2 rounded-control border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  Please select a performance level and provide a justification (min 10 chars) for each rubric criterion.
                </span>
              </div>
            )}

            <DialogFooter className="pt-2 border-t border-app-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!isValidToSubmit || submitting}
              >
                {submitting
                  ? "Saving Evaluation..."
                  : submission
                  ? "Update Submission"
                  : "Submit & Self-Assess"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
