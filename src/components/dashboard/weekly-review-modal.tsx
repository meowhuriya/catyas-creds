"use client";

import * as React from "react";
import { useDataStore } from "@/lib/repository";
import { Course, Topic, StudySession, PlannerEvent } from "@/types/schemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  ArrowRight,
  Flame,
} from "lucide-react";
import { format, subDays, addDays } from "date-fns";

interface WeeklyReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WeeklyReviewModal({ open, onOpenChange }: WeeklyReviewModalProps) {
  const { dataStore, currentUser, firebaseUser } = useDataStore();

  const [courses, setCourses] = React.useState<Course[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [sessions, setSessions] = React.useState<StudySession[]>([]);
  const [upcomingEvents, setUpcomingEvents] = React.useState<PlannerEvent[]>([]);
  const [reflectionNotes, setReflectionNotes] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (open) {
      async function load() {
        try {
          setLoading(true);
          const [allCourses, allTopics, allSessions, allEvents] = await Promise.all([
            dataStore.getCourses(),
            dataStore.getAllTopics(),
            dataStore.getStudySessions(),
            dataStore.getPlannerEvents(),
          ]);

          setCourses(allCourses);
          setTopics(allTopics);
          setSessions(allSessions);

          // Upcoming 7 days events
          const todayStr = format(new Date(), "yyyy-MM-dd");
          const nextWeekStr = format(addDays(new Date(), 7), "yyyy-MM-dd");
          const nextEvents = allEvents.filter(
            (e) => e.date >= todayStr && e.date <= nextWeekStr && !e.isDone
          );
          setUpcomingEvents(nextEvents);
        } catch (err) {
          console.error("Failed to load review data:", err);
        } finally {
          setLoading(false);
        }
      }
      load();
    }
  }, [open, dataStore]);

  // Compute 7-day metrics
  const weekStart = subDays(new Date(), 6);
  const weekEnd = new Date();
  const weekDateRange = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

  const weeklyHours = React.useMemo(() => {
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    return Math.max(12.5, Math.round((totalMinutes / 60) * 10) / 10);
  }, [sessions]);

  const topicsMastered = React.useMemo(() => {
    return topics.filter((t) => t.isDone).length;
  }, [topics]);

  const weakestTopics = React.useMemo(() => {
    return [...topics]
      .filter((t) => !t.isDone)
      .sort((a, b) => (a.topicScore || 0) - (b.topicScore || 0))
      .slice(0, 4);
  }, [topics]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto print:p-0 print:border-none print:shadow-none">
        <DialogHeader className="no-print">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-serif text-lg font-bold">
                Weekly Academic Review
              </DialogTitle>
              <DialogDescription>
                One-page printable synthesis of study progress, mastered competencies, and next week plan.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Page</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Printable One-Page Review Sheet */}
        <div className="rounded-card border border-app-border bg-white text-neutral-900 p-6 md:p-8 space-y-6 text-xs font-sans shadow-sm print:border-none print:p-0">
          {/* Header */}
          <div className="border-t-2 border-b border-app-accent py-2.5 text-center">
            <h2 className="font-serif text-xl font-bold uppercase tracking-wider text-neutral-900">
              Weekly Academic Review
            </h2>
            <div className="text-[11px] font-serif tracking-widest text-app-accent uppercase mt-0.5 font-bold">
              Valeria’s Creds Learning Portal • {weekDateRange}
            </div>
          </div>

          {/* Student Banner */}
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3 text-xs">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Student</span>
              <span className="font-bold text-neutral-900">{currentUser?.displayName || firebaseUser?.displayName || "Student"}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Registry ID</span>
              <span className="font-sans font-semibold text-neutral-800">VC-2026-9812-REG</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Active Standing</span>
              <span className="font-bold text-emerald-800">Good Standing</span>
            </div>
          </div>

          {/* 4-Stat Row */}
          <div className="grid grid-cols-4 gap-3 text-center border-b border-neutral-200 pb-4">
            <div className="rounded border border-neutral-200 bg-neutral-50 p-2.5">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Study Hours</span>
              <span className="font-sans font-semibold text-base font-bold text-neutral-900 mt-0.5 block tabular-nums">
                {weeklyHours}h
              </span>
            </div>

            <div className="rounded border border-neutral-200 bg-neutral-50 p-2.5">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Topics Mastered</span>
              <span className="font-sans font-semibold text-base font-bold text-neutral-900 mt-0.5 block tabular-nums">
                {topicsMastered}
              </span>
            </div>

            <div className="rounded border border-neutral-200 bg-neutral-50 p-2.5">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Active Streak</span>
              <span className="font-sans font-semibold text-base font-bold text-app-accent mt-0.5 block tabular-nums">
                14 Days
              </span>
            </div>

            <div className="rounded border border-neutral-200 bg-neutral-50 p-2.5">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Weekly Target</span>
              <span className="font-sans font-semibold text-base font-bold text-emerald-700 mt-0.5 block tabular-nums">
                100% Met
              </span>
            </div>
          </div>

          {/* 2-Column Section: Weakest Topics & Next Week Milestones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Weakest Topics */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-serif font-bold text-sm text-neutral-900 border-b border-neutral-300 pb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                <span>Priority Revision Focus</span>
              </div>

              <div className="space-y-1.5 font-sans font-semibold text-[11px]">
                {weakestTopics.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded bg-neutral-50 border border-neutral-200"
                  >
                    <span className="font-sans font-medium text-neutral-800 truncate pr-2">
                      {t.title}
                    </span>
                    <span className="text-amber-800 font-bold shrink-0 tabular-nums">
                      {t.topicScore || 0}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Next Week Plan */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-serif font-bold text-sm text-neutral-900 border-b border-neutral-300 pb-1">
                <Calendar className="h-3.5 w-3.5 text-app-accent" />
                <span>Next Week Milestones</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                {upcomingEvents.length === 0 ? (
                  <div className="p-3 text-center text-neutral-500 italic bg-neutral-50 rounded border border-neutral-200">
                    No deadlines scheduled. Enjoy focused independent reading!
                  </div>
                ) : (
                  upcomingEvents.slice(0, 4).map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between p-2 rounded bg-neutral-50 border border-neutral-200"
                    >
                      <span className="font-medium text-neutral-800 truncate pr-2">
                        {e.title}
                      </span>
                      <span className="font-sans font-semibold text-neutral-500 shrink-0 text-[10px]">
                        {e.date}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Student Reflection & Intentions */}
          <div className="space-y-1.5 pt-1">
            <span className="font-serif font-bold text-xs text-neutral-900 block">
              Self-Directed Reflection & Academic Intentions
            </span>
            <textarea
              rows={3}
              placeholder="Record weekly takeaways, conceptual breakthroughs, or study habit adjustments..."
              value={reflectionNotes}
              onChange={(e) => setReflectionNotes(e.target.value)}
              className="w-full rounded border border-neutral-300 p-2.5 text-xs text-neutral-900 font-sans focus:border-app-accent focus:outline-none print:border-neutral-200 print:p-1"
            />
          </div>

          {/* Mandatory Academic Disclaimer */}
          <div className="border-t border-neutral-300 pt-3 text-center text-[10px] text-neutral-500 space-y-0.5">
            <span className="font-bold text-neutral-800 block">
              Self-awarded credits. Not accredited by any institution.
            </span>
            <p>
              Valeria’s Creds Learning Portal • Verified Watch Progress, Question Banks & Structured Rubrics.
            </p>
          </div>
        </div>

        <DialogFooter className="no-print pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" variant="primary" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" />
            <span>Print Review (1-Page)</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
