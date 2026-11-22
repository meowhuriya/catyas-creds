"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Sparkles, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { collectMaterial } from "@/lib/notes/material";
import { VaultNote } from "@/lib/notes/vault-types";
import { cn } from "@/lib/utils";

interface Q {
  type: "mcq" | "short" | "viva";
  prompt: string;
  options?: string[];
  answer: string;
  explanation?: string;
  topic?: string;
  note?: string;
}
interface Check {
  score: number;
  verdict: string;
  feedback: string;
  missing?: string[];
}
type Kind = "mix" | "mcq" | "short" | "viva";

export function PracticeDialog({
  subjectTitle,
  notes,
  startNoteId,
  onClose,
  onAddWeak,
}: {
  subjectTitle: string;
  notes: VaultNote[];
  startNoteId?: string;
  onClose: () => void;
  onAddWeak: (items: { topic: string; noteId?: string }[]) => void;
}) {
  const [scope, setScope] = React.useState<string>(startNoteId ?? "all");
  const [count, setCount] = React.useState(5);
  const [kind, setKind] = React.useState<Kind>("mix");
  const [phase, setPhase] = React.useState<"setup" | "loading" | "quiz" | "done">("setup");
  const [error, setError] = React.useState("");
  const [qs, setQs] = React.useState<Q[]>([]);
  const [sources, setSources] = React.useState<{ read: number; skipped: number } | null>(null);
  const [i, setI] = React.useState(0);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [typed, setTyped] = React.useState("");
  const [check, setCheck] = React.useState<Check | null>(null);
  const [checking, setChecking] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);
  const [results, setResults] = React.useState<{ ok: boolean; topic: string; noteId?: string }[]>([]);
  const [added, setAdded] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const generate = async () => {
    setPhase("loading");
    setError("");
    const chosen = scope === "all" ? notes : notes.filter((n) => n.id === scope);
    const material = await collectMaterial(chosen);
    try {
      const res = await fetch("/api/ai/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "generate",
          subject: subjectTitle,
          noteTitle: chosen.length === 1 ? chosen[0].title : "Mixed notes",
          ...material,
          count,
          kind,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setQs(data.questions);
      setSources(data.sources ?? null);
      setI(0);
      setResults([]);
      setPicked(null);
      setTyped("");
      setCheck(null);
      setRevealed(false);
      setPhase("quiz");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setPhase("setup");
    }
  };

  const q = qs[i];
  const answered = q?.type === "mcq" ? picked !== null : check !== null || revealed;

  const noteIdFor = (title?: string) => {
    const pool = scope === "all" ? notes : notes.filter((n) => n.id === scope);
    if (pool.length === 1) return pool[0].id;
    const t = (title ?? "").trim().toLowerCase();
    return pool.find((n) => n.title.trim().toLowerCase() === t)?.id;
  };
  const record = (ok: boolean) => setResults((r) => [...r.slice(0, i), { ok, topic: q.topic || subjectTitle, noteId: noteIdFor(q.note) }]);

  const pickOption = (opt: string) => {
    if (picked !== null) return;
    setPicked(opt);
    record(opt.trim() === q.answer.trim());
  };

  const runCheck = async () => {
    if (!typed.trim()) return;
    setChecking(true);
    try {
      const res = await fetch("/api/ai/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "check", subject: subjectTitle, question: q.prompt, modelAnswer: q.answer, studentAnswer: typed }),
      });
      const data = (await res.json()) as Check & { error?: string };
      if (!res.ok) throw new Error(data.error);
      setCheck(data);
      record(data.score >= 6);
    } catch {
      setRevealed(true);
      record(false);
    } finally {
      setChecking(false);
    }
  };

  const next = () => {
    if (i + 1 >= qs.length) return setPhase("done");
    setI(i + 1);
    setPicked(null);
    setTyped("");
    setCheck(null);
    setRevealed(false);
  };

  const correct = results.filter((r) => r.ok).length;
  const weakItems = results.filter((r) => !r.ok).filter((r, idx, arr) => arr.findIndex((x) => x.topic === r.topic && x.noteId === r.noteId) === idx);
  const weak = weakItems.map((r) => r.topic);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-6" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-2xl">
        <div className="flex items-center gap-2 border-b border-app-border px-5 py-3">
          <Sparkles className="h-4 w-4 text-app-accent" />
          <h2 className="flex-1 truncate text-sm font-semibold text-app-ink">Practice · {subjectTitle}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-control p-1.5 text-app-ink-muted hover:bg-app-surface-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          {(phase === "setup" || phase === "loading") && (
            <>
              <p className="text-sm text-app-ink-muted">Gemini reads your notes (text, photos and link-shared Drive PDFs) and asks you exam-style questions from them.</p>
              <label className="block space-y-1 text-xs font-medium text-app-ink">
                Practise from
                <select value={scope} onChange={(e) => setScope(e.target.value)} className="w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm">
                  <option value="all">All notes in this subject ({notes.length})</option>
                  {notes.map((n) => (<option key={n.id} value={n.id}>{n.title}</option>))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1 text-xs font-medium text-app-ink">
                  Type
                  <select value={kind} onChange={(e) => setKind(e.target.value as Kind)} className="w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm">
                    <option value="mix">Mix</option>
                    <option value="mcq">Multiple choice</option>
                    <option value="short">Written answers</option>
                    <option value="viva">Viva questions</option>
                  </select>
                </label>
                <label className="space-y-1 text-xs font-medium text-app-ink">
                  How many
                  <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm">
                    {[5, 8, 10, 12].map((n) => (<option key={n} value={n}>{n} questions</option>))}
                  </select>
                </label>
              </div>
              {error && <p className="rounded-control bg-[var(--accent-soft)] px-3 py-2 text-sm text-app-ink">{error}</p>}
              <Button onClick={generate} disabled={phase === "loading" || notes.length === 0} className="w-full">
                {phase === "loading" ? (<><Loader2 className="h-4 w-4 animate-spin" /> Reading your notes…</>) : (<><Sparkles className="h-4 w-4" /> Start practice</>)}
              </Button>
              {notes.length === 0 && <p className="text-xs text-app-ink-muted">Add a note first, then come back to practise from it.</p>}
            </>
          )}

          {phase === "quiz" && q && (
            <>
              <div className="flex items-center justify-between text-xs text-app-ink-muted">
                <span>Question {i + 1} of {qs.length} · {q.type === "mcq" ? "Multiple choice" : q.type === "viva" ? "Viva" : "Written"}</span>
                {sources && sources.skipped > 0 && <span title="Share the Drive file as 'Anyone with the link' (PDF) so Gemini can read it">{sources.skipped} Drive file(s) couldn&apos;t be read</span>}
              </div>
              <p className="font-display text-xl leading-snug text-app-ink">{q.prompt}</p>

              {q.type === "mcq" ? (
                <div className="space-y-2">
                  {(q.options ?? []).map((o) => {
                    const isRight = o.trim() === q.answer.trim();
                    const show = picked !== null;
                    return (
                      <button key={o} onClick={() => pickOption(o)} disabled={show}
                        className={cn("flex w-full items-center gap-2 rounded-control border px-3 py-2.5 text-left text-sm transition-colors",
                          !show && "border-app-border hover:border-app-accent",
                          show && isRight && "border-app-success bg-app-success/10",
                          show && !isRight && picked === o && "border-red-400 bg-red-500/10",
                          show && !isRight && picked !== o && "border-app-border opacity-60")}>
                        {show && isRight && <CheckCircle2 className="h-4 w-4 shrink-0 text-app-success" />}
                        {show && !isRight && picked === o && <XCircle className="h-4 w-4 shrink-0 text-red-500" />}
                        <span>{o}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <textarea value={typed} onChange={(e) => setTyped(e.target.value)} disabled={answered} rows={5} placeholder="Write your answer like you would in the exam…"
                    className="w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm outline-none focus:border-app-accent" />
                  {!answered && (
                    <div className="flex gap-2">
                      <Button onClick={runCheck} disabled={checking || !typed.trim()}>{checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Check my answer</Button>
                      <Button variant="ghost" onClick={() => { setRevealed(true); record(false); }}>Show answer</Button>
                    </div>
                  )}
                  {check && (
                    <div className="rounded-control border border-app-border bg-app-surface-muted p-3 text-sm">
                      <p className="font-semibold text-app-ink">{check.score}/10 · {check.verdict}</p>
                      <p className="mt-1 text-app-ink-muted">{check.feedback}</p>
                      {check.missing && check.missing.length > 0 && (<p className="mt-1 text-xs text-app-ink-muted">Missed: {check.missing.join("; ")}</p>)}
                    </div>
                  )}
                </>
              )}

              {answered && (
                <div className="space-y-2 rounded-control border border-app-border bg-app-surface-muted p-3 text-sm">
                  {q.type !== "mcq" && (<p><span className="font-semibold text-app-ink">Model answer: </span><span className="text-app-ink-muted">{q.answer}</span></p>)}
                  {q.explanation && (<p><span className="font-semibold text-app-ink">In simple words: </span><span className="text-app-ink-muted">{q.explanation}</span></p>)}
                </div>
              )}
              {answered && <Button onClick={next} className="w-full">{i + 1 >= qs.length ? "See results" : "Next question"}</Button>}
            </>
          )}

          {phase === "done" && (
            <div className="space-y-4 text-center">
              <p className="font-display text-4xl text-app-ink">{correct} / {qs.length}</p>
              <p className="text-sm text-app-ink-muted">{correct === qs.length ? "Perfect round. Nice." : "Review the topics below, then try again."}</p>
              {weak.length > 0 && (
                <div className="space-y-2 rounded-control border border-app-border bg-app-surface-muted p-3 text-left text-sm">
                  <p className="font-semibold text-app-ink">Revise these</p>
                  <ul className="list-disc pl-5 text-app-ink-muted">{weak.map((w, k) => (<li key={k}>{w}</li>))}</ul>
                  <Button size="sm" disabled={added} onClick={() => { onAddWeak(weakItems.map((r) => ({ topic: r.topic, noteId: r.noteId }))); setAdded(true); }}>{added ? "Added to the notes' checklists" : "Add as weak spots to my checklist"}</Button>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setPhase("setup")}>New set</Button>
                <Button className="flex-1" onClick={onClose}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
