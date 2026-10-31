import { describe, it, expect } from "vitest";
import {
  getGradeScaleMapping,
  validateGradingScheme,
  calculateCategoryPointsScore,
  calculateCourseGrades,
  calculateSGPA,
  calculateCGPA,
  calculateWhatIfTarget,
  CourseTermRecord,
} from "./grading-engine";
import { Course } from "@/types/schemas";

const SAMPLE_COURSE: Course = {
  id: "course-cs101",
  userId: "user-1",
  termId: "term-1",
  code: "CS 101",
  title: "Computer Systems",
  department: "CS",
  level: "100",
  credits: 4,
  description: "Test course",
  colorTag: "slate",
  gradingScheme: {
    lessonCompletion: 10,
    quizzes: 25,
    assignments: 30,
    midterm: 15,
    finalExam: 20,
  },
  passMark: 40,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("Grading Engine - Scale Mappings", () => {
  it("maps 10-point collegiate scale correctly", () => {
    expect(getGradeScaleMapping(95, "10_point")).toEqual({
      letter: "O",
      points: 10,
      passed: true,
    });
    expect(getGradeScaleMapping(85, "10_point")).toEqual({
      letter: "A+",
      points: 9,
      passed: true,
    });
    expect(getGradeScaleMapping(72, "10_point")).toEqual({
      letter: "A",
      points: 8,
      passed: true,
    });
    expect(getGradeScaleMapping(64, "10_point")).toEqual({
      letter: "B+",
      points: 7,
      passed: true,
    });
    expect(getGradeScaleMapping(53, "10_point")).toEqual({
      letter: "B",
      points: 6,
      passed: true,
    });
    expect(getGradeScaleMapping(45, "10_point")).toEqual({
      letter: "P",
      points: 5,
      passed: true,
    });
    expect(getGradeScaleMapping(35, "10_point")).toEqual({
      letter: "F",
      points: 0,
      passed: false,
    });
  });

  it("maps 4.0 GPA scale correctly", () => {
    expect(getGradeScaleMapping(95, "4_point")).toEqual({
      letter: "A",
      points: 4.0,
      passed: true,
    });
    expect(getGradeScaleMapping(91, "4_point")).toEqual({
      letter: "A-",
      points: 3.7,
      passed: true,
    });
    expect(getGradeScaleMapping(88, "4_point")).toEqual({
      letter: "B+",
      points: 3.3,
      passed: true,
    });
    expect(getGradeScaleMapping(85, "4_point")).toEqual({
      letter: "B",
      points: 3.0,
      passed: true,
    });
    expect(getGradeScaleMapping(78, "4_point")).toEqual({
      letter: "C+",
      points: 2.3,
      passed: true,
    });
    expect(getGradeScaleMapping(55, "4_point")).toEqual({
      letter: "F",
      points: 0.0,
      passed: false,
    });
  });
});

describe("Grading Engine - Scheme Validation", () => {
  it("approves schemes totaling exactly 100", () => {
    const res = validateGradingScheme({
      lessonCompletion: 10,
      quizzes: 25,
      assignments: 30,
      midterm: 15,
      finalExam: 20,
    });
    expect(res.isValid).toBe(true);
    expect(res.total).toBe(100);
  });

  it("rejects schemes not totaling 100", () => {
    const res = validateGradingScheme({
      lessonCompletion: 10,
      quizzes: 20,
      assignments: 30,
      midterm: 15,
      finalExam: 20,
    });
    expect(res.isValid).toBe(false);
    expect(res.total).toBe(95);
    expect(res.error).toBeDefined();
  });
});

describe("Grading Engine - Category Score Calculation", () => {
  it("calculates score from sum of earned points divided by max points", () => {
    const items = [
      { earnedPoints: 25, maxPoints: 30 },
      { earnedPoints: 45, maxPoints: 50 },
    ];
    // (25 + 45) / (30 + 50) = 70 / 80 = 87.5%
    expect(calculateCategoryPointsScore(items)).toBe(87.5);
  });

  it("returns null for empty items list", () => {
    expect(calculateCategoryPointsScore([])).toBeNull();
  });
});

describe("Grading Engine - Course Grade Calculation", () => {
  it("computes current vs projected final grades accurately", () => {
    // Student has 100% lessons completed (weight 10)
    // 80% on Quiz 1 (weight 25)
    // No assignments, midterm, or final yet completed
    const result = calculateCourseGrades(
      SAMPLE_COURSE,
      100, // lesson completion = 100%
      [
        {
          id: "q-1",
          userId: "user-1",
          courseId: "course-cs101",
          type: "quiz",
          title: "Quiz 1",
          maxPoints: 50,
          description: "",
          createdAt: "2026-01-01",
        },
      ],
      [
        {
          id: "att-1",
          userId: "user-1",
          assessmentId: "q-1",
          courseId: "course-cs101",
          answers: {},
          score: 40, // 40/50 = 80%
          maxPoints: 50,
          percentage: 80,
          startedAt: "2026-01-02",
          submittedAt: "2026-01-02",
          isCompleted: true,
        },
      ],
      []
    );

    // Completed categories:
    // - lessonCompletion: 100% * 10 = 10 points
    // - quizzes: 80% * 25 = 20 points
    // Completed weights = 10 + 25 = 35
    // Current grade = (10 + 20) / 35 * 100 = 30 / 35 * 100 = 85.71%
    expect(result.currentGrade).toBe(85.71);

    // Projected final grade = 10 + 20 = 30.00% (uncompleted assignments, midterm, final count as 0)
    expect(result.projectedFinalGrade).toBe(30);
    expect(result.letter).toBe("F"); // under 40%
  });
});

describe("Grading Engine - SGPA and CGPA Calculation", () => {
  it("calculates SGPA accurately from credit-weighted grade points", () => {
    const termCourses = [
      { credits: 4, gradePoints: 10 }, // CS 101: 4 * 10 = 40
      { credits: 4, gradePoints: 8 },  // MATH 210: 4 * 8 = 32
      { credits: 3, gradePoints: 9 },  // PHIL 140: 3 * 9 = 27
    ];
    // Total credits = 11. Total points = 99. SGPA = 99 / 11 = 9.00
    expect(calculateSGPA(termCourses)).toBe(9.0);
  });

  it("handles zero credits edge case gracefully", () => {
    expect(calculateSGPA([])).toBe(0);
    expect(calculateSGPA([{ credits: 0, gradePoints: 10 }])).toBe(0);
  });

  it("handles course retakes in CGPA by replacing prior attempt points", () => {
    const history: CourseTermRecord[] = [
      // Term 1: CS 101 Failed
      {
        courseId: "course-cs101",
        courseCode: "CS 101",
        termId: "term-1",
        credits: 4,
        percentage: 32,
        letter: "F",
        gradePoints: 0,
        passed: false,
      },
      // Term 1: MATH 101 Passed
      {
        courseId: "course-math101",
        courseCode: "MATH 101",
        termId: "term-1",
        credits: 4,
        percentage: 82,
        letter: "A+",
        gradePoints: 9,
        passed: true,
      },
      // Term 2: CS 101 Retaken & Passed with 'O' (10 points)
      {
        courseId: "course-cs101-retake",
        courseCode: "CS 101",
        termId: "term-2",
        credits: 4,
        percentage: 95,
        letter: "O",
        gradePoints: 10,
        passed: true,
      },
    ];

    // Under the retake rule:
    // CS 101 grade point becomes 10 (replaces 0).
    // MATH 101 remains 9.
    // Total distinct credits = 4 (CS 101) + 4 (MATH 101) = 8.
    // Total points = 4 * 10 + 4 * 9 = 40 + 36 = 76.
    // CGPA = 76 / 8 = 9.50.
    expect(calculateCGPA(history)).toBe(9.5);
  });
});

describe("Grading Engine - What-If Projection Calculator", () => {
  it("determines required final exam score to reach target overall grade", () => {
    const scheme: Course = SAMPLE_COURSE;
    // Completed work so far:
    // Lesson completion: 100% (weight 10) -> 10 pts
    // Quizzes: 90% (weight 25) -> 22.5 pts
    // Assignments: 85% (weight 30) -> 25.5 pts
    // Midterm: 80% (weight 15) -> 12.0 pts
    // Current points accumulated = 10 + 22.5 + 25.5 + 12 = 70 points
    // Target overall: 85% (Grade A+)
    // Final exam weight: 20%
    // Needed points = 85 - 70 = 15 points
    // Required score on final = 15 / 20 * 100 = 75.0%
    const completed = [
      { category: "lessonCompletion" as const, scorePercent: 100 },
      { category: "quizzes" as const, scorePercent: 90 },
      { category: "assignments" as const, scorePercent: 85 },
      { category: "midterm" as const, scorePercent: 80 },
    ];

    const requiredFinal = calculateWhatIfTarget(
      scheme.gradingScheme,
      completed,
      "finalExam",
      85
    );
    expect(requiredFinal).toBe(75.0);
  });
});
