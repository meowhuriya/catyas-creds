"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ShortcutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenCommand: () => void;
}

export function ShortcutDialog({
  open,
  onOpenChange,
  onOpenCommand,
}: ShortcutDialogProps) {
  const router = useRouter();
  const lastKeyRef = React.useRef<string | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input, textarea, select, or contentEditable
      const target = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable
      ) {
        return;
      }

      // '?' triggers shortcut dialog (Shift + / or just ?)
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onOpenChange(true);
        return;
      }

      // '/' triggers command palette
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onOpenCommand();
        return;
      }

      // Sequence: 'g' then another key
      if (lastKeyRef.current === "g") {
        if (e.key === "d") {
          e.preventDefault();
          router.push("/");
        } else if (e.key === "c") {
          e.preventDefault();
          router.push("/courses");
        } else if (e.key === "p") {
          e.preventDefault();
          router.push("/planner");
        } else if (e.key === "g") {
          e.preventDefault();
          router.push("/grades");
        } else if (e.key === "t") {
          e.preventDefault();
          router.push("/transcript");
        } else if (e.key === "s") {
          e.preventDefault();
          router.push("/settings");
        }
        lastKeyRef.current = null;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        return;
      }

      if (e.key === "g") {
        lastKeyRef.current = "g";
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          lastKeyRef.current = null;
        }, 1500);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [router, onOpenChange, onOpenCommand]);

  const shortcuts = [
    { key: "g then d", desc: "Go to Dashboard" },
    { key: "g then c", desc: "Go to Courses" },
    { key: "g then p", desc: "Go to Academic Planner" },
    { key: "g then g", desc: "Go to Grades & Standing" },
    { key: "g then t", desc: "Go to Official Transcript" },
    { key: "g then s", desc: "Go to Academic Settings" },
    { key: "⌘K / Ctrl+K / /", desc: "Open Command Palette / Search" },
    { key: "?", desc: "Open Keyboard Shortcuts Help" },
    { key: "j", desc: "Next lesson (in Lesson Player)" },
    { key: "k", desc: "Previous lesson (in Lesson Player)" },
    { key: "n", desc: "Focus lesson notes (in Lesson Player)" },
    { key: "f", desc: "Toggle Focus Mode (in Lesson Player)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Navigate Valeria's Creds efficiently using quick key combinations.
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-app-border text-sm">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 text-xs"
            >
              <span className="text-app-ink">{s.desc}</span>
              <kbd className="rounded border border-app-border bg-app-surface-muted px-2 py-0.5 font-sans font-semibold text-[11px] font-semibold text-app-ink">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
