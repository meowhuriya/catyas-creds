"use client";

import * as React from "react";
import Link from "next/link";
import { useDataStore } from "@/lib/repository";
import {
  Topic,
  Course,
  RecallHistoryEntry,
  RecallStyle,
  RetentionLevel,
} from "@/types/schemas";
import {
  RecallCandidate,
  PrioritizedRecallsResult,
  RecallRating,
  getDefaultRecallStyle,
  toDateString,
} from "@/lib/recall/recall-engine";
import {
  generateRecallContent,
  RecallPracticeContent,
} from "@/lib/recall/recall-content-generator";
import { SectionBar } from "@/components/ui/section-bar";
import { Button } from "@/components/ui/button";
import { SoundEngine } from "@/lib/sound-engine";
import { triggerCelebration, triggerFloatingReward } from "@/components/ui/CelebrationOverlay";
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Brain,
  Code,
  Calculator,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Eye,
  EyeOff,
  History,
  Calendar,
  Layers,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";

export default function RecallPage() {
  const { dataStore } = useDataStore();

  const [activeTab, setActiveTab] = React.useState<"queue" | "history">("queue");
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [queueResult, setQueueResult] = React.useState<PrioritizedRecallsResult | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [history, setHistory] = React.useState<RecallHistoryEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  // Card interactive state
  const [revealed, setRevealed] = React.useState(false);
  const [scratchpadText, setScratchpadText] = React.useState("");
  const [sessionCompletedCount, setSessionCompletedCount] = React.useState(0);
  const [sessionRatings, setSessionRatings] = React.useState<Record<RecallRating, number>>({
    forgot: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  // History search & filter
  const [historySearch, setHistorySearch] = React.useState("");
  const [historyCourseFilter, setHistoryCourseFilter] = React.useState<string>("all");

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [cList, prioQueue, histList] = await Promise.all([
        dataStore.getCourses(),
        dataStore.getPrioritizedDailyRecalls(),
        dataStore.getRecallHistory(),
      ]);
      setCourses(cList);
      setQueueResult(prioQueue);
      setHistory(histList);
    } catch (err) {
      console.error("Failed to load recall page data:", err);
    } finally {
      setLoading(false);
    }
  }, [dataStore]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const candidates = queueResult?.dueToday || [];
  const currentCandidate = candidates[currentIndex] || null;

  // Derive course & recall style for current candidate
  const currentCourse = React.useMemo(() => {
    if (!currentCandidate) return null;
    return courses.find((c) => c.id === currentCandidate.courseId) || null;
  }, [courses, currentCandidate]);

  const effectiveStyle: RecallStyle = React.useMemo(() => {
    if (!currentCourse) return "questions";
    if (currentCourse.recallStyle) return currentCourse.recallStyle;
    return getDefaultRecallStyle(currentCourse);
  }, [currentCourse]);

  // Practice exercises for the current candidate
  const practiceContent: RecallPracticeContent | null = React.useMemo(() => {
    if (!currentCandidate) return null;
    return generateRecallContent({
      topicTitle: currentCandidate.title,
      courseCode: currentCandidate.courseCode || currentCourse?.code || "COURSE",
      courseTitle: currentCandidate.courseTitle || currentCourse?.title || "Subject",
      recallStyle: effectiveStyle,
    });
  }, [currentCandidate, currentCourse, effectiveStyle]);

  // Handle student rating on current card
  const handleRate = async (rating: RecallRating) => {
    if (!currentCandidate || submitting) return;

    // Trigger audio & micro-interaction reward
    if (rating === "forgot") {
      SoundEngine.getInstance().playWrong();
    } else if (rating === "hard") {
      SoundEngine.getInstance().playCorrect(1);
      triggerFloatingReward("+10 Recall XP");
    } else if (rating === "good") {
      SoundEngine.getInstance().playCorrect(2);
      triggerFloatingReward("+25 Recall XP");
    } else if (rating === "easy") {
      SoundEngine.getInstance().playCorrect(3);
      triggerFloatingReward("+35 Recall XP");
    }

    try {
      setSubmitting(true);
      const { topic, historyEntry } = await dataStore.recordRecallReview({
        topicId: currentCandidate.topicId,
        rating,
      });

      // Update local session stats
      setSessionCompletedCount((c) => c + 1);
      setSessionRatings((prev) => ({
        ...prev,
        [rating]: prev[rating] + 1,
      }));

      // Add to local history list
      setHistory((prev) => [historyEntry, ...prev]);

      // Move to next card in queue
      setRevealed(false);
      setScratchpadText("");
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);

      // Check if session queue completed
      if (nextIdx >= candidates.length) {
        SoundEngine.getInstance().playMasteryFanfare();
        triggerCelebration({
          title: "Daily Recall Block Complete!",
          subtitle: `Reviewed ${candidates.length} topics on active SM-2 schedule`,
          xp: 50,
        });
        triggerFloatingReward("+50 Queue Bonus XP");
      }
    } catch (err) {
      console.error("Failed to record recall rating:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard navigation for rating: 1 = Forgot, 2 = Hard, 3 = Good, 4 = Easy
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if student is typing inside scratchpad or an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (activeTab !== "queue" || !currentCandidate) return;

      if (e.key === "1") {
        e.preventDefault();
        handleRate("forgot");
      } else if (e.key === "2") {
        e.preventDefault();
        handleRate("hard");
      } else if (e.key === "3") {
        e.preventDefault();
        handleRate("good");
      } else if (e.key === "4") {
        e.preventDefault();
        handleRate("easy");
      } else if (e.key === " " || e.key === "Enter") {
        // Space or Enter toggles reveal
        e.preventDefault();
        setRevealed((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, currentCandidate, revealed, submitting]);

  // Filtered history list
  const filteredHistory = React.useMemo(() => {
    return history.filter((entry) => {
      const matchCourse =
        historyCourseFilter === "all" || entry.courseCode === historyCourseFilter;
      const matchSearch =
        !historySearch.trim() ||
        entry.topicTitle.toLowerCase().includes(historySearch.toLowerCase()) ||
        entry.courseCode.toLowerCase().includes(historySearch.toLowerCase());
      return matchCourse && matchSearch;
    });
  }, [history, historyCourseFilter, historySearch]);

  const uniqueHistoryCourses = React.useMemo(() => {
    const set = new Set<string>();
    history.forEach((h) => {
      if (h.courseCode) set.add(h.courseCode);
    });
    return Array.from(set).sort();
  }, [history]);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <SectionBar className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-[#A51C30]" />
            <span className="font-serif font-bold text-lg text-[#14161F] dark:text-[#F6EBD3]">
              Smart Spaced Recall Engine
            </span>
          </div>
        </SectionBar>
        <div className="p-12 text-center text-sm text-[#4B5160] dark:text-[#CFC8BB] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] rounded-[18px]">
          Loading spaced recall queue...
        </div>
      </div>
    );
  }

  const isQueueComplete = currentIndex >= candidates.length;
  const totalQueueCount = candidates.length;
  const progressPercent =
    totalQueueCount > 0 ? (currentIndex / totalQueueCount) * 100 : 100;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Header Section Bar */}
      <SectionBar className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-[#A51C30]" />
            <h1 className="font-serif font-bold text-lg sm:text-xl text-[#14161F] dark:text-[#F6EBD3]">
              Smart Recall Engine
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#A51C30]/10 text-[#A51C30] dark:text-[#F07B88] dark:bg-[#A51C30]/20 font-sans font-bold uppercase">
              1 · 3 · 7 · 14 Spacing
            </span>
          </div>
          <p className="text-xs text-[#4B5160] dark:text-[#CFC8BB] mt-0.5">
            Active recall with exam-aware compression, style-specific testing, and retention scoring.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-[10px] bg-[#FAF7F2] dark:bg-[#1A1214] border border-[#E4D9C0] dark:border-[#3D2D31]">
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] transition-colors ${
              activeTab === "queue"
                ? "bg-[#A51C30] text-white shadow-xs"
                : "text-[#4B5160] dark:text-[#CFC8BB] hover:text-[#14161F] dark:hover:text-[#F6EBD3]"
            }`}
          >
            Daily Queue ({totalQueueCount - currentIndex} due)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[8px] transition-colors ${
              activeTab === "history"
                ? "bg-[#A51C30] text-white shadow-xs"
                : "text-[#4B5160] dark:text-[#CFC8BB] hover:text-[#14161F] dark:hover:text-[#F6EBD3]"
            }`}
          >
            Recall History ({history.length})
          </button>
        </div>
      </SectionBar>

      {/* Backlog Deferral Notice Banner (if any) */}
      {queueResult && queueResult.backlogNote && activeTab === "queue" && (
        <div className="p-4 rounded-[14px] border border-[#D9A441]/40 bg-[#FFF9ED] dark:bg-[#282116] text-[#7A4F0E] dark:text-[#E8BD65] flex items-start gap-3 text-xs leading-relaxed">
          <Calendar className="h-4 w-4 shrink-0 mt-0.5 text-[#D9A441]" />
          <div>
            <span className="font-bold">Paced Review Schedule:</span>{" "}
            <span>{queueResult.backlogNote}</span>
          </div>
        </div>
      )}

      {/* TAB 1: DAILY QUEUE */}
      {activeTab === "queue" && (
        <div className="space-y-6">
          {totalQueueCount === 0 ? (
            /* Empty Queue State: No reviews due today */
            <div className="p-10 text-center bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] rounded-[18px] space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#5E7B5B]/15 text-[#5E7B5B]">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#14161F] dark:text-[#F6EBD3]">
                  All Recalls Up to Date!
                </h3>
                <p className="text-xs text-[#4B5160] dark:text-[#CFC8BB] max-w-md mx-auto mt-1">
                  You have zero recall reviews due today. All completed topics are safely consolidated
                  or scheduled for their next spaced review interval.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link href="/today">
                  <Button variant="outline" size="sm" className="btn-secondary text-xs">
                    View Today&apos;s Schedule
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button size="sm" className="btn-primary text-xs">
                    Study New Topics
                  </Button>
                </Link>
              </div>
            </div>
          ) : isQueueComplete ? (
            /* Queue Completed State */
            <div className="p-10 text-center bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] rounded-[18px] space-y-5">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#5E7B5B]/15 text-[#5E7B5B]">
                <Flame className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-xl text-[#14161F] dark:text-[#F6EBD3]">
                  Daily Recall Session Finished!
                </h3>
                <p className="text-xs text-[#4B5160] dark:text-[#CFC8BB] max-w-md mx-auto">
                  Outstanding work! You reviewed {sessionCompletedCount} topic{sessionCompletedCount === 1 ? "" : "s"}{" "}
                  today. Your retention records and schedules have been updated.
                </p>
              </div>

              {/* Rating Breakdown for this session */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto pt-2">
                <div className="p-3 rounded-[12px] bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="text-lg font-bold font-sans text-emerald-700 dark:text-emerald-400">
                    {sessionRatings.easy}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    Easy (+50% gap)
                  </div>
                </div>
                <div className="p-3 rounded-[12px] bg-green-500/10 border border-green-500/30 text-center">
                  <div className="text-lg font-bold font-sans text-green-700 dark:text-green-400">
                    {sessionRatings.good}
                  </div>
                  <div className="text-[11px] font-semibold text-green-800 dark:text-green-300">
                    Good (Next stage)
                  </div>
                </div>
                <div className="p-3 rounded-[12px] bg-amber-500/10 border border-amber-500/30 text-center">
                  <div className="text-lg font-bold font-sans text-amber-700 dark:text-amber-400">
                    {sessionRatings.hard}
                  </div>
                  <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                    Hard (2 days)
                  </div>
                </div>
                <div className="p-3 rounded-[12px] bg-red-500/10 border border-red-500/30 text-center">
                  <div className="text-lg font-bold font-sans text-red-700 dark:text-red-400">
                    {sessionRatings.forgot}
                  </div>
                  <div className="text-[11px] font-semibold text-red-800 dark:text-red-300">
                    Forgot (Stage 1)
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <Button
                  onClick={() => setActiveTab("history")}
                  variant="outline"
                  size="sm"
                  className="btn-secondary text-xs gap-1.5"
                >
                  <History className="h-3.5 w-3.5" />
                  <span>View Review History</span>
                </Button>
                <Link href="/today">
                  <Button size="sm" className="btn-primary text-xs gap-1.5">
                    <span>Back to Today Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Active Card in Queue */
            <div className="space-y-4">
              {/* Queue Progress Bar Header */}
              <div className="flex items-center justify-between text-xs font-semibold text-[#4B5160] dark:text-[#CFC8BB]">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-[#14161F] dark:text-[#F6EBD3]">
                    Card {currentIndex + 1} of {totalQueueCount}
                  </span>
                  <span>•</span>
                  <span>{totalQueueCount - currentIndex} remaining today</span>
                </div>
                <span className="tabular-nums">{Math.round(progressPercent)}% completed</span>
              </div>

              <div className="h-2 w-full rounded-full bg-[#E5D5C5]/40 overflow-hidden">
                <div
                  className="h-full bg-[#A51C30] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Main Solid Surface Flashcard */}
              <div className="p-6 sm:p-8 bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] rounded-[18px] shadow-sm space-y-6">
                {/* Card Header & Metadata Badges */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E4D9C0] dark:border-[#3D2D31]">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Course Code Tag */}
                    <span className="px-2.5 py-0.5 rounded-[5px] text-xs font-bold font-sans uppercase bg-[#FAF7F2] dark:bg-[#1A1214] border border-[#E4D9C0] dark:border-[#3D2D31] text-[#14161F] dark:text-[#F6EBD3]">
                      {currentCandidate?.courseCode}
                    </span>

                    {/* Stage Badge */}
                    <span className="px-2 py-0.5 rounded-[5px] text-xs font-bold bg-[#A51C30]/10 text-[#A51C30] dark:text-[#F07B88] dark:bg-[#A51C30]/20">
                      {currentCandidate?.isLightReview
                        ? "Pre-exam Light Review (Weakest 10)"
                        : currentCandidate?.isPreExamRefresh
                        ? "Pre-exam Refresh (D-3)"
                        : `Stage ${currentCandidate?.recallStage || 1} of 4`}
                    </span>

                    {/* Retention Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-[5px] text-xs font-semibold capitalize flex items-center gap-1 ${
                        currentCandidate?.retentionLevel === "green"
                          ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                          : currentCandidate?.retentionLevel === "amber"
                          ? "bg-amber-500/10 text-amber-800 dark:text-amber-300"
                          : currentCandidate?.retentionLevel === "red"
                          ? "bg-red-500/10 text-red-800 dark:text-red-300"
                          : "bg-[#FAF7F2] dark:bg-[#1A1214] text-[#4B5160] dark:text-[#CFC8BB]"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          currentCandidate?.retentionLevel === "green"
                            ? "bg-emerald-600 dark:bg-emerald-400"
                            : currentCandidate?.retentionLevel === "amber"
                            ? "bg-amber-600 dark:bg-amber-400"
                            : currentCandidate?.retentionLevel === "red"
                            ? "bg-red-600 dark:bg-red-400"
                            : "bg-[#8A7C7F]"
                        }`}
                      />
                      <span>Retention: {currentCandidate?.retentionLevel || "none"}</span>
                    </span>
                  </div>

                  {/* Recall Style Indicator */}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4B5160] dark:text-[#CFC8BB]">
                    {effectiveStyle === "problems" && <Calculator className="h-4 w-4 text-[#A51C30]" />}
                    {effectiveStyle === "code" && <Code className="h-4 w-4 text-[#1C5C62] dark:text-[#52ADB5]" />}
                    {effectiveStyle === "vocabulary_and_usage" && <BookOpen className="h-4 w-4 text-[#7A4F0E] dark:text-[#E8BD65]" />}
                    {effectiveStyle === "questions" && <HelpCircle className="h-4 w-4 text-[#5E7B5B]" />}
                    <span className="capitalize">
                      {effectiveStyle === "vocabulary_and_usage" ? "Vocabulary & Usage" : effectiveStyle} Style
                    </span>
                  </div>
                </div>

                {/* Topic Title */}
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-[#8A7C7F] dark:text-[#A89B9E]">
                    {currentCandidate?.courseTitle}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#14161F] dark:text-[#F6EBD3] mt-1 leading-snug">
                    {currentCandidate?.title}
                  </h2>
                </div>

                {/* Style-Specific Practice Prompt Area */}
                {practiceContent && (
                  <div className="space-y-4">
                    {/* 1. MATHEMATICS (PROBLEMS) */}
                    {practiceContent.style === "problems" && practiceContent.problems && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-[12px] bg-[#FAF7F2] dark:bg-[#1A1214] border border-[#E4D9C0] dark:border-[#3D2D31] space-y-3">
                          <span className="text-xs font-bold text-[#A51C30] dark:text-[#F07B88] uppercase tracking-wide">
                            Practice Problems (Solve on scratchpad before revealing)
                          </span>
                          <div className="space-y-3">
                            {practiceContent.problems.map((prob) => (
                              <div key={prob.id} className="text-xs space-y-1.5">
                                <div className="font-semibold text-[#14161F] dark:text-[#F6EBD3]">
                                  Problem {prob.problemNumber}: {prob.statement}
                                </div>
                                {prob.hint && (
                                  <div className="text-[11px] text-[#4B5160] dark:text-[#CFC8BB] italic">
                                    Hint: {prob.hint}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Working Scratchpad */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs text-[#4B5160] dark:text-[#CFC8BB]">
                            <span className="font-semibold">Scratchpad / Working Area:</span>
                            {scratchpadText && (
                              <button
                                type="button"
                                onClick={() => setScratchpadText("")}
                                className="text-[11px] hover:underline text-[#8A7C7F]"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <textarea
                            value={scratchpadText}
                            onChange={(e) => setScratchpadText(e.target.value)}
                            placeholder="Write your calculations, equations, or reasoning here..."
                            rows={3}
                            className="w-full text-xs font-mono p-3 rounded-[10px] bg-white dark:bg-[#150F11] border border-[#E4D9C0] dark:border-[#3D2D31] text-[#14161F] dark:text-[#F6EBD3] focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
                          />
                        </div>

                        {/* Reveal Step-by-Step Solutions Toggle */}
                        <div className="pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setRevealed((v) => !v)}
                            className="btn-secondary text-xs gap-1.5"
                          >
                            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            <span>{revealed ? "Hide Solutions" : "Reveal Step-by-Step Solutions (Space)"}</span>
                          </Button>

                          {revealed && (
                            <div className="mt-3 p-4 rounded-[12px] bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-3">
                              <span className="font-bold text-emerald-800 dark:text-emerald-300 block uppercase tracking-wide">
                                Verified Solutions:
                              </span>
                              {practiceContent.problems.map((prob) => (
                                <div key={prob.id} className="space-y-1">
                                  <span className="font-semibold text-[#14161F] dark:text-[#F6EBD3]">
                                    Problem {prob.problemNumber} Solution:
                                  </span>
                                  <pre className="whitespace-pre-wrap font-sans text-xs text-[#4B5160] dark:text-[#CFC8BB]">
                                    {prob.solution}
                                  </pre>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 2. COMPUTER SCIENCE (CODE FROM MEMORY) */}
                    {practiceContent.style === "code" && practiceContent.code && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-[12px] bg-[#FAF7F2] dark:bg-[#1A1214] border border-[#E4D9C0] dark:border-[#3D2D31] space-y-2">
                          <span className="text-xs font-bold text-[#1C5C62] dark:text-[#52ADB5] uppercase tracking-wide">
                            Code from Memory Challenge
                          </span>
                          <p className="text-xs font-medium text-[#14161F] dark:text-[#F6EBD3]">
                            {practiceContent.code.prompt}
                          </p>
                          <div className="text-[11px] text-[#4B5160] dark:text-[#CFC8BB]">
                            Invariants: {practiceContent.code.keyInvariants.join(" • ")}
                          </div>
                        </div>

                        {/* Monospace Code Editor Area */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-[#4B5160] dark:text-[#CFC8BB]">
                            Your Code:
                          </span>
                          <textarea
                            value={scratchpadText || practiceContent.code.starterSignature}
                            onChange={(e) => setScratchpadText(e.target.value)}
                            rows={6}
                            spellCheck={false}
                            className="w-full text-xs font-mono p-3 rounded-[10px] bg-white dark:bg-[#150F11] border border-[#E4D9C0] dark:border-[#3D2D31] text-[#14161F] dark:text-[#F6EBD3] focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
                          />
                        </div>

                        {/* Reveal Reference Implementation */}
                        <div className="pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setRevealed((v) => !v)}
                            className="btn-secondary text-xs gap-1.5"
                          >
                            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            <span>{revealed ? "Hide Reference Code" : "Check Reference Code (Space)"}</span>
                          </Button>

                          {revealed && (
                            <div className="mt-3 p-4 rounded-[12px] bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                              <span className="font-bold text-emerald-800 dark:text-emerald-300 block uppercase tracking-wide">
                                Reference Solution:
                              </span>
                              <pre className="font-mono text-xs p-3 rounded-[8px] bg-black/10 dark:bg-black/30 overflow-x-auto text-[#14161F] dark:text-[#F6EBD3]">
                                {practiceContent.code.referenceCode}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 3. VOCABULARY & USAGE (ENGLISH) */}
                    {practiceContent.style === "vocabulary_and_usage" && practiceContent.vocabulary && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-[12px] bg-[#FAF7F2] dark:bg-[#1A1214] border border-[#E4D9C0] dark:border-[#3D2D31] space-y-2">
                          <span className="text-xs font-bold text-[#7A4F0E] dark:text-[#E8BD65] uppercase tracking-wide">
                            Academic Vocabulary & Contextual Usage
                          </span>
                          {practiceContent.vocabulary.map((v, i) => (
                            <div key={i} className="text-xs space-y-1">
                              <p className="font-semibold text-[#14161F] dark:text-[#F6EBD3]">
                                {v.contextPrompt}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Student definition/sentence input */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-[#4B5160] dark:text-[#CFC8BB]">
                            Your Definition & Example Sentence:
                          </span>
                          <textarea
                            value={scratchpadText}
                            onChange={(e) => setScratchpadText(e.target.value)}
                            placeholder="Draft your academic definition and an example sentence..."
                            rows={3}
                            className="w-full text-xs p-3 rounded-[10px] bg-white dark:bg-[#150F11] border border-[#E4D9C0] dark:border-[#3D2D31] text-[#14161F] dark:text-[#F6EBD3] focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
                          />
                        </div>

                        {/* Reveal Exemplar */}
                        <div className="pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setRevealed((v) => !v)}
                            className="btn-secondary text-xs gap-1.5"
                          >
                            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            <span>{revealed ? "Hide Model Definition" : "Reveal Model Definition & Exemplar (Space)"}</span>
                          </Button>

                          {revealed && (
                            <div className="mt-3 p-4 rounded-[12px] bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                              {practiceContent.vocabulary.map((v, i) => (
                                <div key={i} className="space-y-1.5">
                                  <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                                    Model Academic Definition:
                                  </div>
                                  <p className="text-[#14161F] dark:text-[#F6EBD3]">{v.modelDefinition}</p>
                                  <div className="font-semibold text-emerald-900 dark:text-emerald-200 pt-1">
                                    Exemplar Sentence:
                                  </div>
                                  <p className="italic text-[#4B5160] dark:text-[#CFC8BB]">&ldquo;{v.exemplarSentence}&rdquo;</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 4. CONCEPTUAL QUESTIONS (SCIENCE / ENGINEERING) */}
                    {practiceContent.style === "questions" && practiceContent.questions && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-[12px] bg-[#FAF7F2] dark:bg-[#1A1214] border border-[#E4D9C0] dark:border-[#3D2D31] space-y-3">
                          <span className="text-xs font-bold text-[#5E7B5B] uppercase tracking-wide">
                            Conceptual Recall Questions
                          </span>
                          <div className="space-y-3">
                            {practiceContent.questions.map((q) => (
                              <div key={q.questionNumber} className="text-xs space-y-1">
                                <div className="font-semibold text-[#14161F] dark:text-[#F6EBD3]">
                                  Q{q.questionNumber}: {q.question}
                                </div>
                                <div className="text-[11px] text-[#4B5160] dark:text-[#CFC8BB]">
                                  Goal: {q.promptGoal}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Working thoughts */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-[#4B5160] dark:text-[#CFC8BB]">
                            Your Key Points / Response:
                          </span>
                          <textarea
                            value={scratchpadText}
                            onChange={(e) => setScratchpadText(e.target.value)}
                            placeholder="Jot down the governing principle, boundary conditions, and core mechanisms..."
                            rows={3}
                            className="w-full text-xs p-3 rounded-[10px] bg-white dark:bg-[#150F11] border border-[#E4D9C0] dark:border-[#3D2D31] text-[#14161F] dark:text-[#F6EBD3] focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
                          />
                        </div>

                        {/* Reveal Model Answers */}
                        <div className="pt-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setRevealed((v) => !v)}
                            className="btn-secondary text-xs gap-1.5"
                          >
                            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            <span>{revealed ? "Hide Explanations" : "Reveal Model Answers (Space)"}</span>
                          </Button>

                          {revealed && (
                            <div className="mt-3 p-4 rounded-[12px] bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-3">
                              <span className="font-bold text-emerald-800 dark:text-emerald-300 block uppercase tracking-wide">
                                Model Conceptual Answers:
                              </span>
                              {practiceContent.questions.map((q) => (
                                <div key={q.questionNumber} className="space-y-1">
                                  <span className="font-semibold text-[#14161F] dark:text-[#F6EBD3]">
                                    Q{q.questionNumber} Explanation:
                                  </span>
                                  <p className="text-[#4B5160] dark:text-[#CFC8BB]">{q.modelAnswer}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Rating Bar (Forgot, Hard, Good, Easy) */}
                <div className="pt-4 border-t border-[#E4D9C0] dark:border-[#3D2D31] space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#4B5160] dark:text-[#CFC8BB]">
                    <span className="font-semibold">Rate Your Active Recall (Keyboard 1–4):</span>
                    <span className="text-[11px] text-[#8A7C7F]">
                      Score: {currentCandidate?.topicScore || 0}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* 1. FORGOT */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleRate("forgot")}
                      className="p-3 rounded-[12px] border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-left transition-colors cursor-pointer group"
                      title="Hotkey: 1 - Restart at stage 1 tomorrow, retention marked red"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-red-800 dark:text-red-300">
                          [1] Forgot
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-900 dark:text-red-200 font-bold">
                          -5 pts
                        </span>
                      </div>
                      <div className="text-[11px] text-red-700/80 dark:text-red-300/80 mt-1">
                        Restart Stage 1 (tomorrow)
                      </div>
                    </button>

                    {/* 2. HARD */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleRate("hard")}
                      className="p-3 rounded-[12px] border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left transition-colors cursor-pointer group"
                      title="Hotkey: 2 - Repeat same stage in 2 days, retention marked amber"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-amber-800 dark:text-amber-300">
                          [2] Hard
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 font-bold">
                          +2 pts
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1">
                        Repeat in 2 days
                      </div>
                    </button>

                    {/* 3. GOOD */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleRate("good")}
                      className="p-3 rounded-[12px] border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-left transition-colors cursor-pointer group"
                      title="Hotkey: 3 - Advance to next stage in standard gap"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-green-800 dark:text-green-300">
                          [3] Good
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-green-500/20 text-green-900 dark:text-green-200 font-bold">
                          +5 pts
                        </span>
                      </div>
                      <div className="text-[11px] text-green-700/80 dark:text-green-300/80 mt-1">
                        Next stage (standard)
                      </div>
                    </button>

                    {/* 4. EASY */}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleRate("easy")}
                      className="p-3 rounded-[12px] border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition-colors cursor-pointer group"
                      title="Hotkey: 4 - Advance to next stage + 50% extra gap"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                          [4] Easy
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 font-bold">
                          +8 pts
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                        Next stage (+50% gap)
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RECALL HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] rounded-[14px] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search topic or course..."
                className="px-3 py-1.5 rounded-[8px] border border-[#E4D9C0] dark:border-[#3D2D31] bg-white dark:bg-[#150F11] text-xs text-[#14161F] dark:text-[#F6EBD3] focus:outline-none"
              />

              <select
                value={historyCourseFilter}
                onChange={(e) => setHistoryCourseFilter(e.target.value)}
                className="px-3 py-1.5 rounded-[8px] border border-[#E4D9C0] dark:border-[#3D2D31] bg-white dark:bg-[#150F11] text-xs text-[#14161F] dark:text-[#F6EBD3] focus:outline-none"
              >
                <option value="all">All Courses ({uniqueHistoryCourses.length})</option>
                {uniqueHistoryCourses.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-xs font-semibold text-[#4B5160] dark:text-[#CFC8BB]">
              Showing {filteredHistory.length} review{filteredHistory.length === 1 ? "" : "s"}
            </span>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-10 text-center bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] rounded-[18px] text-xs text-[#4B5160] dark:text-[#CFC8BB]">
              No recall reviews recorded yet. Complete reviews in the Daily Queue to build your verified retention history.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[14px] border border-[#E4D9C0] dark:border-[#3D2D31] bg-[#FBF6EC] dark:bg-[#221A1C]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4D9C0] dark:border-[#3D2D31] bg-[#FAF7F2] dark:bg-[#1A1214] font-serif font-bold text-[#14161F] dark:text-[#F6EBD3]">
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Course</th>
                    <th className="p-3">Topic Title</th>
                    <th className="p-3">Stage</th>
                    <th className="p-3">Rating</th>
                    <th className="p-3">Retention Shift</th>
                    <th className="p-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4D9C0]/60 dark:divide-[#3D2D31]/60 text-[#14161F] dark:text-[#F6EBD3]">
                  {filteredHistory.map((item) => {
                    const scoreDelta = item.scoreAfter - item.scoreBefore;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#FAF7F2]/60 dark:hover:bg-[#1A1214]/60 transition-colors"
                      >
                        <td className="p-3 font-mono text-[11px] text-[#4B5160] dark:text-[#CFC8BB] whitespace-nowrap">
                          {item.reviewedAt ? new Date(item.reviewedAt).toLocaleString() : item.date}
                        </td>
                        <td className="p-3 font-bold whitespace-nowrap font-sans">
                          {item.courseCode}
                        </td>
                        <td className="p-3 font-medium max-w-xs truncate" title={item.topicTitle}>
                          {item.topicTitle}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-[#FAF7F2] dark:bg-[#1A1214] border border-[#E4D9C0] dark:border-[#3D2D31] text-[11px] font-semibold">
                            Stage {item.stage}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                              item.rating === "easy"
                                ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                                : item.rating === "good"
                                ? "bg-green-500/15 text-green-800 dark:text-green-300"
                                : item.rating === "hard"
                                ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                                : "bg-red-500/15 text-red-800 dark:text-red-300"
                            }`}
                          >
                            {item.rating}
                          </span>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="capitalize text-[#8A7C7F]">{item.previousRetention}</span>
                            <span className="text-[#8A7C7F]">→</span>
                            <span
                              className={`font-bold capitalize ${
                                item.newRetention === "green"
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : item.newRetention === "amber"
                                  ? "text-amber-700 dark:text-amber-400"
                                  : "text-red-700 dark:text-red-400"
                              }`}
                            >
                              {item.newRetention}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right tabular-nums whitespace-nowrap">
                          <span className="font-bold">{item.scoreAfter}</span>
                          <span
                            className={`ml-1 text-[11px] font-semibold ${
                              scoreDelta >= 0 ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            ({scoreDelta >= 0 ? `+${scoreDelta}` : scoreDelta})
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
