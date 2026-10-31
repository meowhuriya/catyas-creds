import { describe, it, expect } from "vitest";
import {
  getGradeScaleMapping,
  validateGradingScheme,
  calculateCategoryPointsScore,
  calculateCourseGrades,
  calculateSGPA,
  calculateCGPA,
  calculateWhatIfTarget,
  calculateWhatIfRequirement,
  getAcademicStanding,
  isLabCourse,
  THEORY_GRADING_PRESET,
  LAB_GRADING_PRESET,
  CourseTermRecord,
} from "./grading-engine";
import { Course } from "@/types/schemas";

const SAMPLE_COURSE: Course = {
  id: "course-cs101",
  userId: "user-1",
  termId: "term-1",
  code: "CS 101",
  title: "Computer Programming in C",
  department: "CSE",
  level: "100",
  credits: 4,
  description: "Test theory course",
  colorTag: "slate",
  gradingScheme: { ...THEORY_GRADING_PRESET },
  passMark: 40,
  createdAt: "2026-01-01T00:00:00Z",
};

const SAMPLE_LAB_COURSE: Course = {
  id: "course-cs106",
  userId: "user-1",
  termId: "term-1",
  code: "CS 106ES",
  title: "Computer Programming in C Laboratory",
  department: "CSE",
  level: "100",
  credits: 1.5,
  description: "Test lab course",
  colorTag: "teal",
  gradingScheme: { ...LAB_GRADING_PRESET },
  passMark: 40,
  electiveExperimentsCount: 8,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("Grading Engine - Scale Mappings", () => {
  it("maps 10-point collegiate scale correctly (Pass mark 40%)", () => {
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
    expect(getGradeScaleMapping(40, "10_point")).toEqual({
      letter: "P",
      points: 5,
      passed: true,
    });
    expect(getGradeScaleMapping(39.9, "10_point")).toEqual({
      letter: "F",
      points: 0,
      passed: false,
    });
  });

  it("maps 4.0 GPA scale correctly (Pass mark 60% = D)", () => {
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
    expect(getGradeScaleMapping(60, "4_point")).toEqual({
      letter: "D",
      points: 1.0,
      passed: true,
    });
    expect(getGradeScaleMapping(55, "4_point")).toEqual({
      letter: "F",
      points: 0.0,
      passed: false,
    });
  });
});

describe("Grading Engine - Scheme Validation & Presets", () => {
  it("validates theory preset totals exactly 100", () => {
    const res = validateGradingScheme(THEORY_GRADING_PRESET);
    expect(res.isValid).toBe(true);
    expect(res.total).toBe(100);
    expect(THEORY_GRADING_PRESET.lessonCompletion).toBe(10);
    expect(THEORY_GRADING_PRESET.quizzes).toBe(25);
    expect(THEORY_GRADING_PRESET.assignments).toBe(30);
    expect(THEORY_GRADING_PRESET.midterm).toBe(15);
    expect(THEORY_GRADING_PRESET.finalExam).toBe(20);
  });

  it("validates lab preset totals exactly 100", () => {
    const res = validateGradingScheme(LAB_GRADING_PRESET);
    expect(res.isValid).toBe(true);
    expect(res.total).toBe(100);
    expect(LAB_GRADING_PRESET.lessonCompletion).toBe(60);
    expect(LAB_GRADING_PRESET.quizzes).toBe(20);
    expect(LAB_GRADING_PRESET.assignments).toBe(0);
    expect(LAB_GRADING_PRESET.midterm).toBe(0);
    expect(LAB_GRADING_PRESET.finalExam).toBe(20);
  });

  it("rejects bad weights that do not sum to 100", () => {
    expect(
      validateGradingScheme({
        lessonCompletion: 10,
        quizzes: 20,
        assignments: 30,
        midterm: 15,
        finalExam: 20,
      }).isValid
    ).toBe(false);

    expect(
      validateGradingScheme({
        lessonCompletion: 20,
        quizzes: 30,
        assignments: 30,
        midterm: 15,
        finalExam: 20,
      }).isValid
    ).toBe(false);
  });

  it("detects lab courses by title, code, and elective experiments", () => {
    expect(isLabCourse(SAMPLE_LAB_COURSE)).toBe(true);
    expect(isLabCourse(SAMPLE_COURSE)).toBe(false);
    expect(isLabCourse({ title: "Physics Laboratory", code: "PH101" })).toBe(true);
    expect(isLabCourse({ title: "Data Structures", code: "CS201L" })).toBe(true);
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

  it("returns null for empty items list (empty categories)", () => {
    expect(calculateCategoryPointsScore([])).toBeNull();
  });

  it("returns null if total max points is 0", () => {
    expect(calculateCategoryPointsScore([{ earnedPoints: 0, maxPoints: 0 }])).toBeNull();
  });
});

describe("Grading Engine - Course Grade Calculation & Empty Categories", () => {
  it("computes current vs projected final grades accurately with partial work", () => {
    // Student has 100% topic mastery (Study progress weight 10)
    // 80% on Quiz 1 (Quiz weight 25)
    // No assignments, midterm, or final yet completed
    const result = calculateCourseGrades(
      SAMPLE_COURSE,
      100, // topic mastery score = 100%
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
    // - Study progress: 100% * 10 = 10 points
    // - Quizzes: 80% * 25 = 20 points
    // Completed weights = 10 + 25 = 35
    // Current grade = (10 + 20) / 35 * 100 = 30 / 35 * 100 = 85.71%
    expect(result.currentGrade).toBe(85.71);

    // Projected final grade = 10 + 20 = 30.00% (uncompleted assignments, midterm, final count as 0)
    expect(result.projectedFinalGrade).toBe(30);
    expect(result.letter).toBe("F"); // under 40%
  });

  it("handles course with completely empty categories gracefully", () => {
    const result = calculateCourseGrades(
      SAMPLE_COURSE,
      0, // 0 topic mastery
      [], // no assessments
      [], // no attempts
      []  // no submissions
    );

    // Completed weights = 10 (study progress), score = 0
    expect(result.currentGrade).toBe(0);
    expect(result.projectedFinalGrade).toBe(0);
    expect(result.letter).toBe("F");
    expect(result.passed).toBe(false);
  });

  it("computes lab course grades correctly ignoring 0-weight categories", () => {
    // Lab Course scheme: Experiments done 60%, Quizzes/Viva 20%, Final Lab 20%
    const result = calculateCourseGrades(
      SAMPLE_LAB_COURSE,
      90, // Experiments done score = 90%
      [
        {
          id: "lab-viva-1",
          userId: "user-1",
          courseId: "course-cs106",
          type: "quiz",
          title: "Lab Viva 1",
          maxPoints: 20,
          description: "",
          createdAt: "2026-01-01",
        },
      ],
      [
        {
          id: "att-viva-1",
          userId: "user-1",
          assessmentId: "lab-viva-1",
          courseId: "course-cs106",
          answers: {},
          score: 18, // 18/20 = 90%
          maxPoints: 20,
          percentage: 90,
          startedAt: "2026-01-02",
          submittedAt: "2026-01-02",
          isCompleted: true,
        },
      ],
      []
    );

    // Categories with weight > 0 and graded:
    // - Experiments done: 90% * 60 = 54
    // - Quizzes/viva: 90% * 20 = 18
    // Total completed weights = 60 + 20 = 80
    // Current grade = (54 + 18) / 80 * 100 = 72 / 80 * 100 = 90.0%
    expect(result.currentGrade).toBe(90);
    // Projected final = 54 + 18 = 72.0%
    expect(result.projectedFinalGrade).toBe(72);
    expect(result.letter).toBe("A"); // 72% on 10-point scale = A (8 points)
    expect(result.points).toBe(8);
  });
});

describe("Grading Engine - SGPA and CGPA Calculation with Retake Replacement", () => {
  it("calculates SGPA accurately from credit-weighted grade points", () => {
    const termCourses = [
      { credits: 4, gradePoints: 10 }, // CS 101: 4 * 10 = 40
      { credits: 4, gradePoints: 8 },  // MATH 210: 4 * 8 = 32
      { credits: 3, gradePoints: 9 },  // PHIL 140: 3 * 9 = 27
    ];
    // Total credits = 11. Total points = 99. SGPA = 99 / 11 = 9.00
    expect(calculateSGPA(termCourses)).toBe(9.0);
  });

  it("handles zero credits edge case gracefully without NaN", () => {
    expect(calculateSGPA([])).toBe(0);
    expect(calculateSGPA([{ credits: 0, gradePoints: 10 }])).toBe(0);
    expect(calculateCGPA([])).toBe(0);
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

  it("handles multiple retakes of the same course properly", () => {
    const history: CourseTermRecord[] = [
      { courseId: "c1", courseCode: "EE 101", termId: "t1", credits: 3, percentage: 35, letter: "F", gradePoints: 0, passed: false },
      { courseId: "c2", courseCode: "EE 101", termId: "t2", credits: 3, percentage: 55, letter: "B", gradePoints: 6, passed: true },
      { courseId: "c3", courseCode: "EE 101", termId: "t3", credits: 3, percentage: 85, letter: "A+", gradePoints: 9, passed: true },
    ];
    // Latest attempt is 9 grade points on 3 credits.
    expect(calculateCGPA(history)).toBe(9.0);
  });
});

describe("Grading Engine - What-If Projection Calculator", () => {
  it("determines required final exam score to reach target overall grade", () => {
    const scheme: Course = SAMPLE_COURSE;
    // Completed work so far:
    // Study progress: 100% (weight 10) -> 10 pts
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

  it("calculates what-if requirement across remaining weight and achievable flag", () => {
    // Current projected: 60%, target: 80%, remaining weight: 25%
    // Deficit = 20%, required on remaining = (20 / 25) * 100 = 80.0%
    const res = calculateWhatIfRequirement(60, 80, 25);
    expect(res).toEqual({ requiredScoreOnRemaining: 80, achievable: true });

    // Impossible target: Current projected: 40%, target: 90%, remaining weight: 20%
    // Deficit = 50%, required on remaining = (50 / 20) * 100 = 250% > 100%
    const impossible = calculateWhatIfRequirement(40, 90, 20);
    expect(impossible.achievable).toBe(false);
  });

  it("determines correct academic standing designations", () => {
    expect(getAcademicStanding(9.4, "10_point")).toBe("Dean's Honors / Distinction");
    expect(getAcademicStanding(7.8, "10_point")).toBe("First Class Standing");
    expect(getAcademicStanding(3.9, "4_point")).toBe("Summa Cum Laude / Honors");
    expect(getAcademicStanding(3.2, "4_point")).toBe("Good Academic Standing");
    expect(getAcademicStanding(1.5, "4_point")).toBe("Academic Warning");
  });
});
