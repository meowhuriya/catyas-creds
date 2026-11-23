"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  LayoutGrid,
  ListTodo,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Timer,
  Trash2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Bar, ExamForm } from "@/components/notes/exam-panel";
import { NoteReader } from "@/components/notes/note-reader";
import { NoteEditorDialog } from "@/components/notes/note-editor-dialog";
import { TopicChecklist, ScorePill } from "@/components/notes/topic-checklist";
import { Drill } from "@/components/prep/drill";
import { getSubject } from "@/lib/notes/curriculum";
import { REVISION_DAYS, examSubjects, useExams, useNoteTopics } from "@/lib/notes/study";
import { useExamPlan } from "@/lib/notes/use-exam-plan";
import { useFocusDay } from "@/lib/focus/store";
import { QEntry, groupByChapter, questionEntries, qStats, smartOpen } from "@/lib/notes/questions";
import { useVault } from "@/lib/notes/use-vault";
import { VaultNote } from "@/lib/notes/vault-types";
import { cn } from "@/lib/utils";

/** One stop in the exam's plan rail. */
type Stop =
  | { key: "overview"; kind: "overview"; label: string }
  | { key: "todo"; kind: "todo"; label: string }
  | { key: string; kind: "chapter"; label: string; note: VaultNote; chapter: string; entries: QEntry[] }
  | { key: string; kind: "empty"; label: string; note: VaultNote };

type Filter = "all" | "open" | "weak" | "done";

export default function ExamPrepPage() {
  const params = useParams<{ examId: string }>();
  const examId = decodeURIComponent(params?.examId ?? "");
  const router = useRouter();
  const vault = useVault();
  const exams = useExams();
  const nt = useNoteTopics();
  const focus = useFocusDay();
  const toast = useToast();
  const exam = exams.exams.find((e) => e.id === examId);
  const plan = useExamPlan(exam, vault.notes);

  const [at, setAt] = React.useState("overview");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [reading, setReading] = React.useState<string | null>(null);
  const [editingNote, setEditingNote] = React.useState<VaultNote | null>(null);
  const [drill, setDrill] = React.useState<{ notes: VaultNote[]; only?: { noteId: string; itemId: string }[] } | null>(null);
  const [editExam, setEditExam] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [todo, setTodo] = React.useState("");

  // The rail: overview, then every Q-bank's chapters in order, then the to-do list.
  const stops: Stop[] = React.useMemo(() => {
    const out: Stop[] = [{ key: "overview", kind: "overview", label: "Overview" }];
    for (const n of plan.notes) {
      const es = questionEntries([n], plan.topics);
      if (!es.length) {
        out.push({ key: `${n.id}|`, kind: "empty", label: n.title, note: n });
        continue;
      }
      for (const g of groupByChapter(es)) out.push({ key: `${n.id}|${g.chapter}`, kind: "chapter", label: g.chapter || n.title, note: n, chapter: g.chapter, entries: g.entries });
    }
    out.push({ key: "todo", kind: "todo", label: "To-do list" });
    return out;
  }, [plan.notes, plan.topics]);

  React.useEffect(() => setFilter("all"), [at]);

  if (!exam) {
    return (
      <div className="space-y-3 py-16 text-center">
        <p className="font-display text-2xl text-app-ink">{vault.ready ? "Exam not found" : "Loading…"}</p>
        <Link href="/prep" className="text-sm font-semibold text-app-accent hover:underline">Back to Exams</Link>
      </div>
    );
  }

  const idx = Math.max(0, stops.findIndex((s) => s.key === at));
  const stop = stops[idx];
  const go = (i: number) => {
    setAt(stops[Math.max(0, Math.min(stops.length - 1, i))].key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const courseTitle = examSubjects(exam).map((id) => getSubject(id)?.title ?? id).join(" · ");
  const dateLabel = exam.date ? new Date(exam.date + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : "No date set";
  const daysText = plan.phase === "nodate" ? "No date" : plan.phase === "over" ? "Finished" : plan.phase === "examday" ? "Exam today" : `${plan.left} day${plan.left === 1 ? "" : "s"} left`;
  const all = questionEntries(plan.notes, plan.topics);
  const stats = qStats(all);
  const reader = reading ? vault.notes.find((n) => n.id === reading) : undefined;
  const multiNote = plan.notes.length > 1;

  const testOn = (es: QEntry[]) => {
    const open = es.filter((e) => !e.item.done);
    const pick = open.length ? open : es;
    if (!pick.length) return;
    setDrill({ notes: plan.notes, only: pick.map((e) => ({ noteId: e.noteId, itemId: e.itemId })) });
  };
  const addToFocus = (title: string, es: QEntry[]) => {
    const open = smartOpen(es);
    if (!open.length) return;
    focus.addTask({ title, kind: "questions", subjectId: open[0].subjectId, refs: open.map((e) => ({ noteId: e.noteId, itemId: e.itemId })) });
    toast.success("Added to Focus", `${open.length} question${open.length > 1 ? "s" : ""} on today's list.`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Header: where you are and what this exam is */}
      <header className="space-y-4">
        <Link href="/prep" className="inline-flex items-center gap-1.5 text-sm font-medium text-app-ink-muted hover:text-app-ink">
          <ArrowLeft className="h-4 w-4" /> All exams
        </Link>
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-app-ink-muted">{courseTitle}</p>
            <h1 className="font-display text-[32px] font-semibold leading-tight tracking-[-0.02em] text-app-ink">{exam.name}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-app-ink-muted">
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {dateLabel}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", plan.left !== null && plan.left <= 3 && plan.phase !== "over" ? "bg-amber-500/15 text-amber-700" : "bg-[var(--accent-soft)] text-[var(--color-accent)]")}>{daysText}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => testOn(all)} disabled={!all.length}><Target className="h-4 w-4" /> Test me</Button>
            <div className="relative">
              <Button variant="outline" onClick={() => setMenu((m) => !m)} aria-label="More"><MoreHorizontal className="h-4 w-4" /></Button>
              {menu && (
                <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-app-border bg-app-surface py-1 shadow-xl" onMouseLeave={() => setMenu(false)}>
                  <button onClick={() => { setMenu(false); setEditExam(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-app-ink hover:bg-app-surface-muted"><Pencil className="h-4 w-4" /> Edit exam & chapters</button>
                  <button onClick={() => { setMenu(false); setConfirmDelete(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /> Delete exam</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Bar pct={plan.overall.pct} className="h-2 flex-1" />
          <span className="text-sm font-semibold text-app-ink tabular-nums">{plan.overall.pct}% ready</span>
        </div>
      </header>

      {confirmDelete && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
          <Trash2 className="h-4 w-4 text-red-600" />
          <span className="flex-1 text-app-ink">Delete <b>{exam.name}</b>? Your Q-banks, questions and scores stay. Only this exam&apos;s plan and to-dos go.</span>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => { exams.remove(exam.id); toast.success("Exam deleted", exam.name); router.push("/prep"); }}>Delete exam</Button>
        </div>
      )}

      {/* Phone: the plan as a dropdown */}
      <select value={stop.key} onChange={(e) => setAt(e.target.value)} className="w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm lg:hidden">
        {stops.map((s, i) => (<option key={s.key} value={s.key}>{i > 0 && i < stops.length - 1 ? `${i}. ` : ""}{s.label}</option>))}
      </select>

      <div className="grid gap-6 lg:grid-cols-[264px_1fr]">
        {/* Plan rail */}
        <aside className="hidden lg:block">
          <nav className="vc-tile sticky top-4 max-h-[calc(100vh-32px)] space-y-0.5 overflow-y-auto p-2" aria-label="Exam plan">
            {stops.map((s, i) => {
              const prev = stops[i - 1];
              const showNote = multiNote && (s.kind === "chapter" || s.kind === "empty") && (!prev || !("note" in prev) || prev.note.id !== s.note.id);
              const st = s.kind === "chapter" ? qStats(s.entries) : undefined;
              const active = s.key === stop.key;
              return (
                <React.Fragment key={s.key}>
                  {showNote && "note" in s && <p className="truncate px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-app-ink-muted">{s.note.title}</p>}
                  {s.kind === "todo" && <div className="mx-2 my-2 border-t border-app-border" />}
                  <button onClick={() => setAt(s.key)} className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors", active ? "bg-[var(--accent-soft)] font-medium text-app-ink" : "text-app-ink-muted hover:bg-app-surface-muted hover:text-app-ink")}>
                    {s.kind === "overview" ? <LayoutGrid className="h-4 w-4 shrink-0" /> : s.kind === "todo" ? <ListTodo className="h-4 w-4 shrink-0" /> : <Ring pct={st?.pct ?? 0} />}
                    <span className="min-w-0 flex-1 truncate">{s.label}</span>
                    {st && <span className="shrink-0 text-[11px] tabular-nums text-app-ink-muted">{st.mastered}/{st.total}</span>}
                    {s.kind === "empty" && <span className="shrink-0 text-[10px] text-amber-600">import</span>}
                    {s.kind === "todo" && <span className="shrink-0 text-[11px] tabular-nums text-app-ink-muted">{plan.todoProg.done}/{plan.todoProg.total}</span>}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 space-y-5">
          {stop.kind === "overview" && (
            <>
              {plan.notes.length === 0 ? (
                <Empty title="Add the Q-banks for this exam" text="Pick which courses, Q-banks and chapters this exam covers." action={<Button onClick={() => setEditExam(true)}>Choose Q-banks</Button>} />
              ) : all.length === 0 ? (
                <Empty title="Import your questions" text="Open a Q-bank on the left (marked 'import') and press Get questions. They're read straight from your file." action={<Button onClick={() => go(1)}>Go to the first Q-bank</Button>} />
              ) : null}

              {all.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Mastered" value={`${stats.mastered}/${stats.total}`} />
                  <Stat label="Tried" value={`${stats.attempted}`} />
                  <Stat label="Weak" value={`${stats.weak}`} tone={stats.weak ? "warn" : undefined} />
                  <Stat label="Not tried" value={`${stats.untried}`} />
                </div>
              )}

              {all.length > 0 && plan.phase !== "over" && (
                <section className="vc-tile space-y-3 p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-app-ink">{plan.phase === "revision" ? "Revision day" : plan.phase === "examday" ? "Exam day: last look" : "Today's share"}</h2>
                      <p className="text-sm text-app-ink-muted">
                        {plan.phase === "study"
                          ? `${plan.remaining} left over ${plan.studyDaysLeft} study day${plan.studyDaysLeft === 1 ? "" : "s"}, then ${REVISION_DAYS} revision days.`
                          : plan.phase === "nodate"
                            ? "Set the exam date and the questions get spread across the days."
                            : "No new material. Test yourself on what's left and your weak ones."}
                      </p>
                    </div>
                    <Link href="/focus" className="shrink-0 text-xs font-medium text-[var(--color-accent)]">Open Focus →</Link>
                  </div>
                  {plan.todayTasks.length > 0 && (
                    <ul className="space-y-1.5">
                      {plan.todayTasks.map((t) => {
                        const items = (t.refs ?? []).map((r) => plan.topics[r.noteId]?.find((x) => x.id === r.itemId)).filter(Boolean);
                        return (
                          <li key={t.id} className="flex items-center gap-2 rounded-control border border-app-border px-3 py-2 text-sm">
                            {t.done ? <Check className="h-4 w-4 text-emerald-600" /> : <Timer className="h-4 w-4 text-app-ink-muted" />}
                            <span className={cn("min-w-0 flex-1 truncate", t.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{t.title}</span>
                            <span className="text-xs text-app-ink-muted">{items.filter((x) => x!.done).length}/{items.length}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {plan.share.length > 0 ? (
                    <Button className="w-full" variant={plan.todayTasks.length ? "outline" : "primary"} onClick={() => { const n = plan.addShareToFocus(); if (n) toast.success("Added to Focus", `${n} question${n > 1 ? "s" : ""} for today.`); }}>
                      <Timer className="h-4 w-4" /> {plan.todayTasks.length ? `Add ${plan.share.length} more to today` : `Put today's ${plan.share.length} questions in Focus`}
                    </Button>
                  ) : (
                    <p className="text-sm text-app-ink-muted">{plan.remaining === 0 ? "Everything is mastered. Keep testing to stay sharp." : "Today's share is already in Focus."}</p>
                  )}
                </section>
              )}

              {stops.some((s) => s.kind === "chapter" || s.kind === "empty") && (
                <section className="space-y-2">
                  <h2 className="text-sm font-semibold text-app-ink">Chapters</h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {stops.map((s, i) => {
                      if (s.kind !== "chapter" && s.kind !== "empty") return null;
                      const st = s.kind === "chapter" ? qStats(s.entries) : undefined;
                      return (
                        <button key={s.key} onClick={() => go(i)} className="vc-tile group flex items-center gap-3 p-3.5 text-left transition-colors hover:border-app-accent">
                          <Ring pct={st?.pct ?? 0} size={34} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-app-ink">{s.label}</span>
                            <span className="block truncate text-xs text-app-ink-muted">
                              {st ? `${st.mastered}/${st.total} mastered${st.weak ? ` · ${st.weak} weak` : ""}` : "Questions not imported yet"}
                              {multiNote && s.kind === "chapter" ? ` · ${s.note.title}` : ""}
                            </span>
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-app-ink-muted group-hover:text-app-ink" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}

          {stop.kind === "empty" && (
            <section className="vc-tile space-y-3 p-5">
              <ChapterHead eyebrow="Q-bank" title={stop.note.title} onOpen={() => setReading(stop.note.id)} />
              <TopicChecklist note={stop.note} subjectTitle={courseTitle} showHeader={false} onDrill={() => setDrill({ notes: [stop.note] })} />
            </section>
          )}

          {stop.kind === "chapter" && (
            <ChapterView
              key={stop.key}
              stop={stop}
              filter={filter}
              setFilter={setFilter}
              onToggle={(e) => nt.toggle(e.noteId, e.itemId)}
              onRename={() => { const to = window.prompt("Chapter name", stop.label); if (to && to.trim() && to.trim() !== stop.label) { nt.renameChapter(stop.note.id, stop.chapter, to); setAt(`${stop.note.id}|${to.trim()}`); } }}
              onEdit={(e) => { const t = window.prompt("Edit question", e.item.text); if (t && t.trim()) nt.editText(e.noteId, e.itemId, t); }}
              onTest={(es) => testOn(es)}
              onFocus={(es) => addToFocus(`${exam.name} · ${stop.label}`, es)}
              onOpen={() => setReading(stop.note.id)}
              eyebrow={multiNote ? stop.note.title : `Chapter ${idx} of ${stops.length - 2}`}
            />
          )}

          {stop.kind === "todo" && (
            <section className="vc-tile space-y-3 p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="font-semibold text-app-ink">To-do list</h2>
                <span className="text-sm text-app-ink-muted">{plan.todoProg.done}/{plan.todoProg.total}</span>
              </div>
              <p className="text-sm text-app-ink-muted">Anything else for this exam: past papers, record signatures, formulas to revise.</p>
              <form onSubmit={(e) => { e.preventDefault(); if (todo.trim()) exams.addTodo(exam.id, todo); setTodo(""); }} className="flex gap-2">
                <input value={todo} onChange={(e) => setTodo(e.target.value)} placeholder="e.g. Solve the 2024 paper"
                  className="min-w-0 flex-1 rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm outline-none focus:border-app-accent" />
                <Button type="submit" disabled={!todo.trim()}><Plus className="h-4 w-4" /> Add</Button>
              </form>
              <ul className="divide-y divide-app-border">
                {(exam.todos ?? []).map((t) => (
                  <li key={t.id} className="group/row flex items-center gap-3 py-2">
                    <input type="checkbox" checked={t.done} onChange={() => exams.toggleTodo(exam.id, t.id)} className="h-4 w-4 accent-[var(--accent)]" />
                    <span className={cn("flex-1 text-sm", t.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{t.text}</span>
                    <button onClick={() => exams.removeTodo(exam.id, t.id)} aria-label="Delete to-do" className="text-app-ink-muted opacity-60 hover:text-red-600 hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                  </li>
                ))}
                {!(exam.todos ?? []).length && <li className="py-2 text-sm text-app-ink-muted">Nothing yet.</li>}
              </ul>
            </section>
          )}

          {/* Previous / next, like a study plan */}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Previous"><ChevronLeft className="h-4 w-4" /></Button>
            {idx < stops.length - 1 && (
              <button onClick={() => go(idx + 1)} className="vc-tile flex flex-1 items-center justify-between gap-3 px-4 py-2.5 text-left hover:border-app-accent">
                <span className="min-w-0">
                  <span className="block text-[11px] text-app-ink-muted">Next</span>
                  <span className="block truncate text-sm font-medium text-app-ink">{stops[idx + 1].label}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </button>
            )}
          </div>
        </main>
      </div>

      {reader && (
        <NoteReader
          note={reader}
          onClose={() => setReading(null)}
          onEdit={() => { setEditingNote(reader); setReading(null); }}
          onPractice={() => { setDrill({ notes: [reader] }); setReading(null); }}
        />
      )}
      {drill && <Drill subjectTitle={courseTitle || exam.name} notes={drill.notes} only={drill.only} onClose={() => setDrill(null)} />}
      {editExam && <ExamForm notes={vault.notes} exam={exam} onClose={() => setEditExam(false)} />}
      <NoteEditorDialog
        open={!!editingNote}
        onOpenChange={(o) => !o && setEditingNote(null)}
        courseId={exam.subjectId}
        defaultSection={editingNote?.section ?? "qbank"}
        note={editingNote}
        onSave={vault.saveNote}
        onDelete={vault.removeNote}
        onAddImage={vault.addImage}
        onAddFile={vault.addFile}
      />
    </div>
  );
}

function ChapterView({
  stop,
  filter,
  setFilter,
  onToggle,
  onEdit,
  onRename,
  onTest,
  onFocus,
  onOpen,
  eyebrow,
}: {
  stop: Extract<Stop, { kind: "chapter" }>;
  filter: Filter;
  setFilter: (f: Filter) => void;
  onToggle: (e: QEntry) => void;
  onEdit: (e: QEntry) => void;
  onRename: () => void;
  onTest: (es: QEntry[]) => void;
  onFocus: (es: QEntry[]) => void;
  onOpen: () => void;
  eyebrow: string;
}) {
  const st = qStats(stop.entries);
  const shown = stop.entries.filter((e) => (filter === "open" ? !e.item.done : filter === "weak" ? e.item.weak && !e.item.done : filter === "done" ? e.item.done : true));
  const tabs: [Filter, string, number][] = [
    ["all", "All", st.total],
    ["open", "To learn", st.total - st.mastered],
    ["weak", "Weak", st.weak],
    ["done", "Mastered", st.mastered],
  ];
  return (
    <section className="vc-tile overflow-hidden">
      <div className="space-y-4 p-5">
        <ChapterHead eyebrow={eyebrow} title={stop.label} onOpen={onOpen} />
        <button onClick={onRename} className="-mt-2 inline-flex items-center gap-1 text-xs text-app-ink-muted hover:text-app-ink"><Pencil className="h-3 w-3" /> Rename chapter</button>
        <div className="flex items-center gap-3">
          <Bar pct={st.pct} className="h-2 flex-1" />
          <span className="text-sm text-app-ink-muted tabular-nums">{st.mastered}/{st.total} mastered</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onTest(stop.entries)} disabled={!st.total}><Target className="h-4 w-4" /> {st.mastered === st.total ? "Test me again" : "Test me on this chapter"}</Button>
          <Button variant="outline" onClick={() => onFocus(stop.entries)} disabled={st.mastered === st.total}><Timer className="h-4 w-4" /> Add to today in Focus</Button>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto border-y border-app-border bg-app-surface-muted/40 px-3 py-2">
        {tabs.map(([k, label, n]) => (
          <button key={k} onClick={() => setFilter(k)} className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-medium", filter === k ? "bg-app-surface text-app-ink shadow-sm" : "text-app-ink-muted hover:text-app-ink")}>
            {label} <span className="tabular-nums opacity-70">{n}</span>
          </button>
        ))}
      </div>
      <ol className="divide-y divide-app-border">
        {shown.map((e) => (
          <li key={e.key} className="flex items-start gap-3 px-5 py-3">
            <input type="checkbox" checked={e.item.done} onChange={() => onToggle(e)} title="Mastered" className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
            <span title="Double-click to fix the wording" onDoubleClick={() => onEdit(e)} className={cn("flex-1 text-[15px] leading-snug", e.item.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{e.item.text}</span>
            <span className="flex shrink-0 items-center gap-1.5">
              {e.item.weak && !e.item.done && <span className="rounded-full bg-amber-500/15 px-1.5 text-[10px] font-semibold text-amber-700">weak</span>}
              {!!e.item.marks && <span className="rounded-full border border-app-border px-1.5 text-[10px] text-app-ink-muted">{e.item.marks}M</span>}
              <ScorePill item={e.item} />
              <button onClick={() => onTest([e])} className="rounded-full border border-app-border px-2 py-0.5 text-[11px] text-app-ink-muted hover:border-app-accent hover:text-app-ink">Test</button>
            </span>
          </li>
        ))}
        {!shown.length && <li className="px-5 py-6 text-center text-sm text-app-ink-muted">Nothing here.</li>}
      </ol>
    </section>
  );
}

function ChapterHead({ eyebrow, title, onOpen }: { eyebrow: string; title: string; onOpen: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-app-ink-muted">{eyebrow}</p>
        <h2 className="font-display text-2xl leading-tight text-app-ink">{title}</h2>
      </div>
      <button onClick={onOpen} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-app-border px-3 py-1.5 text-xs font-medium text-app-ink-muted hover:text-app-ink"><BookOpen className="h-3.5 w-3.5" /> Open file</button>
    </div>
  );
}

function Ring({ pct, size = 18 }: { pct: number; size?: number }) {
  const r = size / 2 - 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="2.5" className="stroke-app-surface-muted" stroke="currentColor" opacity=".35" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="2.5" stroke={pct >= 100 ? "#10B981" : "var(--accent)"} strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} strokeLinecap="round" />
    </svg>
  );
}

function Empty({ title, text, action }: { title: string; text: string; action: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-app-border p-6">
      <p className="font-semibold text-app-ink">{title}</p>
      <p className="text-sm text-app-ink-muted">{text}</p>
      {action}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="vc-tile px-3 py-3">
      <p className={cn("font-display text-2xl leading-none tabular-nums", tone === "warn" ? "text-amber-600" : "text-app-ink")}>{value}</p>
      <p className="mt-1.5 text-xs text-app-ink-muted">{label}</p>
    </div>
  );
}
