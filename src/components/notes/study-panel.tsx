"use client";

import * as React from "react";
import { ChevronDown, ListChecks, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Bar } from "@/components/notes/exam-panel";
import { progressOf, sumProgress, useNoteTopics, useStudy } from "@/lib/notes/study";
import { cn } from "@/lib/utils";

export function StudyPanel({
  noteIds,
  study,
  onPractice,
}: {
  noteIds: string[];
  study: ReturnType<typeof useStudy>;
  onPractice: () => void;
}) {
  const [text, setText] = React.useState("");
  const { topics } = useNoteTopics();
  const { data, addItems, toggle, remove } = study;
  const overall = sumProgress([...noteIds.map((id) => progressOf(topics[id])), progressOf(data.items)]);

  return (
    <section className="vc-tile space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-app-ink"><ListChecks className="h-4 w-4 text-app-accent" /> Subject progress</h2>
        {false && /* AI switched off */ (<Button size="sm" className="ml-auto" onClick={onPractice}><Sparkles className="h-4 w-4" /> Practise with AI</Button>)}
      </div>
      <div>
        <div className="mb-1 flex justify-between text-xs text-app-ink-muted"><span>{overall.done} of {overall.total} topics done across all notes</span><span className="font-semibold text-app-ink">{overall.pct}%</span></div>
        <Bar pct={overall.pct} />
      </div>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-app-ink-muted">
          General topics (not tied to a note) · {progressOf(data.items).done}/{data.items.length}
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 space-y-3">
          <form onSubmit={(e) => { e.preventDefault(); addItems([text]); setText(""); }} className="flex gap-2">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a general topic"
              className="min-w-0 flex-1 rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm outline-none focus:border-app-accent" />
            <Button type="submit" size="sm" variant="ghost" disabled={!text.trim()}><Plus className="h-4 w-4" /> Add</Button>
          </form>
          <ul className="space-y-1">
            {data.items.map((it) => (
              <li key={it.id} className="group/row flex items-center gap-2 rounded-control px-1 py-1 hover:bg-app-surface-muted">
                <input type="checkbox" checked={it.done} onChange={() => toggle(it.id)} className="h-4 w-4 accent-[var(--accent)]" />
                <span className={cn("flex-1 text-sm", it.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{it.text}</span>
                {it.weak && <span className="rounded-full bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-600">weak spot</span>}
                <button onClick={() => remove(it.id)} aria-label="Remove" className="opacity-0 transition-opacity group-hover/row:opacity-100"><Trash2 className="h-3.5 w-3.5 text-app-ink-muted" /></button>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </section>
  );
}
