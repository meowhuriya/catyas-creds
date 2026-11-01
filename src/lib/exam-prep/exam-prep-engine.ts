import { Topic } from "@/types/schemas";

export type ExamPaceStatus =
  | "mastered"
  | "steady"
  | "moderate"
  | "intensive"
  | "exam_today"
  | "passed";

export interface ExamPrepStats {
  examTitle: string;
  examDate: string; // YYYY-MM-DD
  daysRemaining: number;
  totalTopicsCount: number;
  completedTopicsCount: number;
  uncompletedTopicsCount: number;
  dailyTarget: number;
  paceStatus: ExamPaceStatus;
  statusSentence: string;
  paceBadgeLabel: string;
}

/**
 * Calculates days remaining, uncompleted topics, and daily target topics/day
 * to complete the syllabus before the scheduled exam date.
 */
export function calculateExamPrepStats(
  examTitle: string,
  examDateStr: string,
  topics: Topic[],
  referenceDateStr?: string
): ExamPrepStats {
  const total = topics.length;
  const completed = topics.filter((t) => t.isDone || (t.topicScore || 0) >= 70).length;
  const uncompleted = Math.max(0, total - completed);

  // Normalize dates to midnight for accurate day countdown
  const today = referenceDateStr ? new Date(referenceDateStr) : new Date();
  today.setHours(0, 0, 0, 0);

  const examDate = new Date(examDateStr);
  examDate.setHours(0, 0, 0, 0);

  const diffMs = examDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const title = examTitle.trim() || "Final Examination";
  let dailyTarget = 0;
  let paceStatus: ExamPaceStatus = "moderate";
  let paceBadgeLabel = "Moderate Pace";
  let statusSentence = "";

  if (isNaN(daysRemaining)) {
    return {
      examTitle: title,
      examDate: examDateStr,
      daysRemaining: 0,
      totalTopicsCount: total,
      completedTopicsCount: completed,
      uncompletedTopicsCount: uncompleted,
      dailyTarget: 0,
      paceStatus: "steady",
      statusSentence: "Select an exam date to calculate daily target.",
      paceBadgeLabel: "Pick Date",
    };
  }

  if (daysRemaining < 0) {
    paceStatus = "passed";
    paceBadgeLabel = "Exam Concluded";
    dailyTarget = 0;
    const pastDays = Math.abs(daysRemaining);
    statusSentence = `Exam date was ${pastDays} ${pastDays === 1 ? "day" : "days"} ago.`;
  } else if (daysRemaining === 0) {
    paceStatus = "exam_today";
    paceBadgeLabel = "Exam Today";
    dailyTarget = uncompleted;
    statusSentence =
      uncompleted === 0
        ? `Syllabus 100% mastered! Ready for ${title} today.`
        : `Exam is today! Final review for ${uncompleted} ${uncompleted === 1 ? "topic" : "topics"}.`;
  } else {
    // daysRemaining > 0
    if (uncompleted === 0) {
      paceStatus = "mastered";
      paceBadgeLabel = "100% Exam-Ready";
      dailyTarget = 0;
      statusSentence = `All ${total} topics mastered! You are fully prepared for ${title} in ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}.`;
    } else {
      // Formula: ceil(uncompleted / daysRemaining)
      dailyTarget = Math.ceil(uncompleted / daysRemaining);

      if (dailyTarget <= 2) {
        paceStatus = "steady";
        paceBadgeLabel = "Steady Pace";
      } else if (dailyTarget <= 4) {
        paceStatus = "moderate";
        paceBadgeLabel = "Moderate Pace";
      } else {
        paceStatus = "intensive";
        paceBadgeLabel = "Intensive Pace";
      }

      statusSentence = `Daily target: ${dailyTarget} ${dailyTarget === 1 ? "topic" : "topics"} / day to complete ${uncompleted} uncompleted topics before ${title}.`;
    }
  }

  return {
    examTitle: title,
    examDate: examDateStr,
    daysRemaining,
    totalTopicsCount: total,
    completedTopicsCount: completed,
    uncompletedTopicsCount: uncompleted,
    dailyTarget,
    paceStatus,
    statusSentence,
    paceBadgeLabel,
  };
}
