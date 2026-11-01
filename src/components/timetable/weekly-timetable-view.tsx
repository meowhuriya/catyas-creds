"use client";

import * as React from "react";
import { Course, ClassTimetableSlot } from "@/types/schemas";
import {
  DAYS_OF_WEEK,
  enrichTimetableSlots,
  groupSlotsByDay,
  formatTime12,
  EnrichedTimetableSlot,
  getIsoDayOfWeek,
} from "@/lib/timetable/timetable-engine";
import { AddSlotModal } from "./add-slot-modal";
import { Button } from "@/components/ui/button";
import { cleanSyllabusTitle } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  RotateCcw,
  Trash2,
  Sparkles,
  BookOpen,
  ChevronRight,
  Radio,
} from "lucide-react";

interface WeeklyTimetableViewProps {
  courses: Course[];
  slots: ClassTimetableSlot[];
  onSaveSlot: (slotData: Omit<ClassTimetableSlot, "id" | "userId"> & { id?: string }) => Promise<void>;
  onDeleteSlot: (slotId: string) => Promise<void>;
  onResetToDefault: () => Promise<void>;
  onClear: () => Promise<void>;
}

export function WeeklyTimetableView({
  courses,
  slots,
  onSaveSlot,
  onDeleteSlot,
  onResetToDefault,
  onClear,
}: WeeklyTimetableViewProps) {
  const toast = useToast();

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingSlot, setEditingSlot] = React.useState<ClassTimetableSlot | null>(null);
  const [selectedDayForAdd, setSelectedDayForAdd] = React.useState<number>(1);
  const [mobileDay, setMobileDay] = React.useState<number>(() => {
    const todayIso = getIsoDayOfWeek();
    return todayIso <= 5 ? todayIso : 1;
  });

  // Enrich slots with course info and live session state
  const enrichedSlots = React.useMemo(() => {
    return enrichTimetableSlots(slots, courses);
  }, [slots, courses]);

  const groupedDays = React.useMemo(() => {
    return groupSlotsByDay(enrichedSlots, 5);
  }, [enrichedSlots]);

  const handleOpenAdd = (day: number = 1) => {
    setEditingSlot(null);
    setSelectedDayForAdd(day);
    setModalOpen(true);
  };

  const handleOpenEdit = (slot: ClassTimetableSlot) => {
    setEditingSlot(slot);
    setSelectedDayForAdd(slot.dayOfWeek);
    setModalOpen(true);
  };

  const handleReset = async () => {
    if (confirm("Reset weekly class timetable to the standard Year 1 engineering schedule?")) {
      await onResetToDefault();
      toast.success("Timetable Reset", "Standard Monday–Friday schedule restored.");
    }
  };

  const handleClearAll = async () => {
    if (confirm("Clear all scheduled class slots from your weekly timetable?")) {
      await onClear();
      toast.info("Timetable Cleared", "All scheduled slots have been cleared.");
    }
  };

  const currentIsoDay = getIsoDayOfWeek();

  return (
    <div className="space-y-6 select-none">
      {/* Timetable Header Card (Solid cream panel) */}
      <div className="academic-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]/80">
          <div>
            <span className="eyebrow-label text-[#8A1627] block mb-1">
              WEEKLY CLASS TIMETABLE
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#14161F] dark:text-[#F6EBD3]">
              Academic Class Schedule
            </h2>
            <p className="text-xs text-[#4B5160] dark:text-[#D1C7B7] mt-0.5">
              Structured Monday to Friday collegiate lecture periods, laboratory practicals, and tutorial sessions.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs h-8 gap-1.5 bg-white dark:bg-[#1A1214] border-[#CFC8BB] text-[#14161F] dark:text-[#F6EBD3]"
              title="Populate with standard Year 1 schedule"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[#8A1627]" />
              <span>Standard Schedule</span>
            </Button>

            {slots.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-xs h-8 gap-1.5 bg-white dark:bg-[#1A1214] border-[#CFC8BB] text-[#C62F3C] hover:bg-[#C62F3C]/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => handleOpenAdd(1)}
              className="text-xs h-8 gap-1.5 bg-[#A51C30] hover:bg-[#8A1627] text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Class Slot</span>
            </Button>
          </div>
        </div>

        {/* Timetable Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-[12px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31]">
            <span className="eyebrow-label text-[#8A1627] text-[10px] block mb-0.5">
              TOTAL CLASS PERIODS
            </span>
            <span className="font-serif text-2xl font-bold text-[#14161F] dark:text-[#F6EBD3] tabular-nums">
              {slots.length}
            </span>
            <span className="text-[11px] text-[#4B5160] dark:text-[#D1C7B7] block">
              Slots across 5 days
            </span>
          </div>

          <div className="p-3 rounded-[12px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31]">
            <span className="eyebrow-label text-[#8A1627] text-[10px] block mb-0.5">
              ACTIVE COURSES
            </span>
            <span className="font-serif text-2xl font-bold text-[#14161F] dark:text-[#F6EBD3] tabular-nums">
              {new Set(slots.map((s) => s.courseId)).size}
            </span>
            <span className="text-[11px] text-[#4B5160] dark:text-[#D1C7B7] block">
              Enrolled curriculum
            </span>
          </div>

          <div className="p-3 rounded-[12px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31]">
            <span className="eyebrow-label text-[#8A1627] text-[10px] block mb-0.5">
              LAB SESSIONS
            </span>
            <span className="font-serif text-2xl font-bold text-[#1C5C62] dark:text-[#52ADB5] tabular-nums">
              {slots.filter((s) => s.type === "lab").length}
            </span>
            <span className="text-[11px] text-[#4B5160] dark:text-[#D1C7B7] block">
              Practical laboratories
            </span>
          </div>

          <div className="p-3 rounded-[12px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31]">
            <span className="eyebrow-label text-[#8A1627] text-[10px] block mb-0.5">
              DAILY AVERAGE
            </span>
            <span className="font-serif text-2xl font-bold text-[#3E5C3C] dark:text-[#78A875] tabular-nums">
              {slots.length > 0 ? (slots.length / 5).toFixed(1) : 0}
            </span>
            <span className="text-[11px] text-[#4B5160] dark:text-[#D1C7B7] block">
              Periods / weekday
            </span>
          </div>
        </div>
      </div>

      {/* Desktop 5-Column Grid (hidden on mobile, visible min-[900px]) */}
      <div className="hidden min-[900px]:grid grid-cols-5 gap-3.5 items-start">
        {DAYS_OF_WEEK.slice(0, 5).map((day) => {
          const daySlots = groupedDays.get(day.id) || [];
          const isToday = day.id === currentIsoDay;

          return (
            <div
              key={day.id}
              className={`rounded-[14px] border overflow-hidden flex flex-col transition-all shadow-sm ${
                isToday
                  ? "bg-[#FFFFFF] dark:bg-[#1A1214] border-[#A51C30]/50 ring-1 ring-[#A51C30]/20"
                  : "bg-[#FFFFFF] dark:bg-[#1A1214] border-[#E4D9C0] dark:border-[#3D2D31]"
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3.5 border-b flex items-center justify-between ${
                  isToday
                    ? "bg-[#A51C30]/10 border-[#A51C30]/30"
                    : "bg-[#FBF6EC] dark:bg-[#221A1C] border-[#E4D9C0] dark:border-[#3D2D31]"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif text-sm font-bold text-[#14161F] dark:text-[#F6EBD3]">
                      {day.name}
                    </span>
                    {isToday && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#A51C30] animate-pulse" />
                    )}
                  </div>
                  <span className="text-[10px] font-sans font-semibold text-[#4B5160] dark:text-[#D1C7B7]">
                    {daySlots.length} {daySlots.length === 1 ? "period" : "periods"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAdd(day.id)}
                  className="p-1 rounded-[6px] hover:bg-black/5 dark:hover:bg-white/5 text-[#8A1627] transition-colors cursor-pointer"
                  title={`Add class slot on ${day.name}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Slot Cards List for Day */}
              <div className="p-2.5 space-y-2.5 min-h-[300px]">
                {daySlots.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#4B5160]/70 dark:text-[#D1C7B7]/70">
                    <span>No classes</span>
                  </div>
                ) : (
                  daySlots.map((slot) => {
                    const c = slot.course;

                    return (
                      <div
                        key={slot.id}
                        onClick={() => handleOpenEdit(slot)}
                        className={`p-3 rounded-[10px] border transition-all cursor-pointer text-left hover:shadow-md hover:border-[#A51C30]/40 ${
                          slot.isCurrent
                            ? "bg-[#5E7B5B]/10 border-[#5E7B5B]/40 ring-1 ring-[#5E7B5B]/30"
                            : "bg-[#FBF6EC] dark:bg-[#221A1C] border-[#E4D9C0] dark:border-[#3D2D31]"
                        }`}
                      >
                        {/* Time & Status Row */}
                        <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-[#4B5160] dark:text-[#D1C7B7] mb-1">
                          <span className="tabular-nums">
                            {formatTime12(slot.startTime)} - {formatTime12(slot.endTime)}
                          </span>
                          {slot.isCurrent ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3E5C3C] dark:text-[#78A875] uppercase">
                              <Radio className="h-2.5 w-2.5 animate-pulse" />
                              <span>Now</span>
                            </span>
                          ) : (
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
                          )}
                        </div>

                        {/* Course Code & Title */}
                        {c && (
                          <div className="mb-1.5">
                            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#A51C30] block">
                              {c.code}
                            </span>
                            <h4 className="font-serif text-xs font-bold text-[#14161F] dark:text-[#F6EBD3] leading-snug line-clamp-2">
                              {cleanSyllabusTitle(c.title)}
                            </h4>
                          </div>
                        )}

                        {/* Room Location */}
                        <div className="flex items-center gap-1 text-[10px] font-sans font-medium text-[#4B5160] dark:text-[#D1C7B7] mt-1 pt-1 border-t border-[#E4D9C0]/50 dark:border-[#3D2D31]/50">
                          <MapPin className="h-2.5 w-2.5 text-[#8A1627] shrink-0" />
                          <span className="truncate">{slot.room || "Room 101"}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Day-Switcher & List (< 900px) */}
      <div className="min-[900px]:hidden space-y-4">
        {/* Day Pills Bar */}
        <div className="flex items-center gap-1.5 p-1 rounded-[12px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] overflow-x-auto">
          {DAYS_OF_WEEK.slice(0, 5).map((d) => {
            const isSelected = mobileDay === d.id;
            const isToday = d.id === currentIsoDay;

            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setMobileDay(d.id)}
                className={`flex-1 min-w-[56px] py-1.5 px-2 rounded-[8px] text-xs font-sans font-semibold transition-all text-center cursor-pointer ${
                  isSelected
                    ? "bg-[#A51C30] text-white shadow-xs font-bold"
                    : isToday
                    ? "bg-white dark:bg-[#1A1214] text-[#A51C30] border border-[#A51C30]/30"
                    : "text-[#4B5160] dark:text-[#D1C7B7] hover:text-[#14161F]"
                }`}
              >
                <span>{d.shortName}</span>
                {isToday && <span className="block text-[9px] opacity-90">Today</span>}
              </button>
            );
          })}
        </div>

        {/* Selected Day's Slots */}
        <div className="academic-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border)]/80">
            <div>
              <h3 className="font-serif text-base font-bold text-[#14161F] dark:text-[#F6EBD3]">
                {DAYS_OF_WEEK[mobileDay - 1].name} Classes
              </h3>
              <span className="text-xs text-[#4B5160] dark:text-[#D1C7B7]">
                {(groupedDays.get(mobileDay) || []).length} scheduled periods
              </span>
            </div>

            <Button
              size="sm"
              onClick={() => handleOpenAdd(mobileDay)}
              className="text-xs h-7 gap-1 bg-[#A51C30] hover:bg-[#8A1627] text-white"
            >
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </Button>
          </div>

          <div className="space-y-2.5">
            {(groupedDays.get(mobileDay) || []).length === 0 ? (
              <div className="py-8 text-center text-xs text-[#4B5160] dark:text-[#D1C7B7]">
                No classes scheduled for {DAYS_OF_WEEK[mobileDay - 1].name}.
              </div>
            ) : (
              (groupedDays.get(mobileDay) || []).map((slot) => {
                const c = slot.course;

                return (
                  <div
                    key={slot.id}
                    onClick={() => handleOpenEdit(slot)}
                    className="p-3.5 rounded-[12px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-sans text-xs font-bold text-[#A51C30]">
                          {c?.code || "COURSE"}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-black/5 dark:bg-white/10 text-[#4B5160] dark:text-[#D1C7B7]">
                          {slot.type}
                        </span>
                        {slot.isCurrent && (
                          <span className="text-[10px] font-bold text-[#5E7B5B] uppercase flex items-center gap-1">
                            <Radio className="h-2.5 w-2.5 animate-pulse" />
                            <span>Now</span>
                          </span>
                        )}
                      </div>

                      <h4 className="font-serif text-sm font-bold text-[#14161F] dark:text-[#F6EBD3] truncate">
                        {c ? cleanSyllabusTitle(c.title) : "Curricular Subject"}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-[#4B5160] dark:text-[#D1C7B7] mt-1">
                        <span className="tabular-nums font-medium">
                          {formatTime12(slot.startTime)} – {formatTime12(slot.endTime)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 text-[#8A1627]" />
                          <span>{slot.room || "Room 101"}</span>
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-[#4B5160] shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Slot Modal */}
      <AddSlotModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        courses={courses}
        initialSlot={editingSlot}
        initialDay={selectedDayForAdd}
        onSave={onSaveSlot}
        onDelete={onDeleteSlot}
      />
    </div>
  );
}
