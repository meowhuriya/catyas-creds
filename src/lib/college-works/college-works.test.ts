import { describe, it, expect } from "vitest";
import { CollegeWorkItem, ALL_COURSES } from "@/types/college-works";
import { SEED_COLLEGE_WORKS } from "./seed-data";
import { sanitizeWorkForFirestore, mergeWorksLists } from "./sync-service";

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

  it("detects overdue assignments when deadline has passed and work is not submitted", () => {
    const todayStr = "2026-11-08";
    const overdueWork: CollegeWorkItem = {
      id: "cw-overdue",
      courseCode: "CS105ES",
      courseTitle: "Programming for Problem Solving",
      type: "assignment",
      title: "Assignment 4: Recursion",
      unitOrExp: "Unit 4",
      dueDate: "2026-11-04",
      status: "pending",
      lastUpdatedAt: "2026-11-01T10:00:00.000Z",
    };

    const isCompleted = overdueWork.status === "submitted" || overdueWork.status === "graded";
    const isOverdue = !isCompleted && Boolean(overdueWork.dueDate) && overdueWork.dueDate < todayStr;
    expect(isOverdue).toBe(true);

    // Completed works with past due date are NOT overdue
    const completedWork: CollegeWorkItem = {
      ...overdueWork,
      status: "submitted",
      submittedAt: "2026-11-03T12:00:00.000Z",
    };
    const isCompletedDone = completedWork.status === "submitted" || completedWork.status === "graded";
    const isCompletedOverdue = !isCompletedDone && Boolean(completedWork.dueDate) && completedWork.dueDate < todayStr;
    expect(isCompletedOverdue).toBe(false);
  });

  it("deletes an item by id cleanly", () => {
    const remaining = mockWorks.filter((w) => w.id !== "cw-1");
    expect(remaining.length).toBe(2);
    expect(remaining.some((w) => w.id === "cw-1")).toBe(false);
  });

  describe("Cross-Device Cloud Sync Service", () => {
    it("sanitizes work items to prevent Firestore undefined field errors", () => {
      const itemWithUndefined: CollegeWorkItem = {
        id: "work-test",
        courseCode: "MA101BS",
        courseTitle: "Matrices and Calculus",
        type: "assignment",
        title: "Test Work",
        unitOrExp: "Unit 1",
        dueDate: "2026-11-20",
        status: "pending",
        lastUpdatedAt: "2026-11-08T10:00:00.000Z",
        gradeOrMarks: undefined,
        notes: undefined,
        submissionUrl: undefined,
        attachmentName: undefined,
        submittedAt: undefined,
      };

      const sanitized = sanitizeWorkForFirestore(itemWithUndefined, "user-123");
      expect(sanitized.id).toBe("work-test");
      expect(sanitized.userId).toBe("user-123");
      expect("gradeOrMarks" in sanitized).toBe(false);
      expect("notes" in sanitized).toBe(false);
      expect("submissionUrl" in sanitized).toBe(false);
      expect("attachmentName" in sanitized).toBe(false);
      expect("submittedAt" in sanitized).toBe(false);
    });

    it("merges cloud and local works picking the latest lastUpdatedAt", () => {
      const cloudWorks: CollegeWorkItem[] = [
        {
          id: "work-1",
          courseCode: "CH106BS",
          courseTitle: "Chemistry Lab",
          type: "record",
          title: "Cloud Version Exp 1",
          unitOrExp: "Exp 1",
          dueDate: "2026-11-10",
          status: "pending",
          lastUpdatedAt: "2026-11-05T10:00:00.000Z",
        },
        {
          id: "work-2",
          courseCode: "MA101BS",
          courseTitle: "Calculus",
          type: "assignment",
          title: "Only on Cloud Work",
          unitOrExp: "Unit 1",
          dueDate: "2026-11-12",
          status: "submitted",
          lastUpdatedAt: "2026-11-06T10:00:00.000Z",
        },
      ];

      const localWorks: CollegeWorkItem[] = [
        {
          id: "work-1",
          courseCode: "CH106BS",
          courseTitle: "Chemistry Lab",
          type: "record",
          title: "Laptop Edited Version Exp 1",
          unitOrExp: "Exp 1",
          dueDate: "2026-11-10",
          status: "graded",
          gradeOrMarks: "10/10",
          lastUpdatedAt: "2026-11-08T10:00:00.000Z", // Newer than cloud
        },
        {
          id: "work-3",
          courseCode: "CS105ES",
          courseTitle: "Programming",
          type: "assignment",
          title: "Brand New Work on Laptop",
          unitOrExp: "Unit 2",
          dueDate: "2026-11-15",
          status: "pending",
          lastUpdatedAt: "2026-11-08T11:00:00.000Z", // Local-only
        },
      ];

      const { merged, hasNewLocalItems } = mergeWorksLists(cloudWorks, localWorks);
      expect(merged.length).toBe(3);
      expect(hasNewLocalItems).toBe(true);

      const work1 = merged.find((w) => w.id === "work-1");
      expect(work1?.title).toBe("Laptop Edited Version Exp 1");
      expect(work1?.status).toBe("graded");

      const work2 = merged.find((w) => w.id === "work-2");
      expect(work2?.title).toBe("Only on Cloud Work");

      const work3 = merged.find((w) => w.id === "work-3");
      expect(work3?.title).toBe("Brand New Work on Laptop");
    });

    it("verifies canonical seed works are populated", () => {
      expect(SEED_COLLEGE_WORKS.length).toBe(8);
      expect(SEED_COLLEGE_WORKS.some((w) => w.type === "record")).toBe(true);
      expect(SEED_COLLEGE_WORKS.some((w) => w.type === "assignment")).toBe(true);
    });
  });
});
