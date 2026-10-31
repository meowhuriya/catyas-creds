"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  GraduationCap,
  FileText,
  Award,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { useDataStore } from "@/lib/repository";
import { TOKENS, CourseTagKey } from "@/styles/tokens";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { courses } = useDataStore();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Courses", href: "/courses", icon: BookOpen },
    { label: "Planner", href: "/planner", icon: Calendar },
    { label: "Grades", href: "/grades", icon: GraduationCap },
    { label: "Transcript", href: "/transcript", icon: FileText },
    { label: "Degree Progress", href: "/degree", icon: Award },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const recentCourses = courses.slice(0, 5);

  return (
    <aside
      className={cn(
        "relative hidden md:flex flex-col border-r border-app-border bg-app-surface transition-all duration-200 select-none",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* App Branding Header */}
      <div className="flex h-16 items-center justify-between border-b border-app-border px-4">
        {!collapsed && (
          <Link href="/" className="flex flex-col">
            <span className="font-serif text-lg font-bold tracking-tight text-app-ink">
              Catya's Creds
            </span>
            <span className="text-[10px] uppercase tracking-widest text-app-accent font-semibold -mt-1">
              Academic Portal
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto flex h-9 w-9 items-center justify-center rounded-control bg-app-accent text-white font-serif font-bold text-base">
            C
          </Link>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "rounded-control p-1.5 text-app-ink-muted hover:bg-app-surface-muted hover:text-app-ink transition-colors",
            collapsed && "mx-auto mt-2"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-app-surface-muted text-app-ink font-semibold"
                    : "text-app-ink-muted hover:bg-app-surface-muted/60 hover:text-app-ink",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
              >
                {/* 4px crimson active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-app-accent" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-app-accent" : "text-app-ink-muted group-hover:text-app-ink"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Recent Courses List (under Courses) */}
        {!collapsed && recentCourses.length > 0 && (
          <div className="mt-8 border-t border-app-border/80 pt-4">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-app-ink-muted">
                Recent Courses
              </span>
              <Link
                href="/courses?action=new-course"
                className="text-app-ink-muted hover:text-app-accent transition-colors"
                title="Add Course"
              >
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="space-y-1">
              {recentCourses.map((c) => {
                const isCourseActive = pathname.startsWith(`/courses/${c.id}`);
                const tagColor =
                  TOKENS.colors.courseTags[c.colorTag as CourseTagKey]?.hex ||
                  TOKENS.colors.courseTags.slate.hex;

                return (
                  <li key={c.id}>
                    <Link
                      href={`/courses/${c.id}`}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-control px-3 py-1.5 text-xs transition-colors",
                        isCourseActive
                          ? "bg-app-surface-muted font-medium text-app-ink"
                          : "text-app-ink-muted hover:bg-app-surface-muted/60 hover:text-app-ink"
                      )}
                    >
                      {/* Small 6px course dot */}
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: tagColor }}
                      />
                      <span className="font-mono font-semibold uppercase text-app-ink/80 shrink-0">
                        {c.code}
                      </span>
                      <span className="truncate">{c.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Footer Meta */}
      {!collapsed && (
        <div className="border-t border-app-border p-3 text-[11px] text-app-ink-muted flex flex-col gap-1">
          <div className="flex items-center justify-between text-app-ink-muted/80">
            <span>Catya's Creds v1.0</span>
            <span className="font-mono text-[10px]">Academic</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              YouTube ToS
            </a>
            <span>•</span>
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              Google Privacy
            </a>
          </div>
        </div>
      )}
    </aside>
  );
}
