"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDataStore } from "@/lib/repository";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/dashboard/course-card";
import { CreateCourseDialog } from "@/components/courses/create-course-dialog";
import { CreateTermDialog } from "@/components/courses/create-term-dialog";
import { Plus, Calendar, BookOpen } from "lucide-react";
import { LessonProgress, Assessment } from "@/types/schemas";

function CoursesContent() {
  const searchParams = useSearchParams();
  const { courses, currentTerm, dataStore } = useDataStore();

  const [progressList, setProgressList] = React.useState<LessonProgress[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [createCourseOpen, setCreateCourseOpen] = React.useState(false);
  const [createTermOpen, setCreateTermOpen] = React.useState(false);

  React.useEffect(() => {
    if (searchParams.get("action") === "new-course") {
      setCreateCourseOpen(true);
    }
  }, [searchParams]);

  React.useEffect(() => {
    async function load() {
      const [allProg, allAsm] = await Promise.all([
        dataStore.getAllLessonProgress(),
        Promise.all(courses.map((c) => dataStore.getAssessments(c.id))).then((r) =>
          r.flat()
        ),
      ]);
      setProgressList(allProg);
      setAssessments(allAsm);
    }
    if (courses.length > 0) {
      load();
    }
  }, [courses, dataStore]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-app-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-app-ink-muted">
            <span className="font-semibold uppercase tracking-wider text-app-accent">
              Academic Registry
            </span>
            <span>•</span>
            <span>{currentTerm?.name || "Active Term"}</span>
          </div>
          <h1 className="mt-1 font-serif text-2xl md:text-3xl font-bold tracking-tight text-app-ink">
            Enrolled Academic Courses
          </h1>
          <p className="text-xs text-app-ink-muted mt-0.5">
            Credit-bearing course registrations, video lecture modules, and syllabus progress
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateTermOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>New Term</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setCreateCourseOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Course</span>
          </Button>
        </div>
      </div>

      {/* Course Cards Grid */}
      {courses.length === 0 ? (
        <div className="rounded-card border border-dashed border-app-border bg-app-surface/50 p-12 text-center">
          <BookOpen className="h-8 w-8 text-app-ink-muted mx-auto mb-2" />
          <h3 className="font-serif text-base font-semibold text-app-ink">
            No Courses Enrolled
          </h3>
          <p className="text-xs text-app-ink-muted mt-1 max-w-sm mx-auto">
            Create your first academic course to begin organizing lecture videos and earning credit.
          </p>
          <div className="mt-4">
            <Button size="sm" onClick={() => setCreateCourseOpen(true)}>
              Create First Course
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progressList={progressList.filter((p) => p.courseId === course.id)}
              assessments={assessments.filter((a) => a.courseId === course.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateCourseDialog
        open={createCourseOpen}
        onOpenChange={setCreateCourseOpen}
      />

      <CreateTermDialog
        open={createTermOpen}
        onOpenChange={setCreateTermOpen}
      />
    </div>
  );
}

export default function CoursesPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-xs text-app-ink-muted">Loading courses...</div>}>
      <CoursesContent />
    </React.Suspense>
  );
}
