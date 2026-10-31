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
import { Plus, BookOpen, Database, Filter } from "lucide-react";
import {
  Lesson,
  LessonProgress,
  Assessment,
  Topic,
  Module,
  StudySession,
} from "@/types/schemas";

export default function DashboardPage() {
  const {
    courses,
    currentTerm,
    terms,
    dataStore,
    loadDemoData,
    currentUser,
  } = useDataStore();

  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [progressList, setProgressList] = React.useState<LessonProgress[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [studySessions, setStudySessions] = React.useState<StudySession[]>([]);
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
        ]);

        setLessons(allLessons);
        setProgressList(allProgress);
        setAssessments(allAssessments);
        setTopics(allTopics);
        setModules(allModules);
        setStudySessions(allSessions);
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
  const totalMasteredTopics = topics.filter((t) => t.isDone).length;
  const continueLesson = React.useMemo(() => {
    if (lessons.length === 0) return null;
    const l = lessons[0];
    const p = progressList.find((prog) => prog.lessonId === l.id);
    const c = courses.find((crs) => crs.id === l.courseId);
    return { lesson: l, progress: p, course: c };
  }, [lessons, progressList, courses]);

  // Overall term progress calculation
  const overallProgress = React.useMemo(() => {
    const termTopics = topics.filter((t) =>
      activeTermCourses.some((c) => c.id === t.courseId)
    );
    if (termTopics.length === 0) return 0;
    const done = termTopics.filter((t) => t.isDone).length;
    return (done / termTopics.length) * 100;
  }, [topics, activeTermCourses]);

  return (
    <div className="space-y-8 select-none">
      {/* 1. Bento Hero Container */}
      <BentoHero
        studentName={currentUser?.displayName || "Valeria V."}
        currentTerm={
          terms.find((t) => t.id === selectedTermId) || currentTerm
        }
        coursesCount={activeTermCourses.length}
        totalCredits={termCredits}
        overallProgressPercent={overallProgress}
        streakDays={5}
        continueLesson={continueLesson}
      />

      {/* 2. Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          label="Current CGPA"
          value="9.20"
          unit="/ 10.00"
          subtext="Academic Standing: Outstanding (O)"
        />
        <Stat
          label="Credits Enrolled"
          value={termCredits}
          unit="cr"
          subtext={`Semester total (${activeTermCourses.length} courses)`}
        />
        <Stat
          label="Study Hours This Week"
          value="21.6"
          unit="hrs"
          subtext="Verified lecture playback & focus"
        />
        <Stat
          label="Topics Mastered"
          value={totalMasteredTopics}
          unit={`of ${topics.length || 439}`}
          subtext="Topic mastery score ≥ 70%"
        />
      </div>

      {/* 3. Main Bento Row: 8-Column Course Grid + 4-Column Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Courses */}
        <div className="lg:col-span-8 space-y-4">
          {/* Term Switcher & Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[var(--color-border)]/70">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold text-[var(--color-ink)]">
                Course Journey
              </h2>
              <span className="rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--color-ink)] tabular-nums">
                {activeTermCourses.length}
              </span>
            </div>

            {/* Term Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-xs">
              {terms.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTermId(t.id)}
                  className={`px-3 py-1 rounded-[6px] font-semibold transition-all ${
                    selectedTermId === t.id
                      ? "bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm"
                      : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  {t.name.split(" ")[0]} {t.name.split(" ")[1]}
                </button>
              ))}
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

                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    progressList={courseProgress}
                    assessments={courseAssessments}
                    modules={courseModules}
                    topics={courseTopics}
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
        <WeeklyHoursChart />
        <WeakestTopics topics={topics} courses={courses} />
      </div>
    </div>
  );
}
