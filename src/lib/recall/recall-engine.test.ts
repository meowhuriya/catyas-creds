import { describe, it, expect } from "vitest";
import {
  scheduleInitialRecall,
  processRecallRating,
  prioritizeDailyRecalls,
  calculateExamReadinessForecast,
  getDefaultRecallStyle,
  applyExamConstraints,
  addDays,
  diffCalendarDays,
  RecallCandidate,
} from "./recall-engine";

describe("Recall Engine: Spaced Schedule (1, 3, 7, 14)", () => {
  const baseDate = "2026-11-01";

  it("schedules initial recall at D+1 when topic reaches Done", () => {
    const res = scheduleInitialRecall({ completedAt: baseDate });
    expect(res.nextDueDate).toBe("2026-11-02");
    expect(res.nextStage).toBe(1);
    expect(res.gapDays).toBe(1);
    expect(res.retentionLevel).toBe("green");
    expect(res.isConsolidated).toBe(false);
  });

  it("handles rating 'Good' through stages 1 -> 2 -> 3 -> 4 -> Consolidated", () => {
    // Stage 1 -> 2: standard gap 3 days (D+3)
    const r1 = processRecallRating({
      currentStage: 1,
      rating: "good",
      today: "2026-11-02",
    });
    expect(r1.nextStage).toBe(2);
    expect(r1.nextDueDate).toBe("2026-11-05"); // Nov 2 + 3 days = Nov 5
    expect(r1.gapDays).toBe(3);
    expect(r1.retentionLevel).toBe("green");
    expect(r1.isConsolidated).toBe(false);

    // Stage 2 -> 3: standard gap 7 days (D+7)
    const r2 = processRecallRating({
      currentStage: 2,
      rating: "good",
      today: "2026-11-05",
    });
    expect(r2.nextStage).toBe(3);
    expect(r2.nextDueDate).toBe("2026-11-12"); // Nov 5 + 7 days = Nov 12
    expect(r2.gapDays).toBe(7);

    // Stage 3 -> 4: standard gap 14 days (D+14)
    const r3 = processRecallRating({
      currentStage: 3,
      rating: "good",
      today: "2026-11-12",
    });
    expect(r3.nextStage).toBe(4);
    expect(r3.nextDueDate).toBe("2026-11-26"); // Nov 12 + 14 days = Nov 26
    expect(r3.gapDays).toBe(14);
    expect(r3.isConsolidated).toBe(false);

    // Stage 4 -> 5: Consolidated
    const r4 = processRecallRating({
      currentStage: 4,
      rating: "good",
      today: "2026-11-26",
    });
    expect(r4.nextStage).toBe(5);
    expect(r4.isConsolidated).toBe(true);
    expect(r4.retentionLevel).toBe("green");
  });

  it("handles rating 'Easy' by adding 50% to the next gap", () => {
    // Stage 1 -> 2: standard gap is 3 days. With 50% extra = round(3 * 1.5) = 5 days
    const r1 = processRecallRating({
      currentStage: 1,
      rating: "easy",
      today: "2026-11-02",
    });
    expect(r1.nextStage).toBe(2);
    expect(r1.gapDays).toBe(5);
    expect(r1.nextDueDate).toBe("2026-11-07"); // Nov 2 + 5 = Nov 7

    // Stage 2 -> 3: standard gap is 7 days. With 50% extra = round(7 * 1.5) = 11 days
    const r2 = processRecallRating({
      currentStage: 2,
      rating: "easy",
      today: "2026-11-07",
    });
    expect(r2.nextStage).toBe(3);
    expect(r2.gapDays).toBe(11);
    expect(r2.nextDueDate).toBe("2026-11-18"); // Nov 7 + 11 = Nov 18
  });

  it("handles rating 'Hard' by repeating the same stage in 2 days", () => {
    const res = processRecallRating({
      currentStage: 3,
      rating: "hard",
      today: "2026-11-10",
      currentScore: 75,
    });
    expect(res.nextStage).toBe(3); // stays at stage 3
    expect(res.gapDays).toBe(2);
    expect(res.nextDueDate).toBe("2026-11-12"); // Nov 10 + 2 = Nov 12
    expect(res.retentionLevel).toBe("amber");
  });

  it("handles rating 'Forgot' by restarting at stage 1 tomorrow and flagging red", () => {
    const res = processRecallRating({
      currentStage: 4,
      rating: "forgot",
      today: "2026-11-20",
      currentScore: 80,
    });
    expect(res.nextStage).toBe(1); // resets to stage 1
    expect(res.gapDays).toBe(1);
    expect(res.nextDueDate).toBe("2026-11-21"); // tomorrow
    expect(res.retentionLevel).toBe("red");
    expect(res.newScore).toBe(70); // reduced by 10
  });
});

describe("Recall Engine: Exam-Aware Scheduling", () => {
  const today = "2026-11-01";

  it("ensures no recall falls on the exam day or after exam - 2 days", () => {
    // Exam date is Nov 12 (11 days away). Cutoff is Nov 10 (exam - 2 days).
    const examDate = "2026-11-12";

    // Stage 3 scheduled normally would be +14 days = Nov 15 (which is after exam)
    const res = applyExamConstraints({
      prospectiveDate: "2026-11-15",
      today,
      examDate,
      stage: 3,
      totalStages: 4,
    });

    // Must be pulled forward to or before cutoff date (Nov 10)
    expect(diffCalendarDays(res.nextDueDate, "2026-11-10")).toBeLessThanOrEqual(0);
    // Must NOT fall on exam day (Nov 12)
    expect(res.nextDueDate).not.toBe("2026-11-12");
  });

  it("compresses intervals when exam is soon (e.g. 10 days away)", () => {
    const examDate = "2026-11-11"; // 10 days away, cutoff = Nov 9 (exam - 2)
    const res = processRecallRating({
      currentStage: 2,
      rating: "good",
      today: "2026-11-01",
      examDate,
    });

    // Standard gap would be 7 days (Nov 8), which fits before Nov 9 cutoff
    expect(diffCalendarDays(res.nextDueDate, "2026-11-09")).toBeLessThanOrEqual(0);
    expect(res.nextDueDate).not.toBe(examDate);
  });

  it("handles exam in 3 days: pulls forward to exam - 2", () => {
    const examDate = "2026-11-04"; // 3 days away, cutoff = Nov 2
    const res = processRecallRating({
      currentStage: 1,
      rating: "good",
      today: "2026-11-01",
      examDate,
    });

    expect(res.nextDueDate).toBe("2026-11-02");
    expect(res.nextDueDate).not.toBe(examDate);
  });

  it("suppresses all standard recalls on exam day", () => {
    const examDate = "2026-11-05";
    const candidates: RecallCandidate[] = [
      {
        topicId: "t1",
        courseId: "course-math",
        unitId: "u1",
        title: "Eigenvalues",
        recallDueAt: "2026-11-05",
        recallStage: 2,
        retentionLevel: "green",
        topicScore: 80,
        isDone: true,
      },
    ];

    const res = prioritizeDailyRecalls({
      candidates,
      examDatesByCourse: { "course-math": examDate },
      today: "2026-11-05", // Today is exam day!
    });

    expect(res.dueToday.length).toBe(0);
  });

  it("shows only a light recall of the 10 weakest topics on the day before an exam", () => {
    const examDate = "2026-11-06";
    const todayBefore = "2026-11-05"; // Day before exam

    // Create 15 topics with different scores
    const candidates: RecallCandidate[] = Array.from({ length: 15 }, (_, i) => ({
      topicId: `t-${i}`,
      courseId: "course-math",
      unitId: "u1",
      title: `Topic ${i}`,
      recallDueAt: "2026-11-05",
      recallStage: 2,
      retentionLevel: "amber",
      topicScore: 50 + i * 2, // 50, 52, 54 ... 78
      isDone: true,
    }));

    const res = prioritizeDailyRecalls({
      candidates,
      examDatesByCourse: { "course-math": examDate },
      today: todayBefore,
    });

    // Exactly 10 weakest topics should be selected for light review
    expect(res.dueToday.length).toBe(10);
    expect(res.dueToday.every((t) => t.isLightReview)).toBe(true);
    // Highest score in the light review should be <= the 10th score
    expect(res.dueToday[0].topicScore).toBe(50);
  });
});

describe("Recall Engine: Daily Cap and Prioritization", () => {
  const today = "2026-11-05";

  it("prioritizes overdue first, then nearest exam, then lowest retention", () => {
    const candidates: RecallCandidate[] = [
      {
        topicId: "t-normal-green",
        courseId: "c1",
        unitId: "u1",
        title: "Normal Green",
        recallDueAt: "2026-11-05", // due today
        recallStage: 1,
        retentionLevel: "green",
        topicScore: 85,
        isDone: true,
      },
      {
        topicId: "t-overdue-red",
        courseId: "c2",
        unitId: "u1",
        title: "Overdue Red",
        recallDueAt: "2026-11-02", // 3 days overdue!
        recallStage: 1,
        retentionLevel: "red",
        topicScore: 60,
        isDone: true,
      },
      {
        topicId: "t-exam-soon",
        courseId: "c3",
        unitId: "u1",
        title: "Exam in 4 Days",
        recallDueAt: "2026-11-05", // due today
        recallStage: 2,
        retentionLevel: "amber",
        topicScore: 70,
        isDone: true,
      },
      {
        topicId: "t-red-today",
        courseId: "c1",
        unitId: "u1",
        title: "Red Today",
        recallDueAt: "2026-11-05", // due today, but red retention
        recallStage: 1,
        retentionLevel: "red",
        topicScore: 55,
        isDone: true,
      },
    ];

    const res = prioritizeDailyRecalls({
      candidates,
      examDatesByCourse: { c3: "2026-11-09" }, // c3 has nearest exam
      dailyCap: 20,
      today,
    });

    expect(res.dueToday[0].topicId).toBe("t-overdue-red"); // Overdue #1
    expect(res.dueToday[1].topicId).toBe("t-exam-soon");   // Nearest exam #2
    expect(res.dueToday[2].topicId).toBe("t-red-today");   // Red retention #3
    expect(res.dueToday[3].topicId).toBe("t-normal-green");// Green retention last
  });

  it("caps daily recalls at cap limit and creates backlog deferral", () => {
    // Generate 25 candidate topics due today
    const candidates: RecallCandidate[] = Array.from({ length: 25 }, (_, i) => ({
      topicId: `top-${i}`,
      courseId: "c1",
      unitId: "u1",
      title: `Topic ${i}`,
      recallDueAt: today,
      recallStage: 1,
      retentionLevel: "green",
      topicScore: 75,
      isDone: true,
    }));

    const res = prioritizeDailyRecalls({
      candidates,
      dailyCap: 20,
      today,
    });

    expect(res.dueToday.length).toBe(20);
    expect(res.deferredBacklog.length).toBe(5);
    expect(res.backlogCount).toBe(5);
    expect(res.backlogNote).toContain("5 topics deferred");
  });
});

describe("Recall Engine: Exam Readiness Forecast", () => {
  it("computes readiness percentage and concrete daily learning fix", () => {
    const forecast = calculateExamReadinessForecast({
      totalTopics: 29,
      topicsRecalled: 5,
      examDate: "2026-11-15", // 14 days away
      today: "2026-11-01",
      currentPace: 1.5,
    });

    // Refresh cut-off is Nov 12 (15 - 3 = 12), so 11 days left
    expect(forecast.daysToExam).toBe(14);
    expect(forecast.daysToRefreshCutoff).toBe(11);
    expect(forecast.unreviewedTopics).toBe(24);

    // Concrete fix: 24 topics / 11 days = ceil(2.18) = 3 topics/day
    expect(forecast.requiredPerDay).toBe(3);
    expect(forecast.statusSentence).toBe("Learn and review 3 new topics per day for the next 11 days.");
    expect(forecast.isBehind).toBe(true);
    expect(forecast.warningNote).toContain("Warning: At your current pace");
  });

  it("reports 100% on track when all topics have completed recall", () => {
    const forecast = calculateExamReadinessForecast({
      totalTopics: 29,
      topicsRecalled: 29,
      examDate: "2026-11-15",
      today: "2026-11-01",
    });

    expect(forecast.unreviewedTopics).toBe(0);
    expect(forecast.forecastPercent).toBe(100);
    expect(forecast.isBehind).toBe(false);
    expect(forecast.statusSentence).toContain("Fully on track");
  });
});

describe("Recall Engine: Course Style Derivation", () => {
  it("correctly identifies Mathematics courses as 'problems'", () => {
    expect(getDefaultRecallStyle({ code: "MA101BS", department: "Mathematics" })).toBe("problems");
    expect(getDefaultRecallStyle({ code: "MA201BS", title: "Calculus & Algebra" })).toBe("problems");
  });

  it("correctly identifies Computer Science courses as 'code'", () => {
    expect(getDefaultRecallStyle({ code: "CS105ES", department: "Computer Science" })).toBe("code");
    expect(getDefaultRecallStyle({ code: "CS205ES", title: "Data Structures in C" })).toBe("code");
  });

  it("correctly identifies English courses as 'vocabulary_and_usage'", () => {
    expect(getDefaultRecallStyle({ code: "EN103HS", department: "Humanities" })).toBe("vocabulary_and_usage");
  });

  it("correctly identifies Science and Engineering courses as 'questions'", () => {
    expect(getDefaultRecallStyle({ code: "CH102BS", department: "Chemistry" })).toBe("questions");
    expect(getDefaultRecallStyle({ code: "PH202BS", department: "Physics" })).toBe("questions");
    expect(getDefaultRecallStyle({ code: "EE204ES", department: "Electrical" })).toBe("questions");
  });
});
