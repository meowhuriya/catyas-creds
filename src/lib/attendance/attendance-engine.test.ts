import { describe, it, expect } from "vitest";
import { calculateAttendanceStats } from "./attendance-engine";

describe("calculateAttendanceStats", () => {
  it("handles initial zero classes state gracefully", () => {
    const stats = calculateAttendanceStats(0, 0, 75);
    expect(stats.classesHeld).toBe(0);
    expect(stats.classesAttended).toBe(0);
    expect(stats.classesCanMiss).toBe(0);
    expect(stats.isBelowLimit).toBe(false);
    expect(stats.statusSentence).toBe("you can still miss 0 classes");
  });

  it("calculates exact safe miss allowance when above threshold", () => {
    // 20 held, 18 attended (90%) with 75% min
    // 18 / (20 + 4) = 18 / 24 = 0.75 (75%)
    // Can miss exactly 4 classes
    const stats = calculateAttendanceStats(20, 18, 75);
    expect(stats.currentPercentage).toBe(90);
    expect(stats.isBelowLimit).toBe(false);
    expect(stats.classesCanMiss).toBe(4);
    expect(stats.statusSentence).toBe("you can still miss 4 classes");
  });

  it("handles singular class grammatically", () => {
    // 8 held, 7 attended (87.5%) with 75% min
    // 7 / (8 + 1) = 7/9 = 77.7%
    // 7 / (8 + 2) = 7/10 = 70% (<75%)
    // Can miss exactly 1 class
    const stats = calculateAttendanceStats(8, 7, 75);
    expect(stats.classesCanMiss).toBe(1);
    expect(stats.statusSentence).toBe("you can still miss 1 class");
  });

  it("triggers warning chip and recovery requirement when below minimum threshold", () => {
    // 10 held, 6 attended (60%) with 75% min
    // Must attend next M classes: (75*10 - 100*6) / (100 - 75) = (750 - 600) / 25 = 150 / 25 = 6
    // Check: (6 + 6) / (10 + 6) = 12 / 16 = 75%
    const stats = calculateAttendanceStats(10, 6, 75);
    expect(stats.currentPercentage).toBe(60);
    expect(stats.isBelowLimit).toBe(true);
    expect(stats.classesToRecover).toBe(6);
    expect(stats.statusSentence).toBe("Must attend next 6 classes to recover");
  });

  it("supports editable minimum percentages (e.g. 80%)", () => {
    // 20 held, 18 attended (90%) with 80% min
    // 18 / (20 + 2) = 18 / 22 = 81.8%
    // 18 / (20 + 3) = 18 / 23 = 78.2% (<80%)
    // Can miss 2 classes
    const stats = calculateAttendanceStats(20, 18, 80);
    expect(stats.minimumPercentage).toBe(80);
    expect(stats.classesCanMiss).toBe(2);
    expect(stats.statusSentence).toBe("you can still miss 2 classes");
  });

  it("clamps invalid attendance values safely", () => {
    const stats = calculateAttendanceStats(10, 15, 75);
    expect(stats.classesAttended).toBe(10); // cannot attend more than held
    expect(stats.currentPercentage).toBe(100);
  });
});
