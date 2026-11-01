"use client";

import * as React from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/repository";
import { Course, Term, Assessment, Attempt, Submission, LessonProgress, Module, Topic } from "@/types/schemas";
import {
  calculateCourseGrades,
  calculateSGPA,
  calculateCGPA,
  getAcademicStanding,
  CourseTermRecord,
} from "@/lib/grading/grading-engine";
import { calculateUnitMastery, calculateCourseMastery } from "@/lib/mastery/mastery-engine";
import { Stat } from "@/components/ui/stat";
import { Button } from "@/components/ui/button";
import { TOKENS, CourseTagKey } from "@/styles/tokens";
import { Award, BookOpen, ChevronRight, Layers, Sliders, ExternalLink } from "lucide-react";
import { SectionBar } from "@/components/ui/section-bar";

export default function GradesPage() {
  const { dataStore, currentUser } = useDataStore();

  const [terms, setTerms] = React.useState<Term[]>([]);
  const [selectedTermId, setSelectedTermId] = React.useState<string>("all");
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [attempts, setAttempts] = React.useState<Attempt[]>([]);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [progressList, setProgressList] = React.useState<LessonProgress[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Grade scale toggle (defaults to user setting)
  const [scale, setScale] = React.useState<"10_point" | "4_point">(
    currentUser?.settings?.gradeScale || "10_point"
  );

  React.useEffect(() => {
    if (currentUser?.settings?.gradeScale) {
      setScale(currentUser.settings.gradeScale);
    }
  }, [currentUser]);

  // Load all academic data
  React.useEffect(() => {
    async function loadAllGradesData() {
      try {
        setLoading(true);
        const [allTerms, allCourses, allProgress, allTopics] = await Promise.all([
          dataStore.getTerms(),
          dataStore.getCourses(),
          dataStore.getAllLessonProgress(),
          dataStore.getAllTopics(),
        ]);

        const nestedModules = await Promise.all(
          allCourses.map((c) => dataStore.getModules(c.id))
        );
        const allModules = nestedModules.flat();

        setTerms(allTerms);
        setCourses(allCourses);
        setProgressList(allProgress);
        setModules(allModules);
        setTopics(allTopics);

        const currentT = allTerms.find((t) => t.isCurrent) || allTerms[0];
        if (currentT) {
          setSelectedTermId(currentT.id);
        }

        // Fetch assessments for all courses
        const asmListNested = await Promise.all(
          allCourses.map((c) => dataStore.getAssessments(c.id))
        );
        const allAsms = asmListNested.flat();
        setAssessments(allAsms);

        // Fetch attempts and submissions for all assessments
        const [allAtts, allSubs] = await Promise.all([
          Promise.all(allAsms.map((a) => dataStore.getAttempts(a.id))).then((res) =>
            res.flat()
          ),
          Promise.all(allAsms.map((a) => dataStore.getSubmission(a.id))).then((res) =>
            res.filter(Boolean) as Submission[]
          ),
        ]);

        setAttempts(allAtts);
        setSubmissions(allSubs);
      } catch (err) {
        console.error("Failed to load grades data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAllGradesData();
  }, [dataStore]);

  // Compute grade records for every course
  const courseGradeRecords = React.useMemo(() => {
    return courses.map((course) => {
      const courseAsms = assessments.filter((a) => a.courseId === course.id);
      const courseModules = modules.filter((m) => m.courseId === course.id);
      const courseTopics = topics.filter((t) => t.courseId === course.id);

      const unitScores = courseModules.map((m) => {
        const mTopics = courseTopics.filter((t) => t.unitId === m.id);
        return calculateUnitMastery(
          mTopics,
          m.electiveExperimentsCount || course.electiveExperimentsCount
        ).score;
      });
      const courseMasteryScore = calculateCourseMastery(unitScores).courseScore;

      const gradeRes = calculateCourseGrades(
        course,
        courseMasteryScore,
        courseAsms,
        attempts,
        submissions,
        scale
      );

      return {
        course,
        gradeResult: gradeRes,
      };
    });
  }, [courses, assessments, attempts, submissions, modules, topics, scale]);

  // Detect retakes (courses with matching codes)
  const codeOccurrences = React.useMemo(() => {
    const counts: Record<string, number> = {};
    courses.forEach((c) => {
      const code = c.code.trim().toUpperCase();
      counts[code] = (counts[code] || 0) + 1;
    });
    return counts;
  }, [courses]);

  // Build standard CourseTermRecord items for SGPA & CGPA
  const allTermRecords: CourseTermRecord[] = React.useMemo(() => {
    return courseGradeRecords.map(({ course, gradeResult }) => ({
      courseId: course.id,
      courseCode: course.code,
      termId: course.termId,
      credits: course.credits,
      percentage: gradeResult.currentGrade,
      letter: gradeResult.letter,
      gradePoints: gradeResult.points,
      passed: gradeResult.passed,
      termDate: course.createdAt,
    }));
  }, [courseGradeRecords]);

  // Selected Term Filter
  const activeTerm = terms.find((t) => t.id === selectedTermId) || terms[0];

  const currentTermRecords = React.useMemo(() => {
    if (selectedTermId === "all") return allTermRecords;
    return allTermRecords.filter((r) => r.termId === selectedTermId);
  }, [allTermRecords, selectedTermId]);

  // Compute SGPA for selected term
  const termSGPA = React.useMemo(() => {
    return calculateSGPA(currentTermRecords);
  }, [currentTermRecords]);

  // Compute Cumulative CGPA across all terms with collegiate retake replacement rule
  const cumulativeCGPA = React.useMemo(() => {
    return calculateCGPA(allTermRecords);
  }, [allTermRecords]);

  // Credits summary
  const totalEarnedCredits = courseGradeRecords
    .filter((r) => r.gradeResult.passed)
    .reduce((acc, r) => acc + r.course.credits, 0);

  const termCredits = currentTermRecords.reduce((acc, r) => acc + r.credits, 0);

  // Standing calculation
  const academicStanding = getAcademicStanding(
    selectedTermId === "all" ? cumulativeCGPA : termSGPA,
    scale
  );

  const filteredGradeRows = React.useMemo(() => {
    if (selectedTermId === "all") return courseGradeRecords;
    return courseGradeRecords.filter((r) => r.course.termId === selectedTermId);
  }, [courseGradeRecords, selectedTermId]);

  const hasGradedResult = courseGradeRecords.some(
    (r) => r.gradeResult.points > 0 || r.gradeResult.currentGrade > 0
  );

  return (
    <div className="space-y-6">
      {/* Page Header & Grade Scale Switcher (Solid cream panel) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-[18px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] shadow-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-app-ink">
            Official Grades & Academic Standings
          </h1>
          <p className="text-xs text-app-ink-muted mt-0.5">
            Credit-weighted standing with Semester GPA (SGPA) and Cumulative GPA (CGPA).
          </p>
        </div>

        {/* Controls: Term Filter & Scale Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Term Switcher */}
          <div className="flex items-center gap-1.5 rounded-control border border-app-border bg-app-surface px-2.5 py-1 text-xs">
            <span className="text-app-ink-muted text-[11px] font-medium">Term:</span>
            <select
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="bg-transparent font-semibold text-app-ink focus:outline-none cursor-pointer"
            >
              <option value="all">All Academic Terms</option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.isCurrent ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Scale Toggle */}
          <div className="flex items-center rounded-control border border-app-border bg-app-surface p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setScale("10_point")}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                scale === "10_point"
                  ? "bg-[#A51C30] text-white font-semibold"
                  : "text-app-ink-muted hover:text-app-ink"
              }`}
            >
              10-Pt Scale
            </button>
            <button
              type="button"
              onClick={() => setScale("4_point")}
              className={`rounded px-2.5 py-1 font-medium transition-colors ${
                scale === "4_point"
                  ? "bg-[#A51C30] text-white font-semibold"
                  : "text-app-ink-muted hover:text-app-ink"
              }`}
            >
              4.0 Scale
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Academic Standings Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          label={selectedTermId === "all" ? "Average SGPA" : `${activeTerm?.name || "Term"} SGPA`}
          value={hasGradedResult && termSGPA > 0 ? termSGPA.toFixed(2) : "—"}
          unit={hasGradedResult && termSGPA > 0 ? (scale === "10_point" ? "/ 10.00" : "/ 4.00") : ""}
          subtext={`${termCredits} Credits in ${selectedTermId === "all" ? "all terms" : activeTerm?.name || "Term"}`}
        />

        <Stat
          label="Cumulative CGPA"
          value={hasGradedResult && cumulativeCGPA > 0 ? cumulativeCGPA.toFixed(2) : "—"}
          unit={hasGradedResult && cumulativeCGPA > 0 ? (scale === "10_point" ? "/ 10.00" : "/ 4.00") : ""}
          subtext="Collegiate retake replacement applied"
        />

        <Stat
          label="Total Degree Credits"
          value={totalEarnedCredits}
          unit="cr"
          subtext={`${courses.length} enrolled course units`}
        />

        <div className="rounded-card border border-app-border bg-app-surface p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-app-ink-muted">Academic Standing</span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-app-accent shrink-0" />
              <span className="font-serif text-lg font-bold text-app-ink leading-tight">
                {academicStanding}
              </span>
            </div>
            <span className="text-[10px] text-app-ink-muted block">
              Official university standing designation
            </span>
          </div>
        </div>
      </div>

      {/* Course Gradebook Table */}
      <div className="rounded-card border border-app-border bg-app-surface overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-app-border bg-app-surface-muted/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-base font-bold text-app-ink">
              Enrolled Course Grades
            </h3>
            <span className="rounded-full bg-app-surface px-2 py-0.5 text-xs text-app-ink-muted font-sans font-semibold tabular-nums border border-app-border/60">
              {filteredGradeRows.length} courses
            </span>
          </div>

          <span className="text-xs text-app-ink-muted">
            Click any row to open the course gradebook and syllabus
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-app-ink-muted">
            Loading course standing records...
          </div>
        ) : filteredGradeRows.length === 0 ? (
          <div className="py-12 text-center text-xs text-app-ink-muted">
            No courses found for the selected academic term.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-app-border bg-app-surface-muted/20 text-app-ink-muted">
                  <th className="px-4 py-2.5 font-medium">Course Code</th>
                  <th className="px-4 py-2.5 font-medium">Course Title</th>
                  <th className="px-4 py-2.5 font-medium">Department</th>
                  <th className="px-4 py-2.5 font-medium text-right">Credits</th>
                  <th className="px-4 py-2.5 font-medium text-right">Current Grade</th>
                  <th className="px-4 py-2.5 font-medium text-right">Projected Final</th>
                  <th className="px-4 py-2.5 font-medium text-center">Letter</th>
                  <th className="px-4 py-2.5 font-medium text-right">Grade Points</th>
                  <th className="px-4 py-2.5 font-medium text-center">Standing</th>
                  <th className="px-4 py-2.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filteredGradeRows.map(({ course, gradeResult }) => {
                  const tagColor =
                    TOKENS.colors.courseTags[course.colorTag as CourseTagKey]?.hex ||
                    TOKENS.colors.courseTags.slate.hex;
                  const isRetake = (codeOccurrences[course.code.trim().toUpperCase()] || 0) > 1;

                  return (
                    <tr
                      key={course.id}
                      className="hover:bg-app-surface-muted/30 transition-colors"
                    >
                      {/* Course Code with Color Dot */}
                      <td className="px-4 py-3 font-semibold text-app-ink">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: tagColor }}
                          />
                          <span className="font-sans font-semibold">{course.code}</span>
                          {isRetake && (
                            <span
                              className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20"
                              title="Retake Course: Higher mark used for CGPA"
                            >
                              (R)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Course Title */}
                      <td className="px-4 py-3 font-medium text-app-ink max-w-xs truncate">
                        {course.title}
                      </td>

                      {/* Department & Level */}
                      <td className="px-4 py-3 text-app-ink-muted">
                        {course.department} • {course.level}L
                      </td>

                      {/* Credits */}
                      <td className="px-4 py-3 text-right font-sans font-semibold tabular-nums text-app-ink font-medium">
                        {course.credits}
                      </td>

                      {/* Current Grade % */}
                      <td className="px-4 py-3 text-right font-sans font-semibold tabular-nums font-semibold text-app-ink">
                        {gradeResult.currentGrade}%
                      </td>

                      {/* Projected Final Grade % */}
                      <td className="px-4 py-3 text-right font-sans font-semibold tabular-nums text-app-accent font-semibold">
                        {gradeResult.projectedFinalGrade}%
                      </td>

                      {/* Letter Grade */}
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block min-w-7 rounded bg-app-surface-muted/80 px-2 py-0.5 font-serif font-bold text-app-ink text-sm">
                          {gradeResult.letter}
                        </span>
                      </td>

                      {/* Grade Points */}
                      <td className="px-4 py-3 text-right font-sans font-semibold tabular-nums font-bold text-app-ink">
                        {gradeResult.points.toFixed(1)}
                      </td>

                      {/* Standing Status */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            gradeResult.passed
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              : "bg-app-danger/10 text-app-danger"
                          }`}
                        >
                          {gradeResult.passed ? "Passing" : "Failing"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/courses/${course.id}`}
                          className="inline-flex items-center gap-1 text-app-accent hover:underline font-medium text-xs"
                        >
                          <span>View</span>
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scale & Retake Policy Explanatory Note */}
      <SectionBar className="text-xs text-app-ink-muted space-y-1">
        <span className="font-semibold text-app-ink block">
          Collegiate Grading & Retake Standards:
        </span>
        <p>
          Semester GPA (SGPA) is calculated as the sum of (Grade Points &times; Credits) divided by Total Term Credits. For repeated courses (flagged with <code className="font-bold text-amber-700 dark:text-amber-400">(R)</code>), the higher grade points are incorporated into the Cumulative CGPA, while both course registrations remain preserved in the permanent transcript record.
        </p>
      </SectionBar>
    </div>
  );
}
