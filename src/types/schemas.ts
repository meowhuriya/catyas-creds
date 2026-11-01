import { z } from "zod";

// User & Settings Schemas
export const UserSettingsSchema = z.object({
  gradeScale: z.enum(["10_point", "4_point"]).default("10_point"),
  defaultHoursPerCredit: z.number().min(1).max(100).default(15),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  recallIntervals: z.array(z.number()).default([1, 3, 7, 14]).optional(),
  recallDailyCap: z.number().min(1).max(100).default(20).optional(),
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

export const RecallStyleSchema = z.enum([
  "problems",
  "questions",
  "code",
  "vocabulary_and_usage",
]);
export type RecallStyle = z.infer<typeof RecallStyleSchema>;

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
  electiveExperimentsCount: z.number().nullable().optional(),
  recallStyle: RecallStyleSchema.optional(),
  createdAt: z.string(),
});
export type Course = z.infer<typeof CourseSchema>;

// Module Schema
export const ModuleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  title: z.string().min(1, "Module/Unit title is required"),
  order: z.number().default(0),
  unitNumber: z.number().optional(),
  isSection: z.boolean().optional().default(false),
  electiveExperimentsCount: z.number().nullable().optional(),
  isCollapsed: z.boolean().default(false),
  createdAt: z.string(),
});
export type Module = z.infer<typeof ModuleSchema>;
export const UnitSchema = ModuleSchema;
export type Unit = Module;

export const RetentionLevelSchema = z.enum(["green", "amber", "red", "none"]);
export type RetentionLevel = z.infer<typeof RetentionLevelSchema>;

// Topic Schema
export const TopicSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  unitId: z.string(),
  title: z.string().min(1, "Topic title is required"),
  order: z.number().default(0),
  isDone: z.boolean().default(false),
  watchScore: z.number().min(0).max(40).default(0),
  checkScore: z.number().min(0).max(60).default(0),
  topicScore: z.number().min(0).max(100).default(0),
  isStudiedManually: z.boolean().default(false),
  isExperiment: z.boolean().default(false),
  isSelectedExperiment: z.boolean().default(true),
  lastRevisedAt: z.string().optional(),
  revisionDueAt: z.string().optional(),
  // Smart Recall Engine fields
  recallStage: z.number().default(0).optional(), // 0 = not started, 1 = D+1, 2 = D+3, 3 = D+7, 4 = D+14, 5 = Consolidated
  isConsolidated: z.boolean().default(false).optional(),
  retentionLevel: RetentionLevelSchema.default("none").optional(),
  lastRecallRating: z.enum(["forgot", "hard", "good", "easy"]).optional(),
  lastRecalledAt: z.string().optional(),
  recallDueAt: z.string().optional(),
  recallGapDays: z.number().optional(),
  createdAt: z.string(),
});
export type Topic = z.infer<typeof TopicSchema>;

// Recall History Entry Schema
export const RecallHistoryEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  topicId: z.string(),
  courseId: z.string(),
  topicTitle: z.string(),
  courseCode: z.string(),
  stage: z.number(),
  rating: z.enum(["forgot", "hard", "good", "easy"]),
  previousRetention: RetentionLevelSchema,
  newRetention: RetentionLevelSchema,
  scoreBefore: z.number(),
  scoreAfter: z.number(),
  reviewedAt: z.string(),
  date: z.string(),
});
export type RecallHistoryEntry = z.infer<typeof RecallHistoryEntrySchema>;

// Lesson / Video Schema
export const LessonSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  moduleId: z.string(), // can be unitId
  unitId: z.string().optional(),
  youtubeVideoId: z.string().length(11),
  originalUrl: z.string().url(),
  title: z.string().min(1),
  channelTitle: z.string().min(1),
  thumbnailUrl: z.string().url(),
  durationSeconds: z.number().nullable(), // null means pending capture
  manualDuration: z.string().optional(),   // hh:mm:ss if manually typed
  startTimeSeconds: z.number().default(0),
  canEmbed: z.boolean().default(true),
  linkedTopicIds: z.array(z.string()).optional().default([]),
  order: z.number().default(0),
  cachedAt: z.string(), // ISO date for 30-day freshness re-fetch
  createdAt: z.string(),
});
export type Lesson = z.infer<typeof LessonSchema>;
export const VideoSchema = LessonSchema;
export type Video = Lesson;

// Lesson Progress / Video Progress Schema
export const LessonProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  lessonId: z.string(), // can be videoId
  videoId: z.string().optional(),
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
export const VideoProgressSchema = LessonProgressSchema;
export type VideoProgress = LessonProgress;

// Topic Quick Check Schema
export const QuickCheckSchema = z.object({
  id: z.string(),
  userId: z.string(),
  topicId: z.string(),
  courseId: z.string(),
  questions: z.array(
    z.object({
      id: z.string(),
      prompt: z.string(),
      options: z.array(z.string()),
      correctAnswerIndex: z.number(),
      explanation: z.string().optional(),
    })
  ),
  score: z.number().min(0).max(60),
  isPassed: z.boolean().default(false),
  completedAt: z.string(),
});
export type QuickCheck = z.infer<typeof QuickCheckSchema>;

// Focus Study Session Log Schema
export const StudySessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string().optional(),
  durationMinutes: z.number(),
  mode: z.enum(["pomodoro", "short_break", "long_break", "custom"]).default("pomodoro"),
  completedAt: z.string(),
});
export type StudySession = z.infer<typeof StudySessionSchema>;

// Exam Date Milestone Schema
export const ExamDateSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  examTitle: z.string(),
  date: z.string(), // YYYY-MM-DD
  targetScore: z.number().default(85),
});
export type ExamDate = z.infer<typeof ExamDateSchema>;

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
  type: z.enum(["due_date", "study_block", "exam", "revision"]),
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
  action: z.enum([
    "lesson_watched",
    "exam_started",
    "exam_submitted",
    "grade_updated",
    "topic_checked",
    "session_completed",
  ]),
  entityId: z.string(),
  details: z.string(),
  timestamp: z.string(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

// Course Attendance Schema
export const AttendanceLogEntrySchema = z.object({
  id: z.string(),
  date: z.string(), // YYYY-MM-DD
  status: z.enum(["present", "absent"]),
  timestamp: z.string(),
  note: z.string().optional(),
});
export type AttendanceLogEntry = z.infer<typeof AttendanceLogEntrySchema>;

export const CourseAttendanceSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  userId: z.string(),
  classesHeld: z.number().min(0).default(0),
  classesAttended: z.number().min(0).default(0),
  minimumPercentage: z.number().min(1).max(100).default(75),
  logs: z.array(AttendanceLogEntrySchema).default([]),
  updatedAt: z.string(),
});
export type CourseAttendance = z.infer<typeof CourseAttendanceSchema>;

// Weekly Class Timetable Slot Schema
export const ClassTimetableSlotSchema = z.object({
  id: z.string(),
  userId: z.string(),
  courseId: z.string(),
  dayOfWeek: z.number().min(1).max(7), // 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat, 7 = Sun
  startTime: z.string(), // "HH:MM", e.g. "09:00"
  endTime: z.string(),   // "HH:MM", e.g. "10:00"
  room: z.string().optional(),
  type: z.enum(["lecture", "lab", "tutorial", "seminar"]).default("lecture"),
});
export type ClassTimetableSlot = z.infer<typeof ClassTimetableSlotSchema>;

