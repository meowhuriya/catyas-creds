/**
 * Pure Grading Mathematics Engine
 * All grading calculations, scales, SGPA/CGPA, retake rules, and What-If projections.
 * Zero side-effects, 100% pure TypeScript.
 */

import {
  Course,
  CourseGradingScheme,
  Assessment,
  Attempt,
  Submission,
} from "@/types/schemas";

export interface GradeScaleMapping {
  letter: string;
  points: number;
  passed: boolean;
}

export interface CategoryScoreDetail {
  category: keyof CourseGradingScheme;
  label: string;
  weight: number;
  scorePercent: number | null; // null if no graded items exist yet
  itemsCount: number;
}

export interface CourseGradeResult {
  currentGrade: number;        // Normalized score across completed categories
  projectedFinalGrade: number; // Overall course score treating uncompleted categories as 0
  letter: string;
  points: number;
  passed: boolean;
  categories: CategoryScoreDetail[];
}

export interface CourseTermRecord {
  courseId: string;
  courseCode: string;
  termId: string;
  credits: number;
  percentage: number;
  letter: string;
  gradePoints: number;
  passed: boolean;
  termDate?: string; // ISO date for determining recency in retakes
}

// 1. Scale Mappings
export function getGradeScaleMapping(
  percentage: number,
  scale: "10_point" | "4_point" = "10_point"
): GradeScaleMapping {
  const p = Math.round(percentage * 100) / 100;

  if (scale === "10_point") {
    // 90-100 = O (10), 80-89 = A+ (9), 70-79 = A (8), 60-69 = B+ (7), 50-59 = B (6), 40-49 = P (5), <40 = F (0)
    if (p >= 90) return { letter: "O", points: 10, passed: true };
    if (p >= 80) return { letter: "A+", points: 9, passed: true };
    if (p >= 70) return { letter: "A", points: 8, passed: true };
    if (p >= 60) return { letter: "B+", points: 7, passed: true };
    if (p >= 50) return { letter: "B", points: 6, passed: true };
    if (p >= 40) return { letter: "P", points: 5, passed: true };
    return { letter: "F", points: 0, passed: false };
  } else {
    // 4.0 Standard Collegiate Scale (Pass mark 60% = D)
    if (p >= 93) return { letter: "A", points: 4.0, passed: true };
    if (p >= 90) return { letter: "A-", points: 3.7, passed: true };
    if (p >= 87) return { letter: "B+", points: 3.3, passed: true };
    if (p >= 83) return { letter: "B", points: 3.0, passed: true };
    if (p >= 80) return { letter: "B-", points: 2.7, passed: true };
    if (p >= 77) return { letter: "C+", points: 2.3, passed: true };
    if (p >= 73) return { letter: "C", points: 2.0, passed: true };
    if (p >= 70) return { letter: "C-", points: 1.7, passed: true };
    if (p >= 67) return { letter: "D+", points: 1.3, passed: true };
    if (p >= 60) return { letter: "D", points: 1.0, passed: true };
    return { letter: "F", points: 0.0, passed: false };
  }
}

// 2. Validate Course Grading Scheme
export function validateGradingScheme(scheme: CourseGradingScheme): {
  isValid: boolean;
  total: number;
  error?: string;
} {
  const total =
    scheme.lessonCompletion +
    scheme.quizzes +
    scheme.assignments +
    scheme.midterm +
    scheme.finalExam;

  if (total !== 100) {
    return {
      isValid: false,
      total,
      error: `Grading scheme weights must sum to exactly 100%. Current total: ${total}%.`,
    };
  }

  return { isValid: true, total };
}

// 3. Category Score Calculation
// User rule #2: Inside a category, score = total points earned / total points available.
export function calculateCategoryPointsScore(
  items: { earnedPoints: number; maxPoints: number }[]
): number | null {
  if (items.length === 0) return null;

  const totalMax = items.reduce((acc, item) => acc + item.maxPoints, 0);
  if (totalMax <= 0) return null;

  const totalEarned = items.reduce((acc, item) => acc + item.earnedPoints, 0);
  return (totalEarned / totalMax) * 100;
}

// 4. Full Course Grade Calculation
export function calculateCourseGrades(
  course: Course,
  lessonCompletionPercent: number,
  assessments: Assessment[],
  attempts: Attempt[],
  submissions: Submission[],
  scale: "10_point" | "4_point" = "10_point"
): CourseGradeResult {
  const scheme = course.gradingScheme;

  // Group assessments by category
  const quizzes = assessments.filter((a) => a.type === "quiz");
  const assignments = assessments.filter((a) => a.type === "assignment");
  const midterms = assessments.filter((a) => a.type === "midterm");
  const finals = assessments.filter((a) => a.type === "final");

  // Calculate quizzes score
  const quizItems = quizzes
    .map((q) => {
      // Best attempt score for this quiz
      const atts = attempts.filter((a) => a.assessmentId === q.id && a.isCompleted);
      if (atts.length === 0) return null;
      const best = Math.max(...atts.map((a) => a.score));
      return { earnedPoints: best, maxPoints: q.maxPoints };
    })
    .filter(Boolean) as { earnedPoints: number; maxPoints: number }[];

  const quizScore = calculateCategoryPointsScore(quizItems);

  // Calculate assignments score
  const assignmentItems = assignments
    .map((asg) => {
      const sub = submissions.find((s) => s.assessmentId === asg.id);
      if (!sub) return null;
      return { earnedPoints: sub.finalScore, maxPoints: asg.maxPoints };
    })
    .filter(Boolean) as { earnedPoints: number; maxPoints: number }[];

  const assignmentScore = calculateCategoryPointsScore(assignmentItems);

  // Calculate midterm score
  const midtermItems = midterms
    .map((m) => {
      const atts = attempts.filter((a) => a.assessmentId === m.id && a.isCompleted);
      if (atts.length === 0) return null;
      const best = Math.max(...atts.map((a) => a.score));
      return { earnedPoints: best, maxPoints: m.maxPoints };
    })
    .filter(Boolean) as { earnedPoints: number; maxPoints: number }[];

  const midtermScore = calculateCategoryPointsScore(midtermItems);

  // Calculate final exam score
  const finalItems = finals
    .map((f) => {
      const atts = attempts.filter((a) => a.assessmentId === f.id && a.isCompleted);
      if (atts.length === 0) return null;
      const best = Math.max(...atts.map((a) => a.score));
      return { earnedPoints: best, maxPoints: f.maxPoints };
    })
    .filter(Boolean) as { earnedPoints: number; maxPoints: number }[];

  const finalScore = calculateCategoryPointsScore(finalItems);

  // Categories detail
  const categories: CategoryScoreDetail[] = [
    {
      category: "lessonCompletion",
      label: "Lesson Completion",
      weight: scheme.lessonCompletion,
      scorePercent: lessonCompletionPercent,
      itemsCount: 1,
    },
    {
      category: "quizzes",
      label: "Quizzes",
      weight: scheme.quizzes,
      scorePercent: quizScore,
      itemsCount: quizItems.length,
    },
    {
      category: "assignments",
      label: "Assignments",
      weight: scheme.assignments,
      scorePercent: assignmentScore,
      itemsCount: assignmentItems.length,
    },
    {
      category: "midterm",
      label: "Midterm Examination",
      weight: scheme.midterm,
      scorePercent: midtermScore,
      itemsCount: midtermItems.length,
    },
    {
      category: "finalExam",
      label: "Final Examination",
      weight: scheme.finalExam,
      scorePercent: finalScore,
      itemsCount: finalItems.length,
    },
  ];

  // 1. Current Grade: Normalized sum over categories with graded work
  let completedWeightedSum = 0;
  let completedWeights = 0;

  // 2. Projected Final Grade: Sum over all categories (uncompleted = 0)
  let projectedWeightedSum = 0;

  for (const cat of categories) {
    if (cat.scorePercent !== null) {
      completedWeightedSum += (cat.scorePercent / 100) * cat.weight;
      completedWeights += cat.weight;
      projectedWeightedSum += (cat.scorePercent / 100) * cat.weight;
    }
  }

  const currentGrade =
    completedWeights > 0 ? (completedWeightedSum / completedWeights) * 100 : 0;
  const projectedFinalGrade = projectedWeightedSum; // weights sum to 100

  const scaleMapping = getGradeScaleMapping(projectedFinalGrade, scale);

  return {
    currentGrade: Math.round(currentGrade * 100) / 100,
    projectedFinalGrade: Math.round(projectedFinalGrade * 100) / 100,
    letter: scaleMapping.letter,
    points: scaleMapping.points,
    passed: projectedFinalGrade >= (course.passMark || 40),
    categories,
  };
}

// 5. Semester Grade Point Average (SGPA)
export function calculateSGPA(
  courses: { credits: number; gradePoints: number }[]
): number {
  if (courses.length === 0) return 0;

  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);
  if (totalCredits <= 0) return 0;

  const totalPoints = courses.reduce(
    (acc, c) => acc + c.credits * c.gradePoints,
    0
  );

  return Math.round((totalPoints / totalCredits) * 100) / 100;
}

// 6. Cumulative Grade Point Average (CGPA) with Course Retake Replacement Rule
// Rule: Retake replaces the old grade points in CGPA calculation, but both stay on transcript.
export function calculateCGPA(records: CourseTermRecord[]): number {
  if (records.length === 0) return 0;

  // Group records by courseId or courseCode to detect retakes
  const courseHistoryMap = new Map<string, CourseTermRecord[]>();

  for (const rec of records) {
    const key = rec.courseCode || rec.courseId;
    const existing = courseHistoryMap.get(key) || [];
    existing.push(rec);
    courseHistoryMap.set(key, existing);
  }

  let cumulativePoints = 0;
  let cumulativeCredits = 0;

  for (const [, attempts] of courseHistoryMap.entries()) {
    // If course was taken multiple times, pick the latest attempt for CGPA computation
    const latestAttempt = attempts[attempts.length - 1];

    if (latestAttempt.credits > 0) {
      cumulativeCredits += latestAttempt.credits;
      cumulativePoints += latestAttempt.credits * latestAttempt.gradePoints;
    }
  }

  if (cumulativeCredits <= 0) return 0;
  return Math.round((cumulativePoints / cumulativeCredits) * 100) / 100;
}

// 7. What-If Calculator: "What do I need on final category X to reach target grade Y?"
export function calculateWhatIfTarget(
  scheme: CourseGradingScheme,
  completedCategories: { category: keyof CourseGradingScheme; scorePercent: number }[],
  targetCategory: keyof CourseGradingScheme,
  targetOverallPercent: number
): number | null {
  const targetWeight = scheme[targetCategory];
  if (!targetWeight || targetWeight <= 0) return null;

  // Sum of existing completed categories (excluding targetCategory)
  let accumulatedPoints = 0;

  for (const cat of completedCategories) {
    if (cat.category !== targetCategory) {
      const weight = scheme[cat.category];
      accumulatedPoints += (cat.scorePercent / 100) * weight;
    }
  }

  // targetOverallPercent = accumulatedPoints + (requiredPercent / 100) * targetWeight
  const neededFromTarget = targetOverallPercent - accumulatedPoints;
  const requiredPercent = (neededFromTarget / targetWeight) * 100;

  return Math.round(requiredPercent * 10) / 10;
}
