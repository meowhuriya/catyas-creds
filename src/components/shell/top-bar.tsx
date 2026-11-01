"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Moon,
  Sun,
  ChevronDown,
  Calendar,
  LogOut,
  Database,
  Check,
  Settings,
  Download,
  Trash2,
} from "lucide-react";
import { useDataStore } from "@/lib/repository";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onOpenCommand: () => void;
}

export function TopBar({ onOpenCommand }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    firebaseUser,
    currentTerm,
    terms,
    dataStore,
    refreshData,
    signOut,
    deleteMyAccountAndData,
    isRealMode,
    isDemo,
    loadDemoData,
    clearDemoData,
  } = useDataStore();

  const [theme, setTheme] = React.useState<"light" | "dark">("light");
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
      localStorage.setItem("valerias_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      setTheme("light");
      localStorage.setItem("valerias_theme", "light");
    }
  };

  const handleSelectTerm = async (termId: string) => {
    await dataStore.setCurrentTerm(termId);
    await refreshData();
  };

  const handleExportData = async () => {
    try {
      const json = await dataStore.exportAllDataJson();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `valerias-creds-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export data:", err);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteDialogOpen(false);
    await deleteMyAccountAndData();
    router.push("/login");
  };

  const displayName = firebaseUser?.displayName || currentUser?.displayName || "Student";
  const email = firebaseUser?.email || currentUser?.email || "";
  const photoURL = firebaseUser?.photoURL || currentUser?.photoURL;
  const initial = displayName.charAt(0).toUpperCase() || "S";

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
    <>
      <header className="h-14 w-full bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] rounded-[18px] shadow-sm px-4 md:px-5 flex items-center justify-between">
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
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-app-border bg-app-surface px-1.5 py-0.5 font-sans font-semibold text-[10px] text-app-ink-muted">
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
                className="text-xs h-8 gap-1.5 font-medium px-2.5"
              >
                <Calendar className="h-3.5 w-3.5 text-app-accent" />
                <span className="font-sans font-semibold text-xs whitespace-nowrap">
                  {currentTerm?.name?.includes("2") ? "Sem 2 · 2025-26" : "Sem 1 · 2025-26"}
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

          {/* Account Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex h-8 items-center gap-2 rounded-control border border-app-border bg-app-surface px-2 text-xs text-app-ink hover:bg-app-surface-muted transition-colors">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#A51C30] dark:bg-[#8A1627] text-[11px] font-bold text-white">
                    {initial}
                  </div>
                )}
                <span className="hidden md:inline font-medium">
                  {displayName}
                </span>
                <ChevronDown className="h-3 w-3 text-app-ink-muted" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-2">
              <div className="border-b border-app-border pb-2 mb-2">
                <div className="font-serif text-sm font-semibold text-app-ink truncate">
                  {displayName}
                </div>
                {email && (
                  <div className="text-xs text-app-ink-muted truncate">
                    {email}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                {isRealMode ? (
                  <>
                    <Link
                      href="/settings"
                      className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-xs text-app-ink hover:bg-app-surface-muted transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 text-app-ink-muted" />
                      <span>Settings</span>
                    </Link>

                    <button
                      onClick={handleExportData}
                      className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-xs text-app-ink hover:bg-app-surface-muted transition-colors"
                    >
                      <Download className="h-3.5 w-3.5 text-app-ink-muted" />
                      <span>Export my data</span>
                    </button>

                    <button
                      onClick={() => setDeleteDialogOpen(true)}
                      className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-xs text-app-danger hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-app-danger" />
                      <span>Delete my account and data</span>
                    </button>

                    <div className="border-t border-app-border pt-1 mt-1">
                      <button
                        onClick={signOut}
                        className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-xs text-app-ink hover:bg-app-surface-muted transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5 text-app-ink-muted" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={loadDemoData}
                      className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-xs text-app-ink hover:bg-app-surface-muted transition-colors"
                    >
                      <Database className="h-3.5 w-3.5 text-app-ink-muted" />
                      <span>Reload Demo Data</span>
                    </button>

                    <button
                      onClick={clearDemoData}
                      className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-xs text-app-danger hover:bg-red-500/10 transition-colors"
                    >
                      <Database className="h-3.5 w-3.5 text-app-danger" />
                      <span>Clear All Data</span>
                    </button>

                    <div className="border-t border-app-border pt-1 mt-1">
                      <Link
                        href="/login"
                        className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-xs text-app-accent hover:bg-app-surface-muted transition-colors font-medium"
                      >
                        <LogOut className="h-3.5 w-3.5 text-app-accent" />
                        <span>Sign In</span>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31]">
          <DialogHeader>
            <DialogTitle className="text-app-ink">
              Delete account and all study data?
            </DialogTitle>
            <DialogDescription className="text-app-ink-muted text-xs leading-relaxed">
              This action cannot be undone. All your syllabus progress, watch records, notes, attendance records, and personalized study schedules in Firestore will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
            >
              Delete Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
