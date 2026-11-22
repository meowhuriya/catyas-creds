"use client";

import * as React from "react";
import { ChevronDown, FileQuestion, Loader2, Plus, Sparkles, Target, Trash2 } from "lucide-react";
import { Bar } from "@/components/notes/exam-panel";
import { hasImportSource, useImportQuestions } from "@/lib/notes/use-import";
import { MASTERED_SCORE, StudyItem, useNoteTopics } from "@/lib/notes/study";
import { VaultNote } from "@/lib/notes/vault-types";
import { cn } from "@/lib/utils";

export function ScorePill({ item }: { item: StudyItem }) {
  if (!item.attempts) return null;
  const s = item.lastScore ?? 0;
  return (
    <span
      title={`Last score ${s}/10 · ${item.attempts} attempt${item.attempts > 1 ? "s" : ""}`}
      className={cn(
        "shrink-0 rounded-full px-1.5 text-[10px] font-semibold",
        s >= MASTERED_SCORE ? "bg-emerald-500/15 text-emerald-600" : s >= 5 ? "bg-sky-500/15 text-sky-600" : "bg-amber-500/15 text-amber-600"
      )}
    >
      {s}/10
    </span>
  );
}

/** One note's list of topics or Q-bank questions: import with AI, tick, see scores, start a drill. */
export function TopicChecklist({
  note,
  subjectTitle,
  showHeader = true,
  onDrill,
}: {
  note: VaultNote;
  subjectTitle?: string;
  showHeader?: boolean;
  onDrill?: () => void;
}) {
  const nt = useNoteTopics();
  const items = nt.topics[note.id] ?? [];
  const prog = nt.progress(note.id);
  const [text, setText] = React.useState("");
  const [closed, setClosed] = React.useState<Set<string>>(new Set());
  const importer = useImportQuestions(subjectTitle);
  const busy = importer.busy?.noteId === note.id ? importer.busy.kind : null;
  const msg = importer.msg?.noteId === note.id ? importer.msg.lines : [];
  const hasSource = hasImportSource(note);
  const fill = (kind: "topics" | "questions", ai = false) => importer.run(note, kind, { ai });

  const pasteMany = (raw: string) => {
    const lines = raw.split(/\n+/).map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)]|Q\d+[.):]?)\s*/i, "").trim()).filter(Boolean);
    nt.add(note.id, lines.length > 1 ? lines : [raw]);
  };

  // Group by chapter, keeping first-seen order.
  const groups: { chapter: string; items: StudyItem[] }[] = [];
  for (const it of items) {
    const ch = it.chapter || "";
    let g = groups.find((x) => x.chapter === ch);
    if (!g) groups.push((g = { chapter: ch, items: [] }));
    g.items.push(it);
  }
  const grouped = groups.length > 1 || (groups[0]?.chapter ?? "") !== "";

  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-app-ink">{note.section === "qbank" ? "Questions" : "Topics"} to master</span>
            <span className="text-app-ink-muted">{prog.done}/{prog.total} mastered · {prog.pct}%</span>
          </div>
          <Bar pct={prog.pct} />
        </div>
      )}

      {items.length === 0 ? (
        <div className="space-y-2 rounded-control border border-dashed border-app-border p-3">
          <p className="text-xs text-app-ink-muted">
            {hasSource
              ? "Read the questions straight from this note's file (no AI), or paste them below."
              : "Add your Q-bank file, photos or a Drive link to this note first (pencil icon), or type topics below."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!!busy || !hasSource} onClick={() => fill("questions")} className="inline-flex items-center gap-1.5 rounded-control bg-app-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40">
              {busy === "questions" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileQuestion className="h-3.5 w-3.5" />} Get questions from file
            </button>
            <button type="button" disabled={!!busy || !hasSource} onClick={() => fill("topics", true)} className="inline-flex items-center gap-1.5 rounded-control border border-app-border px-3 py-1.5 text-xs font-medium text-app-ink disabled:opacity-40">
              {busy === "topics" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Pull topics with AI
            </button>
          </div>
        </div>
      ) : (
        onDrill && (
          <button onClick={onDrill} className="flex w-full items-center justify-center gap-2 rounded-control bg-app-accent px-3 py-2 text-sm font-semibold text-white">
            <Target className="h-4 w-4" /> Test me on these
          </button>
        )
      )}
      {busy && <p className="text-[11px] text-app-ink-muted">{importer.progress || "Reading your material…"}</p>}
      {msg.map((m, i) => (
        <p key={i} className="text-[11px] text-app-ink-muted">{m}</p>
      ))}

      {groups.map((g) => {
        const isClosed = closed.has(g.chapter);
        const done = g.items.filter((i) => i.done).length;
        return (
          <div key={g.chapter || "_"} className="space-y-0.5">
            {grouped && (
              <button
                type="button"
                onClick={() => setClosed((s) => { const n = new Set(s); if (n.has(g.chapter)) n.delete(g.chapter); else n.add(g.chapter); return n; })}
                className="flex w-full items-center gap-1.5 pt-1 text-left text-[11px] font-semibold uppercase tracking-wide text-app-ink-muted"
              >
                <ChevronDown className={cn("h-3 w-3 transition-transform", isClosed && "-rotate-90")} />
                <span className="flex-1 truncate">{g.chapter || "Other"}</span>
                <span className="font-normal normal-case">{done}/{g.items.length}</span>
              </button>
            )}
            {!isClosed && (
              <ul className="space-y-0.5">
                {g.items.map((it) => (
                  <li key={it.id} className="group/row flex items-start gap-2 rounded px-1 py-1 hover:bg-app-surface-muted">
                    <input type="checkbox" checked={it.done} onChange={() => nt.toggle(note.id, it.id)} title="Mark as mastered" className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
                    <span className={cn("flex-1 text-sm leading-snug", it.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{it.text}</span>
                    {!!it.marks && <span className="shrink-0 rounded-full border border-app-border px-1.5 text-[10px] text-app-ink-muted">{it.marks}M</span>}
                    <ScorePill item={it} />
                    {it.weak && !it.done && !it.attempts && <span className="shrink-0 rounded-full bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-600">weak</span>}
                    <button onClick={() => nt.remove(note.id, it.id)} aria-label="Remove" className="shrink-0 opacity-0 group-hover/row:opacity-100 focus:opacity-100">
                      <Trash2 className="h-3.5 w-3.5 text-app-ink-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

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
          placeholder="Add one, or paste a whole list"
          className="min-w-0 flex-1 rounded-control border border-app-border bg-app-surface px-2.5 py-1.5 text-sm outline-none focus:border-app-accent"
        />
        <button type="submit" disabled={!text.trim()} aria-label="Add" className="rounded-control border border-app-border px-2 text-app-ink disabled:opacity-40">
          <Plus className="h-4 w-4" />
        </button>
      </form>
      {items.length > 0 && hasSource && (
        <div className="flex flex-wrap gap-3 text-[11px]">
          <button type="button" disabled={!!busy} onClick={() => fill("questions")} className="text-app-ink-muted hover:text-app-ink">Re-import questions</button>
          <button type="button" disabled={!!busy} onClick={() => fill("topics", true)} className="text-app-ink-muted hover:text-app-ink">Pull more topics</button>
        </div>
      )}
    </div>
  );
}
