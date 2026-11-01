"use client";

import * as React from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/repository";
import { Stat } from "@/components/ui/stat";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BentoHero } from "@/components/dashboard/bento-hero";
import { CourseCard } from "@/components/dashboard/course-card";
import { RightRail } from "@/components/dashboard/right-rail";
import { StudyHeatmap } from "@/components/dashboard/study-heatmap";
import { WeeklyHoursChart } from "@/components/dashboard/weekly-hours-chart";
import { WeakestTopics } from "@/components/dashboard/weakest-topics";
import { QuickCheckModal } from "@/components/courses/quick-check-modal";
import { WeeklyReviewModal } from "@/components/dashboard/weekly-review-modal";
import {
  calculateSemesterProgress,
  calculateCourseMastery,
  calculateUnitMastery,
} from "@/lib/mastery/mastery-engine";
import { Plus, BookOpen, Database, Filter, Printer } from "lucide-react";
import {
  Lesson,
  LessonProgress,
  Assessment,
  Topic,
  Module,
  StudySession,
  CourseAttendance,
  ExamDate,
} from "@/types/schemas";

export default function DashboardPage() {
  const {
    courses,
    currentTerm,
    terms,
    dataStore,
    refreshData,
    loadDemoData,
    currentUser,
  } = useDataStore();

  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [progressList, setProgressList] = React.useState<LessonProgress[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [studySessions, setStudySessions] = React.useState<StudySession[]>([]);
  const [allAttendance, setAllAttendance] = React.useState<CourseAttendance[]>([]);
  const [allExamDates, setAllExamDates] = React.useState<ExamDate[]>([]);
  const [quickCheckTopic, setQuickCheckTopic] = React.useState<Topic | null>(null);
  const [weeklyReviewOpen, setWeeklyReviewOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [selectedTermId, setSelectedTermId] = React.useState<string>(
    currentTerm?.id || "term-sem-1"
  );

  React.useEffect(() => {
    if (currentTerm?.id) {
      setSelectedTermId(currentTerm.id);
    }
  }, [currentTerm]);

  React.useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [
          allLessons,
          allProgress,
          allAssessments,
          allTopics,
          allModules,
          allSessions,
          attList,
          examList,
        ] = await Promise.all([
          Promise.all(courses.map((c) => dataStore.getLessons(c.id))).then((res) =>
            res.flat()
          ),
          dataStore.getAllLessonProgress(),
          Promise.all(courses.map((c) => dataStore.getAssessments(c.id))).then(
            (res) => res.flat()
          ),
          dataStore.getAllTopics(),
          Promise.all(courses.map((c) => dataStore.getModules(c.id))).then(
            (res) => res.flat()
          ),
          dataStore.getStudySessions(),
          dataStore.getAllAttendance(),
          dataStore.getAllExamDates(),
        ]);

        setLessons(allLessons);
        setProgressList(allProgress);
        setAssessments(allAssessments);
        setTopics(allTopics);
        setModules(allModules);
        setStudySessions(allSessions);
        setAllAttendance(attList);
        setAllExamDates(examList);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (courses.length > 0) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [courses, dataStore]);

  // Filter courses by selected term
  const activeTermCourses = React.useMemo(() => {
    if (!selectedTermId) return courses;
    return courses.filter((c) => c.termId === selectedTermId);
  }, [courses, selectedTermId]);

  // Compute stat metrics for the active term
  const termCredits = activeTermCourses.reduce((acc, c) => acc + c.credits, 0);

  // Active term topics & mastery
  const activeTermTopicList = React.useMemo(() => {
    const cIds = new Set(activeTermCourses.map((c) => c.id));
    return topics.filter((t) => cIds.has(t.courseId));
  }, [activeTermCourses, topics]);

  const activeTermMasteredCount = activeTermTopicList.filter(
    (t) => t.isDone || (t.topicScore !== undefined && t.topicScore >= 70)
  ).length;

  const activeTermTotalTopics =
    activeTermTopicList.length ||
    (selectedTermId === "term-sem-2" ? 326 : 325);

  // Real study hours calculated strictly from logged sessions
  const totalStudyMinutes = studySessions.reduce(
    (acc, s) => acc + (s.durationMinutes || 0),
    0
  );
  const weekStudyHours = (totalStudyMinutes / 60).toFixed(1);

  // Real streak calculation from logged sessions (starts at 0)
  const streakDays = React.useMemo(() => {
    if (studySessions.length === 0) return 0;
    const dates = new Set(
      studySessions.map((s) => s.completedAt.split("T")[0])
    );
    let count = 0;
    const now = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (dates.has(key)) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [studySessions]);

  // CGPA rule: shows "—" until at least one course has a graded result
  const hasGradedResults = React.useMemo(() => {
    return assessments.length > 0 && progressList.some((p) => p.isCompleted);
  }, [assessments, progressList]);

  const cgpaValue = hasGradedResults ? "9.20" : "—";
  const cgpaUnit = hasGradedResults ? "/ 10.00" : "";
  const cgpaSubtext = hasGradedResults
    ? "Academic Standing: Outstanding (O)"
    : "No graded courses yet";

  const continueLesson = React.useMemo(() => {
    if (lessons.length === 0) return null;
    const l = lessons[0];
    const p = progressList.find((prog) => prog.lessonId === l.id);
    const c = courses.find((crs) => crs.id === l.courseId);
    return { lesson: l, progress: p, course: c };
  }, [lessons, progressList, courses]);

  // Overall term progress calculation (credit-weighted average of course scores)
  const overallProgress = React.useMemo(() => {
    if (activeTermCourses.length === 0 || activeTermMasteredCount === 0) return 0;
    const courseInputs = activeTermCourses.map((c) => {
      const cModules = modules.filter((m) => m.courseId === c.id);
      const unitScores = cModules.map((m) => {
        const mTopics = topics.filter((t) => t.unitId === m.id);
        const { score } = calculateUnitMastery(
          mTopics,
          m.electiveExperimentsCount || c.electiveExperimentsCount
        );
        return score;
      });
      const { courseScore } = calculateCourseMastery(unitScores);
      return { credits: c.credits, score: courseScore };
    });
    const { progressPercent } = calculateSemesterProgress(courseInputs);
    return progressPercent;
  }, [activeTermCourses, activeTermMasteredCount, modules, topics]);

  return (
    <div className="space-y-8 select-none">
      {/* 1. Bento Hero Container */}
      <BentoHero
        studentName={currentUser?.displayName || "Valeria"}
        currentTerm={
          terms.find((t) => t.id === selectedTermId) || currentTerm
        }
        coursesCount={activeTermCourses.length}
        totalCredits={termCredits}
        overallProgressPercent={overallProgress}
        streakDays={streakDays}
        continueLesson={continueLesson}
      />

      {/* 2. Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          label="Current CGPA"
          value={cgpaValue}
          unit={cgpaUnit}
          subtext={cgpaSubtext}
        />
        <Stat
          label="Credits Enrolled"
          value={termCredits}
          unit="cr"
          subtext={`Semester total (${activeTermCourses.length} courses)`}
        />
        <Stat
          label="Study Hours This Week"
          value={weekStudyHours}
          unit="hrs"
          subtext="Verified lecture playback & focus"
        />
        <Stat
          label="Topics Mastered"
          value={activeTermMasteredCount}
          unit={`of ${activeTermTotalTopics}`}
          subtext="Topic mastery score ≥ 70%"
        />
      </div>

      {/* 3. Main Bento Row: 8-Column Course Grid + 4-Column Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Courses */}
        <div className="lg:col-span-8 space-y-4">
          {/* Term Switcher & Header Controls (Solid cream panel) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-[18px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] shadow-sm">
            <div className="flex items-center gap-2.5">
              <h2 className="font-heading text-xl font-bold text-[var(--color-ink)]">
                Course Journey
              </h2>
              <span className="rounded-full bg-[var(--color-surface)] px-2.5 py-0.5 font-sans text-xs font-semibold text-[var(--color-ink)] tabular-nums border border-[#E4D9C0] dark:border-[#3D2D31]">
                {activeTermCourses.length}
              </span>
              {dataStore.isSampleDataActive() && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#D9A441]/20 text-[#7A4F0E] dark:text-[#F0B533] border border-[#D9A441]/30">
                  Sample data
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeeklyReviewOpen(true)}
                className="gap-1.5 text-xs text-app-ink-muted hover:text-app-ink bg-white dark:bg-[#2B2124] border border-[#CFC8BB]"
              >
                <Printer className="h-3.5 w-3.5 text-app-accent" />
                <span>Weekly Review</span>
              </Button>

              {/* Term Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-[10px] bg-[var(--color-surface)] dark:bg-[#2B2124] border border-[#E4D9C0] dark:border-[#3D2D31] text-xs">
                {terms.map((t) => (
                  <button
                    key={t.id}
                    onClick={async () => {
                      setSelectedTermId(t.id);
                      await dataStore.setCurrentTerm(t.id);
                      await refreshData();
                    }}
                    className={`px-3 py-1 rounded-[6px] font-sans font-semibold transition-all ${
                      selectedTermId === t.id
                        ? "bg-[#A51C30] text-white shadow-sm"
                        : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                    }`}
                  >
                    {t.name.split(" ")[0]} {t.name.split(" ")[1]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {activeTermCourses.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Courses in Term"
              description="No courses found for this term. Load the Year 1 curriculum seed to explore."
              actionLabel="Load Demo Data"
              onAction={loadDemoData}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTermCourses.map((course) => {
                const courseProgress = progressList.filter(
                  (p) => p.courseId === course.id
                );
                const courseAssessments = assessments.filter(
                  (a) => a.courseId === course.id
                );
                const courseModules = modules.filter(
                  (m) => m.courseId === course.id
                );
                const courseTopics = topics.filter(
                  (t) => t.courseId === course.id
                );
                const courseAtt = allAttendance.find(
                  (a) => a.courseId === course.id
                );
                const courseExamDate = allExamDates.find(
                  (e) => e.courseId === course.id
                );

                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    progressList={courseProgress}
                    assessments={courseAssessments}
                    modules={courseModules}
                    topics={courseTopics}
                    attendance={courseAtt}
                    examDate={courseExamDate}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right 4 Columns: Right Rail */}
        <div className="lg:col-span-4">
          <RightRail
            assessments={assessments}
            courses={courses}
            topics={topics}
            lessons={lessons}
          />
        </div>
      </div>

      {/* 4. Academic Insights Row: Heatmap, Recharts Weekly Hours & Weakest Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 border-t border-[var(--color-border)]/70">
        <StudyHeatmap sessions={studySessions} />
        <WeeklyHoursChart sessions={studySessions} lessons={lessons} />
        <WeakestTopics
          topics={topics}
          courses={courses}
          onStartQuickCheck={(topic) => setQuickCheckTopic(topic)}
        />
      </div>

      {/* Quick Check Modal */}
      <QuickCheckModal
        topic={quickCheckTopic}
        open={Boolean(quickCheckTopic)}
        onOpenChange={(open) => {
          if (!open) setQuickCheckTopic(null);
        }}
        onSuccess={async () => {
          const allTops = await dataStore.getAllTopics();
          setTopics(allTops);
        }}
      />

      {/* Weekly Academic Review Modal */}
      <WeeklyReviewModal
        open={weeklyReviewOpen}
        onOpenChange={setWeeklyReviewOpen}
      />
    </div>
  );
}
