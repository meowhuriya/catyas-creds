"use client";

import * as React from "react";
import { ListPlus, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Bar } from "@/components/notes/exam-panel";
import { collectMaterial } from "@/lib/notes/material";
import { useNoteTopics } from "@/lib/notes/study";
import { VaultNote } from "@/lib/notes/vault-types";
import { cn } from "@/lib/utils";

/** The checklist of topics / Q-bank questions for one note, with Gemini auto-fill. */
export function TopicChecklist({ note, subjectTitle, showHeader = true }: { note: VaultNote; subjectTitle?: string; showHeader?: boolean }) {
  const nt = useNoteTopics();
  const items = nt.topics[note.id] ?? [];
  const prog = nt.progress(note.id);
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState<"topics" | "questions" | null>(null);
  const [msg, setMsg] = React.useState("");

  const fill = async (kind: "topics" | "questions") => {
    setBusy(kind);
    setMsg("");
    try {
      const m = await collectMaterial([note]);
      const res = await fetch("/api/ai/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "extract", kind, subject: subjectTitle ?? "", ...m }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't read this note");
      const have = new Set(items.map((i) => i.text.toLowerCase()));
      const fresh = (data.items as string[]).filter((t) => !have.has(t.trim().toLowerCase()));
      nt.add(note.id, data.items);
      setMsg(fresh.length ? `Added ${fresh.length} ${kind === "questions" ? "questions" : "topics"}. Edit or delete any you don't need.` : "Nothing new found. Your list already has these.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const pasteMany = (raw: string) => {
    const lines = raw.split(/\n+/).map((l) => l.replace(/^\s*[-*•\d.)]+\s*/, "").trim()).filter(Boolean);
    nt.add(note.id, lines.length > 1 ? lines : [raw]);
  };

  return (
    <div className="space-y-2.5">
      {showHeader && (
        <>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-app-ink">Topics to master</span>
            <span className="text-app-ink-muted">{prog.done}/{prog.total} · {prog.pct}%</span>
          </div>
          <Bar pct={prog.pct} />
        </>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) pasteMany(text);
          setText("");
        }}
        className="flex gap-1.5"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            const t = e.clipboardData.getData("text");
            if (t.includes("\n")) {
              e.preventDefault();
              pasteMany(t);
            }
          }}
          placeholder="Add a topic or question (paste a list to add many)"
          className="min-w-0 flex-1 rounded-control border border-app-border bg-app-surface px-2.5 py-1.5 text-sm outline-none focus:border-app-accent"
        />
        <button type="submit" disabled={!text.trim()} aria-label="Add" className="rounded-control bg-app-accent px-2 text-white disabled:opacity-40">
          <Plus className="h-4 w-4" />
        </button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        <button type="button" disabled={!!busy} onClick={() => fill("topics")} className="inline-flex items-center gap-1 rounded-full border border-app-border px-2.5 py-1 text-[11px] font-medium text-app-ink-muted hover:border-app-accent hover:text-app-ink disabled:opacity-50">
          {busy === "topics" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Pull topics with AI
        </button>
        <button type="button" disabled={!!busy} onClick={() => fill("questions")} className="inline-flex items-center gap-1 rounded-full border border-app-border px-2.5 py-1 text-[11px] font-medium text-app-ink-muted hover:border-app-accent hover:text-app-ink disabled:opacity-50">
          {busy === "questions" ? <Loader2 className="h-3 w-3 animate-spin" /> : <ListPlus className="h-3 w-3" />} It&apos;s a Q-bank: list every question
        </button>
      </div>
      {msg && <p className="text-[11px] text-app-ink-muted">{msg}</p>}

      {items.length > 0 && (
        <ul className="space-y-0.5">
          {items.map((it) => (
            <li key={it.id} className="group/row flex items-start gap-2 rounded px-1 py-1 hover:bg-app-surface-muted">
              <input type="checkbox" checked={it.done} onChange={() => nt.toggle(note.id, it.id)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
              <span className={cn("flex-1 text-sm leading-snug", it.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{it.text}</span>
              {it.weak && !it.done && <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-600">weak</span>}
              <button onClick={() => nt.remove(note.id, it.id)} aria-label="Remove" className="shrink-0 opacity-0 group-hover/row:opacity-100 focus:opacity-100">
                <Trash2 className="h-3.5 w-3.5 text-app-ink-muted" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
