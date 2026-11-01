"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
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
import { LogoMark, Wordmark } from "@/components/brand/logo";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { courses } = useDataStore();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Today", href: "/today", icon: Clock },
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
        "relative hidden md:flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-200 select-none",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2.5 focus:outline-none">
            <LogoMark size={28} />
            <Wordmark size="sm" />
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto focus:outline-none" title="Valeria's Creds">
            <LogoMark size={30} />
          </Link>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "rounded-[6px] p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)] transition-colors",
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
                  "group relative flex items-center gap-3 rounded-[6px] px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold"
                    : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
              >
                {/* 4px crimson active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[var(--color-accent)]" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-[var(--color-accent)]" : "text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)]"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Recent Courses List (under Courses) */}
        {!collapsed && recentCourses.length > 0 && (
          <div className="mt-8 border-t border-[var(--color-border)]/80 pt-4">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                Recent Courses
              </span>
              <Link
                href="/courses?action=new-course"
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors"
                title="Create Course"
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
                        "group relative flex items-center gap-2.5 rounded-[6px] px-3 py-1.5 text-xs transition-colors",
                        isCourseActive
                          ? "bg-[var(--color-surface-muted)] font-medium text-[var(--color-ink)]"
                          : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]"
                      )}
                    >
                      {/* Small 6px course dot */}
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: tagColor }}
                      />
                      <span className="font-mono font-semibold uppercase text-[var(--color-ink)]/80 shrink-0">
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

      {/* Footer Legal & Disclaimers */}
      {!collapsed && (
        <div className="border-t border-[var(--color-border)] p-3 text-[11px] text-[var(--color-ink-muted)] flex flex-col gap-1">
          <div className="flex items-center justify-between text-[var(--color-ink-muted)]/80">
            <span>Valeria's Creds v1.0</span>
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
