"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { useAiStatus } from "@/lib/ai/use-ai-status";
import { CourseBuilderOutput } from "@/lib/ai/ai-schemas";
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
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Layers,
  ListOrdered,
  RotateCcw,
} from "lucide-react";
import { CourseColorTag, CourseLevel } from "@/types/schemas";

interface AiCourseBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (courseId: string) => void;
  onOpenManual?: () => void;
}

export function AiCourseBuilderModal({
  open,
  onOpenChange,
  onSuccess,
  onOpenManual,
}: AiCourseBuilderModalProps) {
  const { dataStore, currentTerm, refreshData } = useDataStore();
  const { configured, unconfiguredMessage } = useAiStatus();

  const [syllabusText, setSyllabusText] = React.useState("");
  const [drafting, setDrafting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Editable draft state
  const [draft, setDraft] = React.useState<CourseBuilderOutput | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editCode, setEditCode] = React.useState("");
  const [editDept, setEditDept] = React.useState("");
  const [editCredits, setEditCredits] = React.useState(3);

  React.useEffect(() => {
    if (!open) {
      setDraft(null);
      setError(null);
      setSyllabusText("");
    }
  }, [open]);

  const handleDraft = async () => {
    if (!syllabusText.trim() || syllabusText.trim().length < 10) {
      setError("Please paste a longer portion of the syllabus text (minimum 10 characters).");
      return;
    }

    try {
      setDrafting(true);
      setError(null);

      const res = await fetch("/api/ai/course-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syllabusText }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate course draft from syllabus.");
      }

      const generatedDraft: CourseBuilderOutput = data.draft;
      setDraft(generatedDraft);
      setEditTitle(generatedDraft.title);
      setEditCode(generatedDraft.code);
      setEditDept(generatedDraft.department);
      setEditCredits(generatedDraft.credits);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error parsing syllabus";
      setError(msg);
    } finally {
      setDrafting(false);
    }
  };

  const handleApproveAndSave = async () => {
    if (!draft || !currentTerm) return;

    try {
      setSaving(true);
      setError(null);

      // 1. Create Course
      const createdCourse = await dataStore.createCourse({
        termId: currentTerm.id,
        title: editTitle.trim() || draft.title,
        code: editCode.trim().toUpperCase() || draft.code,
        department: editDept.trim() || draft.department,
        level: (String(draft.level) as CourseLevel) || "100",
        credits: editCredits || draft.credits || 3,
        description: draft.description || "Course parsed from syllabus.",
        colorTag: "slate" as CourseColorTag,
        passMark: 40,
        gradingScheme: {
          lessonCompletion: 10,
          quizzes: 25,
          assignments: 30,
          midterm: 15,
          finalExam: 20,
        },
      });

      // 2. Create Units & Topics
      for (const unit of draft.units) {
        const createdModule = await dataStore.createModule({
          courseId: createdCourse.id,
          title: `Unit ${unit.unitNumber}: ${unit.title}`,
          order: unit.unitNumber,
          isCollapsed: false,
        });

        for (let i = 0; i < unit.topics.length; i++) {
          const t = unit.topics[i];
          await dataStore.createTopic({
            courseId: createdCourse.id,
            unitId: createdModule.id,
            title: t.title,
            order: t.order || i + 1,
            isDone: false,
            watchScore: 0,
            checkScore: 0,
            topicScore: 0,
            isStudiedManually: false,
            isExperiment: false,
            isSelectedExperiment: false,
          });
        }
      }

      await refreshData();
      onOpenChange(false);
      onSuccess?.(createdCourse.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save course structure";
      console.error("Save error:", err);
      setError(msg);
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
            <DialogTitle>AI Course Builder from Syllabus</DialogTitle>
          </div>
          <DialogDescription>
            Paste syllabus text from a PDF, university bulletin, or syllabus outline. Academic AI will draft a complete course structure matching the seed curriculum format for your review.
          </DialogDescription>
        </DialogHeader>

        {configured === false && (
          <div className="rounded-card border border-app-border bg-app-surface-muted/50 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-app-ink font-semibold">
              <AlertCircle className="h-4 w-4 text-app-accent" />
              <span>{unconfiguredMessage}</span>
            </div>
            <p className="text-app-ink-muted text-[11px]">
              You can still manually configure courses, units, and topic checklists with the standard manual creator.
            </p>
            {onOpenManual && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onOpenManual();
                }}
                className="mt-1 text-xs"
              >
                Open Manual Course Creator
              </Button>
            )}
          </div>
        )}

        <div className="space-y-4 py-2 text-xs">
          {!draft ? (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-app-ink block mb-1">
                  Paste Syllabus Text
                </label>
                <textarea
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  placeholder="Paste syllabus course description, unit outlines, and topic lists here..."
                  rows={8}
                  className="w-full rounded-control border border-app-border bg-app-surface p-2.5 font-mono text-xs text-app-ink placeholder:text-app-ink-muted focus:border-app-accent focus:outline-none"
                />
              </div>

              {error && (
                <div className="rounded-control border border-app-danger/30 bg-app-danger/10 p-2.5 text-xs text-app-danger">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-app-ink-muted">
                  Drafting will not save to your portal until you inspect and approve it.
                </span>

                <Button
                  type="button"
                  variant="primary"
                  onClick={handleDraft}
                  disabled={drafting || configured === false || !syllabusText.trim()}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{drafting ? "Synthesising Curriculum..." : "Draft Course with AI"}</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Review & Edit Draft Screen */
            <div className="space-y-4">
              <div className="rounded-control border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    Curriculum draft generated. Review and adjust parameters before enrolling.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDraft(null)}
                  className="h-6 text-[10px] gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Start Over</span>
                </Button>
              </div>

              {/* Editable metadata fields */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-control border border-app-border bg-app-surface">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-app-ink-muted block">
                    Course Code
                  </label>
                  <Input
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="h-8 text-xs font-mono font-bold mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-app-ink-muted block">
                    Department
                  </label>
                  <Input
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="h-8 text-xs mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-semibold text-app-ink-muted block">
                    Course Title
                  </label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8 text-xs font-semibold mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-app-ink-muted block">
                    Semester Credits
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    value={editCredits}
                    onChange={(e) => setEditCredits(Number(e.target.value))}
                    className="h-8 text-xs font-mono mt-1 w-24"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-app-ink-muted block">
                    Target Academic Term
                  </label>
                  <span className="text-xs font-medium text-app-ink mt-2 block">
                    {currentTerm?.name || "Semester 1"}
                  </span>
                </div>
              </div>

              {/* Unit Journey Structure Preview */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-app-ink uppercase tracking-wider block">
                  Drafted Units & Topics ({draft.units.length} Units, {draft.units.reduce((acc, u) => acc + u.topics.length, 0)} Topics)
                </span>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {draft.units.map((u, uIdx) => (
                    <div
                      key={uIdx}
                      className="rounded-control border border-app-border bg-app-surface p-2.5 space-y-1.5"
                    >
                      <div className="flex items-center gap-2 font-semibold text-app-ink">
                        <Layers className="h-3.5 w-3.5 text-app-accent shrink-0" />
                        <span>Unit {u.unitNumber}: {u.title}</span>
                        <span className="text-[10px] font-mono text-app-ink-muted ml-auto">
                          {u.topics.length} topics
                        </span>
                      </div>

                      <div className="pl-5 space-y-1">
                        {u.topics.map((t, tIdx) => (
                          <div key={tIdx} className="text-[11px] text-app-ink-muted flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-app-accent/60 shrink-0" />
                            <span>{t.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-control border border-app-danger/30 bg-app-danger/10 p-2.5 text-xs text-app-danger">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-app-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>

          {draft && (
            <Button
              type="button"
              variant="primary"
              onClick={handleApproveAndSave}
              disabled={saving}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{saving ? "Enrolling Course..." : "Approve & Enrol Course"}</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
