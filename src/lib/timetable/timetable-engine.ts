import { ClassTimetableSlot, Course } from "@/types/schemas";

export const DAYS_OF_WEEK = [
  { id: 1, name: "Monday", shortName: "Mon" },
  { id: 2, name: "Tuesday", shortName: "Tue" },
  { id: 3, name: "Wednesday", shortName: "Wed" },
  { id: 4, name: "Thursday", shortName: "Thu" },
  { id: 5, name: "Friday", shortName: "Fri" },
  { id: 6, name: "Saturday", shortName: "Sat" },
  { id: 7, name: "Sunday", shortName: "Sun" },
] as const;

export interface EnrichedTimetableSlot extends ClassTimetableSlot {
  course?: Course;
  isCurrent?: boolean;
  isUpcoming?: boolean;
}

/**
 * Returns the day of week index where 1 = Monday ... 7 = Sunday.
 * Native Date.getDay() gives 0 = Sunday, 1 = Monday ... 6 = Saturday.
 */
export function getIsoDayOfWeek(date: Date = new Date()): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

/**
 * Compares two HH:MM time strings.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareTimes(a: string, b: string): number {
  return a.localeCompare(b);
}

/**
 * Formats time from HH:MM (24-hour) to friendly 12-hour collegiate display (e.g. 9:00 AM)
 */
export function formatTime12(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24;
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12; // hour 0 should be 12
  const mFormatted = m < 10 ? `0${m}` : m;
  return `${h}:${mFormatted} ${ampm}`;
}

/**
 * Checks if the given current time is within [startTime, endTime)
 */
export function isTimeInRange(current: string, start: string, end: string): boolean {
  return current >= start && current < end;
}

/**
 * Enriches timetable slots with their course details and live status (current, upcoming).
 */
export function enrichTimetableSlots(
  slots: ClassTimetableSlot[],
  courses: Course[],
  now: Date = new Date()
): EnrichedTimetableSlot[] {
  const currentIsoDay = getIsoDayOfWeek(now);
  const currentHours = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  const courseMap = new Map<string, Course>();
  courses.forEach((c) => courseMap.set(c.id, c));

  return slots.map((slot) => {
    const course = courseMap.get(slot.courseId);
    const isToday = slot.dayOfWeek === currentIsoDay;
    const isCurrent = isToday && isTimeInRange(currentTimeStr, slot.startTime, slot.endTime);
    const isUpcoming = isToday && slot.startTime > currentTimeStr;

    return {
      ...slot,
      course,
      isCurrent,
      isUpcoming,
    };
  });
}

/**
 * Sorts timetable slots chronologically by day of week then start time.
 */
export function sortTimetableSlots(slots: ClassTimetableSlot[]): ClassTimetableSlot[] {
  return [...slots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek;
    }
    return a.startTime.localeCompare(b.startTime);
  });
}

/**
 * Groups slots by day of week (1 to 5 or 6).
 */
export function groupSlotsByDay(
  slots: EnrichedTimetableSlot[],
  maxDay: 5 | 6 | 7 = 5
): Map<number, EnrichedTimetableSlot[]> {
  const map = new Map<number, EnrichedTimetableSlot[]>();
  for (let d = 1; d <= maxDay; d++) {
    map.set(d, []);
  }

  const sorted = sortTimetableSlots(slots) as EnrichedTimetableSlot[];
  sorted.forEach((slot) => {
    if (slot.dayOfWeek <= maxDay) {
      const list = map.get(slot.dayOfWeek) || [];
      list.push(slot);
      map.set(slot.dayOfWeek, list);
    }
  });

  return map;
}

/**
 * Filters slots for a specific day of week and returns sorted list.
 */
export function getSlotsForDay(
  slots: EnrichedTimetableSlot[],
  dayOfWeek: number
): EnrichedTimetableSlot[] {
  return slots
    .filter((s) => s.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}
