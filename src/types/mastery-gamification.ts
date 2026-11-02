import { z } from "zod";

// ===============================================================
// Feature 1: Khan-Style Note Audit & Multi-Modal Exercise Loop
// ===============================================================

export type ExerciseType = "mcq" | "cloze" | "synthesis";

export interface MasteryMCQQuestion {
  id: string;
  type: "mcq";
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface MasteryClozeQuestion {
  id: string;
  type: "cloze";
  prompt: string; // Contains {{blank}}
  snippet?: string;
  acceptedAnswers: string[];
  explanation: string;
  hint?: string;
}

export interface MasterySynthesisQuestion {
  id: string;
  type: "synthesis";
  prompt: string; // JNTUH-style short derivation, C trace, or block diagram
  rubric: string;
  modelAnswer: string;
  hints?: string[];
}

export type MasteryQuestion =
  | MasteryMCQQuestion
  | MasteryClozeQuestion
  | MasterySynthesisQuestion;

export interface MasteryExerciseSet {
  topicId: string;
  topicTitle: string;
  unitTitle?: string;
  courseTitle?: string;
  questions: MasteryQuestion[];
}

export interface NoteAuditRequest {
  topicId: string;
  topicTitle: string;
  unitTitle?: string;
  courseTitle?: string;
  markdownNote?: string;
  images?: {
    mimeType: string;
    data: string; // base64
  }[];
}

export interface NoteAuditResult {
  completenessScore: number; // 0 - 100
  strengths: string[];
  missingConcepts: string[];
  summaryFeedback: string;
  exerciseSet: MasteryExerciseSet;
}

export interface GradeExerciseRequest {
  questionId: string;
  questionType: ExerciseType;
  prompt: string;
  rubric: string;
  modelAnswer: string;
  topicTitle?: string;
  userTextAnswer?: string;
  userImageBase64?: string;
  imageMimeType?: string;
}

export interface GradeExerciseResult {
  isCorrect: boolean;
  score: number; // 0 - 100
  awardedPoints: number; // 0 - 12 (5 questions total 60 pts)
  feedback: string;
  lineErrors?: string[];
  stepByStepAnalysis?: string;
}

// Zod Schemas for API validation
export const NoteAuditRequestSchema = z.object({
  topicId: z.string().min(1),
  topicTitle: z.string().min(1),
  unitTitle: z.string().optional(),
  courseTitle: z.string().optional(),
  markdownNote: z.string().optional(),
  images: z
    .array(
      z.object({
        mimeType: z.string(),
        data: z.string(),
      })
    )
    .optional(),
});

export const GradeExerciseRequestSchema = z.object({
  questionId: z.string().min(1),
  questionType: z.enum(["mcq", "cloze", "synthesis"]),
  prompt: z.string().min(1),
  rubric: z.string().min(1),
  modelAnswer: z.string().min(1),
  topicTitle: z.string().optional(),
  userTextAnswer: z.string().optional(),
  userImageBase64: z.string().optional(),
  imageMimeType: z.string().optional(),
});

// ===============================================================
// Feature 2: Squad Leaderboard & Custom Badge Engine
// ===============================================================

export type BadgeCriteriaType =
  | "TOPICS_MASTERED"
  | "STREAK_DAYS"
  | "WATCH_HOURS"
  | "PERFECT_EXERCISES"
  | "MANUAL_AWARD";

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string; // Base64 or URL
  criteriaType: BadgeCriteriaType;
  thresholdValue: number;
  createdByUid: string;
  createdAt: string;
  isCustom: boolean;
}

export interface LeaderboardProfile {
  uid: string;
  displayName: string;
  avatarUrl?: string;
  squadCode?: string; // 6-char alphanumeric invite code
  xp: number;
  weeklyStudyMinutes: number;
  topicsMasteredCount: number;
  currentStreakDays: number;
  equippedBadges: string[]; // Up to 3 badge IDs
  showOnLeaderboard: boolean;
  updatedAt: string;
}

export const BadgeItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().min(1, "Badge artwork is required"),
  criteriaType: z.enum([
    "TOPICS_MASTERED",
    "STREAK_DAYS",
    "WATCH_HOURS",
    "PERFECT_EXERCISES",
    "MANUAL_AWARD",
  ]),
  thresholdValue: z.number().min(1),
  createdByUid: z.string(),
  createdAt: z.string(),
  isCustom: z.boolean().default(true),
});

export const LeaderboardProfileSchema = z.object({
  uid: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().optional(),
  squadCode: z.string().optional(),
  xp: z.number().default(0),
  weeklyStudyMinutes: z.number().default(0),
  topicsMasteredCount: z.number().default(0),
  currentStreakDays: z.number().default(0),
  equippedBadges: z.array(z.string()).default([]),
  showOnLeaderboard: z.boolean().default(true),
  updatedAt: z.string(),
});
