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
  const [lastKey, setLastKey] = React.useState<string | null>(null);

  React.useEffect(() => {
    let keyTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable
      ) {
        return;
      }

      // '?' triggers shortcut dialog
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
      if (lastKey === "g") {
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
        }
        setLastKey(null);
        clearTimeout(keyTimeout);
        return;
      }

      if (e.key === "g") {
        setLastKey("g");
        keyTimeout = setTimeout(() => {
          setLastKey(null);
        }, 1200);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(keyTimeout);
    };
  }, [lastKey, router, onOpenChange, onOpenCommand]);

  const shortcuts = [
    { key: "g then d", desc: "Go to Dashboard" },
    { key: "g then c", desc: "Go to Courses" },
    { key: "g then p", desc: "Go to Academic Planner" },
    { key: "g then g", desc: "Go to Grades & SGPA" },
    { key: "⌘K / Ctrl+K / /", desc: "Open Command Palette / Search" },
    { key: "?", desc: "Open Keyboard Shortcuts Help" },
    { key: "j", desc: "Next lesson (in Lesson Player)" },
    { key: "k", desc: "Previous lesson (in Lesson Player)" },
    { key: "n", desc: "Focus lesson notes (in Lesson Player)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Navigate Catya's Creds efficiently using quick key combinations.
          </DialogDescription>
        </DialogHeader>

        <div className="divide-y divide-app-border text-sm">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 text-xs"
            >
              <span className="text-app-ink">{s.desc}</span>
              <kbd className="rounded border border-app-border bg-app-surface-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-app-ink">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
