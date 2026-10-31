"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MobileTabBar } from "./mobile-nav";
import { CommandPalette } from "./command-palette";
import { ShortcutDialog } from "./shortcut-dialog";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [shortcutOpen, setShortcutOpen] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem("valerias_sidebar_collapsed");
    if (saved) {
      setSidebarCollapsed(saved === "true");
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("valerias_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-app-ink">
      {/* Skip to Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-control focus:bg-app-accent focus:px-4 focus:py-2 focus:text-white focus:shadow-md"
      >
        Skip to main content
      </a>

      {/* Desktop Collapsible Left Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onOpenCommand={() => setCommandOpen(true)} />

        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-4 py-6 md:px-8 max-w-content w-full mx-auto pb-24 md:pb-12"
        >
          {children}

          {/* Academic Portal Footer */}
          <footer className="mt-16 border-t border-app-border pt-6 pb-4 text-xs text-app-ink-muted flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-app-ink">Valeria’s Creds</span>
              <span>·</span>
              <span>Self-awarded credits. Not accredited by any institution.</span>
            </div>
            <div className="flex items-center gap-4 text-app-ink-muted">
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noreferrer"
                className="hover:underline hover:text-app-ink transition-colors"
              >
                YouTube Terms of Service
              </a>
              <span>·</span>
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="hover:underline hover:text-app-ink transition-colors"
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
