import { z } from "zod";

// User & Settings Schemas
export const UserSettingsSchema = z.object({
  gradeScale: z.enum(["10_point", "4_point"]).default("10_point"),
  defaultHoursPerCredit: z.number().min(1).max(100).default(15),
  theme: z.enum(["light", "dark", "system"]).default("system"),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  photoURL: z.string().optional(),
  currentTermId: z.string().optional(),
  settings: UserSettingsSchema.default({}),
  createdAt: z.string(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// Academic Term Schema
export const TermSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1, "Term name is required"),
  startDate: z.string(), // ISO date YYYY-MM-DD
  endDate: z.string(),   // ISO date YYYY-MM-DD
  isCurrent: z.boolean().default(false),
  createdAt: z.string(),
});
export type Term = z.infer<typeof TermSchema>;

// Course Grading Scheme - weights live ONLY here and must sum to 100
export const CourseGradingSchemeSchema = z.object({
  lessonCompletion: z.number().min(0).max(100).default(10),
  quizzes: z.number().min(0).max(100).default(25),
  assignments: z.number().min(0).max(100).default(30),
  midterm: z.number().min(0).max(100).default(15),
  finalExam: z.number().min(0).max(100).default(20),
}).refine(
  (scheme) =>
    scheme.lessonCompletion +
      scheme.quizzes +
      scheme.assignments +
      scheme.midterm +
      scheme.finalExam ===
    100,
  {
    message: "Grading scheme category weights must total exactly 100%",
  }
);
export type CourseGradingScheme = z.infer<typeof CourseGradingSchemeSchema>;

// Course Schema
export const CourseColorTagSchema = z.enum([
  "slate",
  "teal",
  "olive",
  "ochre",
  "plum",
  "rust",
  "graphite",
  "forest",
]);
export type CourseColorTag = z.infer<typeof CourseColorTagSchema>;

export const CourseLevelSchema = z.enum(["100", "200", "300", "400"]);
export type CourseLevel = z.infer<typeof CourseLevelSchema>;

export const CourseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  termId: z.string(),
  code: z.string().min(1, "Course code is required (e.g. CS 101)"),
  title: z.string().min(1, "Course title is required"),
  department: z.string().min(1, "Department is required"),
  level: CourseLevelSchema,
  credits: z.number().min(0.5).max(10),
  description: z.string().default(""),
  colorTag: CourseColorTagSchema,
  gradingScheme: CourseGradingSchemeSchema.default({
    lessonCompletion: 10,
    quizzes: 25,
    assignments: 30,
    midterm: 15,
    finalExam: 20,
  }),
  passMark: z.number().default(40),
  createdAt: z.string(),
});
export type Course = z.infer<typeof CourseSchema>;

// Module Schema
export const ModuleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  title: z.string().min(1, "Module title is required"),
  order: z.number().default(0),
  isCollapsed: z.boolean().default(false),
  createdAt: z.string(),
});
export type Module = z.infer<typeof ModuleSchema>;

// Lesson Schema
export const LessonSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  moduleId: z.string(),
  youtubeVideoId: z.string().length(11),
  originalUrl: z.string().url(),
  title: z.string().min(1),
  channelTitle: z.string().min(1),
  thumbnailUrl: z.string().url(),
  durationSeconds: z.number().nullable(), // null means pending capture
  manualDuration: z.string().optional(),   // hh:mm:ss if manually typed
  startTimeSeconds: z.number().default(0),
  canEmbed: z.boolean().default(true),
  order: z.number().default(0),
  cachedAt: z.string(), // ISO date for 30-day freshness re-fetch
  createdAt: z.string(),
});
export type Lesson = z.infer<typeof LessonSchema>;

// Lesson Progress Schema
export const LessonProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  lessonId: z.string(),
  courseId: z.string(),
  watchedSeconds: z.number().default(0),
  totalDurationSeconds: z.number().default(0),
  percentWatched: z.number().min(0).max(100).default(0),
  isCompleted: z.boolean().default(false),
  lastPositionSeconds: z.number().default(0),
  completedAt: z.string().optional(),
  updatedAt: z.string(),
});
export type LessonProgress = z.infer<typeof LessonProgressSchema>;

// Assessment Schema (Notice: weightPercentage removed per user requirement #2)
export const AssessmentTypeSchema = z.enum(["quiz", "assignment", "midterm", "final"]);
export type AssessmentType = z.infer<typeof AssessmentTypeSchema>;

export const AssessmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  moduleId: z.string().optional(),
  type: AssessmentTypeSchema,
  title: z.string().min(1, "Assessment title is required"),
  description: z.string().default(""),
  maxPoints: z.number().min(1).default(100),
  dueDate: z.string().optional(),
  timeLimitMinutes: z.number().optional(), // undefined = untimed
  attemptLimit: z.number().optional(),
  lockedUntilLessonCompletionPercent: z.number().min(0).max(100).optional(),
  rubricId: z.string().optional(),
  createdAt: z.string(),
});
export type Assessment = z.infer<typeof AssessmentSchema>;

// Question Schema
export const QuestionTypeSchema = z.enum([
  "multiple_choice",
  "multiple_select",
  "short_answer",
]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  assessmentId: z.string(),
  courseId: z.string(),
  prompt: z.string().min(1),
  type: QuestionTypeSchema,
  options: z.array(z.string()).default([]),
  correctAnswers: z.array(z.string()).min(1),
  points: z.number().min(1).default(1),
  explanation: z.string().optional(),
});
export type Question = z.infer<typeof QuestionSchema>;

// Attempt Schema (Quiz/Exam)
export const AttemptSchema = z.object({
  id: z.string(),
  userId: z.string(),
  assessmentId: z.string(),
  courseId: z.string(),
  answers: z.record(z.union([z.string(), z.array(z.string())])),
  score: z.number(),
  maxPoints: z.number(),
  percentage: z.number(),
  startedAt: z.string(),
  submittedAt: z.string(),
  isCompleted: z.boolean().default(true),
});
export type Attempt = z.infer<typeof AttemptSchema>;

// Rubric Schema
export const RubricLevelSchema = z.object({
  level: z.string(), // e.g. "Exemplary", "Proficient", "Developing", "Unacceptable"
  points: z.number(),
  description: z.string(),
});
export type RubricLevel = z.infer<typeof RubricLevelSchema>;

export const RubricCriterionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  maxPoints: z.number(),
  levels: z.array(RubricLevelSchema),
});
export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;

export const RubricSchema = z.object({
  id: z.string(),
  userId: z.string(),
  assessmentId: z.string(),
  criteria: z.array(RubricCriterionSchema),
});
export type Rubric = z.infer<typeof RubricSchema>;

// Submission Schema (Assignment with Rubric self-assessment)
export const SelfAssessmentMarkSchema = z.object({
  criterionId: z.string(),
  level: z.string(),
  points: z.number(),
  justification: z.string().min(10, "Required justification must be at least 10 characters"),
});
export type SelfAssessmentMark = z.infer<typeof SelfAssessmentMarkSchema>;

export const SubmissionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  assessmentId: z.string(),
  courseId: z.string(),
  submissionType: z.enum(["text", "link"]),
  content: z.string().min(1),
  selfAssessment: z.object({
    criteriaMarks: z.array(SelfAssessmentMarkSchema),
  }),
  finalScore: z.number(),
  gradedAt: z.string(),
});
export type Submission = z.infer<typeof SubmissionSchema>;

// Note Schema
export const NoteTimestampSchema = z.object({
  seconds: z.number(),
  label: z.string(),
});
export type NoteTimestamp = z.infer<typeof NoteTimestampSchema>;

export const NoteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  lessonId: z.string(),
  content: z.string().default(""),
  timestamps: z.array(NoteTimestampSchema).default([]),
  updatedAt: z.string(),
});
export type Note = z.infer<typeof NoteSchema>;

// Planner Event Schema
export const PlannerEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().min(1),
  date: z.string(), // YYYY-MM-DD
  startTime: z.string().optional(), // HH:MM
  endTime: z.string().optional(),   // HH:MM
  type: z.enum(["due_date", "study_block", "exam"]),
  courseId: z.string().optional(),
  assessmentId: z.string().optional(),
  isDone: z.boolean().default(false),
});
export type PlannerEvent = z.infer<typeof PlannerEventSchema>;

// Degree Plan Schema
export const DegreePlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  totalCreditsTarget: z.number().default(120),
  departmentRequirements: z.record(z.number()).default({}),
  levelRequirements: z.record(z.number()).default({}),
});
export type DegreePlan = z.infer<typeof DegreePlanSchema>;

// Transcript Snapshot Schema (Opt-in public verification)
export const TranscriptSnapshotSchema = z.object({
  id: z.string(), // Verification ID
  userId: z.string(),
  studentName: z.string(),
  issuedAt: z.string(),
  termsSnapshot: z.array(z.any()),
  cgpa: z.number(),
  totalCredits: z.number(),
  isPublic: z.boolean().default(false), // opt-in
  verificationHash: z.string(),
});
export type TranscriptSnapshot = z.infer<typeof TranscriptSnapshotSchema>;

// Audit Log Schema
export const AuditLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  action: z.enum(["lesson_watched", "exam_started", "exam_submitted", "grade_updated"]),
  entityId: z.string(),
  details: z.string(),
  timestamp: z.string(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;
