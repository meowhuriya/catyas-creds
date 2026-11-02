import { describe, it, expect } from "vitest";
import {
  NoteAuditRequestSchema,
  GradeExerciseRequestSchema,
  BadgeItemSchema,
  LeaderboardProfileSchema,
} from "@/types/mastery-gamification";
import { LeaderboardService } from "@/lib/gamification/leaderboard-service";

describe("Feature 1: Khan-Style Note Check & Multi-Modal Exercise Loop Schemas", () => {
  it("validates NoteAuditRequest schema", () => {
    const validRequest = {
      topicId: "ma101bs-u1-t1",
      topicTitle: "Matrices and Linear Transformations",
      unitTitle: "Unit 1: Matrices",
      courseTitle: "Matrices and Calculus",
      markdownNote: "Rank of a matrix is the maximum number of linearly independent row vectors.",
      images: [
        {
          mimeType: "image/jpeg",
          data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        },
      ],
    };

    const parsed = NoteAuditRequestSchema.safeParse(validRequest);
    expect(parsed.success).toBe(true);
  });

  it("validates GradeExerciseRequest schema for handwritten and text responses", () => {
    const validGradeReq = {
      questionId: "q-synthesis-1",
      questionType: "synthesis",
      prompt: "Derive the Rank-Nullity Theorem for an m x n matrix.",
      rubric: "3 pts for statement, 6 pts for kernel basis proof, 3 pts for dimension match.",
      modelAnswer: "dim(V) = dim(ker(T)) + dim(im(T))",
      userTextAnswer: "Let T: V -> W be linear transformation. Basis of ker(T)...",
    };

    const parsed = GradeExerciseRequestSchema.safeParse(validGradeReq);
    expect(parsed.success).toBe(true);
  });
});

describe("Feature 2: Squad Leaderboard & Badge Engine", () => {
  it("retrieves the badges catalog containing default system badges", async () => {
    const catalog = await LeaderboardService.getBadgesCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(5);

    const firstMastery = catalog.find((b) => b.id === "badge-first-mastery");
    expect(firstMastery).toBeDefined();
    expect(firstMastery?.criteriaType).toBe("TOPICS_MASTERED");
    expect(firstMastery?.thresholdValue).toBe(1);

    const streak7 = catalog.find((b) => b.id === "badge-streak-7");
    expect(streak7).toBeDefined();
    expect(streak7?.thresholdValue).toBe(7);
  });

  it("awards XP correctly based on activities", async () => {
    const testUid = "test-student-xp";

    // 1. Topic Mastered: +100 XP
    const res1 = await LeaderboardService.recordActivity(testUid, "TOPIC_MASTERED");
    expect(res1.xpEarned).toBe(100);
    expect(res1.profile.xp).toBeGreaterThanOrEqual(100);
    expect(res1.profile.topicsMasteredCount).toBe(1);

    // 2. Lecture Video Completed: +40 XP
    const res2 = await LeaderboardService.recordActivity(testUid, "LECTURE_COMPLETED");
    expect(res2.xpEarned).toBe(40);
    expect(res2.profile.xp).toBe(res1.profile.xp + 40);

    // 3. Spaced Recall Review: +25 XP
    const res3 = await LeaderboardService.recordActivity(testUid, "RECALL_COMPLETED");
    expect(res3.xpEarned).toBe(25);
    expect(res3.profile.xp).toBe(res2.profile.xp + 25);
  });

  it("filters leaderboard by squad code and supports creating custom badges", async () => {
    const allProfiles = await LeaderboardService.getLeaderboardProfiles();
    expect(allProfiles.length).toBeGreaterThan(0);

    // Filter by squad
    const cyberSquad = await LeaderboardService.getLeaderboardProfiles("CYBER9");
    expect(cyberSquad.every((p) => p.squadCode === "CYBER9")).toBe(true);

    // Mint custom badge
    const customBadge = await LeaderboardService.createCustomBadge({
      title: "Algorithms Master",
      description: "Mastered all dynamic programming units.",
      imageUrl: "data:image/svg+xml;utf8,<svg><circle cx='50' cy='50' r='50' fill='red'/></svg>",
      criteriaType: "TOPICS_MASTERED",
      thresholdValue: 8,
      createdByUid: "test-user-creator",
    });

    expect(customBadge.id).toContain("badge-custom-");
    expect(customBadge.isCustom).toBe(true);

    const updatedCatalog = await LeaderboardService.getBadgesCatalog();
    expect(updatedCatalog.some((b) => b.id === customBadge.id)).toBe(true);
  });
});
