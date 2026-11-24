"use client";

import { useParams } from "next/navigation";
import { CourseLearnView } from "@/components/courses/course-learn-view";

export default function CourseDetailPage() {
  const params = useParams();
  return <CourseLearnView courseId={params.courseId as string} />;
}
