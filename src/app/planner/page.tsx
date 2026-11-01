"use client";

import * as React from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/repository";
import { Course, PlannerEvent, Assessment, Topic } from "@/types/schemas";
import { ScheduleStudyBlockModal } from "@/components/planner/schedule-study-block-modal";
import { AiStudyPlanModal } from "@/components/planner/ai-study-plan-modal";
import { Button } from "@/components/ui/button";
import { TOKENS, CourseTagKey } from "@/styles/tokens";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Filter,
  Check,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Award,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
} from "date-fns";

export default function PlannerPage() {
  const { dataStore } = useDataStore();

  const [currentDate, setCurrentDate] = React.useState<Date>(() => new Date());
  const [viewMode, setViewMode] = React.useState<"month" | "week">("month");
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [plannerEvents, setPlannerEvents] = React.useState<PlannerEvent[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = React.useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = React.useState<"all" | "pending" | "done">("all");
  const [selectedTypeFilter, setSelectedTypeFilter] = React.useState<"all" | "study_block" | "due_date" | "exam" | "revision">("all");
  const [scheduleModalOpen, setScheduleModalOpen] = React.useState(false);
  const [aiPlanModalOpen, setAiPlanModalOpen] = React.useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [allCourses, allEvents, allTopics] = await Promise.all([
        dataStore.getCourses(),
        dataStore.getPlannerEvents(),
        dataStore.getAllTopics(),
      ]);

      setCourses(allCourses);
      setPlannerEvents(allEvents);
      setTopics(allTopics);

      const nestedAsms = await Promise.all(
        allCourses.map((c) => dataStore.getAssessments(c.id))
      );
      setAssessments(nestedAsms.flat());
    } catch (err) {
      console.error("Failed to load planner data:", err);
    } finally {
      setLoading(false);
    }
  }, [dataStore]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Aggregate all events (scheduled study blocks, assessment due dates, spaced revisions)
  const aggregatedEvents = React.useMemo(() => {
    const list: Array<PlannerEvent & { course?: Course }> = [];

    // 1. Planner Events (study blocks, exams, etc.)
    plannerEvents.forEach((evt) => {
      const crs = courses.find((c) => c.id === evt.courseId);
      list.push({ ...evt, course: crs });
    });

    // 2. Assessment Due Dates
    assessments.forEach((asm) => {
      if (asm.dueDate) {
        const alreadyExists = plannerEvents.some((e) => e.assessmentId === asm.id);
        if (!alreadyExists) {
          const crs = courses.find((c) => c.id === asm.courseId);
          list.push({
            id: "asm-due-" + asm.id,
            userId: asm.userId,
            title: `${asm.type === "quiz" ? "Quiz Due" : asm.type === "assignment" ? "Assignment Due" : "Exam"}: ${asm.title}`,
            date: asm.dueDate,
            startTime: "23:59",
            type: asm.type === "midterm" || asm.type === "final" ? "exam" : "due_date",
            courseId: asm.courseId,
            assessmentId: asm.id,
            isDone: false,
            course: crs,
          });
        }
      }
    });

    // 3. Spaced Revision Reminders (1, 3, 7, 21 days)
    topics.forEach((top) => {
      if (top.revisionDueAt) {
        const revDate = top.revisionDueAt.split("T")[0];
        const alreadyExists = list.some(
          (e) => e.date === revDate && e.title.includes(top.title)
        );
        if (!alreadyExists) {
          const crs = courses.find((c) => c.id === top.courseId);
          list.push({
            id: "rev-top-" + top.id + "-" + revDate,
            userId: top.userId,
            title: `Spaced Revision: ${top.title}`,
            date: revDate,
            startTime: "09:00",
            type: "revision",
            courseId: top.courseId,
            isDone: false,
            course: crs,
          });
        }
      }
    });

    return list;
  }, [plannerEvents, assessments, topics, courses]);

  // Filter events
  const filteredEvents = React.useMemo(() => {
    return aggregatedEvents.filter((evt) => {
      if (selectedCourseFilter !== "all" && evt.courseId !== selectedCourseFilter) {
        return false;
      }
      if (selectedStatusFilter === "pending" && evt.isDone) return false;
      if (selectedStatusFilter === "done" && !evt.isDone) return false;
      if (selectedTypeFilter !== "all" && evt.type !== selectedTypeFilter) return false;
      return true;
    });
  }, [aggregatedEvents, selectedCourseFilter, selectedStatusFilter, selectedTypeFilter]);

  // Toggle item done
  const handleToggleDone = async (evt: PlannerEvent) => {
    if (evt.id.startsWith("asm-due-") || evt.id.startsWith("rev-top-")) {
      await dataStore.createPlannerEvent({
        title: evt.title,
        date: evt.date,
        startTime: evt.startTime,
        endTime: evt.endTime,
        type: evt.type,
        courseId: evt.courseId,
        assessmentId: evt.assessmentId,
        isDone: !evt.isDone,
      });
    } else {
      await dataStore.togglePlannerEventDone(evt.id, !evt.isDone);
    }
    await loadData();
  };

  // Month navigation
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else {
      setCurrentDate((prev) => subWeeks(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else {
      setCurrentDate((prev) => addWeeks(prev, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month grid calculation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Week grid calculation
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="space-y-6">
      {/* Page Header (Solid cream panel) */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-[18px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] shadow-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-app-ink">
            Academic Planner
          </h1>
          <p className="text-xs text-app-ink-muted mt-0.5">
            Syllabus deadlines, examination schedule, spaced revision sessions, and dedicated study blocks.
          </p>
        </div>

        {/* View Mode & Schedule Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-control border border-app-border bg-app-surface p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                viewMode === "month"
                  ? "bg-app-accent text-white font-semibold"
                  : "text-app-ink-muted hover:text-app-ink"
              }`}
            >
              Month View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={`rounded px-3 py-1 font-medium transition-colors ${
                viewMode === "week"
                  ? "bg-app-accent text-white font-semibold"
                  : "text-app-ink-muted hover:text-app-ink"
              }`}
            >
              Week View
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAiPlanModalOpen(true)}
            className="gap-1.5 text-xs text-app-accent border-app-accent/40 hover:bg-app-accent/10"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Draft Plan with AI</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedDateForModal(format(currentDate, "yyyy-MM-dd"));
              setScheduleModalOpen(true);
            }}
            className="gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Schedule Study Block</span>
          </Button>
        </div>
      </div>

      {/* Navigation Toolbar & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-app-border bg-app-surface p-3.5 shadow-sm">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            className="h-8 w-8 p-0"
            title="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs h-8 px-2.5"
          >
            Today
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            className="h-8 w-8 p-0"
            title="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="font-serif text-lg font-bold text-app-ink ml-2">
            {format(currentDate, viewMode === "month" ? "MMMM yyyy" : "'Week of' MMM d, yyyy")}
          </span>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Course filter */}
          <div className="flex items-center gap-1.5 rounded-control border border-app-border bg-app-surface px-2.5 py-1">
            <span className="text-app-ink-muted text-[11px]">Course:</span>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="bg-transparent font-medium text-app-ink focus:outline-none cursor-pointer"
            >
              <option value="all">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5 rounded-control border border-app-border bg-app-surface px-2.5 py-1">
            <span className="text-app-ink-muted text-[11px]">Type:</span>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
              className="bg-transparent font-medium text-app-ink focus:outline-none cursor-pointer"
            >
              <option value="all">All Event Types</option>
              <option value="study_block">Study Blocks</option>
              <option value="due_date">Assessment Deadlines</option>
              <option value="exam">Examination Milestones</option>
              <option value="revision">Spaced Revisions</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5 rounded-control border border-app-border bg-app-surface px-2.5 py-1">
            <span className="text-app-ink-muted text-[11px]">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="bg-transparent font-medium text-app-ink focus:outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="done">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Calendar View */}
      {viewMode === "month" ? (
        /* Month View Grid */
        <div className="rounded-card border border-app-border bg-app-surface overflow-hidden shadow-sm">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-app-border bg-app-surface-muted/40 text-center text-xs font-semibold uppercase tracking-wider text-app-ink-muted py-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Calendar Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-app-border">
            {monthDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const dayEvents = filteredEvents.filter((e) => e.date === dateStr);

              return (
                <div
                  key={dateStr}
                  className={`min-h-[110px] p-1.5 flex flex-col justify-between transition-colors ${
                    !isCurrentMonth
                      ? "bg-app-surface-muted/30 text-app-ink-muted/50"
                      : "bg-app-surface hover:bg-app-surface-muted/20"
                  }`}
                >
                  {/* Date Number Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`h-5 w-5 flex items-center justify-center rounded-full text-xs font-sans font-semibold font-bold tabular-nums ${
                        isCurrentDay
                          ? "bg-app-accent text-white"
                          : isCurrentMonth
                          ? "text-app-ink"
                          : "text-app-ink-muted/60"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDateForModal(dateStr);
                        setScheduleModalOpen(true);
                      }}
                      className="opacity-0 hover:opacity-100 p-0.5 rounded hover:bg-app-surface-muted text-app-ink-muted transition-opacity"
                      title="Schedule block on this day"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Day Events List */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                    {dayEvents.map((evt) => {
                      const tagColor = evt.course
                        ? TOKENS.colors.courseTags[evt.course.colorTag as CourseTagKey]?.hex ||
                          TOKENS.colors.courseTags.slate.hex
                        : TOKENS.colors.courseTags.slate.hex;

                      return (
                        <div
                          key={evt.id}
                          className={`group flex items-start gap-1.5 rounded p-1 text-[11px] border transition-colors leading-tight ${
                            evt.isDone
                              ? "border-app-border/40 bg-app-surface-muted/40 text-app-ink-muted line-through opacity-70"
                              : evt.type === "exam"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 font-semibold"
                              : evt.type === "revision"
                              ? "border-teal-500/30 bg-teal-500/10 text-teal-900 dark:text-teal-200 font-medium"
                              : evt.type === "study_block"
                              ? "border-indigo-500/30 bg-indigo-500/5 text-app-ink font-medium"
                              : "border-app-accent/30 bg-app-accent/5 text-app-ink font-medium"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleDone(evt);
                            }}
                            className="mt-0.5 shrink-0 text-app-ink-muted hover:text-app-accent"
                          >
                            {evt.isDone ? (
                              <CheckCircle2 className="h-3 w-3 text-app-success" />
                            ) : (
                              <Circle className="h-3 w-3" />
                            )}
                          </button>

                          <div className="flex-1 truncate">
                            <div className="flex items-center gap-1">
                              <span
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ backgroundColor: tagColor }}
                              />
                              <span className="truncate">{evt.title}</span>
                            </div>
                            {evt.startTime && evt.startTime !== "23:59" && (
                              <span className="text-[9px] text-app-ink-muted font-sans font-semibold block">
                                {evt.startTime}
                                {evt.endTime ? ` - ${evt.endTime}` : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week View Grid */
        <div className="rounded-card border border-app-border bg-app-surface overflow-hidden shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-app-border">
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isCurrentDay = isToday(day);
              const dayEvents = filteredEvents.filter((e) => e.date === dateStr);

              return (
                <div key={dateStr} className="min-h-[320px] p-3 flex flex-col">
                  {/* Day Header */}
                  <div className="flex items-center justify-between border-b border-app-border pb-2 mb-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase text-app-ink-muted block">
                        {format(day, "EEE")}
                      </span>
                      <span
                        className={`font-serif text-lg font-bold tabular-nums ${
                          isCurrentDay ? "text-app-accent" : "text-app-ink"
                        }`}
                      >
                        {format(day, "MMM d")}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDateForModal(dateStr);
                        setScheduleModalOpen(true);
                      }}
                      className="h-6 w-6 p-0"
                      title="Add block"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Day Events */}
                  <div className="space-y-2 flex-1">
                    {dayEvents.length === 0 ? (
                      <span className="text-[11px] text-app-ink-muted italic block pt-4 text-center">
                        No scheduled items
                      </span>
                    ) : (
                      dayEvents.map((evt) => {
                        const tagColor = evt.course
                          ? TOKENS.colors.courseTags[evt.course.colorTag as CourseTagKey]?.hex ||
                            TOKENS.colors.courseTags.slate.hex
                          : TOKENS.colors.courseTags.slate.hex;

                        return (
                          <div
                            key={evt.id}
                            className={`rounded-control border p-2 text-xs space-y-1 transition-all ${
                              evt.isDone
                                ? "border-app-border/40 bg-app-surface-muted/30 opacity-60 line-through"
                                : evt.type === "exam"
                                ? "border-amber-500/30 bg-amber-500/10 font-semibold"
                                : evt.type === "revision"
                                ? "border-teal-500/30 bg-teal-500/10 font-medium"
                                : evt.type === "study_block"
                                ? "border-indigo-500/30 bg-indigo-500/5 font-medium"
                                : "border-app-accent/30 bg-app-accent/5 font-medium shadow-xs"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ backgroundColor: tagColor }}
                                />
                                <span className="font-semibold text-app-ink line-clamp-2">
                                  {evt.title}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleToggleDone(evt)}
                                className="text-app-ink-muted hover:text-app-accent shrink-0"
                              >
                                {evt.isDone ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-app-success" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>

                            {evt.startTime && evt.startTime !== "23:59" && (
                              <div className="flex items-center gap-1 text-[10px] text-app-ink-muted font-sans font-semibold">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {evt.startTime}
                                  {evt.endTime ? ` - ${evt.endTime}` : ""}
                                </span>
                              </div>
                            )}

                            {evt.course && (
                              <Link
                                href={`/courses/${evt.course.id}`}
                                className="text-[10px] text-app-accent hover:underline font-medium block truncate"
                              >
                                {evt.course.code}: {evt.course.title}
                              </Link>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedule Study Block Modal */}
      <ScheduleStudyBlockModal
        courses={courses}
        initialDate={selectedDateForModal}
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        onSuccess={loadData}
      />

      {/* AI Study Plan Drafter Modal */}
      <AiStudyPlanModal
        courses={courses}
        open={aiPlanModalOpen}
        onOpenChange={setAiPlanModalOpen}
        onSuccess={loadData}
      />
    </div>
  );
}
