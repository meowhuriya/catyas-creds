import { describe, it, expect } from "vitest";
import {
  CourseBuilderInputSchema,
  CourseBuilderOutputSchema,
  QuickCheckInputSchema,
  QuickCheckOutputSchema,
  TopicChatInputSchema,
  TopicChatExplainOutputSchema,
  TopicChatTestOutputSchema,
  TopicChatFlashcardsOutputSchema,
  StudyPlanInputSchema,
  StudyPlanOutputSchema,
  TidyTopicsInputSchema,
  TidyTopicsOutputSchema,
} from "./ai-schemas";

describe("AI Zod Schemas Validation", () => {
  describe("Course Builder Schemas", () => {
    it("validates valid course builder input", () => {
      const input = {
        syllabusText: "CS201 Data Structures and Algorithms syllabus covering arrays, trees, and graphs.",
        department: "Computer Science",
      };
      const parsed = CourseBuilderInputSchema.safeParse(input);
      expect(parsed.success).toBe(true);
    });

    it("rejects syllabus text shorter than 10 chars", () => {
      const parsed = CourseBuilderInputSchema.safeParse({ syllabusText: "Short" });
      expect(parsed.success).toBe(false);
    });

    it("validates valid course builder output", () => {
      const output = {
        title: "Data Structures",
        code: "CS201",
        department: "CSE",
        level: 200,
        credits: 4,
        description: "Fundamental structures",
        color: "#1E3A8A",
        units: [
          {
            unitNumber: 1,
            title: "Linear Structures",
            topics: [
              { title: "Arrays & Dynamic Lists", order: 1 },
              { title: "Linked Lists", order: 2 },
            ],
          },
        ],
      };
      const parsed = CourseBuilderOutputSchema.safeParse(output);
      expect(parsed.success).toBe(true);
    });
  });

  describe("Quick Check Schemas", () => {
    it("validates quick check input", () => {
      const parsed = QuickCheckInputSchema.safeParse({
        topicTitle: "Eigenvalues and Cayley-Hamilton",
        count: 3,
      });
      expect(parsed.success).toBe(true);
    });

    it("validates quick check output structure", () => {
      const output = {
        topicTitle: "Matrices",
        questions: [
          {
            prompt: "What is the trace of a matrix?",
            type: "multiple_choice" as const,
            options: ["Sum of diagonal elements", "Product of diagonal", "Determinant", "Rank"],
            correctAnswer: "Sum of diagonal elements",
            explanation: "The trace is defined as the sum of elements on the main diagonal.",
          },
        ],
      };
      const parsed = QuickCheckOutputSchema.safeParse(output);
      expect(parsed.success).toBe(true);
    });
  });

  describe("Topic Chat Schemas", () => {
    it("validates explain action output", () => {
      const output = {
        action: "explain" as const,
        summary: "An intuitive overview.",
        keyPoints: ["Point 1", "Point 2"],
        realWorldAnalogy: "Imagine a conveyor belt.",
      };
      const parsed = TopicChatExplainOutputSchema.safeParse(output);
      expect(parsed.success).toBe(true);
    });

    it("validates test action output", () => {
      const output = {
        action: "test" as const,
        question: "Diagnostic problem?",
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
        hint: "Consider the base case.",
        explanation: "Because A satisfies the theorem.",
      };
      const parsed = TopicChatTestOutputSchema.safeParse(output);
      expect(parsed.success).toBe(true);
    });

    it("validates flashcards output", () => {
      const output = {
        action: "flashcards" as const,
        flashcards: [
          { front: "What is O(1)?", back: "Constant time complexity." },
        ],
      };
      const parsed = TopicChatFlashcardsOutputSchema.safeParse(output);
      expect(parsed.success).toBe(true);
    });
  });

  describe("Study Plan Schemas", () => {
    it("validates study plan input & output", () => {
      const input = {
        courseTitle: "CS105ES: Programming for Problem Solving",
        examDate: "2026-12-01",
        currentScore: 72,
        weakTopics: ["Pointers", "Dynamic Memory"],
      };
      expect(StudyPlanInputSchema.safeParse(input).success).toBe(true);

      const output = {
        courseTitle: "CS105ES",
        targetDate: "2026-12-01",
        estimatedHoursNeeded: 16,
        weeks: [
          {
            weekNumber: 1,
            focusTheme: "Pointers and Memory",
            plannedHours: 4,
            milestone: "Master malloc and pointer arithmetic",
            tasks: ["Watch lecture 14", "Complete Pointer Quiz"],
          },
        ],
      };
      expect(StudyPlanOutputSchema.safeParse(output).success).toBe(true);
    });
  });

  describe("Tidy Topics Schemas", () => {
    it("validates raw topics input and refined output", () => {
      const input = {
        rawTopics: ["1. Introduction to Matrices 8 L;", "b) Eigenvalues and vectors"],
      };
      expect(TidyTopicsInputSchema.safeParse(input).success).toBe(true);

      const output = {
        refinedTopics: [
          { original: "1. Introduction to Matrices 8 L;", cleaned: "Introduction to Matrices" },
          { original: "b) Eigenvalues and vectors", cleaned: "Eigenvalues and Vectors" },
        ],
      };
      expect(TidyTopicsOutputSchema.safeParse(output).success).toBe(true);
    });
  });
});
