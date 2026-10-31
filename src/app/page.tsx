"use client";

import * as React from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/repository";
import { Stat } from "@/components/ui/stat";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CourseCard } from "@/components/dashboard/course-card";
import { ContinueWatchingStrip } from "@/components/dashboard/continue-watching";
import { TodoList } from "@/components/dashboard/todo-list";
import { Plus, BookOpen, Database, Sparkles } from "lucide-react";
import {
  Lesson,
  LessonProgress,
  Assessment,
  Attempt,
  Submission,
} from "@/types/schemas";

export default function DashboardPage() {
  const {
    courses,
    currentTerm,
    dataStore,
    loadDemoData,
    currentUser,
  } = useDataStore();

  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [progressList, setProgressList] = React.useState<LessonProgress[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [attempts, setAttempts] = React.useState<Attempt[]>([]);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [allLessons, allProgress, allAssessments, allAttempts, allSubmissions] =
          await Promise.all([
            Promise.all(courses.map((c) => dataStore.getLessons(c.id))).then((res) =>
              res.flat()
            ),
            dataStore.getAllLessonProgress(),
            Promise.all(courses.map((c) => dataStore.getAssessments(c.id))).then(
              (res) => res.flat()
            ),
            Promise.all(
              courses.map(async (c) => {
                const asms = await dataStore.getAssessments(c.id);
                const atts = await Promise.all(
                  asms.map((a) => dataStore.getAttempts(a.id))
                );
                return atts.flat();
              })
            ).then((res) => res.flat()),
            Promise.all(
              courses.map(async (c) => {
                const asms = await dataStore.getAssessments(c.id);
                const subs = await Promise.all(
                  asms.map((a) => dataStore.getSubmission(a.id))
                );
                return subs.filter(Boolean) as Submission[];
              })
            ).then((res) => res.flat()),
          ]);

        setLessons(allLessons);
        setProgressList(allProgress);
        setAssessments(allAssessments);
        setAttempts(allAttempts);
        setSubmissions(allSubmissions);
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

  // Compute stat metrics
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
  const completedLessonsCount = progressList.filter((p) => p.isCompleted).length;
  const totalWatchedSeconds = progressList.reduce(
    (acc, p) => acc + p.watchedSeconds,
    0
  );
  const studyHours = (totalWatchedSeconds / 3600).toFixed(1);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-app-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-app-accent">
              Academic Dashboard
            </span>
            <span>•</span>
            <span className="text-xs text-app-ink-muted">
              {currentTerm ? currentTerm.name : "Active Academic Term"}
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl md:text-3xl font-bold tracking-tight text-app-ink">
            Welcome back, {currentUser?.displayName?.split(" ")[0] || "Catya"}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDemoData}
            className="text-xs gap-1.5"
          >
            <Database className="h-3.5 w-3.5 text-app-ink-muted" />
            <span>Load Demo Data</span>
          </Button>

          <Button size="sm" asChild className="text-xs gap-1.5">
            <Link href="/courses?action=new-course">
              <Plus className="h-3.5 w-3.5" />
              <span>Create Course</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Stat Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat
          label="Current CGPA"
          value="9.20"
          unit="/ 10.00"
          subtext="Grade: Outstanding (O)"
        />
        <Stat
          label="Credits Earned"
          value={totalCredits}
          unit="cr"
          subtext="Towards 120 credit degree"
        />
        <Stat
          label="Lessons Completed"
          value={completedLessonsCount}
          unit={`of ${lessons.length}`}
          subtext="Verified watch time tracking"
        />
        <Stat
          label="Total Study Time"
          value={studyHours}
          unit="hrs"
          subtext="Accumulated video lectures"
        />
      </div>

      {/* Continue Watching Section */}
      <ContinueWatchingStrip
        lessons={lessons}
        progressList={progressList}
        courses={courses}
      />

      {/* Course Cards Grid (Google Classroom style) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-bold text-app-ink">
              Enrolled Courses
            </h2>
            <span className="rounded-full bg-app-surface-muted px-2 py-0.5 font-mono text-xs font-semibold text-app-ink tabular-nums">
              {courses.length}
            </span>
          </div>

          <Link
            href="/courses"
            className="text-xs font-semibold text-app-accent hover:underline"
          >
            Manage All Courses →
          </Link>
        </div>

        {courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Courses Enrolled"
            description="You have not added any academic courses yet. Create a course or load sample data to explore."
            actionLabel="Load Demo Data"
            onAction={loadDemoData}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {courses.map((course) => {
              const courseProgress = progressList.filter(
                (p) => p.courseId === course.id
              );
              const courseAssessments = assessments.filter(
                (a) => a.courseId === course.id
              );

              return (
                <CourseCard
                  key={course.id}
                  course={course}
                  progressList={courseProgress}
                  assessments={courseAssessments}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* To-Do and Upcoming List */}
      <TodoList
        assessments={assessments}
        courses={courses}
        attempts={attempts}
        submissions={submissions}
      />
    </div>
  );
}
