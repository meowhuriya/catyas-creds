"use client";

import * as React from "react";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, Clock, Target, TriangleAlert } from "lucide-react";
import { FocusDay, addDays, addTaskToDay, dayStats } from "@/lib/focus/store";
import { Exam, StudyItem, daysLeft, examSubjects, scopedTopics, todayKey } from "@/lib/notes/study";
import { QEntry, groupByChapter, questionEntries, refKey, smartOpen } from "@/lib/notes/questions";
import { getSubject } from "@/lib/notes/curriculum";
import { VaultNote } from "@/lib/notes/vault-types";
import { cn } from "@/lib/utils";

const dayLabel = (k: string, style: "short" | "long" = "short") =>
  new Date(k + "T00:00:00").toLocaleDateString(undefined, style === "long" ? { weekday: "long", day: "numeric", month: "long" } : { weekday: "short", day: "numeric", month: "short" });

/** "Today", "Tomorrow", "Yesterday" or the date. */
export function relDay(k: string): string {
  const t = todayKey();
  if (k === t) return "Today";
  if (k === addDays(t, 1)) return "Tomorrow";
  if (k === addDays(t, -1)) return "Yesterday";
  return dayLabel(k, "long");
}

const followTone = (pct: number | null) =>
  pct === null ? "bg-app-ink-muted/20" : pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500";

/* ---------------- the day picker above the to-do list ---------------- */
export function DayStrip({
  selected,
  onSelect,
  days,
  exams,
}: {
  selected: string;
  onSelect: (k: string) => void;
  days: Record<string, FocusDay>;
  exams: Exam[];
}) {
  const today = todayKey();
  const [start, setStart] = React.useState(() => addDays(today, -2));
  // keep the chosen day in view
  React.useEffect(() => {
    if (selected < start || selected > addDays(start, 9)) setStart(addDays(selected, -2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);
  const cells = Array.from({ length: 10 }, (_, i) => addDays(start, i));
  const examOn = (k: string) => exams.filter((e) => e.date === k);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <button onClick={() => setStart(addDays(start, -7))} aria-label="Earlier days" className="rounded-full p-1.5 text-app-ink-muted hover:bg-[var(--ctl-fill)] hover:text-app-ink"><ChevronLeft className="h-4 w-4" /></button>
        <div className="grid flex-1 grid-cols-5 gap-1 sm:grid-cols-10">
          {cells.map((k, i) => {
            const st = dayStats(days[k]);
            const past = k < today;
            const ex = examOn(k);
            return (
              <button
                key={k}
                onClick={() => onSelect(k)}
                title={`${dayLabel(k, "long")}: ${st.planned ? `${st.done}/${st.planned} done` : "nothing planned"}${ex.length ? ` · ${ex.map((e) => e.name).join(", ")}` : ""}`}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-center transition-colors",
                  i >= 5 && "hidden sm:flex",
                  k === selected ? "bg-app-accent text-white" : "hover:bg-[var(--ctl-fill)]",
                  k === today && k !== selected && "ring-1 ring-app-accent"
                )}
              >
                <span className={cn("text-[10px] font-semibold uppercase", k === selected ? "text-white/80" : "text-app-ink-muted")}>{new Date(k + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" })}</span>
                <span className="text-sm font-semibold tabular-nums">{Number(k.slice(8))}</span>
                {past ? (
                  <span className={cn("h-1.5 w-6 rounded-full", k === selected ? "bg-white/70" : followTone(st.followed))} />
                ) : (
                  <span className={cn("text-[10px] tabular-nums", k === selected ? "text-white/80" : "text-app-ink-muted")}>{st.planned ? `${st.planned} planned` : "·"}</span>
                )}
                {ex.length > 0 && <Target className={cn("absolute right-1 top-1 h-3 w-3", k === selected ? "text-white" : "text-red-500")} />}
              </button>
            );
          })}
        </div>
        <button onClick={() => setStart(addDays(start, 7))} aria-label="Later days" className="rounded-full p-1.5 text-app-ink-muted hover:bg-[var(--ctl-fill)] hover:text-app-ink"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-app-ink-muted">
        {selected !== today && <button onClick={() => onSelect(today)} className="rounded-full bg-[var(--ctl-fill)] px-2.5 py-1 font-medium text-app-ink">Back to today</button>}
        <label className="inline-flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" /> Go to
          <input type="date" value={selected} onChange={(e) => e.target.value && onSelect(e.target.value)} className="rounded-control border border-app-border bg-app-surface px-2 py-0.5 text-[11px] text-app-ink" />
        </label>
        <span className="ml-auto inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-emerald-500" /> followed</span>
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-amber-500" /> partly</span>
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-red-500" /> missed</span>
        </span>
      </div>
    </div>
  );
}

/* ---------------- how you followed your plan ---------------- */
export function PlanReview({ days, onOpenDay }: { days: Record<string, FocusDay>; onOpenDay: (k: string) => void }) {
  const today = todayKey();
  const past = Array.from({ length: 7 }, (_, i) => addDays(today, i - 7)); // the 7 days before today
  const next = Array.from({ length: 7 }, (_, i) => addDays(today, i + 1));
  const stats = past.map((k) => ({ k, ...dayStats(days[k]) }));
  const planned = stats.reduce((a, s) => a + s.planned, 0);
  const done = stats.reduce((a, s) => a + s.done, 0);
  const planMin = stats.reduce((a, s) => a + s.plannedMin, 0);
  const focMin = stats.reduce((a, s) => a + s.focusedMin, 0);
  const pct = planned ? Math.round((done / planned) * 100) : null;
  const daysPlanned = stats.filter((s) => s.planned).length;
  const upcoming = next.map((k) => ({ k, ...dayStats(days[k]) }));
  const emptyAhead = upcoming.filter((u) => !u.planned).length;
  const todaySt = dayStats(days[today]);

  return (
    <section className="vc-tile space-y-5 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-app-ink">How you&apos;re following your plan</h2>
        <span className="text-xs text-app-ink-muted">Last 7 days</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat big={pct === null ? "–" : `${pct}%`} label={planned ? `${done} of ${planned} planned to-dos done` : "Nothing was planned"} tone={pct === null ? undefined : pct >= 80 ? "good" : pct >= 40 ? "mid" : "bad"} />
        <Stat big={`${(focMin / 60).toFixed(1)} h`} label={planMin ? `focused, of ${(planMin / 60).toFixed(1)} h you blocked out` : "focused (add time slots to compare)"} />
        <Stat big={`${daysPlanned}/7`} label="days you made a plan for" />
      </div>

      {/* per-day bars */}
      <div className="grid grid-cols-7 gap-2">
        {stats.map((s) => (
          <button key={s.k} onClick={() => onOpenDay(s.k)} className="group space-y-1 text-center" title={`${dayLabel(s.k)}: ${s.planned ? `${s.done}/${s.planned} done` : "no plan"} · ${s.focusedMin} min focused`}>
            <div className="relative mx-auto flex h-20 w-full max-w-[44px] items-end overflow-hidden rounded-lg bg-[var(--ctl-fill)]">
              <div className={cn("w-full transition-all", followTone(s.followed))} style={{ height: `${s.followed ?? 0}%` }} />
            </div>
            <p className="text-[10px] font-semibold uppercase text-app-ink-muted group-hover:text-app-ink">{new Date(s.k + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" })}</p>
            <p className="text-[10px] tabular-nums text-app-ink-muted">{s.planned ? `${s.done}/${s.planned}` : "–"}</p>
          </button>
        ))}
      </div>

      <div className="space-y-2 rounded-2xl bg-[var(--ctl-fill)] p-3 text-sm">
        <p className="font-medium text-app-ink">
          Today: {todaySt.planned ? `${todaySt.done} of ${todaySt.planned} done` : "no plan yet"}
          {todaySt.plannedMin ? ` · ${(todaySt.plannedMin / 60).toFixed(1)} h blocked out` : ""}
        </p>
        <p className="text-xs text-app-ink-muted">
          Next 7 days: {upcoming.reduce((a, u) => a + u.planned, 0)} to-dos planned
          {emptyAhead ? ` · ${emptyAhead} day${emptyAhead === 1 ? " has" : "s have"} nothing planned yet` : " · every day has a plan"}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {upcoming.map((u) => (
            <button key={u.k} onClick={() => onOpenDay(u.k)} className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium", u.planned ? "bg-app-surface text-app-ink" : "border border-dashed border-app-ink-muted/40 text-app-ink-muted")}>
              {new Date(u.k + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric" })} · {u.planned || "plan"}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ big, label, tone }: { big: string; label: string; tone?: "good" | "mid" | "bad" }) {
  return (
    <div className="rounded-2xl bg-[var(--ctl-fill)] p-3">
      <p className={cn("font-display text-3xl leading-none tabular-nums", tone === "good" ? "text-emerald-600" : tone === "mid" ? "text-amber-600" : tone === "bad" ? "text-red-600" : "text-app-ink")}>{big}</p>
      <p className="mt-1.5 text-xs text-app-ink-muted">{label}</p>
    </div>
  );
}

/* ---------------- will you cover everything before the exam? ---------------- */
type ChapterRow = {
  key: string;
  noteId: string;
  chapter: string;
  label: string;
  subjectId: string;
  total: number;
  mastered: number;
  open: QEntry[];
  plannedOpen: number;
  firstDay?: string;
  status: "mastered" | "planned" | "partly" | "unplanned";
};

export function examCoverage(exam: Exam, notes: VaultNote[], topics: Record<string, StudyItem[]>, days: Record<string, FocusDay>) {
  const today = todayKey();
  const examNotes = exam.noteIds.map((id) => notes.find((n) => n.id === id)).filter(Boolean) as VaultNote[];
  const entries = questionEntries(examNotes, scopedTopics(exam, topics));
  // every open to-do between today and the day before the exam
  const lastDay = exam.date ? addDays(exam.date, -1) : addDays(today, 60);
  const planned = new Map<string, string>(); // question key -> first day planned
  const titles: { day: string; text: string; subjectId?: string }[] = [];
  const late: { day: string; title: string }[] = [];
  const examKeys = new Set(entries.map((e) => e.key));
  for (const [k, d] of Object.entries(days)) {
    for (const t of d.tasks) {
      if (t.done) continue;
      const keys = (t.refs ?? []).map(refKey);
      if (k >= today && k <= lastDay) {
        for (const q of keys) if (!planned.has(q) || planned.get(q)! > k) planned.set(q, k);
        titles.push({ day: k, text: t.title.toLowerCase(), subjectId: t.subjectId });
      } else if (exam.date && k >= exam.date && keys.some((q) => examKeys.has(q))) late.push({ day: k, title: t.title });
    }
  }
  const byNote = new Map<string, QEntry[]>();
  for (const e of entries) byNote.set(e.noteId, [...(byNote.get(e.noteId) ?? []), e]);
  const rows: ChapterRow[] = [];
  byNote.forEach((es, noteId) => {
    for (const g of groupByChapter(es)) {
      const open = g.entries.filter((e) => !e.item.done);
      const label = g.chapter || es[0].noteTitle;
      // a hand-written to-do that names the chapter ("Unit 3 revision") also counts as planning it
      const sid = es[0].subjectId;
      const code = (getSubject(sid)?.code ?? "").toLowerCase();
      const head = g.chapter.toLowerCase().split(":")[0].trim();
      const sameCourse = (t: { text: string; subjectId?: string }) => t.subjectId === sid || (!!code && t.text.includes(code));
      const names = (t: { text: string }) => t.text.includes(g.chapter.toLowerCase()) || new RegExp(`\\b${head.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(t.text);
      const byTitle = g.chapter ? titles.filter((t) => sameCourse(t) && names(t)) : [];
      const plannedOpen = byTitle.length ? open.length : open.filter((e) => planned.has(e.key)).length;
      const firstDay = [...open.map((e) => planned.get(e.key)).filter(Boolean), ...byTitle.map((t) => t.day)].sort()[0] as string | undefined;
      rows.push({
        key: `${noteId}|${g.chapter}`,
        noteId,
        chapter: g.chapter,
        label,
        subjectId: es[0].subjectId,
        total: g.entries.length,
        mastered: g.entries.length - open.length,
        open,
        plannedOpen,
        firstDay,
        status: open.length === 0 ? "mastered" : plannedOpen >= open.length ? "planned" : plannedOpen > 0 ? "partly" : "unplanned",
      });
    }
  });
  const total = entries.length;
  const mastered = rows.reduce((a, r) => a + r.mastered, 0);
  const plannedQ = rows.reduce((a, r) => a + Math.min(r.plannedOpen, r.open.length), 0);
  const unplannedQ = total - mastered - plannedQ;
  const left = daysLeft(exam.date);
  const studyDays = left === null ? null : Math.max(0, left);
  return { rows, total, mastered, plannedQ, unplannedQ, late, studyDays };
}

export function ExamCoverage({
  exams,
  notes,
  topics,
  days,
}: {
  exams: Exam[];
  notes: VaultNote[];
  topics: Record<string, StudyItem[]>;
  days: Record<string, FocusDay>;
}) {
  const today = todayKey();
  const upcoming = exams.filter((e) => (daysLeft(e.date) ?? 1) >= 0).sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));
  const [open, setOpen] = React.useState<string | null>(upcoming[0]?.id ?? null);
  const [target, setTarget] = React.useState<Record<string, string>>({});
  const [msg, setMsg] = React.useState("");

  if (!upcoming.length)
    return (
      <section className="vc-tile space-y-1 p-5">
        <h2 className="text-sm font-semibold text-app-ink">Exam coverage</h2>
        <p className="text-sm text-app-ink-muted">Add an exam (with its date and Q-banks) and this shows whether your plan covers everything before it.</p>
      </section>
    );

  return (
    <section className="vc-tile space-y-4 p-5">
      <div>
        <h2 className="text-sm font-semibold text-app-ink">Will you cover everything before your exams?</h2>
        <p className="text-xs text-app-ink-muted">Counts what&apos;s mastered, what&apos;s planned on a day before the exam, and what isn&apos;t planned at all.</p>
      </div>
      {msg && <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-700">{msg}</p>}

      {upcoming.map((ex) => {
        const c = examCoverage(ex, notes, topics, days);
        const pM = c.total ? (c.mastered / c.total) * 100 : 0;
        const pP = c.total ? (c.plannedQ / c.total) * 100 : 0;
        const covered = c.total ? Math.round(((c.mastered + c.plannedQ) / c.total) * 100) : 0;
        const isOpen = open === ex.id;
        const gaps = c.rows.filter((r) => r.status === "unplanned" || r.status === "partly");
        const perDay = c.studyDays ? Math.ceil(c.unplannedQ / Math.max(1, c.studyDays)) : null;
        const verdict =
          c.total === 0
            ? "No questions imported for this exam yet."
            : c.unplannedQ === 0
              ? "Everything is mastered or planned before the exam."
              : c.studyDays === null
                ? `${c.unplannedQ} questions aren't planned yet. Add the exam date to check your timing.`
                : c.studyDays === 0
                  ? `Exam is today: ${c.unplannedQ} questions were never planned.`
                  : `${c.unplannedQ} question${c.unplannedQ === 1 ? "" : "s"} in ${gaps.length} chapter${gaps.length === 1 ? "" : "s"} aren't planned yet. That's about ${perDay} a day for the ${c.studyDays} day${c.studyDays === 1 ? "" : "s"} left.`;
        const choices = Array.from({ length: Math.max(1, c.studyDays ?? 14) }, (_, i) => addDays(today, i));
        // the lightest day before the exam is the default suggestion
        const lightest = [...choices].sort((a, b) => dayStats(days[a]).planned - dayStats(days[b]).planned || a.localeCompare(b))[0];

        return (
          <article key={ex.id} className="overflow-hidden rounded-2xl bg-[var(--ctl-fill)]">
            <button onClick={() => setOpen(isOpen ? null : ex.id)} className="w-full space-y-2 p-4 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-app-ink-muted">{examSubjects(ex).map((id) => getSubject(id)?.title ?? id).join(" · ")}</p>
                  <p className="font-semibold text-app-ink">{ex.name}</p>
                  <p className="text-xs text-app-ink-muted">{ex.date ? `${dayLabel(ex.date, "long")} · ${c.studyDays === 0 ? "today" : `${c.studyDays} day${c.studyDays === 1 ? "" : "s"} left`}` : "No date set"}</p>
                </div>
                <span className={cn("shrink-0 font-display text-3xl tabular-nums", covered >= 100 ? "text-emerald-600" : covered >= 60 ? "text-amber-600" : "text-red-600")}>{covered}%</span>
              </div>
              <div className="flex h-2.5 overflow-hidden rounded-full bg-app-surface">
                <div className="bg-emerald-500" style={{ width: `${pM}%` }} />
                <div className="bg-sky-400" style={{ width: `${pP}%` }} />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-app-ink-muted">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {c.mastered} mastered</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400" /> {c.plannedQ} planned</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-app-surface ring-1 ring-app-ink-muted/30" /> {c.unplannedQ} not planned</span>
              </div>
              <p className={cn("text-sm", c.unplannedQ === 0 && c.total ? "text-emerald-700" : "text-app-ink")}>{verdict}</p>
              {c.late.length > 0 && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <TriangleAlert className="h-3.5 w-3.5" /> {c.late.length} to-do{c.late.length === 1 ? " is" : "s are"} planned on or after the exam day.
                </p>
              )}
            </button>

            {isOpen && c.rows.length > 0 && (
              <ul className="divide-y divide-app-border border-t border-app-border bg-app-surface">
                {c.rows.map((r) => (
                  <li key={r.key} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
                    {r.status === "mastered" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : r.status === "planned" ? (
                      <Clock className="h-4 w-4 shrink-0 text-sky-500" />
                    ) : (
                      <CircleDashed className={cn("h-4 w-4 shrink-0", r.status === "partly" ? "text-amber-500" : "text-red-500")} />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-app-ink">{r.label}</span>
                      <span className="block text-[11px] text-app-ink-muted">
                        {r.mastered}/{r.total} mastered
                        {r.status === "planned" && r.firstDay ? ` · planned from ${relDay(r.firstDay)}` : ""}
                        {r.status === "partly" ? ` · ${r.plannedOpen} of ${r.open.length} left are planned` : ""}
                        {r.status === "unplanned" ? ` · ${r.open.length} not planned` : ""}
                      </span>
                    </span>
                    {(r.status === "unplanned" || r.status === "partly") && (
                      <span className="flex items-center gap-1.5">
                        <select
                          value={target[r.key] ?? lightest}
                          onChange={(e) => setTarget((t) => ({ ...t, [r.key]: e.target.value }))}
                          aria-label={`Day to plan ${r.label}`}
                          className="rounded-control border border-app-border bg-app-surface px-2 py-1 text-xs"
                        >
                          {choices.map((k) => (
                            <option key={k} value={k}>{relDay(k)} ({dayStats(days[k]).planned})</option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            const day = target[r.key] ?? lightest;
                            const pick = smartOpen(r.open);
                            addTaskToDay(day, {
                              title: `${getSubject(r.subjectId)?.code ?? ""} · ${r.label}`.replace(/^ · /, ""),
                              kind: "questions",
                              subjectId: r.subjectId,
                              chapter: r.chapter || undefined,
                              refs: pick.map((e) => ({ noteId: e.noteId, itemId: e.itemId })),
                            });
                            setMsg(`Planned ${r.label} (${pick.length} question${pick.length === 1 ? "" : "s"}) for ${relDay(day)}.`);
                          }}
                          className="rounded-full bg-app-accent px-3 py-1 text-xs font-semibold text-white"
                        >
                          Plan it
                        </button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </article>
        );
      })}
    </section>
  );
}

