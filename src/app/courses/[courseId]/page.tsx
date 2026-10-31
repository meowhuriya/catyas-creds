"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDataStore } from "@/lib/repository";
import {
  Course,
  Module,
  Lesson,
  LessonProgress,
  Assessment,
  Note,
} from "@/types/schemas";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { SortableLessonItem } from "@/components/courses/sortable-lesson-item";
import { AddLessonsDialog } from "@/components/courses/add-lessons-dialog";
import { GroupModulesDialog } from "@/components/courses/group-modules-dialog";
import { TOKENS, CourseTagKey } from "@/styles/tokens";
import { formatSecondsToTime } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Plus,
  Layers,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Trash2,
  Printer,
  Sparkles,
} from "lucide-react";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const { dataStore, currentUser } = useDataStore();

  const [course, setCourse] = React.useState<Course | null>(null);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [progressList, setProgressList] = React.useState<LessonProgress[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Dialog states
  const [addLessonsOpen, setAddLessonsOpen] = React.useState(false);
  const [groupModulesOpen, setGroupModulesOpen] = React.useState(false);

  // Bulk selection state
  const [selectedLessonIds, setSelectedLessonIds] = React.useState<Set<string>>(
    new Set()
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [c, m, l, p, a, n] = await Promise.all([
        dataStore.getCourse(courseId),
        dataStore.getModules(courseId),
        dataStore.getLessons(courseId),
        dataStore.getAllLessonProgress(courseId),
        dataStore.getAssessments(courseId),
        dataStore.getAllNotes(courseId),
      ]);

      setCourse(c);
      setModules(m);
      setLessons(l);
      setProgressList(p);
      setAssessments(a);
      setNotes(n);
    } catch (err) {
      console.error("Failed to load course details:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId, dataStore]);

  React.useEffect(() => {
    if (courseId) {
      loadData();
    }
  }, [courseId, loadData]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-xs text-app-ink-muted">
        Loading course syllabus and lecture modules...
      </div>
    );
  }

  if (!course) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Course Not Found"
        description="The requested course registration does not exist or has been removed."
        actionLabel="Return to Courses"
        onAction={() => router.push("/courses")}
      />
    );
  }

  const tagColor =
    TOKENS.colors.courseTags[course.colorTag as CourseTagKey]?.hex ||
    TOKENS.colors.courseTags.slate.hex;

  // Calculate metrics
  const totalLessons = lessons.length;
  const completedLessons = progressList.filter((p) => p.isCompleted).length;
  const percentComplete =
    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  // Calculate known watch time duration
  const totalDurationSeconds = lessons.reduce((acc, l) => {
    const prog = progressList.find((p) => p.lessonId === l.id);
    return acc + (prog?.totalDurationSeconds || l.durationSeconds || 0);
  }, 0);
  const totalKnownHours = (totalDurationSeconds / 3600).toFixed(1);
  const hoursPerCredit = currentUser?.settings?.defaultHoursPerCredit || 15;
  const suggestedCredits = Math.max(
    0.5,
    Math.round((totalDurationSeconds / 3600 / hoursPerCredit) * 2) / 2
  );

  // Drag-and-drop reordering handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lessons.findIndex((l) => l.id === active.id);
    const newIndex = lessons.findIndex((l) => l.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const targetLesson = lessons[newIndex];
      const reordered = arrayMove(lessons, oldIndex, newIndex);
      setLessons(reordered);

      const updates = reordered.map((item, idx) => ({
        id: item.id,
        order: idx,
        moduleId: targetLesson.moduleId,
      }));

      await dataStore.updateLessonOrder(updates);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (confirm("Are you sure you want to delete this lecture video from the course?")) {
      await dataStore.deleteLesson(lessonId);
      await loadData();
    }
  };

  const handleToggleSelectLesson = (lessonId: string) => {
    setSelectedLessonIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (
      confirm(
        `Are you sure you want to delete ${selectedLessonIds.size} selected lessons?`
      )
    ) {
      for (const id of Array.from(selectedLessonIds)) {
        await dataStore.deleteLesson(id);
      }
      setSelectedLessonIds(new Set());
      await loadData();
    }
  };

  const handleCreateModule = async () => {
    const title = prompt("Enter new module title (e.g. Module 3: Advanced Topics):");
    if (title && title.trim()) {
      await dataStore.createModule({
        courseId,
        title: title.trim(),
        order: modules.length,
        isCollapsed: false,
      });
      await loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* 4px Thin Course Color Tag Bar (Strictly 4px, not a big block) */}
      <div
        className="h-1 w-full rounded-full"
        style={{ backgroundColor: tagColor }}
      />

      {/* Course Hero Banner */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-app-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-app-ink-muted">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: tagColor }}
            />
            <span className="font-mono uppercase font-bold text-app-accent">
              {course.code}
            </span>
            <span>•</span>
            <span className="uppercase tracking-wider font-semibold">
              {course.department}
            </span>
            <span>•</span>
            <span className="font-mono">Level {course.level}</span>
          </div>

          <h1 className="mt-1.5 font-serif text-2xl md:text-3xl font-bold tracking-tight text-app-ink">
            {course.title}
          </h1>

          <p className="mt-2 text-xs text-app-ink-muted max-w-2xl leading-relaxed">
            {course.description || "No course description provided."}
          </p>

          {/* Credit suggestion indicator */}
          <div className="mt-3 flex items-center gap-2 text-xs text-app-ink-muted">
            <span className="font-mono font-semibold text-app-ink tabular-nums">
              {course.credits} Credits Assigned
            </span>
            <span>•</span>
            <span className="tabular-nums">
              Total Watch Time: {totalKnownHours} hrs
            </span>
            {suggestedCredits !== course.credits && (
              <span className="rounded bg-app-surface-muted px-1.5 py-0.5 text-[11px] text-app-info font-medium">
                Watch time suggestion: {suggestedCredits} cr (at {hoursPerCredit}h/cr)
              </span>
            )}
          </div>
        </div>

        {/* Top Right Action & Progress Ring */}
        <div className="flex items-center gap-4 shrink-0">
          <ProgressRing
            percentage={percentComplete}
            size={56}
            strokeWidth={4.5}
            color={tagColor}
          />

          <div className="flex flex-col gap-1.5">
            <Button
              size="sm"
              onClick={() => setAddLessonsOpen(true)}
              className="gap-1.5 text-xs shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Lessons</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Course Navigation Tabs */}
      <Tabs defaultValue="classwork" className="w-full">
        <TabsList>
          <TabsTrigger value="classwork">Classwork & Modules</TabsTrigger>
          <TabsTrigger value="stream">Stream</TabsTrigger>
          <TabsTrigger value="grades">Gradebook</TabsTrigger>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
        </TabsList>

        {/* Tab 1: Classwork */}
        <TabsContent value="classwork" className="space-y-6 pt-2">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-app-border bg-app-surface p-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateModule}
                className="gap-1 text-xs"
              >
                <Plus className="h-3 w-3" />
                <span>New Module</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setGroupModulesOpen(true)}
                className="gap-1 text-xs"
              >
                <Layers className="h-3 w-3" />
                <span>Group every N lessons</span>
              </Button>
            </div>

            {selectedLessonIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-app-ink-muted tabular-nums">
                  {selectedLessonIds.size} selected
                </span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="gap-1 text-xs"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete Selected</span>
                </Button>
              </div>
            )}
          </div>

          {/* Module List & Lessons */}
          {lessons.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Lessons Added Yet"
              description="Paste YouTube video links to import lecture videos and track completed coursework."
              actionLabel="Add Lessons by Link"
              onAction={() => setAddLessonsOpen(true)}
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-6">
                {modules.map((mod) => {
                  const modLessons = lessons.filter((l) => l.moduleId === mod.id);

                  return (
                    <div
                      key={mod.id}
                      className="rounded-card border border-app-border bg-app-surface overflow-hidden shadow-sm"
                    >
                      {/* Module Header */}
                      <div className="flex items-center justify-between border-b border-app-border bg-app-surface-muted/50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-base font-bold text-app-ink">
                            {mod.title}
                          </h3>
                          <span className="rounded-full bg-app-surface px-2 py-0.5 text-xs text-app-ink-muted font-mono tabular-nums border border-app-border/60">
                            {modLessons.length} lessons
                          </span>
                        </div>
                      </div>

                      {/* Module Lesson Items */}
                      <div className="p-3">
                        {modLessons.length === 0 ? (
                          <div className="py-6 text-center text-xs text-app-ink-muted">
                            Drag lessons here or add new videos to this module.
                          </div>
                        ) : (
                          <SortableContext
                            items={modLessons.map((l) => l.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-2">
                              {modLessons.map((lesson) => {
                                const prog = progressList.find(
                                  (p) => p.lessonId === lesson.id
                                );
                                return (
                                  <SortableLessonItem
                                    key={lesson.id}
                                    lesson={lesson}
                                    progress={prog}
                                    courseId={course.id}
                                    onDelete={handleDeleteLesson}
                                    selected={selectedLessonIds.has(lesson.id)}
                                    onToggleSelect={handleToggleSelectLesson}
                                  />
                                );
                              })}
                            </div>
                          </SortableContext>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </DndContext>
          )}
        </TabsContent>

        {/* Tab 2: Stream */}
        <TabsContent value="stream" className="space-y-4 pt-2">
          <div className="rounded-card border border-app-border bg-app-surface p-5">
            <h3 className="font-serif text-base font-bold text-app-ink mb-1">
              Course Stream & Milestone Announcements
            </h3>
            <p className="text-xs text-app-ink-muted mb-4">
              Real-time feed of syllabus progress, lecture completions, and upcoming submissions.
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-control border border-app-border bg-app-surface-muted/30 p-3 text-xs">
                <CheckCircle2 className="h-4 w-4 text-app-success mt-0.5" />
                <div>
                  <span className="font-semibold text-app-ink block">
                    {course.code} Syllabus Initialized
                  </span>
                  <span className="text-app-ink-muted text-[11px]">
                    Enrolled {course.credits} credit units with {lessons.length} video lectures.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Grades Preview */}
        <TabsContent value="grades" className="space-y-4 pt-2">
          <div className="rounded-card border border-app-border bg-app-surface p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-app-ink">
                  Grading Criteria & Weight Scheme
                </h3>
                <p className="text-xs text-app-ink-muted">
                  Category weights total 100%. Within each category, scores are calculated proportionally.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-app-ink">
                Pass Mark: {course.passMark}%
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(course.gradingScheme).map(([cat, weight]) => (
                <div
                  key={cat}
                  className="rounded-control border border-app-border bg-app-surface-muted/50 p-3 text-center"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-app-ink-muted block truncate">
                    {cat.replace(/([A-Z])/g, " $1")}
                  </span>
                  <span className="font-serif text-xl font-bold text-app-ink tabular-nums mt-1 block">
                    {weight}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Printable Syllabus */}
        <TabsContent value="syllabus" className="space-y-4 pt-2">
          <div className="rounded-card border border-app-border bg-white text-neutral-900 p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-300 pb-3 mb-6 no-print">
              <span className="font-serif text-sm font-semibold uppercase tracking-wider text-neutral-700">
                Official Syllabus Document
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 text-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Syllabus</span>
              </Button>
            </div>

            <div className="border-b-2 border-app-accent pb-3 mb-6 text-center">
              <h2 className="font-serif text-2xl font-bold uppercase tracking-wider text-neutral-900">
                {course.code}: {course.title}
              </h2>
              <p className="font-serif text-xs text-app-accent font-semibold mt-1">
                Department of {course.department} • {course.credits} Semester Credits
              </p>
            </div>

            <div className="space-y-6 text-xs text-neutral-800">
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-neutral-900 mb-1">
                  1. Course Overview & Description
                </h4>
                <p className="leading-relaxed">
                  {course.description || "Comprehensive university-grade course modules."}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-neutral-900 mb-2">
                  2. Lecture Schedule & Modules
                </h4>
                <div className="divide-y divide-neutral-200 border-t border-b border-neutral-200">
                  {lessons.map((l, i) => (
                    <div key={l.id} className="py-2 flex justify-between">
                      <span>
                        Lecture {i + 1}: {l.title}
                      </span>
                      <span className="text-neutral-500">{l.channelTitle}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 5: Course Notes */}
        <TabsContent value="notes" className="space-y-4 pt-2">
          {notes.length === 0 ? (
            <div className="py-12 text-center text-xs text-app-ink-muted">
              No notes taken for this course yet. Open any lecture video to create timestamped notes.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map((note) => {
                const lesson = lessons.find((l) => l.id === note.lessonId);
                return (
                  <div
                    key={note.id}
                    className="rounded-card border border-app-border bg-app-surface p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-app-ink truncate">
                        {lesson?.title || "Lesson Note"}
                      </span>
                      {lesson && (
                        <Link
                          href={`/courses/${courseId}/lessons/${lesson.id}`}
                          className="text-app-accent hover:underline font-medium"
                        >
                          Open Lecture →
                        </Link>
                      )}
                    </div>
                    <p className="text-xs text-app-ink-muted whitespace-pre-wrap line-clamp-4 font-mono bg-app-surface-muted/40 p-2 rounded">
                      {note.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Lessons Dialog */}
      <AddLessonsDialog
        courseId={course.id}
        modules={modules}
        existingLessons={lessons}
        open={addLessonsOpen}
        onOpenChange={setAddLessonsOpen}
        onSuccess={loadData}
      />

      {/* Group Modules Dialog */}
      <GroupModulesDialog
        courseId={course.id}
        lessons={lessons}
        open={groupModulesOpen}
        onOpenChange={setGroupModulesOpen}
        onSuccess={loadData}
      />
    </div>
  );
}
