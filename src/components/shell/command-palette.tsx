"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  GraduationCap,
  FileText,
  Award,
  Settings,
  PlusCircle,
  Database,
  Moon,
  Sun,
  Search,
  FlaskConical,
  ClipboardCheck,
} from "lucide-react";
import { useDataStore } from "@/lib/repository";
import { cn } from "@/lib/utils";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { courses, loadDemoData, clearDemoData } = useDataStore();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        (e.key === "k" && (e.metaKey || e.ctrlKey)) ||
        (e.key === "/" &&
          !open &&
          !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))
      ) {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-xl overflow-hidden rounded-card border border-app-border bg-app-surface shadow-dialog animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <Command className="flex flex-col h-full w-full">
          <div className="flex items-center border-b border-app-border px-3">
            <Search className="h-4 w-4 shrink-0 text-app-ink-muted mr-2" />
            <Command.Input
              autoFocus
              placeholder="Search or jump to... (Esc to close)"
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm text-app-ink outline-none placeholder:text-app-ink-muted/70 disabled:cursor-not-allowed"
            />
          </div>
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-xs text-app-ink-muted">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="text-xs font-semibold text-app-ink-muted px-2 py-1">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/"))}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-control text-app-ink cursor-pointer hover:bg-app-surface-muted aria-selected:bg-app-surface-muted"
              >
                <LayoutDashboard className="h-4 w-4 text-app-ink-muted" />
                <span>Dashboard</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/courses"))}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-control text-app-ink cursor-pointer hover:bg-app-surface-muted aria-selected:bg-app-surface-muted"
              >
                <BookOpen className="h-4 w-4 text-app-ink-muted" />
                <span>Courses</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/college-works"))}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-control text-app-ink cursor-pointer hover:bg-app-surface-muted aria-selected:bg-app-surface-muted"
              >
                <ClipboardCheck className="h-4 w-4 text-app-ink-muted" />
                <span>College Works (Assignments & Lab Records)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/research"))}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-control text-app-ink cursor-pointer hover:bg-app-surface-muted aria-selected:bg-app-surface-muted"
              >
                <FlaskConical className="h-4 w-4 text-app-ink-muted" />
                <span>Research & Lab (NotebookLM Studio)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/certificates"))}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-control text-app-ink cursor-pointer hover:bg-app-surface-muted aria-selected:bg-app-surface-muted"
              >
                <Award className="h-4 w-4 text-app-ink-muted" />
                <span>Activities & Certificate Feed</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/planner"))}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-control text-app-ink cursor-pointer hover:bg-app-surface-muted aria-selected:bg-app-surface-muted"
              >
                <Calendar className="h-4 w-4 text-app-ink-muted" />
                <span>Academic Planner</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/grades"))}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-control text-app-ink cursor-pointer hover:bg-app-surface-muted aria-selected:bg-app-surface-muted"
              >
                <GraduationCap className="h-4 w-4 text-app-ink-muted" />
                <span>Grades & SGPA</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/transcript"))}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-control text-app-ink cursor-pointer hover:bg-app-surface-muted aria-selected:bg-app-surface-muted"
              >
                <FileText className="h-4 w-4 text-app-ink-muted" />
                <span>Official Transcript</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/degree"))}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-control text-app-ink cursor-pointer hover:bg-app-surface-muted aria-selected:bg-app-surface-muted"
              >
                <Award className="h-4 w-4 text-app-ink-muted" />
                <span>Degree Progress</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => router.push("/settings"))}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-control text-app-ink cursor-pointer hover:bg-app-surface-muted aria-selected:bg-app-surface-muted"
              >
                <Settings className="h-4 w-4 text-app-ink-muted" />
                <span>Settings</span>
              </Command.Item>
            </Command.Group>

            {courses.length > 0 && (
              <Command.Group heading="Enrolled Courses" className="mt-2 text-xs font-semibold text-app-ink-muted px-2 py-1">
                {courses.map((course) => (
                  <Command.Item
                    key={course.id}
                    onSelect={() => runCommand(() => router.push(`/courses/${course.id}`))}
                    className="flex items-center justify-between px-2 py-1.5 text-sm rounded-control text-app-ink cursor-pointer hover:bg-app-surface-muted aria-selected:bg-app-surface-muted"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-sans font-semibold text-xs font-semibold text-app-ink-muted">
                        {course.code}
                      </span>
                      <span className="truncate">{course.title}</span>
                    </div>
                    <span className="text-xs text-app-ink-muted tabular-nums shrink-0">
                      {course.credits} cr
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Quick Actions" className="mt-2 text-xs font-semibold text-app-ink-muted px-2 py-1">
              <Command.Item
                onSelect={() => runCommand(() => router.push("/courses?action=new-course"))}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-control text-app-ink cursor-pointer hover:bg-app-surface-muted aria-selected:bg-app-surface-muted"
              >
                <PlusCircle className="h-4 w-4 text-app-ink-muted" />
                <span>Create New Course</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(loadDemoData)}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-control text-app-ink cursor-pointer hover:bg-app-surface-muted aria-selected:bg-app-surface-muted"
              >
                <Database className="h-4 w-4 text-app-ink-muted" />
                <span>Load Demo Data (2 terms, 4 courses)</span>
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(clearDemoData)}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-control text-app-ink cursor-pointer hover:bg-app-surface-muted aria-selected:bg-app-surface-muted"
              >
                <Database className="h-4 w-4 text-app-danger" />
                <span className="text-app-danger">Clear All Data</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
      <div className="fixed inset-0 -z-10" onClick={() => onOpenChange(false)} />
    </div>
  );
}
