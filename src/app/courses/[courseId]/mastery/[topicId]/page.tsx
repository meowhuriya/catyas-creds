"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDataStore } from "@/lib/repository";
import { Course, Topic, Module } from "@/types/schemas";
import { TopicMasteryLoop } from "@/components/mastery/TopicMasteryLoop";
import { ChevronRight, ArrowLeft } from "lucide-react";

export default function MasteryTopicPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const topicId = params.topicId as string;

  const { dataStore } = useDataStore();
  const [course, setCourse] = React.useState<Course | null>(null);
  const [topic, setTopic] = React.useState<Topic | null>(null);
  const [unit, setUnit] = React.useState<Module | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const c = await dataStore.getCourse(courseId);
        setCourse(c);

        if (c) {
          const allTopics = await dataStore.getAllTopics(c.id);
          const foundTopic = allTopics.find(
            (t) =>
              t.id.toLowerCase() === topicId.toLowerCase() ||
              t.id.toLowerCase().replace(/[^a-z0-9]/g, "") ===
                topicId.toLowerCase().replace(/[^a-z0-9]/g, "")
          );
          setTopic(foundTopic || null);

          if (foundTopic) {
            const modules = await dataStore.getModules(c.id);
            const foundUnit = modules.find((m) => m.id === foundTopic.unitId);
            setUnit(foundUnit);
          }
        }
      } catch (err) {
        console.error("Failed to load topic mastery context:", err);
      } finally {
        setLoading(false);
      }
    }

    if (courseId && topicId) {
      loadData();
    }
  }, [courseId, topicId, dataStore]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-xs text-[#4B5160] dark:text-[#CFC8BB]">
        Preparing Khan Mastery Exercise Environment...
      </div>
    );
  }

  if (!course || !topic) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-serif font-bold text-[#8A1627]">Topic Not Found</h2>
        <p className="text-xs text-[#4B5160] dark:text-[#CFC8BB]">
          The requested syllabus topic could not be resolved.
        </p>
        <button
          onClick={() => router.push(`/courses/${courseId}`)}
          className="btn-primary text-xs px-5 py-2"
        >
          Return to Course
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 py-2">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#4B5160] dark:text-[#CFC8BB] flex-wrap">
        <Link href="/courses" className="hover:text-[#8A1627] hover:underline">
          Courses
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/courses/${course.id}`} className="hover:text-[#8A1627] hover:underline">
          {course.code}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-[#14161F] dark:text-[#F6EBD3]">
          Mastery Check
        </span>
      </div>

      <TopicMasteryLoop
        topic={topic}
        course={course}
        unit={unit}
        onClose={() => router.push(`/courses/${course.id}`)}
        onMasteryUpdated={(updated) => setTopic(updated)}
      />
    </div>
  );
}
