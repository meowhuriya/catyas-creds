"use client";

import * as React from "react";
import { CalendarDays, ListChecks, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStudy } from "@/lib/notes/study";
import { cn } from "@/lib/utils";

function daysLeft(d?: string): number | null {
  if (!d) return null;
  const t = new Date(d + "T00:00:00").getTime();
  if (Number.isNaN(t)) return null;
  return Math.ceil((t - new Date().setHours(0, 0, 0, 0)) / 86400000);
}

export function StudyPanel({
  subjectId,
  onPractice,
  study,
}: {
  subjectId: string;
  onPractice: () => void;
  study: ReturnType<typeof useStudy>;
}) {
  const [text, setText] = React.useState("");
  const { data, addItems, toggle, remove, setExamDate } = study;
  const done = data.items.filter((i) => i.done).length;
  const pct = data.items.length ? Math.round((done / data.items.length) * 100) : 0;
  const left = daysLeft(data.examDate);
  void subjectId;

  return (
    <section className="vc-tile space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-app-ink"><ListChecks className="h-4 w-4 text-app-accent" /> Study tracker</h2>
        <label className="ml-auto flex items-center gap-2 text-xs text-app-ink-muted">
          <CalendarDays className="h-3.5 w-3.5" /> Exam on
          <input type="date" value={data.examDate ?? ""} onChange={(e) => setExamDate(e.target.value)} className="rounded-control border border-app-border bg-app-surface px-2 py-1 text-xs text-app-ink" />
        </label>
        {left !== null && (
          <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent)]">
            {left > 0 ? `${left} day${left === 1 ? "" : "s"} left` : left === 0 ? "Exam today" : "Exam passed"}
          </span>
        )}
        <Button size="sm" onClick={onPractice}><Sparkles className="h-4 w-4" /> Practise with AI</Button>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-app-ink-muted"><span>{done} of {data.items.length} topics done</span><span>{pct}%</span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-app-surface-muted"><div className="h-full rounded-full bg-app-accent transition-all" style={{ width: `${pct}%` }} /></div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); addItems([text]); setText(""); }} className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a topic, e.g. Unit 2 – Fourier series"
          className="min-w-0 flex-1 rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm outline-none focus:border-app-accent" />
        <Button type="submit" size="sm" variant="ghost" disabled={!text.trim()}><Plus className="h-4 w-4" /> Add</Button>
      </form>

      {data.items.length > 0 && (
        <ul className="space-y-1">
          {data.items.map((it) => (
            <li key={it.id} className="group flex items-center gap-2 rounded-control px-1 py-1 hover:bg-app-surface-muted">
              <input type="checkbox" checked={it.done} onChange={() => toggle(it.id)} className="h-4 w-4 accent-[var(--accent)]" />
              <span className={cn("flex-1 text-sm", it.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{it.text}</span>
              {it.weak && <span className="rounded-full bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-600">weak spot</span>}
              <button onClick={() => remove(it.id)} aria-label="Remove" className="opacity-0 transition-opacity group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5 text-app-ink-muted" /></button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
