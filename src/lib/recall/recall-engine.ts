/**
 * Smart Recall Engine (Pure TypeScript)
 * Implements spaced recall scheduling (1, 3, 7, 14 days),
 * ratings (Forgot, Hard, Good, Easy), exam-aware compression & refresh,
 * daily capping with backlog deferral, and exam readiness forecasting.
 */

export const DEFAULT_RECALL_INTERVALS = [1, 3, 7, 14] as const;
export const DEFAULT_DAILY_CAP = 20;

export type RecallRating = "forgot" | "hard" | "good" | "easy";
export type RetentionLevel = "green" | "amber" | "red" | "none";
export type RecallStyle = "problems" | "questions" | "code" | "vocabulary_and_usage";

export interface ScheduledRecall {
  nextDueDate: string;       // YYYY-MM-DD
  nextStage: number;         // 1, 2, 3, 4, or 5 (Consolidated)
  gapDays: number;
  retentionLevel: RetentionLevel;
  isConsolidated: boolean;
  isPreExamRefresh?: boolean;
  isLightReview?: boolean;
  scoreAdjustment: number;
  newScore: number;
}

export interface RecallCandidate {
  topicId: string;
  courseId: string;
  unitId: string;
  title: string;
  recallDueAt: string;       // YYYY-MM-DD
  recallStage: number;       // 1, 2, 3, 4
  retentionLevel: RetentionLevel;
  topicScore: number;
  isDone: boolean;
  isConsolidated?: boolean;
  isLightReview?: boolean;
  isPreExamRefresh?: boolean;
  courseCode?: string;
  courseTitle?: string;
}

export interface PrioritizedRecallsResult {
  dueToday: RecallCandidate[];
  deferredBacklog: RecallCandidate[];
  totalOverdue: number;
  backlogCount: number;
  backlogNote?: string;
}

export interface ReadinessForecast {
  totalTopics: number;
  topicsRecalled: number;
  unreviewedTopics: number;
  daysToExam: number;
  daysToRefreshCutoff: number; // exam - 3 days
  forecastPercent: number;    // % topics expected to have >=1 recall by exam - 3 days
  requiredPerDay: number;
  isBehind: boolean;
  statusSentence: string;
  warningNote?: string;
}

/**
 * Format a Date to YYYY-MM-DD string in UTC/local calendar day
 */
export function toDateString(d: Date | string): string {
  if (typeof d === "string") {
    return d.split("T")[0];
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date object at midnight local time
 */
export function parseDateString(str: string): Date {
  const [y, m, d] = str.split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Add days to a date string or Date object, returning YYYY-MM-DD
 */
export function addDays(base: Date | string, days: number): string {
  const dt = typeof base === "string" ? parseDateString(base) : new Date(base.getTime());
  dt.setDate(dt.getDate() + days);
  return toDateString(dt);
}

/**
 * Difference in calendar days between date A and date B (A - B)
 */
export function diffCalendarDays(a: Date | string, b: Date | string): number {
  const dtA = typeof a === "string" ? parseDateString(a) : new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const dtB = typeof b === "string" ? parseDateString(b) : new Date(b.getFullYear(), b.getMonth(), b.getDate());
  const diffTime = dtA.getTime() - dtB.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Derive the default recall style for a course based on its code, department, and title
 */
export function getDefaultRecallStyle(course: { code?: string; department?: string; title?: string }): RecallStyle {
  const code = (course.code || "").toUpperCase();
  const dept = (course.department || "").toLowerCase();
  const title = (course.title || "").toLowerCase();

  if (
    code.startsWith("MA") ||
    dept.includes("math") ||
    title.includes("calculus") ||
    title.includes("matrix") ||
    title.includes("algebra")
  ) {
    return "problems";
  }
  if (
    code.startsWith("CS") ||
    dept.includes("computer") ||
    dept.includes("cse") ||
    title.includes("programming") ||
    title.includes("data structure") ||
    title.includes("python") ||
    title.includes("problem solving")
  ) {
    return "code";
  }
  if (
    code.startsWith("EN") ||
    dept.includes("humanities") ||
    dept.includes("english") ||
    title.includes("english") ||
    title.includes("communication")
  ) {
    return "vocabulary_and_usage";
  }
  return "questions";
}

/**
 * Adjusts a prospective due date to respect exam constraints:
 * 1. No recall may fall on the exam day (D_exam).
 * 2. Any recall that would land after D_exam - 2 days is pulled forward to D_exam - 2 days.
 * 3. Compresses remaining stages evenly between today and D_exam - 2 days if needed.
 */
export function applyExamConstraints(options: {
  prospectiveDate: string; // YYYY-MM-DD
  today: string;           // YYYY-MM-DD
  examDate?: string;       // YYYY-MM-DD
  stage: number;
  totalStages?: number;
}): { nextDueDate: string; isCompressed: boolean; isPreExamRefresh?: boolean } {
  const { prospectiveDate, today, examDate, stage, totalStages = 4 } = options;
  if (!examDate) {
    return { nextDueDate: prospectiveDate, isCompressed: false };
  }

  const daysToExam = diffCalendarDays(examDate, today);

  // If exam has already passed, use standard date
  if (daysToExam < 0) {
    return { nextDueDate: prospectiveDate, isCompressed: false };
  }

  // Pre-exam cutoff date: Exam date minus 2 days
  const cutoffDate = addDays(examDate, -2);
  const daysToCutoff = diffCalendarDays(cutoffDate, today);

  // Pre-exam refresh is at Exam date minus 3 days
  const refreshDate = addDays(examDate, -3);

  // 1. If today is exam day or after, no recalls on exam day
  if (prospectiveDate === examDate) {
    // Pull forward to cutoffDate if before, else today if today < examDate
    const adjusted = daysToCutoff >= 0 ? cutoffDate : addDays(examDate, -1);
    return { nextDueDate: adjusted, isCompressed: true };
  }

  // 2. If prospective date lands after cutoff date (D_exam - 2)
  if (diffCalendarDays(prospectiveDate, cutoffDate) > 0) {
    if (daysToCutoff <= 0) {
      // Very close to exam (<= 2 days), pull to today
      return { nextDueDate: today, isCompressed: true };
    }

    // Compress evenly across remaining stages
    const remainingStages = Math.max(1, totalStages - stage + 1);
    const compressedStep = Math.max(1, Math.floor(daysToCutoff / remainingStages));
    const compressedDate = addDays(today, compressedStep);

    // Ensure it doesn't overshoot cutoff or land on exam day
    const finalDate = diffCalendarDays(compressedDate, cutoffDate) > 0 ? cutoffDate : compressedDate;
    return { nextDueDate: finalDate, isCompressed: true };
  }

  return { nextDueDate: prospectiveDate, isCompressed: false };
}

/**
 * Schedules the initial recall for a topic when it first reaches Done (score >= 70).
 * Default intervals: [1, 3, 7, 14]
 */
export function scheduleInitialRecall(options: {
  completedAt: Date | string;
  intervals?: readonly number[];
  examDate?: string;
}): ScheduledRecall {
  const { completedAt, intervals = DEFAULT_RECALL_INTERVALS, examDate } = options;
  const completedDateStr = toDateString(completedAt);
  const firstInterval = intervals[0] || 1;
  const rawDueDate = addDays(completedDateStr, firstInterval);

  const { nextDueDate } = applyExamConstraints({
    prospectiveDate: rawDueDate,
    today: completedDateStr,
    examDate,
    stage: 1,
    totalStages: intervals.length,
  });

  return {
    nextDueDate,
    nextStage: 1,
    gapDays: diffCalendarDays(nextDueDate, completedDateStr),
    retentionLevel: "green",
    isConsolidated: false,
    scoreAdjustment: 0,
    newScore: 70,
  };
}

/**
 * Processes a student's self-rating on a recall test and calculates the next schedule.
 * Ratings:
 * - Forgot: restart at stage 1 tomorrow (gap = 1 day), retention = red
 * - Hard: repeat same stage in 2 days (gap = 2 days), retention = amber
 * - Good: next stage (intervals[nextStage - 1]), retention = green
 * - Easy: next stage and add 50% to the next gap, retention = green
 * After stage 14 (stage 4): Topic is "Consolidated".
 */
export function processRecallRating(options: {
  currentStage: number; // 1, 2, 3, 4
  rating: RecallRating;
  intervals?: readonly number[];
  today?: Date | string;
  examDate?: string;
  currentScore?: number;
}): ScheduledRecall {
  const {
    currentStage,
    rating,
    intervals = DEFAULT_RECALL_INTERVALS,
    today = new Date(),
    examDate,
    currentScore = 70,
  } = options;

  const todayStr = toDateString(today);
  const totalStages = intervals.length; // 4

  let nextStage = currentStage;
  let gapDays = 1;
  let retentionLevel: RetentionLevel = "green";
  let isConsolidated = false;
  let scoreAdjustment = 0;

  switch (rating) {
    case "forgot": {
      // Restart at stage 1 (tomorrow)
      nextStage = 1;
      gapDays = 1;
      retentionLevel = "red";
      scoreAdjustment = -10;
      break;
    }
    case "hard": {
      // Repeat the same stage in 2 days
      nextStage = currentStage;
      gapDays = 2;
      retentionLevel = "amber";
      scoreAdjustment = 2;
      break;
    }
    case "good": {
      // Next stage
      nextStage = currentStage + 1;
      retentionLevel = "green";
      scoreAdjustment = 5;

      if (nextStage > totalStages) {
        isConsolidated = true;
        gapDays = 90; // Consolidated: maintenance review far in future
      } else {
        gapDays = intervals[nextStage - 1] || 14;
      }
      break;
    }
    case "easy": {
      // Next stage and add 50% to the next gap
      nextStage = currentStage + 1;
      retentionLevel = "green";
      scoreAdjustment = 8;

      if (nextStage > totalStages) {
        isConsolidated = true;
        gapDays = 120;
      } else {
        const standardGap = intervals[nextStage - 1] || 14;
        gapDays = Math.round(standardGap * 1.5);
      }
      break;
    }
  }

  // Raw next due date
  let prospectiveDueDate = addDays(todayStr, gapDays);

  // If not consolidated and exam date is present, apply exam constraints
  if (!isConsolidated && examDate) {
    const constraintResult = applyExamConstraints({
      prospectiveDate: prospectiveDueDate,
      today: todayStr,
      examDate,
      stage: nextStage,
      totalStages,
    });
    prospectiveDueDate = constraintResult.nextDueDate;
    gapDays = Math.max(1, diffCalendarDays(prospectiveDueDate, todayStr));
  }

  const newScore = Math.min(100, Math.max(40, currentScore + scoreAdjustment));

  return {
    nextDueDate: prospectiveDueDate,
    nextStage,
    gapDays,
    retentionLevel,
    isConsolidated,
    scoreAdjustment,
    newScore,
  };
}

/**
 * Filters and prioritizes topics due for daily recall with daily cap & backlog deferral.
 * Ordering rules:
 * 1. Overdue first (due < today, descending days overdue)
 * 2. Topics of the nearest exam
 * 3. Lowest retention (red < amber < green, then lowest score)
 *
 * Exam day rules:
 * - If today is exam day (examDate === today): 0 recalls for that course.
 * - If today is the day before exam (examDate === today + 1): shows ONLY a light recall of the 10 weakest topics.
 */
export function prioritizeDailyRecalls(options: {
  candidates: RecallCandidate[];
  examDatesByCourse?: Record<string, string>; // courseId -> YYYY-MM-DD
  dailyCap?: number;
  today?: Date | string;
}): PrioritizedRecallsResult {
  const {
    candidates,
    examDatesByCourse = {},
    dailyCap = DEFAULT_DAILY_CAP,
    today = new Date(),
  } = options;

  const todayStr = toDateString(today);

  // 1. Filter out consolidated topics
  const activeCandidates = candidates.filter((c) => !c.isConsolidated);

  // 2. Filter topics based on exam-day rules
  const eligibleCandidates: Array<RecallCandidate & { isLightReview?: boolean }> = [];

  for (const item of activeCandidates) {
    const courseExamDate = examDatesByCourse[item.courseId];
    if (courseExamDate) {
      const daysToExam = diffCalendarDays(courseExamDate, todayStr);

      // On exam day (daysToExam === 0): No recalls for this course
      if (daysToExam === 0) {
        continue;
      }

      // Day before exam (daysToExam === 1): Only top 10 weakest topics of this course are eligible
      if (daysToExam === 1) {
        // Will handle filtering weakest 10 below
        continue;
      }
    }

    // Is the topic due on or before today?
    if (item.recallDueAt && item.recallDueAt <= todayStr) {
      eligibleCandidates.push(item);
    }
  }

  // Handle day before exam for each course (light recall of weakest 10 topics)
  Object.entries(examDatesByCourse).forEach(([courseId, examDateStr]) => {
    const daysToExam = diffCalendarDays(examDateStr, todayStr);
    if (daysToExam === 1) {
      // Find all topics of this course, sort by score ascending (weakest first)
      const courseTopics = activeCandidates
        .filter((c) => c.courseId === courseId)
        .sort((a, b) => a.topicScore - b.topicScore)
        .slice(0, 10);

      courseTopics.forEach((t) => {
        eligibleCandidates.push({ ...t, isLightReview: true });
      });
    }
  });

  // Calculate overdue count
  const totalOverdue = eligibleCandidates.filter((c) => c.recallDueAt < todayStr).length;

  // 3. Sort by priority
  eligibleCandidates.sort((a, b) => {
    const aDueDiff = diffCalendarDays(todayStr, a.recallDueAt); // >0 if overdue
    const bDueDiff = diffCalendarDays(todayStr, b.recallDueAt);

    const aIsOverdue = aDueDiff > 0;
    const bIsOverdue = bDueDiff > 0;

    // Rule 1: Overdue first (descending by days overdue)
    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;
    if (aIsOverdue && bIsOverdue && aDueDiff !== bDueDiff) {
      return bDueDiff - aDueDiff;
    }

    // Rule 2: Nearest exam date
    const aExamDate = examDatesByCourse[a.courseId];
    const bExamDate = examDatesByCourse[b.courseId];

    if (aExamDate && !bExamDate) return -1;
    if (!aExamDate && bExamDate) return 1;
    if (aExamDate && bExamDate && aExamDate !== bExamDate) {
      return aExamDate.localeCompare(bExamDate);
    }

    // Rule 3: Lowest retention (red < amber < green < none)
    const retentionRank: Record<RetentionLevel, number> = {
      red: 0,
      amber: 1,
      none: 2,
      green: 3,
    };
    const aRank = retentionRank[a.retentionLevel || "none"];
    const bRank = retentionRank[b.retentionLevel || "none"];
    if (aRank !== bRank) {
      return aRank - bRank;
    }

    // Tie-breaker: lowest topic score
    return a.topicScore - b.topicScore;
  });

  // 4. Apply daily cap
  const dueToday = eligibleCandidates.slice(0, dailyCap);
  const deferredBacklog = eligibleCandidates.slice(dailyCap);
  const backlogCount = deferredBacklog.length;

  let backlogNote: string | undefined;
  if (backlogCount > 0) {
    backlogNote = `Backlog: ${backlogCount} topic${backlogCount === 1 ? "" : "s"} deferred to the next 2 days to keep your daily recall focused on highest-priority reviews.`;
  }

  return {
    dueToday,
    deferredBacklog,
    totalOverdue,
    backlogCount,
    backlogNote,
  };
}

/**
 * Calculates the Exam Readiness Forecast for a course.
 * Predicts whether the student will cover topics with at least one recall by D_exam - 3 days.
 */
export function calculateExamReadinessForecast(options: {
  totalTopics: number;
  topicsRecalled: number;     // topics with at least 1 recall completed
  examDate: string;           // YYYY-MM-DD
  today?: Date | string;
  currentPace?: number;       // topics completed/recalled per day (default 1.5)
}): ReadinessForecast {
  const {
    totalTopics,
    topicsRecalled,
    examDate,
    today = new Date(),
    currentPace = 1.5,
  } = options;

  const todayStr = toDateString(today);
  const daysToExam = diffCalendarDays(examDate, todayStr);
  const refreshCutoffDate = addDays(examDate, -3);
  const daysToRefreshCutoff = Math.max(0, diffCalendarDays(refreshCutoffDate, todayStr));

  const unreviewedTopics = Math.max(0, totalTopics - topicsRecalled);

  // Projected recalls completed by refresh cut-off date at current pace
  const projectedNew = Math.floor(currentPace * daysToRefreshCutoff);
  const projectedTotal = Math.min(totalTopics, topicsRecalled + projectedNew);
  const forecastPercent = totalTopics > 0 ? Math.round((projectedTotal / totalTopics) * 100) : 100;

  // Required daily pace to finish all remaining topics by cut-off date
  const requiredPerDay = daysToRefreshCutoff > 0 ? Math.ceil(unreviewedTopics / daysToRefreshCutoff) : unreviewedTopics;

  const isBehind = forecastPercent < 85 && unreviewedTopics > 0;

  let statusSentence = "";
  let warningNote: string | undefined;

  if (unreviewedTopics === 0) {
    statusSentence = "100% of topics have completed verified recall. Fully on track for examination!";
  } else if (daysToRefreshCutoff <= 0) {
    statusSentence = `${unreviewedTopics} topic${unreviewedTopics === 1 ? "" : "s"} unreviewed before exam refresh cut-off. Focus on light high-yield recall.`;
    if (isBehind) {
      warningNote = `Exam is in ${daysToExam} days. ${unreviewedTopics} topics need immediate review.`;
    }
  } else {
    statusSentence = `Learn and review ${requiredPerDay} new topic${requiredPerDay === 1 ? "" : "s"} per day for the next ${daysToRefreshCutoff} days.`;
    if (isBehind) {
      warningNote = `Warning: At your current pace (${currentPace}/day), only ${forecastPercent}% of syllabus topics will have verified recall before the pre-exam refresh.`;
    }
  }

  return {
    totalTopics,
    topicsRecalled,
    unreviewedTopics,
    daysToExam,
    daysToRefreshCutoff,
    forecastPercent,
    requiredPerDay,
    isBehind,
    statusSentence,
    warningNote,
  };
}
