import { describe, it, expect } from "vitest";
import { calculateExamPrepStats } from "./exam-prep-engine";
import { Topic } from "@/types/schemas";

function mockTopics(total: number, completedCount: number): Topic[] {
  return Array.from({ length: total }, (_, i) => ({
    id: `topic-${i + 1}`,
    userId: "test-user",
    courseId: "course-1",
    unitId: "unit-1",
    title: `Topic ${i + 1}`,
    order: i,
    isDone: i < completedCount,
    watchScore: i < completedCount ? 40 : 0,
    checkScore: i < completedCount ? 60 : 0,
    topicScore: i < completedCount ? 100 : 0,
    isStudiedManually: false,
    isExperiment: false,
    isSelectedExperiment: true,
    createdAt: new Date().toISOString(),
  }));
}

describe("calculateExamPrepStats", () => {
  it("calculates exact daily target for uncompleted topics over days remaining", () => {
    // 29 topics, 5 completed -> 24 uncompleted
    // Exam date 12 days from reference date
    // Daily target = ceil(24 / 12) = 2 topics / day
    const topics = mockTopics(29, 5);
    const stats = calculateExamPrepStats(
      "Midterm Exam",
      "2026-11-20",
      topics,
      "2026-11-08"
    );

    expect(stats.totalTopicsCount).toBe(29);
    expect(stats.completedTopicsCount).toBe(5);
    expect(stats.uncompletedTopicsCount).toBe(24);
    expect(stats.daysRemaining).toBe(12);
    expect(stats.dailyTarget).toBe(2);
    expect(stats.paceStatus).toBe("steady");
    expect(stats.statusSentence).toBe(
      "Daily target: 2 topics / day to complete 24 uncompleted topics before Midterm Exam."
    );
  });

  it("handles intensive pace when many topics remain over short window", () => {
    // 71 topics, 0 completed -> 71 uncompleted
    // 10 days remaining -> ceil(71 / 10) = 8 topics / day
    const topics = mockTopics(71, 0);
    const stats = calculateExamPrepStats(
      "Final Exam",
      "2026-11-18",
      topics,
      "2026-11-08"
    );

    expect(stats.uncompletedTopicsCount).toBe(71);
    expect(stats.daysRemaining).toBe(10);
    expect(stats.dailyTarget).toBe(8);
    expect(stats.paceStatus).toBe("intensive");
  });

  it("handles 100% completed syllabus (mastered state)", () => {
    const topics = mockTopics(20, 20);
    const stats = calculateExamPrepStats(
      "Final Examination",
      "2026-11-20",
      topics,
      "2026-11-08"
    );

    expect(stats.uncompletedTopicsCount).toBe(0);
    expect(stats.dailyTarget).toBe(0);
    expect(stats.paceStatus).toBe("mastered");
    expect(stats.statusSentence).toContain("All 20 topics mastered! You are fully prepared");
  });

  it("handles exam day (0 days remaining)", () => {
    const topics = mockTopics(10, 6);
    const stats = calculateExamPrepStats(
      "Final Exam",
      "2026-11-08",
      topics,
      "2026-11-08"
    );

    expect(stats.daysRemaining).toBe(0);
    expect(stats.uncompletedTopicsCount).toBe(4);
    expect(stats.dailyTarget).toBe(4);
    expect(stats.paceStatus).toBe("exam_today");
  });

  it("handles passed exam date gracefully", () => {
    const topics = mockTopics(10, 2);
    const stats = calculateExamPrepStats(
      "Quiz 1",
      "2026-11-01",
      topics,
      "2026-11-08"
    );

    expect(stats.daysRemaining).toBeLessThan(0);
    expect(stats.dailyTarget).toBe(0);
    expect(stats.paceStatus).toBe("passed");
  });
});
