"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  GraduationCap,
  Menu,
  FileText,
  Award,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);

  const mainTabs = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Courses", href: "/courses", icon: BookOpen },
    { label: "Planner", href: "/planner", icon: Calendar },
    { label: "Grades", href: "/grades", icon: GraduationCap },
  ];

  const moreItems = [
    { label: "Official Transcript", href: "/transcript", icon: FileText },
    { label: "Degree Progress", href: "/degree", icon: Award },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* "More" Drawer for mobile */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/50 backdrop-blur-sm animate-in fade-in-0">
          <div className="fixed inset-x-0 bottom-16 rounded-t-card border-t border-app-border bg-app-surface p-4 shadow-dialog">
            <div className="flex items-center justify-between pb-3 border-b border-app-border mb-3">
              <span className="font-serif text-sm font-semibold text-app-ink">
                More Academic Navigation
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                className="rounded-control p-1 text-app-ink-muted hover:bg-app-surface-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-control px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-app-surface-muted text-app-accent font-semibold"
                        : "text-app-ink-muted hover:bg-app-surface-muted hover:text-app-ink"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar on Mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-app-border bg-app-surface/95 px-2 backdrop-blur-md md:hidden select-none">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-control py-1 px-3 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-app-accent font-semibold"
                  : "text-app-ink-muted hover:text-app-ink"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-control py-1 px-3 text-[11px] font-medium transition-colors",
            moreOpen
              ? "text-app-accent font-semibold"
              : "text-app-ink-muted hover:text-app-ink"
          )}
        >
          <Menu className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
