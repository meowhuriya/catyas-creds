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
  Trophy,
  Settings,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  ClipboardCheck,
  NotebookPen,
  Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark, Wordmark } from "@/components/brand/logo";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

type NavItem = { label: string; href: string; icon: React.ElementType };
type NavGroup = { title: string | null; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: null,
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Today", href: "/today", icon: Clock },
    ],
  },
  {
    title: "Study",
    items: [
      { label: "Notes Vault", href: "/notes", icon: NotebookPen },
      { label: "Courses", href: "/courses", icon: BookOpen },
      { label: "Smart Recall", href: "/recall", icon: RotateCcw },
      { label: "Planner", href: "/planner", icon: Calendar },
    ],
  },
  {
    title: "College",
    items: [
      { label: "College Works", href: "/college-works", icon: ClipboardCheck },
      { label: "Grades", href: "/grades", icon: GraduationCap },
      { label: "Transcript", href: "/transcript", icon: FileText },
      { label: "Degree Progress", href: "/degree", icon: Award },
    ],
  },
  {
    title: "Grow",
    items: [
      { label: "Research & Lab", href: "/research", icon: FlaskConical },
      { label: "Certificates", href: "/certificates", icon: Medal },
      { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
    ],
  },
];

const SETTINGS: NavItem = { label: "Settings", href: "/settings", icon: Settings };

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        data-active={isActive ? "true" : "false"}
        title={collapsed ? item.label : undefined}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "pro-nav group flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors",
          isActive ? "is-active text-[var(--color-ink)]" : "text-[var(--color-ink-muted)] hover:bg-[var(--wash)] hover:text-[var(--color-ink)]",
          collapsed && "justify-center px-0"
        )}
      >
        <Icon className={cn("h-[17px] w-[17px] shrink-0", isActive ? "text-[var(--color-accent)]" : "text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)]")} strokeWidth={1.75} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "relative hidden md:flex flex-col transition-[width] duration-200 select-none shrink-0 h-[calc(100vh-32px)] sticky top-4 overflow-hidden",
        collapsed ? "w-[68px]" : "w-[232px]"
      )}
    >
      <div className={cn("flex h-16 items-center px-4", collapsed ? "justify-center" : "justify-between")}>
        <Link href="/" className="flex items-center gap-2.5 focus:outline-none" title="Valeria's Creds">
          <LogoMark size={collapsed ? 32 : 30} />
          {!collapsed && <Wordmark size="sm" />}
        </Link>
        {!collapsed && (
          <button
            onClick={onToggle}
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
            className="rounded-lg p-1.5 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-ink)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 pt-3 space-y-6" aria-label="Main">
        {NAV_GROUPS.map((group, i) => (
          <div key={group.title ?? i} className="space-y-0.5">
            {group.title &&
              (collapsed ? (
                <div className="mx-3 mb-2 border-t border-app-border/70" />
              ) : (
                <div className="flex items-center gap-2 px-3 pb-1.5">
                  <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-muted)]/60">
                    {group.title}
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-[rgba(60,40,110,0.16)] to-transparent" />
                </div>
              ))}
            {group.items.map(renderItem)}
          </div>
        ))}
      </nav>

            <div className="shrink-0 p-3 space-y-1">
        {renderItem(SETTINGS)}
        {collapsed && (
          <button
            onClick={onToggle}
            title="Expand sidebar"
            aria-label="Expand sidebar"
            className="flex w-full justify-center rounded-lg p-2 text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-muted)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
