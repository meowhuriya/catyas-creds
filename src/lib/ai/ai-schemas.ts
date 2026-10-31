import { z } from "zod";

// Course Builder Schema
export const CourseBuilderInputSchema = z.object({
  syllabusText: z.string().min(10, "Syllabus text must be at least 10 characters long."),
  department: z.string().optional(),
  termId: z.string().optional(),
});

export const CourseBuilderOutputSchema = z.object({
  title: z.string(),
  code: z.string(),
  department: z.string(),
  level: z.number().default(100),
  credits: z.number().default(3),
  description: z.string(),
  color: z.string().default("#A51C30"),
  units: z.array(
    z.object({
      unitNumber: z.number(),
      title: z.string(),
      topics: z.array(
        z.object({
          title: z.string(),
          order: z.number(),
        })
      ),
    })
  ),
});

export type CourseBuilderInput = z.infer<typeof CourseBuilderInputSchema>;
export type CourseBuilderOutput = z.infer<typeof CourseBuilderOutputSchema>;

// Quick Check Schema
export const QuickCheckInputSchema = z.object({
  topicTitle: z.string().min(2, "Topic title is required."),
  notes: z.string().optional(),
  count: z.number().min(1).max(5).default(3),
});

export const QuickCheckQuestionSchema = z.object({
  prompt: z.string(),
  type: z.literal("multiple_choice"),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
  explanation: z.string(),
});

export const QuickCheckOutputSchema = z.object({
  topicTitle: z.string(),
  questions: z.array(QuickCheckQuestionSchema),
});

export type QuickCheckInput = z.infer<typeof QuickCheckInputSchema>;
export type QuickCheckOutput = z.infer<typeof QuickCheckOutputSchema>;
export type QuickCheckQuestion = z.infer<typeof QuickCheckQuestionSchema>;

// Topic Chat Schemas
export const TopicChatInputSchema = z.object({
  topicTitle: z.string().min(2, "Topic title is required."),
  action: z.enum(["explain", "test", "flashcards"]),
  context: z.string().optional(),
});

export const TopicChatExplainOutputSchema = z.object({
  action: z.literal("explain"),
  summary: z.string(),
  keyPoints: z.array(z.string()),
  realWorldAnalogy: z.string(),
});

export const TopicChatTestOutputSchema = z.object({
  action: z.literal("test"),
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
  hint: z.string(),
  explanation: z.string(),
});

export const TopicChatFlashcardSchema = z.object({
  front: z.string(),
  back: z.string(),
});

export const TopicChatFlashcardsOutputSchema = z.object({
  action: z.literal("flashcards"),
  flashcards: z.array(TopicChatFlashcardSchema),
});

export type TopicChatInput = z.infer<typeof TopicChatInputSchema>;
export type TopicChatExplainOutput = z.infer<typeof TopicChatExplainOutputSchema>;
export type TopicChatTestOutput = z.infer<typeof TopicChatTestOutputSchema>;
export type TopicChatFlashcardsOutput = z.infer<typeof TopicChatFlashcardsOutputSchema>;

// Study Plan Schema
export const StudyPlanInputSchema = z.object({
  courseTitle: z.string().min(2, "Course title is required."),
  examDate: z.string(),
  currentScore: z.number().min(0).max(100).default(0),
  weakTopics: z.array(z.string()).default([]),
});

export const StudyPlanOutputSchema = z.object({
  courseTitle: z.string(),
  targetDate: z.string(),
  estimatedHoursNeeded: z.number(),
  weeks: z.array(
    z.object({
      weekNumber: z.number(),
      focusTheme: z.string(),
      plannedHours: z.number(),
      milestone: z.string(),
      tasks: z.array(z.string()),
    })
  ),
});

export type StudyPlanInput = z.infer<typeof StudyPlanInputSchema>;
export type StudyPlanOutput = z.infer<typeof StudyPlanOutputSchema>;

// Tidy Topics Schema
export const TidyTopicsInputSchema = z.object({
  rawTopics: z.array(z.string()).min(1, "At least one raw topic string must be provided."),
});

export const TidyTopicsOutputSchema = z.object({
  refinedTopics: z.array(
    z.object({
      original: z.string(),
      cleaned: z.string(),
    })
  ),
});

export type TidyTopicsInput = z.infer<typeof TidyTopicsInputSchema>;
export type TidyTopicsOutput = z.infer<typeof TidyTopicsOutputSchema>;
