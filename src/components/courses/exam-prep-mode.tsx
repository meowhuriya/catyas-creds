"use client";

import * as React from "react";
import { Course, Module, Topic, ExamDate } from "@/types/schemas";
import { useDataStore } from "@/lib/repository";
import {
  calculateExamPrepStats,
  ExamPrepStats,
} from "@/lib/exam-prep/exam-prep-engine";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cleanSyllabusTitle } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  CalendarPlus,
  Play,
  Check,
  ChevronDown,
  Sliders,
  Flame,
  Award,
} from "lucide-react";

interface ExamPrepModeProps {
  course: Course;
  modules: Module[];
  topics: Topic[];
  onTopicUpdate?: () => Promise<void>;
  onOpenQuickCheck?: (topic: Topic) => void;
}

export function ExamPrepMode({
  course,
  modules,
  topics,
  onTopicUpdate,
  onOpenQuickCheck,
}: ExamPrepModeProps) {
  const { dataStore } = useDataStore();
  const toast = useToast();

  const [examDateRecord, setExamDateRecord] = React.useState<ExamDate | null>(null);
  const [examTitle, setExamTitle] = React.useState<string>("Final Examination");
  const [selectedDate, setSelectedDate] = React.useState<string>("");
  const [isEditingExam, setIsEditingExam] = React.useState(false);
  const [filterMode, setFilterMode] = React.useState<"uncompleted" | "all">("uncompleted");
  const [loading, setLoading] = React.useState(true);

  // Load saved exam milestone for this course
  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const saved = await dataStore.getCourseExamDate(course.id);
        if (saved) {
          setExamDateRecord(saved);
          setExamTitle(saved.examTitle);
          setSelectedDate(saved.date);
        } else {
          // Default: 3 weeks from today
          const defaultDate = new Date();
          defaultDate.setDate(defaultDate.getDate() + 21);
          const dateStr = defaultDate.toISOString().split("T")[0];
          setSelectedDate(dateStr);
        }
      } catch (err) {
        console.error("Failed to load course exam date:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [course.id, dataStore]);

  // Calculate Exam Prep Stats
  const stats: ExamPrepStats = React.useMemo(() => {
    return calculateExamPrepStats(
      examTitle || "Final Examination",
      selectedDate,
      topics
    );
  }, [examTitle, selectedDate, topics]);

  // Save Exam Date Milestone
  const handleSaveExamDate = async () => {
    if (!selectedDate) {
      toast.error("Invalid Date", "Please select an exam date.");
      return;
    }

    try {
      const saved = await dataStore.saveCourseExamDate(course.id, {
        examTitle: examTitle.trim() || "Final Examination",
        date: selectedDate,
        targetScore: 85,
      });
      setExamDateRecord(saved);
      setIsEditingExam(false);
      toast.success(
        "Exam Target Scheduled",
        `${saved.examTitle} scheduled for ${saved.date}. Daily target: ${stats.dailyTarget} topics/day.`
      );
    } catch (err) {
      console.error("Failed to save exam date:", err);
      toast.error("Error", "Could not save exam milestone.");
    }
  };

  // Add event to Academic Planner
  const handleAddToPlanner = async () => {
    if (!selectedDate) return;

    try {
      await dataStore.createPlannerEvent({
        title: `${course.code}: ${examTitle || "Final Exam"}`,
        date: selectedDate,
        startTime: "09:00",
        endTime: "12:00",
        type: "exam",
        courseId: course.id,
        isDone: false,
      });
      toast.success(
        "Added to Academic Planner",
        `${examTitle} is now marked on your calendar for ${selectedDate}.`
      );
    } catch (err) {
      console.error("Failed to create planner event:", err);
    }
  };

  // Quick preset dates
  const handleApplyPreset = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // Toggle topic completion
  const handleToggleTopic = async (topic: Topic) => {
    const newDone = !topic.isDone;
    const newScore = newDone ? 100 : 0;
    const newWatch = newDone ? 40 : 0;
    const newCheck = newDone ? 60 : 0;

    try {
      await dataStore.updateTopic(topic.id, {
        isDone: newDone,
        topicScore: newScore,
        watchScore: newWatch,
        checkScore: newCheck,
        lastRevisedAt: newDone ? new Date().toISOString() : undefined,
      });
      if (onTopicUpdate) {
        await onTopicUpdate();
      }
    } catch (err) {
      console.error("Failed to update topic:", err);
    }
  };

  // Filter topics
  const uncompletedTopics = topics.filter(
    (t) => !t.isDone && (t.topicScore || 0) < 70
  );
  const displayedTopics = filterMode === "uncompleted" ? uncompletedTopics : topics;

  // Group displayed topics by unit
  const groupedByUnit = React.useMemo(() => {
    const groups: { unit: Module; topics: Topic[] }[] = [];
    const sortedModules = [...modules].sort((a, b) => a.order - b.order);

    for (const mod of sortedModules) {
      const unitTops = displayedTopics.filter((t) => t.unitId === mod.id);
      if (unitTops.length > 0 || filterMode === "all") {
        groups.push({ unit: mod, topics: unitTops });
      }
    }
    return groups;
  }, [modules, displayedTopics, filterMode]);

  const percentReady =
    stats.totalTopicsCount > 0
      ? Math.round((stats.completedTopicsCount / stats.totalTopicsCount) * 100)
      : 0;

  if (loading) {
    return (
      <div className="academic-card p-6 text-center text-sm text-[var(--color-ink-muted)]">
        Loading exam preparation metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* 1. Header Banner & Exam Milestone Editor */}
      <div className="academic-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]/80">
          <div>
            <span className="eyebrow-label text-[#8A1627] block mb-1">
              {course.code} · EXAM PREPARATION MODE
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#14161F] dark:text-[#F6EBD3]">
              {examTitle || "Final Examination"} Target
            </h2>
            <p className="text-xs text-[#4B5160] dark:text-[#D1C7B7] mt-0.5">
              Scheduled for{" "}
              <strong className="text-[#14161F] dark:text-[#F6EBD3] font-sans font-semibold">
                {selectedDate || "Not Set"}
              </strong>{" "}
              ({stats.daysRemaining > 0 ? `${stats.daysRemaining} days remaining` : "Due today"})
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToPlanner}
              className="text-xs h-8 gap-1.5 bg-white dark:bg-[#1A1214] border-[#CFC8BB] text-[#14161F] dark:text-[#F6EBD3]"
              title="Add this exam date as a milestone to your Academic Planner"
            >
              <CalendarPlus className="h-3.5 w-3.5 text-[#8A1627]" />
              <span>Add to Planner</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingExam(!isEditingExam)}
              className="text-xs h-8 gap-1.5 bg-white dark:bg-[#1A1214] border-[#CFC8BB] text-[#14161F] dark:text-[#F6EBD3]"
            >
              <Sliders className="h-3.5 w-3.5 text-[#8A1627]" />
              <span>{isEditingExam ? "Close Editor" : "Change Exam Date"}</span>
            </Button>
          </div>
        </div>

        {/* Date Picker Form (when expanded) */}
        {isEditingExam && (
          <div className="p-4 rounded-[14px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-sm font-bold text-[#14161F] dark:text-[#F6EBD3]">
                Set Examination Title & Target Date
              </h3>
              <span className="text-xs text-[#4B5160] dark:text-[#D1C7B7]">
                Pace updates automatically
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#14161F] dark:text-[#F6EBD3] mb-1">
                  Examination Name
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="e.g. End-Semester Final Examination"
                  className="w-full h-9 px-3 rounded-[8px] bg-white dark:bg-[#1A1214] border border-[#CFC8BB] dark:border-[#3D2D31] text-xs font-sans text-[#14161F] dark:text-[#F6EBD3] focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#14161F] dark:text-[#F6EBD3] mb-1">
                  Examination Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-[8px] bg-white dark:bg-[#1A1214] border border-[#CFC8BB] dark:border-[#3D2D31] text-xs font-sans text-[#14161F] dark:text-[#F6EBD3] focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-[#4B5160] dark:text-[#D1C7B7]">
                Quick Presets:
              </span>
              {[
                { label: "In 1 Week", days: 7 },
                { label: "In 2 Weeks", days: 14 },
                { label: "In 3 Weeks", days: 21 },
                { label: "In 1 Month", days: 30 },
                { label: "In 6 Weeks", days: 42 },
              ].map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => handleApplyPreset(p.days)}
                  className="px-2.5 py-1 rounded-[6px] bg-white dark:bg-[#1A1214] border border-[#CFC8BB] dark:border-[#3D2D31] text-[11px] font-sans font-medium text-[#14161F] dark:text-[#F6EBD3] hover:border-[#A51C30] hover:text-[#A51C30] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E4D9C0] dark:border-[#3D2D31]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingExam(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveExamDate}
                className="text-xs bg-[#A51C30] hover:bg-[#8A1627] text-white"
              >
                Save Exam Milestone
              </Button>
            </div>
          </div>
        )}

        {/* 2. Key Scorecard Grid: 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Days Remaining */}
          <div className="p-4 rounded-[14px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31]">
            <span className="eyebrow-label text-[#8A1627] block mb-1">
              COUNTDOWN
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-3xl font-bold text-[#14161F] dark:text-[#F6EBD3] tabular-nums">
                {stats.daysRemaining >= 0 ? stats.daysRemaining : 0}
              </span>
              <span className="text-xs font-sans text-[#4B5160] dark:text-[#D1C7B7]">
                {stats.daysRemaining === 1 ? "day left" : "days left"}
              </span>
            </div>
            <span className="text-[11px] text-[#4B5160] dark:text-[#D1C7B7] block mt-1">
              Target: {selectedDate}
            </span>
          </div>

          {/* Card 2: Uncompleted Topics */}
          <div className="p-4 rounded-[14px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31]">
            <span className="eyebrow-label text-[#8A1627] block mb-1">
              UNCOMPLETED TOPICS
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-3xl font-bold text-[#C62F3C] tabular-nums">
                {stats.uncompletedTopicsCount}
              </span>
              <span className="text-xs font-sans text-[#4B5160] dark:text-[#D1C7B7]">
                / {stats.totalTopicsCount} total
              </span>
            </div>
            <span className="text-[11px] text-[#5E7B5B] font-medium block mt-1">
              {stats.completedTopicsCount} mastered
            </span>
          </div>

          {/* Card 3: Daily Target (The Hero Metric) */}
          <div className="col-span-2 p-4 rounded-[14px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31]">
            <div className="flex items-center justify-between mb-1">
              <span className="eyebrow-label text-[#8A1627]">
                DAILY PREP TARGET
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                  stats.paceStatus === "mastered"
                    ? "bg-[#5E7B5B]/15 text-[#5E7B5B]"
                    : stats.paceStatus === "steady"
                    ? "bg-[#5E7B5B]/15 text-[#5E7B5B]"
                    : stats.paceStatus === "moderate"
                    ? "bg-[#D9A441]/20 text-[#A06C16]"
                    : "bg-[#C62F3C]/15 text-[#C62F3C]"
                }`}
              >
                {stats.paceStatus === "intensive" && <Flame className="h-3 w-3" />}
                {stats.paceStatus === "mastered" && <Award className="h-3 w-3" />}
                <span>{stats.paceBadgeLabel}</span>
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-[#A51C30] tabular-nums">
                {stats.dailyTarget}
              </span>
              <span className="text-sm font-sans font-bold text-[#14161F] dark:text-[#F6EBD3]">
                {stats.dailyTarget === 1 ? "topic / day" : "topics / day"}
              </span>
            </div>

            <p className="text-xs text-[#4B5160] dark:text-[#D1C7B7] mt-1">
              {stats.statusSentence}
            </p>
          </div>
        </div>

        {/* Readiness Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#14161F] dark:text-[#F6EBD3]">
            <span>Curricular Exam Readiness</span>
            <span className="tabular-nums font-sans text-[#8A1627]">
              {percentReady}% Complete
            </span>
          </div>
          <ProgressBar value={percentReady} className="h-2" />
        </div>
      </div>

      {/* 3. Interactive Uncompleted Topics Checklist */}
      <div className="academic-card p-5 sm:p-6 space-y-4">
        {/* Header & Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]/80">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#14161F] dark:text-[#F6EBD3]">
              Curricular Topics for Exam Preparation
            </h3>
            <p className="text-xs text-[#4B5160] dark:text-[#D1C7B7]">
              Mark topics completed or take quick checks to reduce uncompleted count and daily target
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-[10px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterMode("uncompleted")}
              className={`px-3 py-1 rounded-[7px] text-xs font-sans font-semibold transition-colors ${
                filterMode === "uncompleted"
                  ? "bg-white dark:bg-[#1A1214] text-[#A51C30] shadow-sm font-bold"
                  : "text-[#4B5160] dark:text-[#D1C7B7] hover:text-[#14161F]"
              }`}
            >
              Uncompleted ({uncompletedTopics.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1 rounded-[7px] text-xs font-sans font-semibold transition-colors ${
                filterMode === "all"
                  ? "bg-white dark:bg-[#1A1214] text-[#A51C30] shadow-sm font-bold"
                  : "text-[#4B5160] dark:text-[#D1C7B7] hover:text-[#14161F]"
              }`}
            >
              All Topics ({topics.length})
            </button>
          </div>
        </div>

        {/* Topics List Grouped by Unit */}
        {groupedByUnit.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#4B5160] dark:text-[#D1C7B7]">
            {filterMode === "uncompleted"
              ? "All topics are mastered! You are 100% prepared for this examination."
              : "No curricular topics registered for this course."}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByUnit.map(({ unit, topics: unitTops }) => (
              <div
                key={unit.id}
                className="rounded-[12px] border border-[#E4D9C0] dark:border-[#3D2D31] bg-white dark:bg-[#1A1214] overflow-hidden"
              >
                {/* Unit Section Title */}
                <div className="bg-[#FBF6EC] dark:bg-[#221A1C] px-4 py-2.5 border-b border-[#E4D9C0] dark:border-[#3D2D31] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="eyebrow-label text-[#8A1627] text-[10px]">
                      UNIT {unit.unitNumber || 1}
                    </span>
                    <h4 className="font-serif text-sm font-bold text-[#14161F] dark:text-[#F6EBD3]">
                      {cleanSyllabusTitle(unit.title)}
                    </h4>
                  </div>
                  <span className="text-[11px] font-sans font-semibold text-[#4B5160] dark:text-[#D1C7B7]">
                    {unitTops.filter((t) => t.isDone).length}/{unitTops.length} done
                  </span>
                </div>

                {/* Topics in this unit */}
                <div className="divide-y divide-[#E4D9C0]/60 dark:divide-[#3D2D31]">
                  {unitTops.map((t) => {
                    const isDone = t.isDone || (t.topicScore || 0) >= 70;

                    return (
                      <div
                        key={t.id}
                        className="p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FBF6EC]/40 dark:hover:bg-[#221A1C]/40 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* 22px Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggleTopic(t)}
                            className={`h-[22px] w-[22px] rounded-[5px] border mt-0.5 shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                              isDone
                                ? "bg-[#5E7B5B] border-[#5E7B5B] text-white"
                                : "border-[#CFC8BB] bg-white hover:border-[#A51C30]"
                            }`}
                            title={isDone ? "Mark as uncompleted" : "Mark as mastered"}
                          >
                            {isDone && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </button>

                          <div className="min-w-0">
                            <span
                              className={`text-[15px] sm:text-[16px] font-medium leading-snug block ${
                                isDone
                                  ? "line-through text-[#4B5160]/70 dark:text-[#D1C7B7]/70"
                                  : "text-[#14161F] dark:text-[#F6EBD3]"
                              }`}
                            >
                              {t.title}
                            </span>

                            {/* Score Breakdown Bar */}
                            {(t.topicScore || 0) > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="h-1 w-20 bg-[#E5D5C5] rounded-full overflow-hidden flex">
                                  <div
                                    className="bg-[#2F7F86] h-full"
                                    style={{
                                      width: `${((t.watchScore || 0) / 40) * 40}%`,
                                    }}
                                  />
                                  <div
                                    className="bg-[#5E7B5B] h-full"
                                    style={{
                                      width: `${((t.checkScore || 0) / 60) * 60}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[11px] font-sans font-semibold text-[#4B5160] dark:text-[#D1C7B7]">
                                  {t.topicScore}/100 pts
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {onOpenQuickCheck && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onOpenQuickCheck(t)}
                              className="text-xs h-7 gap-1 bg-white dark:bg-[#1A1214] border-[#CFC8BB] text-[#8A1627] hover:bg-[#8A1627]/10"
                              title="Test mastery with a quick 3-question diagnostic"
                            >
                              <Sparkles className="h-3 w-3" />
                              <span>Quick Check</span>
                            </Button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleTopic(t)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-[6px] border transition-colors cursor-pointer ${
                              isDone
                                ? "bg-white dark:bg-[#1A1214] border-[#CFC8BB] text-[#4B5160]"
                                : "bg-[#5E7B5B] border-[#5E7B5B] text-white hover:bg-[#4E6B4B]"
                            }`}
                          >
                            {isDone ? "Review Again" : "Mark Mastered"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
