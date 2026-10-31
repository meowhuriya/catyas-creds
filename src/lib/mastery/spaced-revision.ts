/**
 * Spaced Revision Interval Engine
 * Intervals: 1 day, 3 days, 7 days, 21 days after topic is Done.
 */

export const REVISION_INTERVALS_DAYS = [1, 3, 7, 21] as const;

export interface SpacedRevisionResult {
  nextDueDate: string; // ISO date string YYYY-MM-DD
  stage: number;       // 0 = 1 day, 1 = 3 days, 2 = 7 days, 3 = 21 days, 4 = Mastered
  isDue: boolean;
}

/**
 * Calculates the next revision due date based on completion date and current stage.
 */
export function calculateNextRevision(
  baseDate: Date | string,
  currentStage = 0
): { nextDueDate: string; stage: number } {
  const dateObj = typeof baseDate === "string" ? new Date(baseDate) : new Date(baseDate.getTime());

  // Safe clamp stage
  const stage = Math.min(REVISION_INTERVALS_DAYS.length - 1, Math.max(0, currentStage));
  const daysToAdd = REVISION_INTERVALS_DAYS[stage];

  const targetDate = new Date(dateObj);
  targetDate.setDate(targetDate.getDate() + daysToAdd);

  return {
    nextDueDate: targetDate.toISOString().split("T")[0],
    stage,
  };
}

/**
 * Checks if a topic is due for revision given its due date and current time.
 */
export function isRevisionDue(revisionDueAt?: string | null, now = new Date()): boolean {
  if (!revisionDueAt) return false;
  const dueDateStr = revisionDueAt.split("T")[0];
  const todayStr = now.toISOString().split("T")[0];
  return dueDateStr <= todayStr;
}

/**
 * Advances the topic's revision stage after completing a quick review.
 */
export function advanceRevisionStage(
  currentStage: number,
  completedAt = new Date()
): { nextDueDate: string; nextStage: number; isFullyMastered: boolean } {
  const nextStage = currentStage + 1;
  const isFullyMastered = nextStage >= REVISION_INTERVALS_DAYS.length;

  if (isFullyMastered) {
    // Already past 21 days, set next review far in future (90 days)
    const farDate = new Date(completedAt);
    farDate.setDate(farDate.getDate() + 90);
    return {
      nextDueDate: farDate.toISOString().split("T")[0],
      nextStage,
      isFullyMastered: true,
    };
  }

  const { nextDueDate } = calculateNextRevision(completedAt, nextStage);
  return {
    nextDueDate,
    nextStage,
    isFullyMastered: false,
  };
}
