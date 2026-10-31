"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDataStore } from "@/lib/repository";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/dashboard/course-card";
import { CreateCourseDialog } from "@/components/courses/create-course-dialog";
import { CreateTermDialog } from "@/components/courses/create-term-dialog";
import { Plus, Calendar, BookOpen, Filter } from "lucide-react";
import { LessonProgress, Assessment, Module, Topic } from "@/types/schemas";

function CoursesContent() {
  const searchParams = useSearchParams();
  const { courses, terms, currentTerm, dataStore } = useDataStore();

  const [progressList, setProgressList] = React.useState<LessonProgress[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [selectedTermId, setSelectedTermId] = React.useState<string>("all");
  const [createCourseOpen, setCreateCourseOpen] = React.useState(false);
  const [createTermOpen, setCreateTermOpen] = React.useState(false);

  React.useEffect(() => {
    if (searchParams.get("action") === "new-course") {
      setCreateCourseOpen(true);
    }
  }, [searchParams]);

  React.useEffect(() => {
    async function load() {
      const [allProg, allAsm, allMods, allTops] = await Promise.all([
        dataStore.getAllLessonProgress(),
        Promise.all(courses.map((c) => dataStore.getAssessments(c.id))).then((r) =>
          r.flat()
        ),
        Promise.all(courses.map((c) => dataStore.getModules(c.id))).then((r) =>
          r.flat()
        ),
        dataStore.getAllTopics(),
      ]);
      setProgressList(allProg);
      setAssessments(allAsm);
      setModules(allMods);
      setTopics(allTops);
    }
    if (courses.length > 0) {
      load();
    }
  }, [courses, dataStore]);

  const filteredCourses = React.useMemo(() => {
    if (selectedTermId === "all") return courses;
    return courses.filter((c) => c.termId === selectedTermId);
  }, [courses, selectedTermId]);

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <span className="font-semibold uppercase tracking-wider text-[var(--color-accent)]">
              Academic Registry
            </span>
            <span>•</span>
            <span>{currentTerm?.name || "Active Term"}</span>
          </div>
          <h1 className="mt-1 font-serif text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-ink)]">
            Enrolled Academic Courses
          </h1>
          <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">
            Credit-bearing course registrations, video lecture modules, and verified syllabus progress
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

      {/* Filter Tabs by Term */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-[8px] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-xs">
          <button
            onClick={() => setSelectedTermId("all")}
            className={`px-3 py-1 rounded-[6px] font-semibold transition-all ${
              selectedTermId === "all"
                ? "bg-[var(--color-surface)] text-[var(--color-accent)] shadow-sm"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            All Courses ({courses.length})
          </button>
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

        <span className="text-xs text-[var(--color-ink-muted)] font-mono tabular-nums">
          Showing {filteredCourses.length} of {courses.length} Courses
        </span>
      </div>

      {/* Course Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 p-12 text-center">
          <BookOpen className="h-8 w-8 text-[var(--color-ink-muted)] mx-auto mb-2" />
          <h3 className="font-serif text-base font-semibold text-[var(--color-ink)]">
            No Courses Enrolled
          </h3>
          <p className="text-xs text-[var(--color-ink-muted)] mt-1 max-w-sm mx-auto">
            Create your first academic course or load the Year 1 syllabus to begin.
          </p>
          <div className="mt-4">
            <Button size="sm" onClick={() => setCreateCourseOpen(true)}>
              Create First Course
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progressList={progressList.filter((p) => p.courseId === course.id)}
              assessments={assessments.filter((a) => a.courseId === course.id)}
              modules={modules.filter((m) => m.courseId === course.id)}
              topics={topics.filter((t) => t.courseId === course.id)}
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
    <React.Suspense fallback={<div className="p-8 text-xs text-[var(--color-ink-muted)]">Loading courses...</div>}>
      <CoursesContent />
    </React.Suspense>
  );
}
