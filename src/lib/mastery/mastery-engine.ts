/**
 * Pure Topic Mastery & Academic Rollup Engine
 * All grading and mastery formulas are pure functions with zero external dependencies.
 */

export interface TopicScoreInput {
  watchScore: number;
  checkScore: number;
}

export interface TopicMasteryResult {
  watchScore: number;
  checkScore: number;
  topicScore: number;
  isDone: boolean;
  status: "not_started" | "learning" | "done";
}

/**
 * Calculates mastery score for a single topic.
 * Watch score: 0 to 40 points
 * Check score: 0 to 60 points
 * Topic score: sum of watch and check (0 to 100)
 * Done threshold: >= 70 points
 */
export function calculateTopicMastery(
  watchScore: number,
  checkScore: number
): TopicMasteryResult {
  const cleanWatch = Math.min(40, Math.max(0, Math.round(watchScore || 0)));
  const cleanCheck = Math.min(60, Math.max(0, Math.round(checkScore || 0)));
  const topicScore = Math.min(100, cleanWatch + cleanCheck);
  const isDone = topicScore >= 70;

  let status: "not_started" | "learning" | "done" = "not_started";
  if (isDone) {
    status = "done";
  } else if (topicScore > 0) {
    status = "learning";
  }

  return {
    watchScore: cleanWatch,
    checkScore: cleanCheck,
    topicScore,
    isDone,
    status,
  };
}

export interface UnitTopicItem {
  id: string;
  topicScore: number;
  isDone: boolean;
  isSelectedExperiment?: boolean;
}

export interface UnitMasteryResult {
  score: number;
  completedTopics: number;
  totalTopics: number;
  isCompleted: boolean;
}

/**
 * Calculates unit score as the average of its topics.
 * For lab elective sections ("any N experiments"), only counts selected experiments.
 */
export function calculateUnitMastery(
  topics: UnitTopicItem[],
  electiveExperimentsCount?: number | null
): UnitMasteryResult {
  if (!topics || topics.length === 0) {
    return { score: 0, completedTopics: 0, totalTopics: 0, isCompleted: false };
  }

  // Filter topics if elective lab requirement is active
  const isElective =
    typeof electiveExperimentsCount === "number" && electiveExperimentsCount > 0;

  const relevantTopics = isElective
    ? topics.filter((t) => t.isSelectedExperiment !== false)
    : topics;

  if (relevantTopics.length === 0) {
    return { score: 0, completedTopics: 0, totalTopics: 0, isCompleted: false };
  }

  const targetCount = isElective
    ? Math.min(electiveExperimentsCount, relevantTopics.length)
    : relevantTopics.length;

  const totalScore = relevantTopics.reduce((acc, t) => acc + (t.topicScore || 0), 0);
  const avgScore = Math.round(totalScore / relevantTopics.length);
  const completedCount = relevantTopics.filter((t) => t.isDone).length;

  const isCompleted = completedCount >= targetCount && avgScore >= 70;

  return {
    score: avgScore,
    completedTopics: completedCount,
    totalTopics: targetCount,
    isCompleted,
  };
}

/**
 * Calculates course score as the arithmetic average of its units.
 */
export function calculateCourseMastery(unitScores: number[]): {
  courseScore: number;
  completedUnits: number;
  totalUnits: number;
} {
  if (!unitScores || unitScores.length === 0) {
    return { courseScore: 0, completedUnits: 0, totalUnits: 0 };
  }

  const total = unitScores.reduce((acc, s) => acc + (s || 0), 0);
  const courseScore = Math.round(total / unitScores.length);
  const completedUnits = unitScores.filter((s) => s >= 70).length;

  return {
    courseScore,
    completedUnits,
    totalUnits: unitScores.length,
  };
}

export interface SemesterCourseInput {
  credits: number;
  score: number;
}

/**
 * Calculates semester progress as the credit-weighted average of course scores.
 */
export function calculateSemesterProgress(courses: SemesterCourseInput[]): {
  progressPercent: number;
  totalCredits: number;
  earnedCredits: number;
} {
  if (!courses || courses.length === 0) {
    return { progressPercent: 0, totalCredits: 0, earnedCredits: 0 };
  }

  let totalCredits = 0;
  let weightedScoreSum = 0;
  let earnedCredits = 0;

  for (const c of courses) {
    const cred = Math.max(0, c.credits || 0);
    const sc = Math.min(100, Math.max(0, c.score || 0));
    totalCredits += cred;
    weightedScoreSum += sc * cred;

    // Passing threshold is 40% (or mastery 70%)
    if (sc >= 40) {
      earnedCredits += cred;
    }
  }

  const progressPercent =
    totalCredits > 0 ? Math.round(weightedScoreSum / totalCredits) : 0;

  return {
    progressPercent,
    totalCredits,
    earnedCredits,
  };
}

/**
 * Calculates exam readiness percentage based on unit scores and quiz performance.
 * 60% mastery weight + 40% quiz assessment weight (or 100% mastery if no quiz yet).
 */
export function calculateExamReadiness(
  masteryScore: number,
  quizScore?: number | null
): number {
  const cleanMastery = Math.min(100, Math.max(0, masteryScore || 0));

  if (typeof quizScore !== "number" || isNaN(quizScore)) {
    return cleanMastery;
  }

  const cleanQuiz = Math.min(100, Math.max(0, quizScore));
  const combined = Math.round(0.6 * cleanMastery + 0.4 * cleanQuiz);
  return Math.min(100, Math.max(0, combined));
}
