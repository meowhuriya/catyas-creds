"use client";

import * as React from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/repository";
import { Course, DegreePlan, Term, LessonProgress, Topic } from "@/types/schemas";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Stat } from "@/components/ui/stat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { TOKENS, CourseTagKey } from "@/styles/tokens";
import { SectionBar } from "@/components/ui/section-bar";
import {
  GraduationCap,
  Layers,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  ShieldCheck,
  ChevronRight,
  Award,
} from "lucide-react";

function matchesDepartment(courseDept: string, targetDept: string): boolean {
  const cd = (courseDept || "").toLowerCase().trim();
  const td = (targetDept || "").toLowerCase().trim();
  if (cd === td) return true;
  if (td.includes("computer") && (cd.includes("computer") || cd.includes("cse") || cd === "cs")) return true;
  if (td.includes("math") && (cd.includes("math") || cd.includes("calculus"))) return true;
  if (
    td.includes("basic sciences") &&
    (cd.includes("physics") || cd.includes("chemistry") || cd.includes("science") || cd === "bs")
  ) {
    return true;
  }
  if (
    td.includes("humanities") &&
    (cd.includes("humanities") || cd.includes("english") || cd.includes("skill") || cd === "hs")
  ) {
    return true;
  }
  if (
    td.includes("engineering sciences") &&
    (cd.includes("electronics") ||
      cd.includes("electrical") ||
      cd.includes("mechanical") ||
      cd.includes("workshop") ||
      cd.includes("engineering") ||
      cd === "es")
  ) {
    return true;
  }
  return false;
}

export default function DegreePage() {
  const { dataStore } = useDataStore();

  const [courses, setCourses] = React.useState<Course[]>([]);
  const [terms, setTerms] = React.useState<Term[]>([]);
  const [degreePlan, setDegreePlan] = React.useState<DegreePlan | null>(null);
  const [progressList, setProgressList] = React.useState<LessonProgress[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Edit target modal state
  const [editTargetOpen, setEditTargetOpen] = React.useState(false);
  const [tempTarget, setTempTarget] = React.useState<number>(160);
  const [savingTarget, setSavingTarget] = React.useState(false);

  // Audit filter tab
  const [auditTab, setAuditTab] = React.useState<"completed" | "in_progress" | "remaining">(
    "completed"
  );

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [c, t, p, prog, top] = await Promise.all([
        dataStore.getCourses(),
        dataStore.getTerms(),
        dataStore.getDegreePlan(),
        dataStore.getAllLessonProgress(),
        dataStore.getAllTopics(),
      ]);

      setCourses(c);
      setTerms(t);
      setDegreePlan(p);
      setProgressList(prog);
      setTopics(top);
      if (p) {
        setTempTarget(p.totalCreditsTarget);
      }
    } catch (err) {
      console.error("Failed to load degree progress:", err);
    } finally {
      setLoading(false);
    }
  }, [dataStore]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const targetCredits = degreePlan?.totalCreditsTarget || 160;

  // Active term identification
  const currentTerm = terms.find((t) => t.isCurrent) || terms[0];

  // Group courses into Completed vs In Progress
  const { completedCourses, inProgressCourses } = React.useMemo(() => {
    const completed: Course[] = [];
    const inProg: Course[] = [];

    courses.forEach((c) => {
      const courseProg = progressList.filter((p) => p.courseId === c.id);
      const totalLes = courseProg.length;
      const doneLes = courseProg.filter((p) => p.isCompleted).length;
      const isLesComplete = totalLes > 0 && doneLes >= totalLes;

      const courseTopics = topics.filter((t) => t.courseId === c.id);
      const isTopicComplete =
        courseTopics.length > 0 && courseTopics.every((t) => t.isDone);

      if (isLesComplete || isTopicComplete || (c.termId !== currentTerm?.id && c.termId)) {
        completed.push(c);
      } else {
        inProg.push(c);
      }
    });

    return { completedCourses: completed, inProgressCourses: inProg };
  }, [courses, progressList, topics, currentTerm]);

  const earnedCredits = completedCourses.reduce((acc, c) => acc + c.credits, 0);
  const inProgressCredits = inProgressCourses.reduce((acc, c) => acc + c.credits, 0);
  const remainingCredits = Math.max(0, targetCredits - earnedCredits);
  const overallPercent = Math.min(100, Math.round((earnedCredits / targetCredits) * 100));

  // Department Requirements
  const departmentRequirements: Record<string, number> = React.useMemo(() => {
    return (
      degreePlan?.departmentRequirements || {
        "Computer Science": 70,
        Mathematics: 20,
        "Basic Sciences": 20,
        Humanities: 15,
        "Engineering Sciences": 35,
      }
    );
  }, [degreePlan]);

  const departmentBreakdown = React.useMemo(() => {
    return Object.entries(departmentRequirements).map(([dept, required]) => {
      const earned = completedCourses
        .filter((c) => matchesDepartment(c.department, dept))
        .reduce((acc, c) => acc + c.credits, 0);
      const inProg = inProgressCourses
        .filter((c) => matchesDepartment(c.department, dept))
        .reduce((acc, c) => acc + c.credits, 0);
      const remaining = Math.max(0, required - earned);
      const pct = Math.min(100, Math.round((earned / required) * 100));

      return { dept, required, earned, inProg, remaining, pct };
    });
  }, [departmentRequirements, completedCourses, inProgressCourses]);

  // Level Requirements
  const levelRequirements: Record<string, number> = React.useMemo(() => {
    return (
      degreePlan?.levelRequirements || {
        "100": 40,
        "200": 42,
        "300": 41,
        "400": 37,
      }
    );
  }, [degreePlan]);

  const levelBreakdown = React.useMemo(() => {
    return Object.entries(levelRequirements).map(([level, required]) => {
      const earned = completedCourses
        .filter((c) => c.level === level)
        .reduce((acc, c) => acc + c.credits, 0);
      const inProg = inProgressCourses
        .filter((c) => c.level === level)
        .reduce((acc, c) => acc + c.credits, 0);
      const remaining = Math.max(0, required - earned);
      const pct = Math.min(100, Math.round((earned / required) * 100));

      return {
        level,
        title:
          level === "100"
            ? "100-Level Foundation"
            : level === "200"
            ? "200-Level Intermediate"
            : level === "300"
            ? "300-Level Upper Division"
            : "400-Level Advanced Seminar & Capstone",
        required,
        earned,
        inProg,
        remaining,
        pct,
      };
    });
  }, [levelRequirements, completedCourses, inProgressCourses]);

  // Find biggest deficit for academic advisor prompt
  const biggestDeficitDept = React.useMemo(() => {
    return [...departmentBreakdown].sort((a, b) => b.remaining - a.remaining)[0];
  }, [departmentBreakdown]);

  const handleSaveTarget = async () => {
    try {
      setSavingTarget(true);
      await dataStore.updateDegreePlan({
        totalCreditsTarget: Number(tempTarget) || 160,
      });
      await loadData();
      setEditTargetOpen(false);
    } catch (err) {
      console.error("Failed to update degree target:", err);
    } finally {
      setSavingTarget(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header (Solid cream panel) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-[18px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] shadow-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-app-ink">
            Degree Audit & Curriculum Progress
          </h1>
          <p className="text-xs text-app-ink-muted mt-0.5">
            Bachelor of Technology (B.Tech CSE) collegiate curriculum audit ({targetCredits} Total Credits Target).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setTempTarget(targetCredits);
            setEditTargetOpen(true);
          }}
          className="gap-1.5 text-xs"
        >
          <Edit2 className="h-3.5 w-3.5" />
          <span>Edit Degree Target ({targetCredits} cr)</span>
        </Button>
      </div>

      {/* Prominent Stat Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          label="Total Credits Completed"
          value={earnedCredits}
          unit={`/ ${targetCredits}`}
          subtext={`${overallPercent}% of degree completed`}
        />

        <Stat
          label="Credits In Progress"
          value={inProgressCredits}
          unit="cr"
          subtext={`${inProgressCourses.length} active courses enrolled`}
        />

        <Stat
          label="Remaining Requirements"
          value={remainingCredits}
          unit="cr"
          subtext="To complete degree requirements"
        />

        <Stat
          label="Estimated Graduation"
          value="Spring 2029"
          unit=""
          subtext="At 20 credits / semester pace"
        />
      </div>

      {/* Overall Degree Progress Bar */}
      <div className="rounded-card border border-app-border bg-app-surface p-4 space-y-2 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-app-ink">Overall Degree Completion</span>
          <span className="font-sans font-semibold text-app-accent tabular-nums">{overallPercent}% ({earnedCredits} / {targetCredits} Credits)</span>
        </div>
        <ProgressBar value={overallPercent} />
      </div>

      {/* Advisory Guidance Notice */}
      {biggestDeficitDept && biggestDeficitDept.remaining > 0 && (
        <SectionBar className="flex items-start gap-3 border-[#A51C30]/30 text-xs">
          <GraduationCap className="h-5 w-5 text-app-accent mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-semibold text-app-ink block text-sm">
              Academic Curricular Advisory
            </span>
            <p className="text-app-ink-muted">
              You need <strong className="text-app-accent font-bold tabular-nums">{biggestDeficitDept.remaining} more credits</strong> in{" "}
              <strong className="text-app-ink font-semibold">{biggestDeficitDept.dept}</strong> and{" "}
              <strong className="text-app-ink font-semibold">{remainingCredits} credits overall</strong> to fulfill your graduation requirements.
            </p>
          </div>
        </SectionBar>
      )}

      {/* Department & Level Distributions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department Requirements */}
        <div className="rounded-card border border-app-border bg-app-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-app-border pb-3">
            <div>
              <h3 className="font-serif text-base font-bold text-app-ink">
                Departmental Credit Requirements
              </h3>
              <p className="text-[11px] text-app-ink-muted">
                Major core, basic sciences, humanities, and engineering sciences.
              </p>
            </div>
            <span className="font-sans font-semibold text-xs font-bold text-app-ink-muted tabular-nums">
              {earnedCredits} / {targetCredits} cr
            </span>
          </div>

          <div className="space-y-4">
            {departmentBreakdown.map((item) => (
              <div key={item.dept} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-app-ink">{item.dept}</span>
                  <span className="font-sans font-semibold tabular-nums text-app-ink-muted text-[11px]">
                    <strong className="text-app-ink font-semibold">{item.earned}</strong> / {item.required} cr ({item.pct}%)
                  </span>
                </div>
                <ProgressBar value={item.pct} />
              </div>
            ))}
          </div>
        </div>

        {/* Division / Level Requirements */}
        <div className="rounded-card border border-app-border bg-app-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-app-border pb-3">
            <div>
              <h3 className="font-serif text-base font-bold text-app-ink">
                Curricular Level Distribution
              </h3>
              <p className="text-[11px] text-app-ink-muted">
                Progress across lower-division foundations and upper-division seminars.
              </p>
            </div>
            <span className="font-sans font-semibold text-xs font-bold text-app-ink-muted tabular-nums">
              4 Academic Levels
            </span>
          </div>

          <div className="space-y-4">
            {levelBreakdown.map((item) => (
              <div key={item.level} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-app-ink">{item.title}</span>
                  <span className="font-sans font-semibold tabular-nums text-app-ink-muted text-[11px]">
                    <strong className="text-app-ink font-semibold">{item.earned}</strong> / {item.required} cr ({item.pct}%)
                  </span>
                </div>
                <ProgressBar value={item.pct} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Curricular Audit List */}
      <div className="rounded-card border border-app-border bg-app-surface overflow-hidden shadow-sm">
        {/* Audit Filter Tabs */}
        <div className="flex items-center justify-between border-b border-app-border bg-app-surface-muted/50 px-4 py-2.5">
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setAuditTab("completed")}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                auditTab === "completed"
                  ? "bg-[#A51C30] text-white font-semibold"
                  : "text-app-ink-muted hover:text-app-ink"
              }`}
            >
              Completed Courses ({completedCourses.length})
            </button>
            <button
              type="button"
              onClick={() => setAuditTab("in_progress")}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                auditTab === "in_progress"
                  ? "bg-[#A51C30] text-white font-semibold"
                  : "text-app-ink-muted hover:text-app-ink"
              }`}
            >
              In Progress ({inProgressCourses.length})
            </button>
            <button
              type="button"
              onClick={() => setAuditTab("remaining")}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                auditTab === "remaining"
                  ? "bg-[#A51C30] text-white font-semibold"
                  : "text-app-ink-muted hover:text-app-ink"
              }`}
            >
              Remaining Requirements
            </button>
          </div>

          <span className="text-xs text-app-ink-muted font-sans font-semibold tabular-nums">
            {auditTab === "completed"
              ? `${earnedCredits} credits completed`
              : auditTab === "in_progress"
              ? `${inProgressCredits} credits active`
              : `${remainingCredits} credits remaining`}
          </span>
        </div>

        {/* Audit Tab Contents */}
        <div className="p-4">
          {auditTab === "completed" && (
            completedCourses.length === 0 ? (
              <div className="py-8 text-center text-xs text-app-ink-muted">
                No courses completed yet. Completed courses will appear here with credits and standing.
              </div>
            ) : (
              <div className="divide-y divide-app-border text-xs">
                {completedCourses.map((c) => {
                  const tagColor =
                    TOKENS.colors.courseTags[c.colorTag as CourseTagKey]?.hex ||
                    TOKENS.colors.courseTags.slate.hex;

                  return (
                    <div
                      key={c.id}
                      className="py-3 flex items-center justify-between hover:bg-app-surface-muted/30 px-2 rounded transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: tagColor }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-semibold font-bold text-app-ink">{c.code}</span>
                            <span className="font-semibold text-app-ink">{c.title}</span>
                          </div>
                          <span className="text-[11px] text-app-ink-muted">
                            Department of {c.department} • {c.level}L • {c.credits} Credits
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                          Satisfied
                        </span>
                        <Link
                          href={`/courses/${c.id}`}
                          className="text-app-accent hover:underline text-xs flex items-center gap-1 font-medium"
                        >
                          <span>View</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {auditTab === "in_progress" && (
            inProgressCourses.length === 0 ? (
              <div className="py-8 text-center text-xs text-app-ink-muted">
                No courses currently in progress.
              </div>
            ) : (
              <div className="divide-y divide-app-border text-xs">
                {inProgressCourses.map((c) => {
                  const tagColor =
                    TOKENS.colors.courseTags[c.colorTag as CourseTagKey]?.hex ||
                    TOKENS.colors.courseTags.slate.hex;

                  return (
                    <div
                      key={c.id}
                      className="py-3 flex items-center justify-between hover:bg-app-surface-muted/30 px-2 rounded transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: tagColor }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-semibold font-bold text-app-ink">{c.code}</span>
                            <span className="font-semibold text-app-ink">{c.title}</span>
                          </div>
                          <span className="text-[11px] text-app-ink-muted">
                            Department of {c.department} • {c.level}L • {c.credits} Credits
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="rounded bg-app-accent/10 px-2 py-0.5 text-[10px] font-semibold text-app-accent">
                          In Progress
                        </span>
                        <Link
                          href={`/courses/${c.id}`}
                          className="text-app-accent hover:underline text-xs flex items-center gap-1 font-medium"
                        >
                          <span>Open</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {auditTab === "remaining" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-control border border-app-border p-4 space-y-3 bg-app-surface">
                <h4 className="font-semibold text-app-ink">Department Deficit Breakdown</h4>
                <div className="space-y-2">
                  {departmentBreakdown
                    .filter((d) => d.remaining > 0)
                    .map((d) => (
                      <div key={d.dept} className="flex items-center justify-between border-b border-app-border/60 pb-1.5">
                        <span className="text-app-ink font-medium">{d.dept}</span>
                        <span className="font-sans font-semibold text-app-accent font-bold tabular-nums">
                          {d.remaining} credits needed
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-control border border-app-border p-4 space-y-3 bg-app-surface">
                <h4 className="font-semibold text-app-ink">Curricular Division Deficit</h4>
                <div className="space-y-2">
                  {levelBreakdown
                    .filter((l) => l.remaining > 0)
                    .map((l) => (
                      <div key={l.level} className="flex items-center justify-between border-b border-app-border/60 pb-1.5">
                        <span className="text-app-ink font-medium">{l.title}</span>
                        <span className="font-sans font-semibold text-app-accent font-bold tabular-nums">
                          {l.remaining} credits needed
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Official Disclaimer */}
      <SectionBar className="text-center text-xs text-app-ink-muted">
        <span className="font-serif font-semibold text-app-ink block text-sm">
          Self-awarded credits. Not accredited by any institution.
        </span>
        <p className="text-[11px] text-app-ink-muted mt-0.5 max-w-xl mx-auto">
          Valeria’s Creds degree audit calculations are mathematically modelled after standard university degree requirements for structured independent study and portfolio evidence.
        </p>
      </SectionBar>

      {/* Edit Degree Target Dialog */}
      <Dialog open={editTargetOpen} onOpenChange={setEditTargetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Degree Credit Target</DialogTitle>
            <DialogDescription>
              Set the total credit threshold for your academic curriculum (default 160 credits).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-semibold text-app-ink block mb-1">
                Total Required Credits Target
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={30}
                  max={300}
                  value={tempTarget}
                  onChange={(e) => setTempTarget(Number(e.target.value))}
                  className="font-sans font-semibold font-bold text-center text-base"
                />
                <span className="font-sans font-semibold text-app-ink-muted">Credits</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {[120, 140, 160, 180].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTempTarget(preset)}
                  className={`flex-1 rounded border py-1.5 text-xs font-sans font-semibold font-medium transition-colors ${
                    tempTarget === preset
                      ? "border-app-accent bg-app-accent/10 text-app-accent font-bold"
                      : "border-app-border bg-app-surface text-app-ink-muted hover:border-app-ink-muted"
                  }`}
                >
                  {preset} cr
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-app-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditTargetOpen(false)}
              disabled={savingTarget}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveTarget}
              disabled={savingTarget || !tempTarget || tempTarget < 30}
            >
              {savingTarget ? "Saving..." : "Save Target"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
