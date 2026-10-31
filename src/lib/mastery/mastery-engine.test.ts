import { describe, it, expect } from "vitest";
import {
  calculateTopicMastery,
  calculateUnitMastery,
  calculateCourseMastery,
  calculateSemesterProgress,
  calculateExamReadiness,
} from "./mastery-engine";

describe("mastery-engine", () => {
  describe("calculateTopicMastery", () => {
    it("correctly calculates topic score below 70 as learning", () => {
      const res = calculateTopicMastery(40, 20);
      expect(res.topicScore).toBe(60);
      expect(res.isDone).toBe(false);
      expect(res.status).toBe("learning");
    });

    it("marks topic as done when score reaches 70", () => {
      const res = calculateTopicMastery(40, 30);
      expect(res.topicScore).toBe(70);
      expect(res.isDone).toBe(true);
      expect(res.status).toBe("done");
    });

    it("marks topic as not_started when score is 0", () => {
      const res = calculateTopicMastery(0, 0);
      expect(res.topicScore).toBe(0);
      expect(res.isDone).toBe(false);
      expect(res.status).toBe("not_started");
    });

    it("clamps watchScore to 40 and checkScore to 60", () => {
      const res = calculateTopicMastery(50, 75);
      expect(res.watchScore).toBe(40);
      expect(res.checkScore).toBe(60);
      expect(res.topicScore).toBe(100);
      expect(res.isDone).toBe(true);
    });

    it("handles negative inputs gracefully", () => {
      const res = calculateTopicMastery(-10, -5);
      expect(res.watchScore).toBe(0);
      expect(res.checkScore).toBe(0);
      expect(res.topicScore).toBe(0);
    });
  });

  describe("calculateUnitMastery", () => {
    it("calculates average of topics", () => {
      const topics = [
        { id: "1", topicScore: 80, isDone: true },
        { id: "2", topicScore: 60, isDone: false },
      ];
      const res = calculateUnitMastery(topics);
      expect(res.score).toBe(70);
      expect(res.completedTopics).toBe(1);
      expect(res.totalTopics).toBe(2);
      expect(res.isCompleted).toBe(false); // only 1 of 2 done
    });

    it("marks unit complete when all topics are done and avg >= 70", () => {
      const topics = [
        { id: "1", topicScore: 80, isDone: true },
        { id: "2", topicScore: 75, isDone: true },
      ];
      const res = calculateUnitMastery(topics);
      expect(res.score).toBe(78);
      expect(res.isCompleted).toBe(true);
    });

    it("handles elective lab requirements (any N experiments)", () => {
      const topics = [
        { id: "1", topicScore: 80, isDone: true, isSelectedExperiment: true },
        { id: "2", topicScore: 85, isDone: true, isSelectedExperiment: true },
        { id: "3", topicScore: 0, isDone: false, isSelectedExperiment: false }, // omitted
      ];
      const res = calculateUnitMastery(topics, 2);
      expect(res.completedTopics).toBe(2);
      expect(res.totalTopics).toBe(2);
      expect(res.isCompleted).toBe(true);
    });

    it("handles empty topics", () => {
      const res = calculateUnitMastery([]);
      expect(res.score).toBe(0);
      expect(res.isCompleted).toBe(false);
    });
  });

  describe("calculateCourseMastery", () => {
    it("calculates arithmetic average of unit scores", () => {
      const res = calculateCourseMastery([80, 90, 70]);
      expect(res.courseScore).toBe(80);
      expect(res.completedUnits).toBe(3);
    });

    it("handles zero units", () => {
      const res = calculateCourseMastery([]);
      expect(res.courseScore).toBe(0);
      expect(res.completedUnits).toBe(0);
    });
  });

  describe("calculateSemesterProgress", () => {
    it("computes credit-weighted average of course scores", () => {
      const courses = [
        { credits: 4, score: 80 }, // 320
        { credits: 2, score: 50 }, // 100
      ]; // total credits = 6, total weighted = 420 => 70%
      const res = calculateSemesterProgress(courses);
      expect(res.totalCredits).toBe(6);
      expect(res.progressPercent).toBe(70);
      expect(res.earnedCredits).toBe(6);
    });

    it("handles zero credits", () => {
      const res = calculateSemesterProgress([]);
      expect(res.progressPercent).toBe(0);
      expect(res.totalCredits).toBe(0);
    });
  });

  describe("calculateExamReadiness", () => {
    it("blends mastery and quiz scores (60/40)", () => {
      const readiness = calculateExamReadiness(80, 60);
      // 0.6 * 80 + 0.4 * 60 = 48 + 24 = 72
      expect(readiness).toBe(72);
    });

    it("uses 100% mastery when quiz score is not provided", () => {
      expect(calculateExamReadiness(85, null)).toBe(85);
      expect(calculateExamReadiness(90, undefined)).toBe(90);
    });
  });
});
