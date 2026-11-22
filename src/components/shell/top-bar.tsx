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
  GraduationCap,
} from "lucide-react";
import { useDataStore } from "@/lib/repository";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getSubject } from "@/lib/notes/curriculum";
import { SoundControlPopover } from "./sound-control-popover";
import { AppearanceControl } from "./appearance-control";
import { useSound } from "@/lib/sound-engine";
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
      const prev = segments[i - 1];
      const named: Record<string, string> = { prep: "Exam Prep", notes: "Notes Vault" };
      const formatted =
        named[seg] ??
        (prev === "notes" ? getSubject(decodeURIComponent(seg))?.title : undefined) ??
        (prev === "prep" ? "Exam plan" : undefined) ??
        seg.charAt(0).toUpperCase() + seg.slice(1).replace("-", " ");
      items.push({
        label: formatted,
        href: isLast ? undefined : acc,
      });
    });
    return items;
  }, [pathname]);

  return (
    <>
      <header className="vc-topbar h-14 w-full px-3 md:px-4 flex items-center justify-between gap-3 min-w-0 [&_nav]:font-sans [&_nav]:uppercase [&_nav]:tracking-[0.14em] [&_nav]:text-[11px]">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <div className="flex-1" />

        {/* Right Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenCommand}
            aria-label="Search (Command K)"
            title="Search  ⌘K"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-app-ink-muted hover:bg-app-surface-muted hover:text-app-ink"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>

          {/* Term Switcher Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-9 gap-1.5 font-medium px-2.5 rounded-xl"
              >
                <Calendar className="h-3.5 w-3.5 text-app-accent" />
                <span className="font-sans font-semibold text-xs whitespace-nowrap">
                  {currentTerm?.name?.includes("2") ? "Sem 2" : "Sem 1"}
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

          <AppearanceControl />

          {/* Sound & Focus Ambience Popover */}
          <SoundControlPopover />

          {/* Account Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="ml-1 flex h-9 items-center rounded-full p-0.5 hover:ring-2 hover:ring-app-accent/30" aria-label="Account menu">
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C93A55] text-sm font-bold text-white">
                    {initial}
                  </div>
                )}
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
