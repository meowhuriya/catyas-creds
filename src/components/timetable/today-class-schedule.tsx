"use client";

import * as React from "react";
import Link from "next/link";
import { Course, ClassTimetableSlot } from "@/types/schemas";
import {
  DAYS_OF_WEEK,
  enrichTimetableSlots,
  getSlotsForDay,
  formatTime12,
  getIsoDayOfWeek,
} from "@/lib/timetable/timetable-engine";
import { useDataStore } from "@/lib/repository";
import { cleanSyllabusTitle } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Radio,
  BookOpen,
  UserCheck,
} from "lucide-react";

interface TodayClassScheduleProps {
  courses: Course[];
  slots: ClassTimetableSlot[];
  onAttendanceRecorded?: () => void;
}

export function TodayClassSchedule({
  courses,
  slots,
  onAttendanceRecorded,
}: TodayClassScheduleProps) {
  const { dataStore } = useDataStore();
  const toast = useToast();

  const currentIsoDay = getIsoDayOfWeek();
  // Default to today if Mon-Fri (1-5), otherwise Monday (1)
  const [selectedDay, setSelectedDay] = React.useState<number>(() => {
    return currentIsoDay <= 5 ? currentIsoDay : 1;
  });

  const enrichedSlots = React.useMemo(() => {
    return enrichTimetableSlots(slots, courses);
  }, [slots, courses]);

  const displayedSlots = React.useMemo(() => {
    return getSlotsForDay(enrichedSlots, selectedDay);
  }, [enrichedSlots, selectedDay]);

  const handleMarkAttendance = async (course: Course) => {
    try {
      await dataStore.recordAttendance(course.id, "present", "Logged from Today's Class Schedule");
      toast.success(
        "Attendance Recorded",
        `Marked present for ${course.code}: ${cleanSyllabusTitle(course.title)}.`
      );
      if (onAttendanceRecorded) {
        onAttendanceRecorded();
      }
    } catch (err) {
      console.error("Failed to record attendance:", err);
      toast.error("Error", "Could not record attendance.");
    }
  };

  const isViewingRealToday = selectedDay === currentIsoDay;
  const dayObj = DAYS_OF_WEEK.find((d) => d.id === selectedDay) || DAYS_OF_WEEK[0];

  return (
    <div className="academic-card p-5 space-y-4 select-none">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--color-border)]/80">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--color-accent)]" />
          <div>
            <h3 className="font-serif text-sm font-bold text-[#14161F] dark:text-[#F6EBD3]">
              {isViewingRealToday ? "Today's Class Schedule" : `${dayObj.name} Class Schedule`}
            </h3>
            <span className="text-[11px] text-[#4B5160] dark:text-[#D1C7B7] block">
              {displayedSlots.length} {displayedSlots.length === 1 ? "period" : "periods"} scheduled
              {!isViewingRealToday && currentIsoDay > 5 && " (Weekend: Showing Monday)"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/planner?view=timetable"
            className="text-[11px] font-semibold text-[#8A1627] dark:text-[#F07B88] hover:underline inline-flex items-center gap-1"
          >
            <span>Full Timetable</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Weekday Switcher Pills */}
      <div className="flex items-center gap-1 p-1 rounded-[10px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31]">
        {DAYS_OF_WEEK.slice(0, 5).map((d) => {
          const isSelected = selectedDay === d.id;
          const isToday = currentIsoDay === d.id;

          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDay(d.id)}
              className={`flex-1 py-1 px-1.5 rounded-[6px] text-xs font-sans font-semibold transition-colors text-center cursor-pointer ${
                isSelected
                  ? "bg-[#A51C30] text-white shadow-xs font-bold"
                  : isToday
                  ? "bg-white dark:bg-[#1A1214] text-[#A51C30] border border-[#A51C30]/40"
                  : "text-[#4B5160] dark:text-[#D1C7B7] hover:text-[#14161F]"
              }`}
            >
              <span>{d.shortName}</span>
              {isToday && (
                <span className="block text-[8px] uppercase tracking-wider opacity-90">
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Slots List */}
      <div className="space-y-2.5">
        {displayedSlots.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#4B5160] dark:text-[#D1C7B7]">
            No classes scheduled for {dayObj.name}.
          </div>
        ) : (
          displayedSlots.map((slot) => {
            const c = slot.course;

            return (
              <div
                key={slot.id}
                className={`p-3.5 rounded-[12px] border transition-all ${
                  slot.isCurrent
                    ? "bg-[#5E7B5B]/10 border-[#5E7B5B]/40 ring-1 ring-[#5E7B5B]/30"
                    : "bg-[#FBF6EC] dark:bg-[#221A1C] border-[#E4D9C0] dark:border-[#3D2D31]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Header info */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-sans text-xs font-bold text-[#A51C30] dark:text-[#F07B88]">
                        {c?.code || "COURSE"}
                      </span>
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          slot.type === "lab"
                            ? "bg-[#2F7F86]/15 text-[#1C5C62] dark:text-[#52ADB5]"
                            : slot.type === "tutorial"
                            ? "bg-[#D9A441]/20 text-[#7A4F0E] dark:text-[#F0B533]"
                            : "bg-[#5E7B5B]/15 text-[#3E5C3C] dark:text-[#78A875]"
                        }`}
                      >
                        {slot.type}
                      </span>
                      {slot.isCurrent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3E5C3C] dark:text-[#78A875] uppercase">
                          <Radio className="h-2.5 w-2.5 animate-pulse" />
                          <span>In Session Now</span>
                        </span>
                      )}
                    </div>

                    {/* Course Title */}
                    <h4 className="font-serif text-sm font-bold text-[#14161F] dark:text-[#F6EBD3] leading-snug">
                      {c ? cleanSyllabusTitle(c.title) : "Curricular Subject"}
                    </h4>

                    {/* Time & Room */}
                    <div className="flex items-center gap-3 text-xs text-[#4B5160] dark:text-[#D1C7B7] mt-1.5">
                      <span className="tabular-nums font-semibold text-[#14161F] dark:text-[#F6EBD3]">
                        {formatTime12(slot.startTime)} – {formatTime12(slot.endTime)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 text-[#8A1627] shrink-0" />
                        <span>{slot.room || "Room 101"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {c && (
                      <button
                        type="button"
                        onClick={() => handleMarkAttendance(c)}
                        className="px-2.5 py-1 rounded-[6px] bg-white dark:bg-[#1A1214] border border-[#CFC8BB] dark:border-[#3D2D31] text-[11px] font-sans font-semibold text-[#3E5C3C] dark:text-[#78A875] hover:bg-[#5E7B5B]/10 hover:border-[#5E7B5B] transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Mark attendance present for this lecture"
                      >
                        <UserCheck className="h-3 w-3" />
                        <span>Attended</span>
                      </button>
                    )}

                    {c && (
                      <Link
                        href={`/courses/${c.id}`}
                        className="px-2.5 py-1 rounded-[6px] bg-[#A51C30] text-white text-[11px] font-sans font-semibold hover:bg-[#8A1627] transition-colors inline-flex items-center gap-1"
                      >
                        <span>Course</span>
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
