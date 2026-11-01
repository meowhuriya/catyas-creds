"use client";

import * as React from "react";
import { Course, ClassTimetableSlot } from "@/types/schemas";
import { DAYS_OF_WEEK } from "@/lib/timetable/timetable-engine";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  X,
  Clock,
  Calendar,
  MapPin,
  BookOpen,
  Trash2,
  Check,
} from "lucide-react";

interface AddSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  initialSlot?: ClassTimetableSlot | null;
  initialDay?: number;
  onSave: (slotData: Omit<ClassTimetableSlot, "id" | "userId"> & { id?: string }) => Promise<void>;
  onDelete?: (slotId: string) => Promise<void>;
}

export function AddSlotModal({
  open,
  onOpenChange,
  courses,
  initialSlot,
  initialDay = 1,
  onSave,
  onDelete,
}: AddSlotModalProps) {
  const toast = useToast();

  const [courseId, setCourseId] = React.useState<string>("");
  const [dayOfWeek, setDayOfWeek] = React.useState<number>(initialDay);
  const [startTime, setStartTime] = React.useState<string>("09:00");
  const [endTime, setEndTime] = React.useState<string>("10:00");
  const [room, setRoom] = React.useState<string>("Room 301");
  const [type, setType] = React.useState<"lecture" | "lab" | "tutorial" | "seminar">("lecture");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (initialSlot) {
      setCourseId(initialSlot.courseId);
      setDayOfWeek(initialSlot.dayOfWeek);
      setStartTime(initialSlot.startTime);
      setEndTime(initialSlot.endTime);
      setRoom(initialSlot.room || "Room 301");
      setType(initialSlot.type || "lecture");
    } else {
      if (courses.length > 0 && !courseId) {
        setCourseId(courses[0].id);
      }
      setDayOfWeek(initialDay);
      setStartTime("09:00");
      setEndTime("10:00");
      setRoom("Room 301");
      setType("lecture");
    }
  }, [initialSlot, initialDay, courses, open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      toast.error("Selection Required", "Please select a registered course.");
      return;
    }
    if (!startTime || !endTime) {
      toast.error("Invalid Times", "Please provide both start and end times.");
      return;
    }
    if (startTime >= endTime) {
      toast.error("Invalid Times", "Class start time must precede end time.");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        id: initialSlot?.id,
        courseId,
        dayOfWeek,
        startTime,
        endTime,
        room: room.trim() || "Room 101",
        type,
      });
      toast.success(
        initialSlot ? "Timetable Slot Updated" : "Timetable Slot Added",
        `${startTime} - ${endTime} slot saved to weekly schedule.`
      );
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save slot:", err);
      toast.error("Error", "Could not save timetable slot.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialSlot || !onDelete) return;
    if (confirm("Are you sure you want to remove this slot from your timetable?")) {
      try {
        setSaving(true);
        await onDelete(initialSlot.id);
        toast.info("Slot Removed", "The timetable slot has been removed.");
        onOpenChange(false);
      } catch (err) {
        console.error("Failed to delete slot:", err);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-[18px] bg-[#FFFFFF] dark:bg-[#1A1214] border border-[#E4D9C0] dark:border-[#3D2D31] shadow-xl overflow-hidden select-none">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E4D9C0] dark:border-[#3D2D31] bg-[#FBF6EC] dark:bg-[#221A1C]">
          <div>
            <span className="eyebrow-label text-[#8A1627] block mb-0.5">
              TIMETABLE MANAGER
            </span>
            <h3 className="font-serif text-lg font-bold text-[#14161F] dark:text-[#F6EBD3]">
              {initialSlot ? "Edit Class Slot" : "Schedule Class Slot"}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-[8px] text-[#4B5160] hover:text-[#14161F] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Course select */}
          <div>
            <label className="block text-xs font-semibold text-[#14161F] dark:text-[#F6EBD3] mb-1">
              Academic Course
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full h-9 px-3 rounded-[8px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#CFC8BB] dark:border-[#3D2D31] text-xs font-sans text-[#14161F] dark:text-[#F6EBD3] focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} · {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-xs font-semibold text-[#14161F] dark:text-[#F6EBD3] mb-1">
              Day of Week
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {DAYS_OF_WEEK.slice(0, 5).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDayOfWeek(d.id)}
                  className={`py-1.5 rounded-[6px] text-xs font-sans font-semibold transition-colors border cursor-pointer ${
                    dayOfWeek === d.id
                      ? "bg-[#A51C30] text-white border-[#A51C30]"
                      : "bg-[#FBF6EC] dark:bg-[#221A1C] text-[#4B5160] dark:text-[#D1C7B7] border-[#CFC8BB] hover:border-[#A51C30]"
                  }`}
                >
                  {d.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* Time interval */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#14161F] dark:text-[#F6EBD3] mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-9 px-3 rounded-[8px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#CFC8BB] dark:border-[#3D2D31] text-xs font-sans text-[#14161F] dark:text-[#F6EBD3] focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#14161F] dark:text-[#F6EBD3] mb-1">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-9 px-3 rounded-[8px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#CFC8BB] dark:border-[#3D2D31] text-xs font-sans text-[#14161F] dark:text-[#F6EBD3] focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
                required
              />
            </div>
          </div>

          {/* Room / Location & Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#14161F] dark:text-[#F6EBD3] mb-1">
                Room / Location
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Room 301, Lab A"
                className="w-full h-9 px-3 rounded-[8px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#CFC8BB] dark:border-[#3D2D31] text-xs font-sans text-[#14161F] dark:text-[#F6EBD3] focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#14161F] dark:text-[#F6EBD3] mb-1">
                Instruction Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full h-9 px-3 rounded-[8px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#CFC8BB] dark:border-[#3D2D31] text-xs font-sans text-[#14161F] dark:text-[#F6EBD3] focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
              >
                <option value="lecture">Lecture</option>
                <option value="lab">Lab / Practical</option>
                <option value="tutorial">Tutorial</option>
                <option value="seminar">Seminar</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#E4D9C0] dark:border-[#3D2D31]">
            {initialSlot && onDelete ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={saving}
                className="text-xs text-[#C62F3C] border-[#C62F3C]/30 hover:bg-[#C62F3C]/10 gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={saving}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="text-xs bg-[#A51C30] hover:bg-[#8A1627] text-white"
              >
                {saving ? "Saving..." : initialSlot ? "Save Changes" : "Add to Timetable"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
