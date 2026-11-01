import { describe, it, expect } from "vitest";
import {
  getIsoDayOfWeek,
  compareTimes,
  formatTime12,
  isTimeInRange,
  enrichTimetableSlots,
  sortTimetableSlots,
  groupSlotsByDay,
  getSlotsForDay,
} from "./timetable-engine";
import { ClassTimetableSlot, Course } from "@/types/schemas";

describe("Timetable Engine", () => {
  const dummyCourses: Course[] = [
    {
      id: "course-math",
      userId: "u1",
      termId: "term-1",
      code: "MA101BS",
      title: "Matrices and Calculus",
      department: "Mathematics",
      credits: 4,
      level: "100",
      colorTag: "rust",
      description: "Math course",
      gradingScheme: { lessonCompletion: 10, quizzes: 20, assignments: 20, midterm: 30, finalExam: 20 },
      passMark: 40,
      createdAt: "2026-01-01",
    },
    {
      id: "course-chem",
      userId: "u1",
      termId: "term-1",
      code: "CH102BS",
      title: "Engineering Chemistry",
      department: "Chemistry",
      credits: 3,
      level: "100",
      colorTag: "teal",
      description: "Chemistry course",
      gradingScheme: { lessonCompletion: 10, quizzes: 20, assignments: 20, midterm: 30, finalExam: 20 },
      passMark: 40,
      createdAt: "2026-01-01",
    },
  ];

  const dummySlots: ClassTimetableSlot[] = [
    {
      id: "slot-2",
      userId: "u1",
      courseId: "course-chem",
      dayOfWeek: 1,
      startTime: "11:00",
      endTime: "12:00",
      room: "Room 204",
      type: "lecture",
    },
    {
      id: "slot-1",
      userId: "u1",
      courseId: "course-math",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "10:00",
      room: "Room 301",
      type: "lecture",
    },
    {
      id: "slot-3",
      userId: "u1",
      courseId: "course-math",
      dayOfWeek: 2,
      startTime: "10:00",
      endTime: "11:00",
      room: "Room 301",
      type: "lecture",
    },
  ];

  it("converts Date to ISO day of week (Monday = 1, Sunday = 7)", () => {
    // 2026-11-01 is a Sunday
    const sun = new Date(2026, 10, 1);
    expect(getIsoDayOfWeek(sun)).toBe(7);

    // 2026-11-02 is a Monday
    const mon = new Date(2026, 10, 2);
    expect(getIsoDayOfWeek(mon)).toBe(1);
  });

  it("formats 24h time to 12h time format", () => {
    expect(formatTime12("09:00")).toBe("9:00 AM");
    expect(formatTime12("12:00")).toBe("12:00 PM");
    expect(formatTime12("13:30")).toBe("1:30 PM");
    expect(formatTime12("00:15")).toBe("12:15 AM");
  });

  it("evaluates time ranges accurately", () => {
    expect(isTimeInRange("09:30", "09:00", "10:00")).toBe(true);
    expect(isTimeInRange("09:00", "09:00", "10:00")).toBe(true);
    expect(isTimeInRange("10:00", "09:00", "10:00")).toBe(false);
    expect(isTimeInRange("08:59", "09:00", "10:00")).toBe(false);
  });

  it("sorts slots chronologically by day and start time", () => {
    const sorted = sortTimetableSlots(dummySlots);
    expect(sorted[0].id).toBe("slot-1");
    expect(sorted[1].id).toBe("slot-2");
    expect(sorted[2].id).toBe("slot-3");
  });

  it("enriches slots with course metadata and live status", () => {
    // Monday at 09:30 AM
    const mondayMorning = new Date(2026, 10, 2, 9, 30);
    const enriched = enrichTimetableSlots(dummySlots, dummyCourses, mondayMorning);

    const slot1 = enriched.find((s) => s.id === "slot-1");
    expect(slot1?.course?.code).toBe("MA101BS");
    expect(slot1?.isCurrent).toBe(true);
    expect(slot1?.isUpcoming).toBe(false);

    const slot2 = enriched.find((s) => s.id === "slot-2");
    expect(slot2?.course?.code).toBe("CH102BS");
    expect(slot2?.isCurrent).toBe(false);
    expect(slot2?.isUpcoming).toBe(true);
  });

  it("groups slots by day of week", () => {
    const enriched = enrichTimetableSlots(dummySlots, dummyCourses);
    const grouped = groupSlotsByDay(enriched, 5);
    expect(grouped.get(1)?.length).toBe(2);
    expect(grouped.get(2)?.length).toBe(1);
    expect(grouped.get(3)?.length).toBe(0);
  });

  it("filters slots for a specific day", () => {
    const enriched = enrichTimetableSlots(dummySlots, dummyCourses);
    const monSlots = getSlotsForDay(enriched, 1);
    expect(monSlots.length).toBe(2);
    expect(monSlots[0].startTime).toBe("09:00");
    expect(monSlots[1].startTime).toBe("11:00");
  });
});
