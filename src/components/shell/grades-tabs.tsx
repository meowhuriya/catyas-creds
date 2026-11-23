"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/grades", label: "Grades & GPA" },
  { href: "/transcript", label: "Transcript" },
  { href: "/degree", label: "Degree progress" },
];

/** Grades, transcript and degree progress are one section with three tabs. */
export function GradesTabs({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="space-y-5">
      <nav className="mx-auto flex max-w-6xl gap-1 rounded-full border border-app-border bg-app-surface p-1 sm:w-fit" aria-label="Grades">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={cn("flex-1 whitespace-nowrap rounded-full px-4 py-1.5 text-center text-sm font-medium transition-colors sm:flex-none", pathname.startsWith(t.href) ? "bg-app-accent text-white" : "text-app-ink-muted hover:text-app-ink")}>
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
