"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MobileTabBar } from "./mobile-nav";
import { CommandPalette } from "./command-palette";
import { ShortcutDialog } from "./shortcut-dialog";
import { CelebrationOverlay } from "@/components/ui/CelebrationOverlay";
import { useToast } from "@/components/ui/toast";
import { useDataStore } from "@/lib/repository";
import { loadSavedAppearance, applyAppearanceToDOM, getCustomWallpaper } from "@/lib/appearance";
import { onCloudSyncUpdate } from "@/lib/cloud-sync/synced-storage";
import { validateSeedTotals } from "@/lib/syllabus/seed-loader";
import { SoundEngine } from "@/lib/sound-engine";
import { Loader2, Info } from "lucide-react";
import { TiltFx } from "@/components/fx/tilt-fx";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isRealMode, isDemo, firebaseUser, authLoading } = useDataStore();

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [shortcutOpen, setShortcutOpen] = React.useState(false);
  const { info, error: toastError } = useToast();

  React.useEffect(() => {
    // Attach modern professional click sound listener across all working elements
    const detachSound = SoundEngine.getInstance().attachGlobalClickListener();
    return () => {
      detachSound();
    };
  }, []);

  React.useEffect(() => {
    // Re-apply appearance when another signed-in device changes it
    return onCloudSyncUpdate("valerias_appearance_settings_v2", () => {
      const synced = loadSavedAppearance();
      getCustomWallpaper().then((img) => applyAppearanceToDOM(synced, img));
    });
  }, []);

  React.useEffect(() => {
    // Apply saved appearance
    const apper = loadSavedAppearance();
    getCustomWallpaper().then((img) => {
      applyAppearanceToDOM(apper, img);
    });

    const saved = localStorage.getItem("valerias_sidebar_collapsed");
    if (saved) {
      setSidebarCollapsed(saved === "true");
    }

    const notified = localStorage.getItem("valerias_creds_syllabus_notified");
    if (!notified) {
      const validation = validateSeedTotals();
      if (validation.isValid) {
        info(
          "Syllabus loaded: 19 courses, 651 topics",
          `Sem 1 = ${validation.sem1.courses} courses, ${validation.sem1.credits} credits, ${validation.sem1.topics} topics; Sem 2 = ${validation.sem2.courses} courses, ${validation.sem2.credits} credits, ${validation.sem2.topics} topics.`
        );
        localStorage.setItem("valerias_creds_syllabus_notified", "true");
      } else {
        toastError(
          "Syllabus count mismatch",
          validation.errorMessage || "The syllabus totals in meridian-year1-seed.json do not match the required totals."
        );
      }
    }
  }, [info, toastError]);

  // Route protection in Real Mode
  React.useEffect(() => {
    if (!authLoading && isRealMode) {
      const isPublicRoute = pathname === "/login" || pathname?.startsWith("/verify");
      if (!firebaseUser && !isPublicRoute) {
        router.push("/login");
      }
    }
  }, [authLoading, isRealMode, firebaseUser, pathname, router]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("valerias_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Login page has its own standalone full-screen layout
  if (pathname === "/login") {
    return (
      <>
        {children}
      </>
    );
  }

  // Public verification route bypasses auth checks and app shell
  if (pathname?.startsWith("/verify")) {
    return <>{children}</>;
  }

  // If in Real Mode and authenticating, show solid loading screen
  if (isRealMode && authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 select-none">
        <div className="p-8 rounded-[18px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] text-center space-y-3 shadow-xl">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#C93A55]" />
          <p className="text-xs font-medium text-app-ink">Checking session...</p>
        </div>
      </div>
    );
  }

  // If in Real Mode and not logged in, show redirecting state
  if (isRealMode && !firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 select-none">
        <div className="p-8 rounded-[18px] bg-app-surface border border-app-border text-center space-y-3 shadow-xl">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#C93A55]" />
          <p className="text-xs font-medium text-app-ink">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-transparent text-app-ink">
      {/* Skip to Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-app-accent focus:px-4 focus:py-2 focus:text-white focus:shadow-md"
      >
        Skip to main content
      </a>

      {/* Desktop Floating Left Sidebar (16px from edges, 264px wide, solid cream panel) */}
      <div className="hidden md:block p-4 pr-0 shrink-0 select-none">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      </div>

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col min-w-0 h-screen overflow-y-auto">
        <div className="sticky top-4 z-40 px-4 md:px-8 pt-4 pb-0 pointer-events-none">
          <div className="pointer-events-auto">
            <TopBar onOpenCommand={() => setCommandOpen(true)} />
          </div>
        </div>

        <main
          id="main-content"
          className="flex-1 px-4 pt-4 md:px-10 max-w-[1280px] w-full mx-auto pb-24 md:pb-12 space-y-4"
        >
          {/* Demo Mode Banner when Firebase is not configured */}
          {isDemo && (
            <div className="rounded-[14px] bg-app-surface border border-amber-500/40 p-3 px-4 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 shadow-xs">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-semibold">Demo mode (not saved online)</span>
              </div>
              <span className="text-[11px] text-app-ink-muted hidden sm:inline">
                Connect Firebase credentials to enable real-time cloud synchronization.
              </span>
            </div>
          )}

          <div key={pathname} className="fade-up space-y-4">
            {children}
          </div>

          <footer className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-2 px-1 text-[11px] text-app-ink-muted no-print">
            <span className="font-sans uppercase tracking-[0.14em]">Valeria&apos;s Creds</span>
            <span className="flex items-center gap-3">
              <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" className="hover:text-app-ink">YouTube Terms</a>
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="hover:text-app-ink">Google Privacy</a>
            </span>
          </footer>
        </main>
      </div>

      <TiltFx />

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar />

      {/* Global Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      {/* Keyboard Shortcuts Help Dialog */}
      <ShortcutDialog
        open={shortcutOpen}
        onOpenChange={setShortcutOpen}
        onOpenCommand={() => setCommandOpen(true)}
      />

      {/* Procedural Sound Celebration & Floating Reward Overlay */}
      <CelebrationOverlay />
    </div>
  );
}
