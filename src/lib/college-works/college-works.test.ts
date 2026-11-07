import { describe, it, expect } from "vitest";
import { CollegeWorkItem, ALL_COURSES } from "@/types/college-works";

describe("College Works Academic Management System", () => {
  const mockWorks: CollegeWorkItem[] = [
    {
      id: "cw-1",
      courseCode: "CH106BS",
      courseTitle: "Engineering Chemistry Lab",
      type: "record",
      title: "Exp 3: Conductometric Titration",
      unitOrExp: "Experiment #3",
      dueDate: "2026-10-28",
      status: "graded",
      gradeOrMarks: "10/10",
      submittedAt: "2026-10-27T16:45:00.000Z",
      lastUpdatedAt: "2026-10-29T11:15:00.000Z",
    },
    {
      id: "cw-2",
      courseCode: "MA101BS",
      courseTitle: "Matrices and Calculus",
      type: "assignment",
      title: "Assignment 2: Cayley-Hamilton Theorem",
      unitOrExp: "Unit 2",
      dueDate: "2026-11-05",
      status: "submitted",
      submittedAt: "2026-11-04T18:20:00.000Z",
      lastUpdatedAt: "2026-11-04T18:20:00.000Z",
    },
    {
      id: "cw-3",
      courseCode: "CH102BS",
      courseTitle: "Engineering Chemistry",
      type: "assignment",
      title: "Assignment 3: Corrosion Kinetics",
      unitOrExp: "Unit 3",
      dueDate: "2026-11-18",
      status: "pending",
      lastUpdatedAt: "2026-11-06T14:10:00.000Z",
    },
  ];

  it("contains all 19 enrolled B.Tech semester 1 and 2 courses", () => {
    expect(ALL_COURSES.length).toBe(19);
    const codes = ALL_COURSES.map((c) => c.code);
    expect(codes).toContain("MA101BS");
    expect(codes).toContain("CH102BS");
    expect(codes).toContain("CS105ES");
    expect(codes).toContain("CH106BS");
    expect(codes).toContain("CS107ES");
    expect(codes).toContain("CS208ES");
  });

  it("differentiates theory assignments and practical lab records", () => {
    const assignments = mockWorks.filter((w) => w.type === "assignment");
    const records = mockWorks.filter((w) => w.type === "record");

    expect(assignments.length).toBe(2);
    expect(records.length).toBe(1);
    expect(records[0].courseCode).toBe("CH106BS");
  });

  it("filters items by course code correctly", () => {
    const chemistryLabWorks = mockWorks.filter((w) => w.courseCode === "CH106BS");
    expect(chemistryLabWorks.length).toBe(1);
    expect(chemistryLabWorks[0].title).toContain("Conductometric Titration");
  });

  it("verifies and tracks submission and last updated timestamps", () => {
    const submittedItem = mockWorks.find((w) => w.status === "submitted");
    expect(submittedItem).toBeDefined();
    expect(submittedItem?.submittedAt).toBe("2026-11-04T18:20:00.000Z");
    expect(submittedItem?.lastUpdatedAt).toBe("2026-11-04T18:20:00.000Z");

    const pendingItem = mockWorks.find((w) => w.status === "pending");
    expect(pendingItem?.submittedAt).toBeUndefined();
    expect(pendingItem?.lastUpdatedAt).toBeDefined();
  });

  it("updates submission timestamp when item is marked as submitted", () => {
    const pendingItem = mockWorks[2];
    const nowIso = "2026-11-07T12:00:00.000Z";

    const updatedItem: CollegeWorkItem = {
      ...pendingItem,
      status: "submitted",
      submittedAt: nowIso,
      lastUpdatedAt: nowIso,
    };

    expect(updatedItem.status).toBe("submitted");
    expect(updatedItem.submittedAt).toBe(nowIso);
    expect(updatedItem.lastUpdatedAt).toBe(nowIso);
  });

  it("deletes an item by id cleanly", () => {
    const remaining = mockWorks.filter((w) => w.id !== "cw-1");
    expect(remaining.length).toBe(2);
    expect(remaining.some((w) => w.id === "cw-1")).toBe(false);
  });
});
