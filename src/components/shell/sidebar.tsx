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
        "relative hidden md:flex flex-col bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] rounded-[18px] shadow-sm transition-all duration-200 select-none shrink-0 h-[calc(100vh-32px)] sticky top-4 overflow-hidden",
        collapsed ? "w-16" : "w-[264px]"
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

      {/* Part 1: Main Navigation Items (Fixed Height) */}
      <div className="shrink-0 px-2 py-3">
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
                    ? "bg-[#A51C30]/10 text-[#A51C30] dark:text-[#F07B88] font-semibold"
                    : "text-[#4B5160] dark:text-[#D1C7B7] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#14161F] dark:hover:text-[#F6EBD3]",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
              >
                {/* 4px crimson active indicator */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#A51C30]" />
                )}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-[#A51C30] dark:text-[#F07B88]" : "text-[#4B5160] dark:text-[#D1C7B7] group-hover:text-[#14161F]"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Part 2: Recent Courses (flex: 1, min-height: 0, scrolls inside itself, 5 items, one line each with ellipsis & tooltip) */}
      {!collapsed && (
        <div className="flex-1 min-h-0 overflow-y-auto px-2 py-3 border-t border-[#E4D9C0] dark:border-[#3D2D31]">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A1627] dark:text-[#F07B88]">
              Recent Courses
            </span>
            <Link
              href="/courses?action=new-course"
              className="text-[#4B5160] hover:text-[#A51C30] transition-colors"
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
                    title={c.title}
                    className={cn(
                      "group relative flex items-center gap-2 rounded-[6px] px-3 py-1.5 text-xs transition-colors",
                      isCourseActive
                        ? "bg-[#A51C30]/10 font-semibold text-[#A51C30] dark:text-[#F07B88]"
                        : "text-[#4B5160] dark:text-[#D1C7B7] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#14161F] dark:hover:text-[#F6EBD3]"
                    )}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: tagColor }}
                    />
                    <span className="font-sans font-semibold tracking-wide uppercase text-[#14161F] dark:text-[#F6EBD3] shrink-0 text-[11px]">
                      {c.code}
                    </span>
                    <span className="truncate flex-1 font-medium text-[12px]">
                      {c.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Part 3: Footer pinned at bottom with its own solid background (List never runs under footer) */}
      {!collapsed && (
        <div className="shrink-0 bg-[#FBF6EC] dark:bg-[#221A1C] border-t border-[#E4D9C0] dark:border-[#3D2D31] p-3 space-y-1 text-xs">
          <div className="text-[12px] font-semibold text-[#14161F] dark:text-[#F6EBD3]">
            Valeria’s Creds v1.0
          </div>
          <div className="text-[12px] text-[#4B5160] dark:text-[#D1C7B7] flex items-center gap-1.5">
            <a
              href="https://www.youtube.com/t/terms"
              target="_blank"
              rel="noreferrer"
              className="hover:underline hover:text-[#14161F] dark:hover:text-[#F6EBD3]"
            >
              YouTube Terms
            </a>
            <span>·</span>
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="hover:underline hover:text-[#14161F] dark:hover:text-[#F6EBD3]"
            >
              Google Privacy
            </a>
          </div>
        </div>
      )}
    </aside>
  );
}
