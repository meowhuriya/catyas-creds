"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MobileTabBar } from "./mobile-nav";
import { CommandPalette } from "./command-palette";
import { ShortcutDialog } from "./shortcut-dialog";
import { useToast } from "@/components/ui/toast";
import { loadSavedAppearance, applyAppearanceToDOM, getCustomWallpaper } from "@/lib/appearance";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [shortcutOpen, setShortcutOpen] = React.useState(false);
  const { info } = useToast();

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
      info(
        "Syllabus loaded: 19 courses, 651 topics",
        "Sem 1 = 9 courses, 20 credits, 325 topics. Sem 2 = 10 courses, 20 credits, 326 topics."
      );
      localStorage.setItem("valerias_creds_syllabus_notified", "true");
    }
  }, [info]);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("valerias_sidebar_collapsed", String(next));
      return next;
    });
  };

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
          className="flex-1 px-4 pt-6 md:px-8 max-w-content w-full mx-auto pb-24 md:pb-12"
        >
          {children}

          {/* Academic Portal Footer (Solid cream panel) */}
          <footer className="mt-12 rounded-[18px] bg-[#FBF6EC] dark:bg-[#221A1C] border border-[#E4D9C0] dark:border-[#3D2D31] p-4 text-xs text-app-ink-muted flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm no-print">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-app-ink">Valeria's Creds</span>
              <span>·</span>
              <span>Self-awarded credits. Not accredited by any institution.</span>
            </div>
            <div className="flex items-center gap-4 text-app-ink-muted">
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noreferrer"
                className="hover:underline hover:text-app-ink transition-colors font-medium"
              >
                YouTube Terms of Service
              </a>
              <span>·</span>
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="hover:underline hover:text-app-ink transition-colors font-medium"
              >
                Google Privacy Policy
              </a>
            </div>
          </footer>
        </main>
      </div>

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
    </div>
  );
}
