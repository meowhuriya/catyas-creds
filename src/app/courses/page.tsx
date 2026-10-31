"use client";

import * as React from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/repository";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/dashboard/course-card";
import { Plus, BookOpen } from "lucide-react";
import { LessonProgress, Assessment } from "@/types/schemas";

export default function CoursesPage() {
  const { courses, dataStore } = useDataStore();
  const [progressList, setProgressList] = React.useState<LessonProgress[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);

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
      <div className="flex items-center justify-between border-b border-app-border pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-app-ink">
            Academic Courses
          </h1>
          <p className="text-xs text-app-ink-muted mt-0.5">
            Credit-bearing course enrollments organized by term and department
          </p>
        </div>

        <Button size="sm" asChild className="gap-1.5 text-xs">
          <Link href="/courses?action=new-course">
            <Plus className="h-3.5 w-3.5" />
            <span>Create Course</span>
          </Link>
        </Button>
      </div>

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
    </div>
  );
}
