"use client";

import * as React from "react";
import { Course, CourseAttendance, AttendanceLogEntry } from "@/types/schemas";
import { useDataStore } from "@/lib/repository";
import { calculateAttendanceStats, AttendanceStats } from "@/lib/attendance/attendance-engine";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Calendar,
  Check,
  Percent,
  Clock,
  ChevronDown,
} from "lucide-react";

interface AttendanceTrackerProps {
  course: Course;
  onAttendanceChange?: (stats: AttendanceStats) => void;
}

export function AttendanceTracker({ course, onAttendanceChange }: AttendanceTrackerProps) {
  const { dataStore } = useDataStore();

  const [attendance, setAttendance] = React.useState<CourseAttendance | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editHeld, setEditHeld] = React.useState(0);
  const [editAttended, setEditAttended] = React.useState(0);
  const [editMinPercent, setEditMinPercent] = React.useState(75);

  const loadAttendance = React.useCallback(async () => {
    try {
      const data = await dataStore.getCourseAttendance(course.id);
      setAttendance(data);
      setEditHeld(data.classesHeld);
      setEditAttended(data.classesAttended);
      setEditMinPercent(data.minimumPercentage || 75);
    } catch (err) {
      console.error("Failed to load course attendance:", err);
    } finally {
      setLoading(false);
    }
  }, [course.id, dataStore]);

  React.useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const stats: AttendanceStats = React.useMemo(() => {
    if (!attendance) {
      return calculateAttendanceStats(0, 0, 75);
    }
    return calculateAttendanceStats(
      attendance.classesHeld,
      attendance.classesAttended,
      attendance.minimumPercentage
    );
  }, [attendance]);

  React.useEffect(() => {
    if (onAttendanceChange) {
      onAttendanceChange(stats);
    }
  }, [stats, onAttendanceChange]);

  const handleMarkPresent = async () => {
    try {
      const updated = await dataStore.recordAttendance(course.id, "present");
      setAttendance(updated);
      setEditHeld(updated.classesHeld);
      setEditAttended(updated.classesAttended);
    } catch (err) {
      console.error("Failed to mark present:", err);
    }
  };

  const handleMarkAbsent = async () => {
    try {
      const updated = await dataStore.recordAttendance(course.id, "absent");
      setAttendance(updated);
      setEditHeld(updated.classesHeld);
      setEditAttended(updated.classesAttended);
    } catch (err) {
      console.error("Failed to mark absent:", err);
    }
  };

  const handleSaveEdit = async () => {
    const held = Math.max(0, Number(editHeld) || 0);
    const attended = Math.max(0, Math.min(held, Number(editAttended) || 0));
    const minP = Math.min(100, Math.max(1, Number(editMinPercent) || 75));

    try {
      const updated = await dataStore.updateCourseAttendance(course.id, {
        classesHeld: held,
        classesAttended: attended,
        minimumPercentage: minP,
      });
      setAttendance(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update attendance:", err);
    }
  };

  const handleResetAttendance = async () => {
    if (confirm("Reset attendance record for this course to 0 held, 0 attended?")) {
      try {
        const updated = await dataStore.updateCourseAttendance(course.id, {
          classesHeld: 0,
          classesAttended: 0,
          logs: [],
        });
        setAttendance(updated);
        setEditHeld(0);
        setEditAttended(0);
        setIsEditing(false);
      } catch (err) {
        console.error("Failed to reset attendance:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="academic-card p-6 text-center text-sm text-[var(--color-ink-muted)]">
        Loading attendance records...
      </div>
    );
  }

  return (
    <div className="academic-card p-6 space-y-6">
      {/* Header Row: Title, Eyebrow, Edit Mode Toggle, Warning Chip if below limit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]/80">
        <div>
          <span className="eyebrow-label text-[#8A1627] block mb-1">
            {course.code} · ATTENDANCE TRACKER
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#14161F] dark:text-[#F6EBD3]">
            Class Attendance & Absence Buffer
          </h2>
          <p className="text-xs text-[#4B5160] dark:text-[#D1C7B7] mt-0.5">
            Monitored against institutional requirement of {stats.minimumPercentage}% attendance
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Warning Chip below limit */}
          {stats.isBelowLimit && (
            <span
              data-testid="attendance-warning-chip"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C62F3C]/10 text-[#C62F3C] border border-[#C62F3C]/30 shadow-sm"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Below {stats.minimumPercentage}% Limit</span>
            </span>
          )}

          {!stats.isBelowLimit && stats.classesHeld > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#5E7B5B]/10 text-[#3E5C3C] dark:text-[#78A875] border border-[#5E7B5B]/30">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>On Track</span>
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs gap-1.5 h-8 bg-white dark:bg-[#221A1C] border-[#CFC8BB] text-[#14161F] dark:text-[#F6EBD3]"
          >
            <Sliders className="h-3.5 w-3.5 text-[#8A1627]" />
            <span>{isEditing ? "Close Editor" : "Edit Counts"}</span>
          </Button>
        </div>
      </div>

      {/* Editable Form (when toggled) */}
      {isEditing && (
        <div className="p-4 rounded-[14px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-sm font-bold text-[#14161F] dark:text-[#F6EBD3]">
              Configure Attendance Numbers & Minimum Threshold
            </h3>
            <span className="text-xs text-[#4B5160] dark:text-[#D1C7B7]">
              Default minimum is 75%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#14161F] dark:text-[#F6EBD3] mb-1">
                Classes Held
              </label>
              <input
                type="number"
                min="0"
                value={editHeld}
                onChange={(e) => setEditHeld(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-9 px-3 rounded-[8px] bg-white dark:bg-[#1A1214] border border-[#CFC8BB] dark:border-[#3D2D31] text-sm font-sans text-[#14161F] dark:text-[#F6EBD3] focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14161F] dark:text-[#F6EBD3] mb-1">
                Classes Attended
              </label>
              <input
                type="number"
                min="0"
                max={editHeld}
                value={editAttended}
                onChange={(e) => setEditAttended(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full h-9 px-3 rounded-[8px] bg-white dark:bg-[#1A1214] border border-[#CFC8BB] dark:border-[#3D2D31] text-sm font-sans text-[#14161F] dark:text-[#F6EBD3] focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#14161F] dark:text-[#F6EBD3] mb-1">
                Minimum Percentage Required (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={editMinPercent}
                onChange={(e) =>
                  setEditMinPercent(Math.min(100, Math.max(1, parseInt(e.target.value) || 75)))
                }
                className="w-full h-9 px-3 rounded-[8px] bg-white dark:bg-[#1A1214] border border-[#CFC8BB] dark:border-[#3D2D31] text-sm font-sans text-[#14161F] dark:text-[#F6EBD3] focus:outline-none focus:ring-1 focus:ring-[#A51C30]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAttendance}
              className="text-xs text-[#C62F3C] border-[#C62F3C]/30 hover:bg-[#C62F3C]/10 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset to 0</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                className="text-xs bg-[#A51C30] hover:bg-[#8A1627] text-white"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Primary KPI Grid: 4 Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Current Rate */}
        <div className="p-4 rounded-[14px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31]">
          <span className="eyebrow-label text-[#8A1627] block mb-1">
            ATTENDANCE RATE
          </span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`font-serif text-3xl font-bold tabular-nums ${
                stats.isBelowLimit ? "text-[#C62F3C]" : "text-[#14161F] dark:text-[#F6EBD3]"
              }`}
            >
              {stats.classesHeld > 0 ? `${stats.currentPercentage}%` : "100%"}
            </span>
          </div>
          <span className="text-xs text-[#4B5160] dark:text-[#D1C7B7] block mt-1">
            Min threshold: {stats.minimumPercentage}%
          </span>
        </div>

        {/* Metric 2: Classes Attended */}
        <div className="p-4 rounded-[14px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31]">
          <span className="eyebrow-label text-[#8A1627] block mb-1">
            CLASSES ATTENDED
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-3xl font-bold text-[#14161F] dark:text-[#F6EBD3] tabular-nums">
              {stats.classesAttended}
            </span>
            <span className="text-xs text-[#4B5160] dark:text-[#D1C7B7] font-sans">
              / {stats.classesHeld} held
            </span>
          </div>
          <span className="text-xs text-[#3E5C3C] dark:text-[#78A875] font-medium block mt-1">
            {stats.classesAbsent} absent
          </span>
        </div>

        {/* Metric 3: Safe Buffer / Recovery Target */}
        <div
          className={`col-span-2 p-4 rounded-[14px] border ${
            stats.isBelowLimit
              ? "bg-[#C62F3C]/5 border-[#C62F3C]/30"
              : "bg-[#FBF6EC] dark:bg-[#221A1C] border-[#E4D9C0] dark:border-[#3D2D31]"
          }`}
        >
          <span className="eyebrow-label text-[#8A1627] block mb-1">
            {stats.isBelowLimit ? "RECOVERY ACTION REQUIRED" : "SAFE ABSENCE ALLOWANCE"}
          </span>

          <div className="mt-1">
            {!stats.isBelowLimit ? (
              <div>
                <p className="font-serif text-xl sm:text-2xl font-bold text-[#14161F] dark:text-[#F6EBD3]">
                  {stats.statusSentence}
                </p>
                <p className="text-xs text-[#4B5160] dark:text-[#D1C7B7] mt-0.5">
                  without dropping below the required {stats.minimumPercentage}% attendance standard
                </p>
              </div>
            ) : (
              <div>
                <p className="font-serif text-xl sm:text-2xl font-bold text-[#C62F3C]">
                  {stats.statusSentence}
                </p>
                <p className="text-xs text-[#C62F3C]/80 mt-0.5">
                  Consecutive lectures needed to restore compliant status above {stats.minimumPercentage}%
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Segmented Progress Bar with Minimum Limit Marker */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-semibold text-[#14161F] dark:text-[#F6EBD3]">
          <span className="flex items-center gap-1.5">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                stats.isBelowLimit ? "bg-[#C62F3C]" : "bg-[#5E7B5B]"
              }`}
            />
            <span>
              {stats.classesAttended} of {stats.classesHeld} Sessions Attended
            </span>
          </span>
          <span className="text-[#8A1627] font-sans">
            Required: {stats.minimumPercentage}%
          </span>
        </div>

        <div className="relative h-3 w-full bg-[#E5D5C5]/60 dark:bg-[#3D2D31] rounded-full overflow-hidden">
          {/* Active progress */}
          <div
            className={`h-full transition-all duration-300 ${
              stats.isBelowLimit ? "bg-[#C62F3C]" : "bg-[#5E7B5B]"
            }`}
            style={{
              width: `${stats.classesHeld > 0 ? Math.min(100, stats.currentPercentage) : 100}%`,
            }}
          />
        </div>

        <div className="relative w-full h-3">
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${stats.minimumPercentage}%` }}
          >
            <div className="w-0.5 h-2 bg-[#8A1627]" />
            <span className="text-[10px] font-bold text-[#8A1627] tracking-tight">
              {stats.minimumPercentage}% Limit
            </span>
          </div>
        </div>
      </div>

      {/* Quick Attendance Logging Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[var(--color-border)]/80">
        <div>
          <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-[#14161F] dark:text-[#F6EBD3]">
            Quick Attendance Action
          </h4>
          <p className="text-xs text-[#4B5160] dark:text-[#D1C7B7]">
            Log today&apos;s class with a single click to update real-time attendance buffers
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={handleMarkPresent}
            className="text-xs bg-[#5E7B5B] hover:bg-[#4E6B4B] text-white gap-1.5 h-9 px-3.5 shadow-sm"
          >
            <Check className="h-4 w-4" />
            <span>Mark Present</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAbsent}
            className="text-xs bg-white dark:bg-[#221A1C] border-[#CFC8BB] text-[#C62F3C] hover:bg-[#C62F3C]/10 gap-1.5 h-9 px-3.5 shadow-sm"
          >
            <XCircle className="h-4 w-4" />
            <span>Mark Absent</span>
          </Button>
        </div>
      </div>

      {/* Recent Attendance Log (if entries exist) */}
      {attendance && attendance.logs && attendance.logs.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-[#14161F] dark:text-[#F6EBD3]">
            Recent Class Attendance Logs
          </h4>
          <div className="rounded-[10px] border border-[#E4D9C0] dark:border-[#3D2D31] divide-y divide-[#E4D9C0] dark:divide-[#3D2D31] max-h-48 overflow-y-auto bg-white dark:bg-[#1A1214]">
            {attendance.logs.slice(0, 10).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between px-3.5 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-[#8A1627]" />
                  <span className="font-medium text-[#14161F] dark:text-[#F6EBD3]">
                    {log.date}
                  </span>
                  {log.note && (
                    <span className="text-[#4B5160] dark:text-[#D1C7B7] italic">
                      ({log.note})
                    </span>
                  )}
                </div>

                <div>
                  {log.status === "present" ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#3E5C3C] dark:text-[#78A875]">
                      <Check className="h-3 w-3" />
                      <span>Present</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-[#C62F3C]">
                      <XCircle className="h-3 w-3" />
                      <span>Absent</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
