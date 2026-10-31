"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Moon,
  Sun,
  User as UserIcon,
  ChevronDown,
  Calendar,
  LogOut,
  Database,
  Check,
} from "lucide-react";
import { useDataStore } from "@/lib/repository";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onOpenCommand: () => void;
}

export function TopBar({ onOpenCommand }: TopBarProps) {
  const pathname = usePathname();
  const {
    currentUser,
    currentTerm,
    terms,
    dataStore,
    refreshData,
    signInWithGoogle,
    signOut,
    isDemo,
    loadDemoData,
    clearDemoData,
  } = useDataStore();

  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    // Check initial system / html theme
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
      localStorage.setItem("catyas_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
      localStorage.setItem("catyas_theme", "light");
    }
  };

  const handleSelectTerm = async (termId: string) => {
    await dataStore.setCurrentTerm(termId);
    await refreshData();
  };

  // Generate breadcrumbs from pathname
  const breadcrumbItems = React.useMemo(() => {
    if (pathname === "/") {
      return [{ label: "Dashboard" }];
    }
    const segments = pathname.split("/").filter(Boolean);
    const items: Array<{ label: string; href?: string }> = [{ label: "Dashboard", href: "/" }];

    let acc = "";
    segments.forEach((seg, i) => {
      acc += `/${seg}`;
      const isLast = i === segments.length - 1;
      const formatted = seg.charAt(0).toUpperCase() + seg.slice(1).replace("-", " ");
      items.push({
        label: formatted,
        href: isLast ? undefined : acc,
      });
    });
    return items;
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-app-border bg-app-surface/90 px-4 md:px-6 backdrop-blur-md">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Centre: Command / Search Trigger */}
      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <button
          onClick={onOpenCommand}
          className="flex h-9 w-full items-center justify-between rounded-control border border-app-border bg-app-surface-muted/60 px-3 text-xs text-app-ink-muted hover:bg-app-surface-muted hover:text-app-ink transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            <span>Search courses, lessons, assessments...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-app-border bg-app-surface px-1.5 py-0.5 font-mono text-[10px] text-app-ink-muted">
            <span className="text-[9px]">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Term Switcher Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1.5 font-medium"
            >
              <Calendar className="h-3.5 w-3.5 text-app-accent" />
              <span className="hidden md:inline max-w-[130px] truncate">
                {currentTerm ? currentTerm.name : "Select Term"}
              </span>
              <ChevronDown className="h-3 w-3 text-app-ink-muted" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1">
            <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-app-ink-muted">
              Academic Terms
            </div>
            <div className="space-y-0.5">
              {terms.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTerm(t.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-control px-2 py-1.5 text-xs text-left transition-colors",
                    t.isCurrent
                      ? "bg-app-surface-muted font-medium text-app-ink"
                      : "text-app-ink-muted hover:bg-app-surface-muted hover:text-app-ink"
                  )}
                >
                  <span className="truncate">{t.name}</span>
                  {t.isCurrent && (
                    <Check className="h-3.5 w-3.5 text-app-accent shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          className="flex h-8 w-8 items-center justify-center rounded-control border border-app-border bg-app-surface text-app-ink-muted hover:bg-app-surface-muted hover:text-app-ink transition-colors"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4 text-amber-400" />
          )}
          <span className="sr-only">Toggle Theme</span>
        </button>

        {/* Profile & Demo Data Menu */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-8 items-center gap-2 rounded-control border border-app-border bg-app-surface px-2 text-xs text-app-ink hover:bg-app-surface-muted transition-colors">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-app-accent text-[11px] font-bold text-white">
                {currentUser?.displayName?.charAt(0) || "C"}
              </div>
              <span className="hidden md:inline font-medium">
                {currentUser?.displayName || "Student"}
              </span>
              <ChevronDown className="h-3 w-3 text-app-ink-muted" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2">
            <div className="border-b border-app-border pb-2 mb-2">
              <div className="font-serif text-sm font-semibold text-app-ink">
                {currentUser?.displayName || "Valeria V."}
              </div>
              <div className="text-xs text-app-ink-muted truncate">
                {currentUser?.email || "catya.student@catyascreds.edu"}
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] text-app-ink-muted">
                  {isDemo ? "High-Fidelity Demo Store" : "Firebase Cloud"}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <button
                onClick={loadDemoData}
                className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-xs text-app-ink hover:bg-app-surface-muted transition-colors"
              >
                <Database className="h-3.5 w-3.5 text-app-ink-muted" />
                <span>Reload Demo Data (2 terms, 4 courses)</span>
              </button>

              <button
                onClick={clearDemoData}
                className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-xs text-app-danger hover:bg-red-500/10 transition-colors"
              >
                <Database className="h-3.5 w-3.5 text-app-danger" />
                <span>Clear All Data</span>
              </button>

              <div className="border-t border-app-border pt-1 mt-1">
                {isDemo ? (
                  <button
                    onClick={signInWithGoogle}
                    className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-xs text-app-accent hover:bg-app-surface-muted transition-colors font-medium"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-app-accent" />
                    <span>Sign In with Google</span>
                  </button>
                ) : (
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-xs text-app-ink hover:bg-app-surface-muted transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5 text-app-ink-muted" />
                    <span>Sign Out (Return to Demo)</span>
                  </button>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
