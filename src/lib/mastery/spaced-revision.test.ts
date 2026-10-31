import { describe, it, expect } from "vitest";
import {
  calculateNextRevision,
  isRevisionDue,
  advanceRevisionStage,
  REVISION_INTERVALS_DAYS,
} from "./spaced-revision";

describe("spaced-revision", () => {
  it("has exact intervals 1, 3, 7, 21 days", () => {
    expect(REVISION_INTERVALS_DAYS).toEqual([1, 3, 7, 21]);
  });

  it("calculates 1st revision as +1 day", () => {
    const base = new Date("2026-10-01T10:00:00Z");
    const res = calculateNextRevision(base, 0);
    expect(res.stage).toBe(0);
    expect(res.nextDueDate).toBe("2026-10-02");
  });

  it("calculates 2nd revision as +3 days", () => {
    const base = new Date("2026-10-01T10:00:00Z");
    const res = calculateNextRevision(base, 1);
    expect(res.stage).toBe(1);
    expect(res.nextDueDate).toBe("2026-10-04");
  });

  it("calculates 3rd revision as +7 days", () => {
    const base = new Date("2026-10-01T10:00:00Z");
    const res = calculateNextRevision(base, 2);
    expect(res.stage).toBe(2);
    expect(res.nextDueDate).toBe("2026-10-08");
  });

  it("calculates 4th revision as +21 days", () => {
    const base = new Date("2026-10-01T10:00:00Z");
    const res = calculateNextRevision(base, 3);
    expect(res.stage).toBe(3);
    expect(res.nextDueDate).toBe("2026-10-22");
  });

  it("advances stage sequentially through all intervals", () => {
    const base = new Date("2026-10-01T10:00:00Z");
    const step1 = advanceRevisionStage(0, base);
    expect(step1.nextStage).toBe(1);
    expect(step1.nextDueDate).toBe("2026-10-04");
    expect(step1.isFullyMastered).toBe(false);

    const step2 = advanceRevisionStage(1, base);
    expect(step2.nextStage).toBe(2);
    expect(step2.nextDueDate).toBe("2026-10-08");

    const step3 = advanceRevisionStage(2, base);
    expect(step3.nextStage).toBe(3);
    expect(step3.nextDueDate).toBe("2026-10-22");

    const step4 = advanceRevisionStage(3, base);
    expect(step4.nextStage).toBe(4);
    expect(step4.isFullyMastered).toBe(true);
  });

  it("correctly identifies when a revision is due", () => {
    const now = new Date("2026-10-05T12:00:00Z");
    expect(isRevisionDue("2026-10-04", now)).toBe(true);
    expect(isRevisionDue("2026-10-05", now)).toBe(true);
    expect(isRevisionDue("2026-10-10", now)).toBe(false);
    expect(isRevisionDue(null, now)).toBe(false);
  });
});
