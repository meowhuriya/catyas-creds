"use client";

import * as React from "react";
import { Camera, CheckCircle2, ChevronDown, Clock, Keyboard, Loader2, RotateCcw, Shuffle, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/notes/image-utils";
import { MASTERED_SCORE, StudyItem, drillOrder, useNoteTopics } from "@/lib/notes/study";
import { VaultNote } from "@/lib/notes/vault-types";
import { cn } from "@/lib/utils";

type Focus = "smart" | "new" | "weak" | "order";
type Style = "exact" | "twist";

interface Source {
  item: StudyItem;
  note: VaultNote;
}
interface Card {
  src: Source;
  text: string; // what is asked (twisted text in twist mode)
  marks: number;
  twisted: boolean;
}
interface Grade {
  score: number;
  verdict: string;
  good?: string[];
  missing?: string[];
  tip?: string;
  modelAnswer?: string;
  simple?: string;
  self?: boolean;
}

const LONG_WORDS = /\b(explain|describe|derive|discuss|prove|elaborate|write short notes|compare|illustrate|with (a )?neat (sketch|diagram))\b/i;
function isLong(c: Card) {
  return c.marks >= 5 || (c.marks === 0 && (c.text.length > 90 || LONG_WORDS.test(c.text)));
}

async function post(body: object) {
  const res = await fetch("/api/ai/practice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

function mmss(sec: number) {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/**
 * Exam drill: questions come straight from your Q-banks (or AI twists of them).
 * Short ones you type; long ones you write on paper and snap a photo. AI marks it like an examiner.
 */
export function Drill({
  subjectTitle,
  notes,
  only,
  onClose,
}: {
  subjectTitle: string;
  notes: VaultNote[];
  only?: { noteId: string; itemId: string }[]; // jump straight into these questions
  onClose: () => void;
}) {
  const nt = useNoteTopics();
  const all: Source[] = React.useMemo(
    () => notes.flatMap((note) => (nt.topics[note.id] ?? []).map((item) => ({ item, note }))),
    [notes, nt.topics]
  );
  const chapters = Array.from(new Set(all.map((s) => s.item.chapter).filter(Boolean))) as string[];

  const [picked, setPicked] = React.useState<string[]>(notes.map((n) => n.id));
  const [chapter, setChapter] = React.useState("");
  const [focus, setFocus] = React.useState<Focus>("smart");
  const [style, setStyle] = React.useState<Style>("exact");
  const [count, setCount] = React.useState(10);
  const [phase, setPhase] = React.useState<"setup" | "loading" | "run" | "done">("setup");
  const [error, setError] = React.useState("");
  const [cards, setCards] = React.useState<Card[]>([]);
  const [i, setI] = React.useState(0);
  const [results, setResults] = React.useState<(Grade | null)[]>([]);
  const [run, setRun] = React.useState(0);

  const pool = all.filter((s) => picked.includes(s.note.id) && (!chapter || s.item.chapter === chapter));
  const filtered = (focus === "new" ? pool.filter((s) => !s.item.attempts) : focus === "weak" ? pool.filter((s) => s.item.weak || (s.item.attempts && (s.item.lastScore ?? 0) < MASTERED_SCORE)) : pool);

  const start = React.useCallback(
    async (sources: Source[], st: Style) => {
      setError("");
      if (sources.length === 0) {
        setError("No questions match. Import questions into your Q-bank notes first, or change the filters.");
        return;
      }
      let next: Card[] = sources.map((src) => ({ src, text: src.item.text, marks: src.item.marks ?? 0, twisted: false }));
      if (st === "twist") {
        setPhase("loading");
        try {
          const data = await post({ mode: "twist", subject: subjectTitle, questions: sources.map((s) => ({ text: s.item.text, marks: s.item.marks ?? 0 })) });
          const tw = (data.questions ?? []) as { text: string; marks?: number; from?: number }[];
          next = sources.map((src, k) => {
            const t = tw.find((q) => q.from === k + 1) ?? tw[k];
            return { src, text: t?.text || src.item.text, marks: src.item.marks ?? t?.marks ?? 0, twisted: !!t?.text };
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : "Couldn't twist questions");
          setPhase("setup");
          return;
        }
      }
      setCards(next);
      setRun((r) => r + 1);
      setResults(next.map(() => null));
      setI(0);
      setPhase("run");
    },
    [subjectTitle]
  );

  // Opened for specific questions (e.g. from Today's plan): skip setup.
  const startedOnly = React.useRef(false);
  React.useEffect(() => {
    if (!only || startedOnly.current || all.length === 0) return;
    startedOnly.current = true;
    const srcs = only.map((o) => all.find((s) => s.note.id === o.noteId && s.item.id === o.itemId)).filter(Boolean) as Source[];
    void start(srcs, "exact");
  }, [only, all, start]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && phase !== "run" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, phase]);

  const begin = () => {
    const ordered = focus === "order" ? filtered : drillOrder(filtered.map((s) => s.item)).map((it) => filtered.find((s) => s.item === it)!);
    void start(ordered.slice(0, count), style);
  };

  const saveGrade = (g: Grade) => {
    const c = cards[i];
    nt.record(c.src.note.id, c.src.item.id, g.score);
    setResults((r) => r.map((x, k) => (k === i ? g : x)));
  };

  const graded = results.filter(Boolean) as Grade[];
  const avg = graded.length ? Math.round((graded.reduce((a, g) => a + g.score, 0) / graded.length) * 10) / 10 : 0;

  return (
    <div className="fixed inset-0 z-[110] flex items-stretch justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex w-full max-w-3xl flex-col overflow-hidden bg-app-surface shadow-2xl sm:max-h-[94vh] sm:rounded-2xl sm:border sm:border-app-border">
        <div className="flex items-center gap-2 border-b border-app-border px-5 py-3">
          <Target className="h-4 w-4 text-app-accent" />
          <h2 className="flex-1 truncate text-sm font-semibold text-app-ink">
            Test me · {subjectTitle}
            {phase === "run" && <span className="ml-2 font-normal text-app-ink-muted">{i + 1} / {cards.length}</span>}
          </h2>
          <button onClick={onClose} aria-label="Close" className="rounded-control p-1.5 text-app-ink-muted hover:bg-app-surface-muted"><X className="h-4 w-4" /></button>
        </div>
        {phase === "run" && (
          <div className="flex gap-1 px-5 pt-3">
            {cards.map((_, k) => (
              <span key={k} className={cn("h-1 flex-1 rounded-full", results[k] ? (results[k]!.score >= MASTERED_SCORE ? "bg-emerald-500" : results[k]!.score >= 5 ? "bg-sky-500" : "bg-amber-500") : k === i ? "bg-app-accent" : "bg-app-surface-muted")} />
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {(phase === "setup" || phase === "loading") && (
            <div className="space-y-5">
              <p className="text-sm text-app-ink-muted">
                You get questions from your own Q-banks. Type short answers. For long answers, write on paper <b>without looking</b>, then snap a photo. AI marks it like a JNTUH examiner and shows the model answer.
              </p>
              <Field label="Questions from">
                <div className="flex flex-wrap gap-1.5">
                  {notes.map((n) => {
                    const on = picked.includes(n.id);
                    const c = (nt.topics[n.id] ?? []).length;
                    return (
                      <button key={n.id} type="button" onClick={() => setPicked((p) => (on ? p.filter((x) => x !== n.id) : [...p, n.id]))}
                        className={cn("rounded-full border px-3 py-1 text-xs", on ? "border-app-accent bg-[var(--accent-soft)] text-app-ink" : "border-app-border text-app-ink-muted")}>
                        {n.title} <span className="opacity-60">· {c}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>
              {chapters.length > 0 && (
                <Field label="Unit / chapter">
                  <select value={chapter} onChange={(e) => setChapter(e.target.value)} className="w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm">
                    <option value="">All units</option>
                    {chapters.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </Field>
              )}
              <Field label="Which questions">
                <Segmented value={focus} onChange={setFocus} options={[["smart", "Smart mix"], ["new", "Not tried yet"], ["weak", "My weak ones"], ["order", "In order"]]} />
                <p className="mt-1 text-[11px] text-app-ink-muted">Smart mix: weak ones first, then ones you haven&apos;t tried, then shaky ones.</p>
              </Field>
              <Field label="Ask them">
                <Segmented value={style} onChange={setStyle} options={[["exact", "Exactly as in the Q-bank"], ["twist", "Twisted by AI"]]} />
                <p className="mt-1 text-[11px] text-app-ink-muted">Twisted: same concept, asked from a new angle, so you can&apos;t just memorise the wording.</p>
              </Field>
              <Field label="How many">
                <Segmented value={String(count)} onChange={(v) => setCount(Number(v))} options={[["5", "5"], ["10", "10"], ["15", "15"], ["20", "20"]]} />
              </Field>
              {error && <p className="rounded-control bg-[var(--accent-soft)] px-3 py-2 text-sm text-app-ink">{error}</p>}
              <Button onClick={begin} disabled={phase === "loading" || filtered.length === 0} className="w-full" size="lg">
                {phase === "loading" ? <><Loader2 className="h-4 w-4 animate-spin" /> Preparing questions…</> : <><Target className="h-4 w-4" /> Start ({Math.min(count, filtered.length)} of {filtered.length})</>}
              </Button>
              {all.length === 0 && <p className="text-center text-xs text-app-ink-muted">No questions yet. Open a Q-bank note and press <b>Import every question</b>.</p>}
            </div>
          )}

          {phase === "run" && cards[i] && (
            <QuestionView
              key={`${run}-${i}`}
              card={cards[i]}
              subjectTitle={subjectTitle}
              result={results[i]}
              onGraded={saveGrade}
              onNext={() => (i + 1 >= cards.length ? setPhase("done") : setI(i + 1))}
              last={i + 1 >= cards.length}
            />
          )}

          {phase === "done" && (
            <div className="space-y-5">
              <div className="text-center">
                <p className="font-display text-5xl text-app-ink">{avg}<span className="text-2xl text-app-ink-muted">/10</span></p>
                <p className="mt-1 text-sm text-app-ink-muted">
                  average · {graded.filter((g) => g.score >= MASTERED_SCORE).length} mastered · {graded.filter((g) => g.score < 5).length} need work
                </p>
              </div>
              <ul className="space-y-1.5">
                {cards.map((c, k) => (
                  <li key={k} className="flex items-start gap-2 rounded-control border border-app-border px-3 py-2 text-sm">
                    <span className={cn("mt-0.5 shrink-0 rounded-full px-1.5 text-[11px] font-semibold", !results[k] ? "bg-app-surface-muted text-app-ink-muted" : results[k]!.score >= MASTERED_SCORE ? "bg-emerald-500/15 text-emerald-600" : results[k]!.score >= 5 ? "bg-sky-500/15 text-sky-600" : "bg-amber-500/15 text-amber-600")}>
                      {results[k] ? `${results[k]!.score}/10` : "skipped"}
                    </span>
                    <span className="flex-1 text-app-ink">{c.text}</span>
                  </li>
                ))}
              </ul>
              <p className="text-center text-xs text-app-ink-muted">Scores are saved. 7+ marks a question as mastered; under 5 marks it weak, and it comes back first next time.</p>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => {
                  const weak = cards.filter((_, k) => !results[k] || results[k]!.score < MASTERED_SCORE).map((c) => c.src);
                  if (weak.length) void start(weak, "exact"); else setPhase("setup");
                }}>
                  <RotateCcw className="h-4 w-4" /> Retry the ones I missed
                </Button>
                <Button className="flex-1" onClick={onClose}>Done</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-app-ink">{label}</p>
      {children}
    </div>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-control border border-app-border p-1">
      {options.map(([v, label]) => (
        <button key={v} type="button" onClick={() => onChange(v)} className={cn("flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors", value === v ? "bg-app-accent text-white" : "text-app-ink-muted hover:text-app-ink")}>
          {label}
        </button>
      ))}
    </div>
  );
}

function QuestionView({
  card,
  subjectTitle,
  result,
  onGraded,
  onNext,
  last,
}: {
  card: Card;
  subjectTitle: string;
  result: Grade | null;
  onGraded: (g: Grade) => void;
  onNext: () => void;
  last: boolean;
}) {
  const long = isLong(card);
  const [mode, setMode] = React.useState<"photo" | "type">(long ? "photo" : "type");
  const [typed, setTyped] = React.useState("");
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState<"grade" | "answer" | null>(null);
  const [error, setError] = React.useState("");
  const [reveal, setReveal] = React.useState<{ modelAnswer?: string; simple?: string } | null>(null);
  const [secs, setSecs] = React.useState(0);
  const [showModel, setShowModel] = React.useState(false);
  const suggested = card.marks ? Math.round(card.marks * 1.5) : long ? 12 : 3;

  React.useEffect(() => {
    if (result) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [result]);

  const reference = card.src.note.body.slice(0, 8000);

  const grade = async () => {
    setBusy("grade");
    setError("");
    try {
      const images = photos.map((d) => {
        const m = d.match(/^data:(.+?);base64,(.+)$/)!;
        return { mimeType: m[1], data: m[2] };
      });
      const g = await post({ mode: "grade", subject: subjectTitle, question: card.text, marks: card.marks, reference, studentAnswer: mode === "type" ? typed : "", images: mode === "photo" ? images : [] });
      onGraded({ ...g, score: Math.max(0, Math.min(10, Math.round(Number(g.score) || 0))) });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't grade that");
    } finally {
      setBusy(null);
    }
  };

  const showAnswer = async () => {
    setBusy("answer");
    setError("");
    try {
      setReveal(await post({ mode: "answer", subject: subjectTitle, question: card.text, marks: card.marks, reference }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the answer");
    } finally {
      setBusy(null);
    }
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const next = [...photos];
    for (const f of Array.from(files).slice(0, 4 - photos.length)) next.push(await compressImage(f));
    setPhotos(next);
  };

  const shown = result ?? (reveal ? { score: -1, verdict: "", ...reveal } : null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-app-ink-muted">
        <span className="truncate">{card.src.note.title}{card.src.item.chapter ? ` · ${card.src.item.chapter}` : ""}</span>
        {card.marks > 0 && <span className="rounded-full border border-app-border px-1.5">{card.marks} marks</span>}
        {card.twisted && <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-1.5 text-[var(--color-accent)]"><Shuffle className="h-3 w-3" /> twisted</span>}
        <span className="ml-auto inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {mmss(secs)} <span className="opacity-60">/ aim ~{suggested} min</span></span>
      </div>
      <p className="font-display text-2xl leading-snug text-app-ink">{card.text}</p>
      {card.twisted && <p className="text-[11px] text-app-ink-muted">Original: {card.src.item.text}</p>}

      {!shown && (
        <>
          <div className="flex gap-1 rounded-control border border-app-border p-1">
            <button type="button" onClick={() => setMode("type")} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium", mode === "type" ? "bg-app-accent text-white" : "text-app-ink-muted")}><Keyboard className="h-3.5 w-3.5" /> Type it</button>
            <button type="button" onClick={() => setMode("photo")} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium", mode === "photo" ? "bg-app-accent text-white" : "text-app-ink-muted")}><Camera className="h-3.5 w-3.5" /> Write on paper + photo</button>
          </div>

          {mode === "type" ? (
            <textarea value={typed} onChange={(e) => setTyped(e.target.value)} rows={long ? 10 : 5} autoFocus placeholder="Answer from memory, like in the exam…"
              className="w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm outline-none focus:border-app-accent" />
          ) : (
            <div className="space-y-2 rounded-control border border-dashed border-app-border p-4">
              <p className="text-sm text-app-ink">Close your notes and write the full answer on paper. When you&apos;re done, take a clear photo of each page.</p>
              <div className="flex flex-wrap gap-2">
                {photos.map((p, k) => (
                  <div key={k} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p} alt={`Page ${k + 1}`} className="h-24 w-20 rounded-md border border-app-border object-cover" />
                    <button onClick={() => setPhotos(photos.filter((_, j) => j !== k))} aria-label="Remove photo" className="absolute -right-1.5 -top-1.5 rounded-full bg-app-surface p-0.5 shadow"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                {photos.length < 4 && (
                  <label className="flex h-24 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-app-border text-[11px] text-app-ink-muted hover:border-app-accent">
                    <Camera className="h-5 w-5" /> {photos.length ? "Add page" : "Add photo"}
                    <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => { void addPhotos(e.target.files); e.target.value = ""; }} />
                  </label>
                )}
              </div>
            </div>
          )}

          {error && <p className="rounded-control bg-[var(--accent-soft)] px-3 py-2 text-sm text-app-ink">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={grade} disabled={!!busy || (mode === "type" ? !typed.trim() : photos.length === 0)} className="flex-1">
              {busy === "grade" ? <><Loader2 className="h-4 w-4 animate-spin" /> Marking…</> : "Mark my answer"}
            </Button>
            <Button variant="ghost" onClick={showAnswer} disabled={!!busy}>{busy === "answer" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} I don&apos;t know it</Button>
            <Button variant="ghost" onClick={onNext} disabled={!!busy}>Skip</Button>
          </div>
        </>
      )}

      {shown && (
        <div className="space-y-3">
          {shown.score >= 0 && (
            <div className="flex items-center gap-3 rounded-control border border-app-border p-3">
              <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full font-display text-xl", shown.score >= MASTERED_SCORE ? "bg-emerald-500/15 text-emerald-600" : shown.score >= 5 ? "bg-sky-500/15 text-sky-600" : "bg-amber-500/15 text-amber-600")}>
                {shown.score}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-app-ink">{shown.verdict}</p>
                <p className="text-xs text-app-ink-muted">{shown.score >= MASTERED_SCORE ? "Marked as mastered." : shown.score >= 5 ? "Almost. It'll come back for another go." : "Marked weak. It comes first next time."}</p>
              </div>
            </div>
          )}
          {!!shown.good?.length && (
            <Box title="What you got right" tone="good">{shown.good.map((g, k) => (<li key={k}>{g}</li>))}</Box>
          )}
          {!!shown.missing?.length && (
            <Box title="Missing or wrong" tone="warn">{shown.missing.map((g, k) => (<li key={k}>{g}</li>))}</Box>
          )}
          {shown.tip && <p className="text-sm text-app-ink"><b>Tip:</b> {shown.tip}</p>}
          {shown.simple && (
            <div className="rounded-control bg-[var(--accent-soft)] p-3 text-sm">
              <p className="mb-1 text-xs font-semibold text-[var(--color-accent)]">In simple words</p>
              <p className="text-app-ink">{shown.simple}</p>
            </div>
          )}
          {shown.modelAnswer && (
            <div className="rounded-control border border-app-border">
              <button onClick={() => setShowModel((v) => !v)} className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold text-app-ink">
                Model answer (how to write it in the exam)
                <ChevronDown className={cn("h-4 w-4 transition-transform", showModel && "rotate-180")} />
              </button>
              {(showModel || shown.score < 0) && <p className="whitespace-pre-wrap border-t border-app-border px-3 py-2 text-sm leading-relaxed text-app-ink">{shown.modelAnswer}</p>}
            </div>
          )}
          {!result && reveal && (
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => onGraded({ score: 0, verdict: "Didn't know it yet", self: true, ...reveal })}>Mark as weak</Button>
              <Button className="flex-1" onClick={() => { setReveal(null); setSecs(0); }}>Now try writing it</Button>
            </div>
          )}
          {result && (
            <Button onClick={onNext} className="w-full">{last ? "See results" : "Next question"}</Button>
          )}
          {result && result.score < MASTERED_SCORE && !result.self && (
            <button onClick={() => onGraded({ ...result, score: MASTERED_SCORE, verdict: "You marked it as mastered" })} className="flex w-full items-center justify-center gap-1 text-[11px] text-app-ink-muted hover:text-app-ink">
              <CheckCircle2 className="h-3 w-3" /> I disagree, I know this one
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Box({ title, tone, children }: { title: string; tone: "good" | "warn"; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-control border p-3 text-sm", tone === "good" ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5")}>
      <p className={cn("mb-1 text-xs font-semibold", tone === "good" ? "text-emerald-600" : "text-amber-600")}>{title}</p>
      <ul className="list-disc space-y-0.5 pl-5 text-app-ink">{children}</ul>
    </div>
  );
}
