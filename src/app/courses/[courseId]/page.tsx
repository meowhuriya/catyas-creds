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
  Attempt,
  Submission,
  Note,
  Topic,
  CourseAttendance,
  ExamDate,
  RecallStyle,
} from "@/types/schemas";
import {
  calculateExamReadinessForecast,
  getDefaultRecallStyle,
} from "@/lib/recall/recall-engine";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusChip } from "@/components/ui/status-chip";
import { SortableLessonItem } from "@/components/courses/sortable-lesson-item";
import { AddLessonsDialog } from "@/components/courses/add-lessons-dialog";
import { GroupModulesDialog } from "@/components/courses/group-modules-dialog";
import { GradingSchemeModal } from "@/components/courses/grading-scheme-modal";
import { CreateAssessmentModal } from "@/components/assessments/create-assessment-modal";
import { QuizRunnerModal } from "@/components/assessments/quiz-runner-modal";
import { AssignmentSubmissionModal } from "@/components/assessments/assignment-submission-modal";
import { AiQuizDraftModal } from "@/components/assessments/ai-quiz-draft-modal";
import { WhatIfCalculator } from "@/components/grades/what-if-calculator";
import { calculateCourseGrades } from "@/lib/grading/grading-engine";
import { TOKENS, CourseTagKey } from "@/styles/tokens";
import { formatSecondsToTime, cleanSyllabusTitle, getYoutubeSearchUrl } from "@/lib/utils";
import { AlgorithmicCover } from "@/components/dashboard/algorithmic-cover";
import { UnitJourney } from "@/components/courses/unit-journey";
import { TopicChecklist } from "@/components/courses/topic-checklist";
import { UnitVideoGallery } from "@/components/courses/unit-video-gallery";
import { ResetSyllabusDialog } from "@/components/courses/reset-syllabus-dialog";
import { TidyTopicsDialog } from "@/components/courses/tidy-topics-dialog";
import { QuickCheckModal } from "@/components/courses/quick-check-modal";
import { TopicMasteryLoop } from "@/components/mastery/TopicMasteryLoop";
import { TopicAiChatModal } from "@/components/topics/topic-ai-chat-modal";
import { MilestoneBanner } from "@/components/ui/milestone-banner";
import { calculateUnitMastery, calculateCourseMastery } from "@/lib/mastery/mastery-engine";
import { AttendanceTracker } from "@/components/courses/attendance-tracker";
import { ExamPrepMode } from "@/components/courses/exam-prep-mode";
import { calculateAttendanceStats, AttendanceStats } from "@/lib/attendance/attendance-engine";
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
  Lock,
  Sliders,
  FileCheck,
  ClipboardList,
  RotateCcw,
  AlertTriangle,
  UserCheck,
  Brain,
  Search,
} from "lucide-react";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const { dataStore, currentUser } = useDataStore();

  const [activeTab, setActiveTab] = React.useState("units");
  const [course, setCourse] = React.useState<Course | null>(null);
  const [modules, setModules] = React.useState<Module[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [lessons, setLessons] = React.useState<Lesson[]>([]);
  const [progressList, setProgressList] = React.useState<LessonProgress[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [attempts, setAttempts] = React.useState<Attempt[]>([]);
  const [submissions, setSubmissions] = React.useState<Submission[]>([]);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [attendanceRecord, setAttendanceRecord] = React.useState<CourseAttendance | null>(null);
  const [courseExamDate, setCourseExamDate] = React.useState<ExamDate | null>(null);
  const [attStats, setAttStats] = React.useState<AttendanceStats>(calculateAttendanceStats(0, 0, 75));
  const [activeUnitId, setActiveUnitId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Dialog states
  const [addLessonsOpen, setAddLessonsOpen] = React.useState(false);
  const [groupModulesOpen, setGroupModulesOpen] = React.useState(false);
  const [gradingSchemeOpen, setGradingSchemeOpen] = React.useState(false);
  const [createAssessmentOpen, setCreateAssessmentOpen] = React.useState(false);
  const [resetSyllabusOpen, setResetSyllabusOpen] = React.useState(false);
  const [tidyTopicsOpen, setTidyTopicsOpen] = React.useState(false);
  const [quickCheckTopic, setQuickCheckTopic] = React.useState<Topic | null>(null);
  const [masteryLoopTopic, setMasteryLoopTopic] = React.useState<Topic | null>(null);
  const [aiChatTopic, setAiChatTopic] = React.useState<Topic | null>(null);
  const [activeQuizAssessment, setActiveQuizAssessment] = React.useState<Assessment | null>(null);
  const [activeAssignmentAssessment, setActiveAssignmentAssessment] = React.useState<Assessment | null>(null);
  const [aiQuizDraftOpen, setAiQuizDraftOpen] = React.useState(false);

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
      if (!course) {
        setLoading(true);
      }

      // 1. Fetch Course with resilient multi-key fallback
      let c = await dataStore.getCourse(courseId).catch((err) => {
        console.warn("getCourse error:", err);
        return null;
      });

      if (!c) {
        try {
          const all = await dataStore.getCourses();
          const idLower = (courseId || "").toLowerCase();
          const cleanCode = idLower.replace(/^course-/, "");
          c =
            all.find(
              (item) =>
                item.id.toLowerCase() === idLower ||
                item.id.toLowerCase() === `course-${cleanCode}` ||
                item.code.toLowerCase() === cleanCode
            ) || null;
        } catch (err) {
          console.warn("getCourses fallback error:", err);
        }
      }

      if (c) {
        setCourse(c);
      }

      const targetCourseId = c?.id || courseId;

      // 2. Fetch Modules (Units) & Topics safely
      const [m, top] = await Promise.all([
        dataStore.getModules(targetCourseId).catch(() => []),
        dataStore.getAllTopics(targetCourseId).catch(() => []),
      ]);

      setModules(m || []);
      setTopics(top || []);

      if (m && m.length > 0 && !activeUnitId) {
        setActiveUnitId(m[0].id);
      }

      // 3. Fetch auxiliary resources independently without blocking view
      const [l, p, a, n, att, exm] = await Promise.all([
        dataStore.getLessons(targetCourseId).catch(() => []),
        dataStore.getAllLessonProgress(targetCourseId).catch(() => []),
        dataStore.getAssessments(targetCourseId).catch(() => []),
        dataStore.getAllNotes(targetCourseId).catch(() => []),
        dataStore.getCourseAttendance(targetCourseId).catch(() => null),
        dataStore.getCourseExamDate(targetCourseId).catch(() => null),
      ]);

      setLessons(l || []);
      setProgressList(p || []);
      setAssessments(a || []);
      setNotes(n || []);

      if (att) {
        setAttendanceRecord(att);
        setAttStats(
          calculateAttendanceStats(
            att.classesHeld || 0,
            att.classesAttended || 0,
            att.minimumPercentage || 75
          )
        );
      } else {
        setAttStats(calculateAttendanceStats(0, 0, 75));
      }

      setCourseExamDate(exm || null);

      // 4. Load attempts & submissions for assessments safely
      if (a && a.length > 0) {
        try {
          const [allAttempts, allSubmissions] = await Promise.all([
            Promise.all(a.map((asm) => dataStore.getAttempts(asm.id).catch(() => []))).then(
              (res) => res.flat()
            ),
            Promise.all(
              a.map((asm) => dataStore.getSubmission(asm.id).catch(() => null))
            ).then((res) => res.filter(Boolean) as Submission[]),
          ]);

          setAttempts(allAttempts);
          setSubmissions(allSubmissions);
        } catch (err) {
          console.warn("Error loading assessment attempts/submissions:", err);
        }
      }
    } catch (err) {
      console.error("Failed to load course details:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId, dataStore, activeUnitId]);

  React.useEffect(() => {
    if (courseId) {
      loadData();
    }
  }, [courseId, loadData]);

  const readinessForecast = React.useMemo(() => {
    if (!courseExamDate?.date) return null;
    const recalledCount = topics.filter((t) => (t.recallStage || 0) >= 1).length;
    return calculateExamReadinessForecast({
      totalTopics: topics.length,
      topicsRecalled: recalledCount,
      examDate: courseExamDate.date,
    });
  }, [topics, courseExamDate]);

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

  // Calculate Course Topic Mastery score (0–100) & topic completion
  const unitScores = modules.map((m) => {
    const unitTopics = topics.filter((t) => t.unitId === m.id);
    return calculateUnitMastery(unitTopics, m.electiveExperimentsCount || course.electiveExperimentsCount).score;
  });
  const courseMasteryScore = calculateCourseMastery(unitScores).courseScore;

  const totalTopicsCount = topics.length;
  const completedTopicsCount = topics.filter((t) => t.isDone).length;
  const topicCompletionPercent =
    totalTopicsCount > 0 ? (completedTopicsCount / totalTopicsCount) * 100 : 0;

  const gpaScale = currentUser?.settings?.gradeScale || "10_point";
  const gradeResult = calculateCourseGrades(
    course,
    courseMasteryScore,
    assessments,
    attempts,
    submissions,
    gpaScale
  );

  const currentRecallStyle: RecallStyle = course.recallStyle || getDefaultRecallStyle(course);

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

  const handleUpdateTopic = async (topicId: string, updates: Partial<Topic>) => {
    await dataStore.updateTopic(topicId, updates);
    await loadData();
  };

  const handleCreateTopic = async (title: string) => {
    const currentUnitId = activeUnitId || (modules[0] ? modules[0].id : "");
    const unitTopics = topics.filter((t) => t.unitId === currentUnitId);
    await dataStore.createTopic({
      courseId,
      unitId: currentUnitId,
      title,
      order: unitTopics.length,
      isDone: false,
      watchScore: 0,
      checkScore: 0,
      topicScore: 0,
      isStudiedManually: false,
      isExperiment: false,
      isSelectedExperiment: true,
    });
    await loadData();
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (confirm("Are you sure you want to delete this topic from the syllabus?")) {
      await dataStore.deleteTopic(topicId);
      await loadData();
    }
  };

  const handleSplitTopic = async (topicId: string, title1: string, title2: string) => {
    const t = topics.find((item) => item.id === topicId);
    if (!t) return;
    await dataStore.updateTopic(topicId, { title: title1 });
    await dataStore.createTopic({
      courseId: t.courseId,
      unitId: t.unitId,
      title: title2,
      order: t.order + 1,
      isDone: false,
      watchScore: 0,
      checkScore: 0,
      topicScore: 0,
      isStudiedManually: false,
      isExperiment: t.isExperiment,
      isSelectedExperiment: t.isSelectedExperiment,
    });
    await loadData();
  };

  const handleMergeTopics = async (primaryId: string, secondaryId: string, combinedTitle: string) => {
    const t1 = topics.find((item) => item.id === primaryId);
    const t2 = topics.find((item) => item.id === secondaryId);
    if (!t1 || !t2) return;
    const higherWatch = Math.max(t1.watchScore, t2.watchScore);
    const higherCheck = Math.max(t1.checkScore, t2.checkScore);
    const totalScore = higherWatch + higherCheck;
    await dataStore.updateTopic(primaryId, {
      title: combinedTitle,
      watchScore: higherWatch,
      checkScore: higherCheck,
      topicScore: totalScore,
      isDone: totalScore >= 70,
    });
    await dataStore.deleteTopic(secondaryId);
    await loadData();
  };

  const handleResetSyllabus = async () => {
    await dataStore.resetCourseToOriginalSyllabus(courseId);
    await loadData();
  };

  const handleApplyTidy = async (cleanedTopics: { id: string; title: string }[]) => {
    for (const item of cleanedTopics) {
      await dataStore.updateTopic(item.id, { title: item.title });
    }
    await loadData();
  };

  const activeUnit = modules.find((m) => m.id === activeUnitId) || modules[0];
  const activeUnitTopics = activeUnit
    ? topics.filter((t) => t.unitId === activeUnit.id).sort((a, b) => a.order - b.order)
    : [];

  const activeUnitMastery = calculateUnitMastery(
    activeUnitTopics,
    activeUnit?.electiveExperimentsCount || course.electiveExperimentsCount
  );

  return (
    <div className="space-y-6 select-none">
      {/* 160px Algorithmic Cover Banner */}
      <div className="rounded-[14px] overflow-hidden shadow-card border border-[var(--color-border)]">
        <AlgorithmicCover
          courseCode={course.code}
          courseTitle={course.title}
          department={course.department}
          colorTag={course.colorTag}
          height={160}
        />
      </div>

      {/* Course Hero Meta & Actions */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 p-5 rounded-[18px] bg-app-surface border border-app-border shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: tagColor }}
            />
            <span className="course-code text-[var(--color-crimson)]">
              {course.code}
            </span>
            <span>•</span>
            <span className="uppercase tracking-wider font-semibold">
              {course.department}
            </span>
            <span>•</span>
            <span className="font-sans font-semibold">Level {course.level}</span>
          </div>

          <h1 className="mt-1.5 font-serif text-2xl md:text-3xl font-bold tracking-tight text-[var(--color-ink)]">
            {course.title}
          </h1>

          <p className="mt-2 text-xs text-[var(--color-ink-muted)] max-w-2xl leading-relaxed">
            {course.description || "Foundational academic curriculum in engineering."}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <span className="font-sans font-semibold text-[var(--color-ink)] tabular-nums">
              {course.credits} Credits Assigned
            </span>
            <span>•</span>
            <span className="tabular-nums">
              Total Watch Time: {totalKnownHours} hrs
            </span>
            {suggestedCredits !== course.credits && (
              <span className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-[11px] text-[#1C5C62] dark:text-[#52ADB5] font-semibold">
                Watch time suggestion: {suggestedCredits} cr (at {hoursPerCredit}h/cr)
              </span>
            )}
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveTab("attendance")}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border text-[11px] font-sans font-semibold transition-colors cursor-pointer ${
                attStats.isBelowLimit
                  ? "bg-[#C62F3C]/10 text-[#C62F3C] border-[#C62F3C]/30 hover:bg-[#C62F3C]/20"
                  : "bg-[var(--color-surface-muted)] text-[var(--color-ink)] border-[var(--color-border)] hover:bg-[var(--color-surface)]"
              }`}
              title="Click to view and manage attendance records"
            >
              {attStats.isBelowLimit ? (
                <>
                  <AlertTriangle className="h-3 w-3 text-[#C62F3C]" />
                  <span>{attStats.currentPercentage}% Att. (Below {attStats.minimumPercentage}% limit)</span>
                </>
              ) : (
                <>
                  <UserCheck className="h-3 w-3 text-[#5E7B5B]" />
                  <span>
                    {attendanceRecord && attendanceRecord.classesHeld > 0
                      ? `${attStats.currentPercentage}% Att. (${attStats.statusSentence})`
                      : `Attendance: ${attStats.minimumPercentage}% Target`}
                  </span>
                </>
              )}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveTab("exam-prep")}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] border text-[11px] font-sans font-semibold transition-colors cursor-pointer bg-[var(--color-surface-muted)] text-[var(--color-ink)] border-[var(--color-border)] hover:bg-[var(--color-surface)]"
              title="Click to view and manage exam preparation targets"
            >
              <Calendar className="h-3 w-3 text-[#A51C30]" />
              <span>
                {courseExamDate
                  ? `Exam: ${courseExamDate.date} (${courseExamDate.examTitle})`
                  : "Exam Prep: Set Date"}
              </span>
            </button>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetSyllabusOpen(true)}
            className="gap-1.5 text-xs text-[#7A4F0E] dark:text-[#F0B533] border-[#7A4F0E]/30 dark:border-[#F0B533]/30 hover:bg-[#7A4F0E]/10"
            title="Reset this course to the original syllabus definition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Syllabus</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setTidyTopicsOpen(true)}
            className="gap-1.5 text-xs text-[var(--color-accent)] border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/10"
            title="Clean raw syllabus topics with AI"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tidy Topics</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setGradingSchemeOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Grading Scheme</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setAddLessonsOpen(true)}
            className="gap-1.5 text-xs shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Videos</span>
          </Button>
        </div>
      </div>

      {/* Unit Journey Visual Roadmap */}
      {modules.length > 0 && (
        <UnitJourney
          units={modules}
          topics={topics}
          activeUnitId={activeUnit?.id}
          onSelectUnit={(uId) => setActiveUnitId(uId)}
        />
      )}

      {/* Milestone Banner when active unit is mastered */}
      {activeUnitMastery.isCompleted && (
        <MilestoneBanner
          type="unit"
          title={`${activeUnit?.title || "Unit"} Mastered!`}
          subtitle={`All ${activeUnitMastery.completedTopics} of ${activeUnitMastery.totalTopics} curricular topics are completed with verified watch progress and check mastery.`}
        />
      )}

      {/* Exam Readiness Forecast & Recall Style Card (Phase S1) */}
      <div className="rounded-[16px] border border-app-border bg-app-surface p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[#A51C30]" />
            <h3 className="font-serif text-sm font-bold text-[#14161F] dark:text-[#F6EBD3]">
              Exam Readiness Forecast & Recall Style
            </h3>
            {courseExamDate && readinessForecast && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  readinessForecast.isBehind
                    ? "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                }`}
              >
                {readinessForecast.forecastPercent}% Forecasted
              </span>
            )}
          </div>

          {/* Recall Style Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#4B5160] dark:text-[#CFC8BB]">Recall Style:</span>
            <select
              value={currentRecallStyle}
              onChange={async (e) => {
                const newStyle = e.target.value as RecallStyle;
                await dataStore.updateCourseRecallStyle(course.id, newStyle);
                await loadData();
              }}
              className="px-2.5 py-1 rounded-[6px] border border-[#E4D9C0] dark:border-[#3D2D31] bg-white dark:bg-[#150F11] text-xs font-semibold text-[#14161F] dark:text-[#F6EBD3] focus:outline-none cursor-pointer"
            >
              <option value="problems">Problems (Math / Analytical)</option>
              <option value="questions">Questions (Science / Concepts)</option>
              <option value="code">Code (CS / Memory)</option>
              <option value="vocabulary_and_usage">Vocabulary & Usage (English)</option>
            </select>
          </div>
        </div>

        {/* Readiness forecast sentence or set exam prompt */}
        {courseExamDate && readinessForecast ? (
          <div className="space-y-2 pt-1 text-xs">
            <p className="font-medium text-[#14161F] dark:text-[#F6EBD3]">
              {readinessForecast.statusSentence}
            </p>
            {readinessForecast.warningNote && (
              <div className="p-2.5 rounded-[8px] bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-medium">
                {readinessForecast.warningNote}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#4B5160] dark:text-[#CFC8BB]">
              <span>
                Exam target: <strong className="text-[#14161F] dark:text-[#F6EBD3]">{courseExamDate.date}</strong>
              </span>
              <span>•</span>
              <span>
                Refresh cutoff: <strong className="text-[#14161F] dark:text-[#F6EBD3]">{readinessForecast.daysToRefreshCutoff} days</strong>
              </span>
              <span>•</span>
              <span>
                Unreviewed syllabus topics: <strong className="text-[#14161F] dark:text-[#F6EBD3]">{readinessForecast.unreviewedTopics}</strong>
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4B5160] dark:text-[#CFC8BB] pt-1">
            <span>Set an exam date to unlock pre-exam recall compression and readiness forecasting.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("exam-prep")}
              className="btn-secondary text-xs h-7 px-2.5"
            >
              Set Exam Target
            </Button>
          </div>
        )}
      </div>

      {/* Course Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="units">Units & Topics</TabsTrigger>
          <TabsTrigger value="exam-prep" className="gap-1.5">
            <span>Exam Prep</span>
            {courseExamDate && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#A51C30]" />
            )}
          </TabsTrigger>
          <TabsTrigger value="classwork">Classwork & Modules</TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1.5">
            <span>Attendance</span>
            {attStats.isBelowLimit && (
              <span className="h-2 w-2 rounded-full bg-[#C62F3C] animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="grades">Gradebook</TabsTrigger>
          <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
        </TabsList>

        {/* Tab 0: Units & Topics (Primary split view) */}
        <TabsContent value="units" className="space-y-6 pt-2">
          {modules.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No Units in Course"
              description="This course does not have any units or modules configured."
              actionLabel="Reset to Official Syllabus"
              onAction={handleResetSyllabus}
            />
          ) : (
            <div className="space-y-6">
              {/* Unit Header: Eyebrow, Title, Small ring, Thin full-width progress bar */}
              {activeUnit && (
                <div className="academic-card p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="eyebrow-label text-[#8A1627] block mb-1">
                        {course.code} · UNIT {activeUnit.unitNumber || 1}
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#14161F] dark:text-[#F6EBD3]">
                        {cleanSyllabusTitle(activeUnit.title)}
                      </h2>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <a
                        href={getYoutubeSearchUrl(course.title, cleanSyllabusTitle(activeUnit.title))}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1.5 shrink-0"
                        title={`Search YouTube for ${course.title} ${cleanSyllabusTitle(activeUnit.title)}`}
                      >
                        <Search className="h-3.5 w-3.5 text-[#8A1627]" />
                        <span>Find videos</span>
                      </a>

                      <ProgressRing
                        percentage={
                          activeUnitTopics.length > 0
                            ? Math.round(
                                (activeUnitTopics.filter((t) => t.isDone).length /
                                  activeUnitTopics.length) *
                                  100
                              )
                            : 0
                        }
                        size={36}
                        strokeWidth={3.5}
                        color="#A51C30"
                        showText={false}
                      />
                      <span className="text-sm font-semibold text-[#14161F] dark:text-[#F6EBD3] tabular-nums">
                        {activeUnitTopics.filter((t) => t.isDone).length}/{activeUnitTopics.length} topics done
                      </span>
                    </div>
                  </div>

                  {/* Thin full-width progress bar */}
                  <div className="h-1 w-full bg-[#E5D5C5]/50 rounded-full overflow-hidden mt-4">
                    <div
                      className="h-full bg-[#A51C30] transition-all"
                      style={{
                        width: `${
                          activeUnitTopics.length > 0
                            ? (activeUnitTopics.filter((t) => t.isDone).length /
                                activeUnitTopics.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Layout columns: minmax(0, 1.5fr) and minmax(360px, 1fr), stack below 1100px */}
              <div className="grid grid-cols-1 min-[1100px]:grid-cols-[minmax(0,1.5fr)_minmax(360px,1fr)] gap-6 items-start">
                {/* Left Column: Topic Checklist */}
                <div>
                  <TopicChecklist
                    course={course}
                    unit={activeUnit || modules[0]}
                    topics={activeUnitTopics}
                    onUpdateTopic={handleUpdateTopic}
                    onCreateTopic={handleCreateTopic}
                    onDeleteTopic={handleDeleteTopic}
                    onSplitTopic={handleSplitTopic}
                    onMergeTopics={handleMergeTopics}
                    onStartQuickCheck={(topic) => setQuickCheckTopic(topic)}
                    onStartMasteryLoop={(topic) => setMasteryLoopTopic(topic)}
                    onOpenTopicAi={(topic) => setAiChatTopic(topic)}
                  />
                </div>

                {/* Right Column: Sticky Lecture Panel */}
                <div className="min-[1100px]:sticky min-[1100px]:top-20">
                  <UnitVideoGallery
                    course={course}
                    unit={activeUnit || modules[0]}
                    videos={lessons}
                    progressList={progressList}
                    topics={topics}
                    onOpenAddVideos={() => setAddLessonsOpen(true)}
                  />
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 1: Classwork */}
        <TabsContent value="classwork" className="space-y-6 pt-2">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-app-border bg-app-surface p-3">
            <div className="flex flex-wrap items-center gap-2">
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

              <div className="h-4 w-px bg-app-border mx-1" />

              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreateAssessmentOpen(true)}
                className="gap-1 text-xs"
              >
                <ClipboardList className="h-3 w-3" />
                <span>New Assessment</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiQuizDraftOpen(true)}
                className="gap-1 text-xs"
              >
                <Sparkles className="h-3 w-3" />
                <span>AI Quiz from Notes</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setGradingSchemeOpen(true)}
                className="gap-1 text-xs"
              >
                <Sliders className="h-3 w-3" />
                <span>Grading Scheme (100%)</span>
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

          {/* Graded Work & Assessments Section */}
          <div className="rounded-card border border-app-border bg-app-surface overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-app-border bg-app-surface-muted/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-app-accent" />
                <h3 className="font-serif text-base font-bold text-app-ink">
                  Graded Work & Assessments
                </h3>
                <span className="rounded-full bg-app-surface px-2 py-0.5 text-xs text-app-ink-muted font-sans tabular-nums border border-app-border/60">
                  {assessments.length} items
                </span>
              </div>
              <span className="text-xs text-app-ink-muted">
                Weighted across 5 syllabus categories
              </span>
            </div>

            <div className="p-4">
              {assessments.length === 0 ? (
                <div className="py-6 text-center text-xs text-app-ink-muted space-y-2">
                  <p>No assessments configured yet for {course.code}.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateAssessmentOpen(true)}
                    className="gap-1 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create First Assessment</span>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assessments.map((asm) => {
                    const isLocked = Boolean(
                      asm.lockedUntilLessonCompletionPercent &&
                        topicCompletionPercent < asm.lockedUntilLessonCompletionPercent
                    );

                    const asmAttempts = attempts.filter(
                      (a) => a.assessmentId === asm.id && a.isCompleted
                    );
                    const bestAttempt =
                      asmAttempts.length > 0
                        ? Math.max(...asmAttempts.map((a) => a.score))
                        : null;

                    const asmSubmission = submissions.find(
                      (s) => s.assessmentId === asm.id
                    );

                    return (
                      <div
                        key={asm.id}
                        className={`rounded-control border p-3.5 flex flex-col justify-between transition-colors ${
                          isLocked
                            ? "border-app-border/60 bg-app-surface-muted/30 opacity-75"
                            : "border-app-border bg-app-surface hover:border-app-border"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-app-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-app-accent">
                                {asm.type}
                              </span>
                              <h4 className="font-semibold text-app-ink text-xs">
                                {asm.title}
                              </h4>
                            </div>

                            <span className="font-sans text-[11px] font-bold text-app-ink tabular-nums shrink-0">
                              {asm.maxPoints} pts
                            </span>
                          </div>

                          {asm.description && (
                            <p className="text-[11px] text-app-ink-muted line-clamp-2">
                              {asm.description}
                            </p>
                          )}

                          {/* Lock warning badge */}
                          {isLocked && (
                            <div className="flex items-center gap-1.5 rounded bg-amber-500/10 px-2 py-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                              <Lock className="h-3 w-3 shrink-0" />
                              <span>
                                Locked: requires {asm.lockedUntilLessonCompletionPercent}% topic completion (currently {Math.round(topicCompletionPercent)}%).
                              </span>
                            </div>
                          )}

                          {/* Score / Attempt status info */}
                          {!isLocked && (
                            <div className="flex items-center justify-between text-[11px] pt-1">
                              {asm.type === "assignment" ? (
                                asmSubmission ? (
                                  <span className="font-medium text-app-success flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Submitted: {asmSubmission.finalScore} / {asm.maxPoints} pts
                                  </span>
                                ) : (
                                  <span className="text-app-ink-muted">
                                    Not yet submitted
                                  </span>
                                )
                              ) : asmAttempts.length > 0 ? (
                                <span className="font-medium text-app-success flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Score: {bestAttempt} / {asm.maxPoints} pts (Attempt {asmAttempts.length}
                                  {asm.attemptLimit ? `/${asm.attemptLimit}` : ""})
                                </span>
                              ) : (
                                <span className="text-app-ink-muted">
                                  {asm.timeLimitMinutes
                                    ? `Timed: ${asm.timeLimitMinutes} mins`
                                    : "Untimed"}
                                </span>
                              )}

                              {asm.dueDate && (
                                <span className="text-app-ink-muted font-sans">
                                  Due {asm.dueDate}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 mt-2 border-t border-app-border/60 flex items-center justify-end gap-2">
                          {isLocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="gap-1.5 text-xs opacity-60"
                            >
                              <Lock className="h-3 w-3" />
                              <span>Locked</span>
                            </Button>
                          ) : asm.type === "assignment" ? (
                            <Button
                              variant={asmSubmission ? "outline" : "primary"}
                              size="sm"
                              onClick={() => setActiveAssignmentAssessment(asm)}
                              className="text-xs"
                            >
                              {asmSubmission ? "Update Submission & Rubric" : "Submit Assignment"}
                            </Button>
                          ) : (
                            <Button
                              variant={asmAttempts.length > 0 ? "outline" : "primary"}
                              size="sm"
                              onClick={() => setActiveQuizAssessment(asm)}
                              className="text-xs"
                            >
                              {asmAttempts.length > 0
                                ? "Review / Retake Quiz"
                                : asm.type === "midterm" || asm.type === "final"
                                ? "Take Examination"
                                : "Start Quiz"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
                          <span className="rounded-full bg-app-surface px-2 py-0.5 text-xs text-app-ink-muted font-sans tabular-nums border border-app-border/60">
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

        {/* Tab: Exam Prep Mode */}
        <TabsContent value="exam-prep" className="space-y-6 pt-2">
          <ExamPrepMode
            course={course}
            modules={modules}
            topics={topics}
            onTopicUpdate={loadData}
            onOpenQuickCheck={(top) => setQuickCheckTopic(top)}
          />
        </TabsContent>

        {/* Tab: Attendance Tracker */}
        <TabsContent value="attendance" className="space-y-6 pt-2">
          <AttendanceTracker
            course={course}
            onAttendanceChange={(newStats) => {
              setAttStats(newStats);
            }}
          />
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
        <TabsContent value="grades" className="space-y-6 pt-2">
          {/* Overall Performance Card */}
          <div className="rounded-card border border-app-border bg-app-surface p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app-border pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-app-ink">
                  Overall Academic Performance
                </h3>
                <p className="text-xs text-app-ink-muted">
                  Weighted category engine compliant with academic standing rules.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGradingSchemeOpen(true)}
                  className="gap-1.5 text-xs"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Edit Scheme (100%)</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-control border border-app-border bg-app-surface-muted/40 p-3.5">
                <span className="text-[11px] font-semibold uppercase text-app-ink-muted block mb-1">
                  Current Grade (Completed Work)
                </span>
                <span className="font-serif text-3xl font-bold text-app-ink tabular-nums">
                  {gradeResult.currentGrade}%
                </span>
                <span className="text-[10px] text-app-ink-muted block mt-1">
                  Excludes uncompleted categories
                </span>
              </div>

              <div className="rounded-control border border-app-border bg-app-surface-muted/40 p-3.5">
                <span className="text-[11px] font-semibold uppercase text-app-ink-muted block mb-1">
                  Projected Final Grade
                </span>
                <span className="font-serif text-3xl font-bold text-app-accent tabular-nums">
                  {gradeResult.projectedFinalGrade}%
                </span>
                <span className="text-[10px] text-app-ink-muted block mt-1">
                  Pending categories count as 0
                </span>
              </div>

              <div className="rounded-control border border-app-border bg-app-surface-muted/40 p-3.5">
                <span className="text-[11px] font-semibold uppercase text-app-ink-muted block mb-1">
                  Letter & Grade Points ({gpaScale === "10_point" ? "10-Pt" : "4.0"})
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-bold text-app-ink">
                    {gradeResult.letter}
                  </span>
                  <span className="font-sans text-sm font-semibold text-app-ink-muted tabular-nums">
                    ({gradeResult.points.toFixed(1)} GP)
                  </span>
                </div>
                <span className="text-[10px] text-app-ink-muted block mt-1">
                  Collegiate standing scale
                </span>
              </div>

              <div className="rounded-control border border-app-border bg-app-surface-muted/40 p-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase text-app-ink-muted block mb-1">
                    Pass Mark & Status
                  </span>
                  <span className="font-sans text-sm font-bold text-app-ink tabular-nums">
                    Pass Mark: {course.passMark}%
                  </span>
                </div>
                <div className="mt-2">
                  <StatusChip
                    status={gradeResult.passed ? "graded" : "overdue"}
                    label={gradeResult.passed ? "Passing Grade" : "Below Pass Mark"}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Category Weights Grid */}
          <div className="rounded-card border border-app-border bg-app-surface p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-app-border pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-app-ink">
                  Grading Criteria & Category Weights
                </h3>
                <p className="text-xs text-app-ink-muted">
                  Weights sum to exactly 100%. Within each category, scores are calculated proportionally (points earned / max points).
                </p>
              </div>
              <span className="font-sans text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Total Weight: 100%
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {gradeResult.categories.map((cat) => (
                <div
                  key={cat.category}
                  className="rounded-control border border-app-border bg-app-surface-muted/40 p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-app-ink-muted truncate">
                      {cat.label}
                    </span>
                    <span className="font-sans text-xs font-bold text-app-ink tabular-nums">
                      {cat.weight}%
                    </span>
                  </div>

                  <div className="font-serif text-xl font-bold text-app-ink tabular-nums">
                    {cat.scorePercent !== null
                      ? `${Math.round(cat.scorePercent)}%`
                      : "Pending"}
                  </div>

                  <span className="text-[10px] text-app-ink-muted block">
                    {cat.category === "lessonCompletion"
                      ? `${completedTopicsCount} of ${totalTopicsCount} topics done`
                      : `${cat.itemsCount} assessment items`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Graded Items Table */}
          <div className="rounded-card border border-app-border bg-app-surface overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-app-border bg-app-surface-muted/50 px-4 py-3">
              <h3 className="font-serif text-base font-bold text-app-ink">
                Course Assessment Gradebook
              </h3>
              <span className="text-xs text-app-ink-muted font-sans tabular-nums">
                {assessments.length} assessment records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-app-border bg-app-surface-muted/20 text-app-ink-muted">
                    <th className="px-4 py-2.5 font-medium">Type</th>
                    <th className="px-4 py-2.5 font-medium">Title</th>
                    <th className="px-4 py-2.5 font-medium">Category</th>
                    <th className="px-4 py-2.5 font-medium text-right">Max Pts</th>
                    <th className="px-4 py-2.5 font-medium text-right">Points Earned</th>
                    <th className="px-4 py-2.5 font-medium text-right">Score %</th>
                    <th className="px-4 py-2.5 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {assessments.map((asm) => {
                    const asmAttempts = attempts.filter(
                      (a) => a.assessmentId === asm.id && a.isCompleted
                    );
                    const bestAttempt =
                      asmAttempts.length > 0
                        ? Math.max(...asmAttempts.map((a) => a.score))
                        : null;
                    const asmSub = submissions.find(
                      (s) => s.assessmentId === asm.id
                    );

                    const earned =
                      asm.type === "assignment"
                        ? asmSub?.finalScore ?? null
                        : bestAttempt;

                    const percent =
                      earned !== null
                        ? Math.round((earned / asm.maxPoints) * 100)
                        : null;

                    return (
                      <tr key={asm.id} className="hover:bg-app-surface-muted/30">
                        <td className="px-4 py-3">
                          <span className="rounded bg-app-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-app-accent">
                            {asm.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-app-ink">
                          {asm.title}
                        </td>
                        <td className="px-4 py-3 text-app-ink-muted capitalize">
                          {asm.type === "quiz"
                            ? "Quizzes"
                            : asm.type === "assignment"
                            ? "Assignments"
                            : asm.type === "midterm"
                            ? "Midterm Exam"
                            : "Final Exam"}
                        </td>
                        <td className="px-4 py-3 text-right font-sans tabular-nums text-app-ink">
                          {asm.maxPoints}
                        </td>
                        <td className="px-4 py-3 text-right font-sans tabular-nums font-semibold text-app-ink">
                          {earned !== null ? earned : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-sans tabular-nums">
                          {percent !== null ? (
                            <span
                              className={`font-semibold ${
                                percent >= (course.passMark || 40)
                                  ? "text-app-success"
                                  : "text-app-danger"
                              }`}
                            >
                              {percent}%
                            </span>
                          ) : (
                            <span className="text-app-ink-muted">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {asm.type === "assignment" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveAssignmentAssessment(asm)}
                              className="text-xs h-7"
                            >
                              {asmSub ? "View Rubric" : "Submit"}
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveQuizAssessment(asm)}
                              className="text-xs h-7"
                            >
                              {asmAttempts.length > 0 ? "Review" : "Take"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive What-If Grade Simulator */}
          <WhatIfCalculator
            course={course}
            assessments={assessments}
            attempts={attempts}
            submissions={submissions}
            lessonCompletionPercent={courseMasteryScore}
            scale={gpaScale}
          />
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
                    <p className="text-xs text-app-ink-muted whitespace-pre-wrap line-clamp-4 font-sans bg-app-surface-muted/40 p-2 rounded">
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
        topics={topics}
        targetUnitId={activeUnit?.id || (modules.length > 0 ? modules[0].id : undefined)}
        open={addLessonsOpen}
        onOpenChange={setAddLessonsOpen}
        onSuccess={loadData}
        onLessonsAdded={(newLessons) => {
          setLessons((prev) => [...prev, ...newLessons]);
        }}
      />

      {/* Group Modules Dialog */}
      <GroupModulesDialog
        courseId={course.id}
        lessons={lessons}
        open={groupModulesOpen}
        onOpenChange={setGroupModulesOpen}
        onSuccess={loadData}
      />

      {/* Grading Scheme Modal */}
      <GradingSchemeModal
        course={course}
        open={gradingSchemeOpen}
        onOpenChange={setGradingSchemeOpen}
        onSuccess={loadData}
      />

      {/* Create Assessment Modal */}
      <CreateAssessmentModal
        course={course}
        open={createAssessmentOpen}
        onOpenChange={setCreateAssessmentOpen}
        onSuccess={loadData}
      />

      {/* Quiz Runner Modal */}
      {activeQuizAssessment && (
        <QuizRunnerModal
          assessment={activeQuizAssessment}
          open={Boolean(activeQuizAssessment)}
          onOpenChange={(open) => !open && setActiveQuizAssessment(null)}
          onSuccess={loadData}
        />
      )}

      {/* Assignment Submission & Rubric Modal */}
      {activeAssignmentAssessment && (
        <AssignmentSubmissionModal
          assessment={activeAssignmentAssessment}
          open={Boolean(activeAssignmentAssessment)}
          onOpenChange={(open) => !open && setActiveAssignmentAssessment(null)}
          onSuccess={loadData}
        />
      )}

      {/* AI Quiz Drafter Modal */}
      <AiQuizDraftModal
        course={course}
        lessons={lessons}
        notes={notes}
        open={aiQuizDraftOpen}
        onOpenChange={setAiQuizDraftOpen}
        onSuccess={loadData}
      />

      {/* Reset Syllabus Dialog */}
      <ResetSyllabusDialog
        courseCode={course.code}
        courseTitle={course.title}
        open={resetSyllabusOpen}
        onOpenChange={setResetSyllabusOpen}
        onConfirm={handleResetSyllabus}
      />

      {/* Tidy Topics Dialog */}
      <TidyTopicsDialog
        courseCode={course.code}
        courseTitle={course.title}
        topics={topics}
        open={tidyTopicsOpen}
        onOpenChange={setTidyTopicsOpen}
        onApplyTidy={handleApplyTidy}
      />

      {/* Quick Check Modal */}
      <QuickCheckModal
        topic={quickCheckTopic}
        courseCode={course.code}
        open={Boolean(quickCheckTopic)}
        onOpenChange={(open) => {
          if (!open) setQuickCheckTopic(null);
        }}
        onSuccess={loadData}
      />

      {/* Topic AI Assistant Modal */}
      <TopicAiChatModal
        topicTitle={aiChatTopic?.title || ""}
        courseTitle={course.title}
        open={Boolean(aiChatTopic)}
        onOpenChange={(open) => {
          if (!open) setAiChatTopic(null);
        }}
      />

      {/* Khan-Style Note Audit & Mastery Loop Modal */}
      {masteryLoopTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl my-auto animate-in zoom-in-95 duration-200">
            <TopicMasteryLoop
              topic={masteryLoopTopic}
              course={course}
              unit={modules.find((m) => m.id === masteryLoopTopic.unitId)}
              onClose={() => setMasteryLoopTopic(null)}
              onMasteryUpdated={() => {
                setMasteryLoopTopic(null);
                loadData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
