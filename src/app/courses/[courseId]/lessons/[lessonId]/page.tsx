"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

export default function LegacyLessonRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lessonId = params.lessonId as string;

  React.useEffect(() => {
    if (courseId && lessonId) {
      router.replace(`/courses/${courseId}/player/${lessonId}`);
    }
  }, [courseId, lessonId, router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8 text-xs text-[var(--color-ink-muted)]">
      Loading verified lecture player...
    </div>
  );
}
