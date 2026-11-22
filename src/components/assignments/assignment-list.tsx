"use client";

import * as React from "react";
import {
  CalendarDays,
  ChevronDown,
  ExternalLink,
  FileText,
  Link2,
  Paperclip,
  Pencil,
  Plus,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { NoteEditorDialog } from "@/components/notes/note-editor-dialog";
import { NoteReader } from "@/components/notes/note-reader";
import { Bar } from "@/components/notes/exam-panel";
import { useVault } from "@/lib/notes/use-vault";
import { SUBJECTS, getSubject, subjectsFor } from "@/lib/notes/curriculum";
import { VaultNote, VaultSection } from "@/lib/notes/vault-types";
import { daysLeft } from "@/lib/notes/study";
import { useFocusDay } from "@/lib/focus/store";
import {
  Assignment,
  AssignmentKind,
  AssignmentStatus,
  Bucket,
  KIND_LABEL,
  STATUS_LABEL,
  bucketOf,
  makeParts,
  partsProgress,
  useAssignments,
} from "@/lib/assignments/store";
import { cn } from "@/lib/utils";

type Vault = ReturnType<typeof useVault>;

const BUCKETS: { key: Bucket; label: string; tone: string }[] = [
  { key: "overdue", label: "Overdue", tone: "text-red-600" },
  { key: "week", label: "Due this week", tone: "text-app-accent" },
  { key: "later", label: "Later", tone: "text-app-ink-muted" },
  { key: "nodate", label: "No date yet", tone: "text-app-ink-muted" },
  { key: "done", label: "Submitted", tone: "text-app-ink-muted" },
];

function dueLabel(a: Assignment): string {
  if (a.status === "submitted") return a.submittedAt ? `Submitted ${new Date(a.submittedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}` : "Submitted";
  const d = daysLeft(a.due);
  if (d === null) return "No due date";
  if (d < 0) return `${-d} day${d === -1 ? "" : "s"} overdue`;
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `Due in ${d} days`;
}

/* ---------------- form ---------------- */
function AssignmentForm({
  subjectId,
  vaultSubjects,
  assignment,
  onClose,
}: {
  subjectId?: string;
  vaultSubjects: string[];
  assignment?: Assignment;
  onClose: () => void;
}) {
  const { save } = useAssignments();
  const [subj, setSubj] = React.useState(assignment?.subjectId ?? subjectId ?? "");
  const [title, setTitle] = React.useState(assignment?.title ?? "");
  const [kind, setKind] = React.useState<AssignmentKind>(assignment?.kind ?? "written");
  const [due, setDue] = React.useState(assignment?.due ?? "");
  const [how, setHow] = React.useState(assignment?.how ?? "");
  const [parts, setParts] = React.useState("");
  const choices = React.useMemo(() => {
    const ids = new Set<string>([...subjectsFor(1, 1), ...subjectsFor(1, 2)].map((s) => s.id));
    vaultSubjects.forEach((id) => ids.add(id));
    return SUBJECTS.filter((s) => ids.has(s.id));
  }, [vaultSubjects]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !subj) return;
          save({
            ...(assignment ?? {}),
            id: assignment?.id,
            subjectId: subj,
            title: title.trim(),
            kind,
            due,
            how: how.trim() || undefined,
            parts: [...(assignment?.parts ?? []), ...makeParts(parts.split(/\n+/))],
          });
          onClose();
        }}
        className="flex max-h-[90vh] w-full max-w-md flex-col gap-3 overflow-y-auto rounded-2xl border border-app-border bg-app-surface p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-app-ink">{assignment ? "Edit assignment" : "New assignment"}</h3>
          <button type="button" onClick={onClose} aria-label="Close"><X className="h-4 w-4 text-app-ink-muted" /></button>
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="e.g. Assignment 2: Cayley-Hamilton"
          className="w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm outline-none focus:border-app-accent" />
        {!subjectId && (
          <select value={subj} onChange={(e) => setSubj(e.target.value)} className="w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm">
            <option value="">Choose course…</option>
            {choices.map((s) => (<option key={s.id} value={s.id}>{s.title}</option>))}
          </select>
        )}
        <div className="flex gap-1.5">
          {(Object.keys(KIND_LABEL) as AssignmentKind[]).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)}
              className={cn("flex-1 rounded-control border px-2 py-1.5 text-xs", kind === k ? "border-app-accent bg-app-accent text-white" : "border-app-border text-app-ink-muted hover:text-app-ink")}>
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-app-ink-muted">
          <CalendarDays className="h-3.5 w-3.5" /> Due date
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-control border border-app-border bg-app-surface px-2 py-1 text-xs text-app-ink" />
        </label>
        <textarea value={parts} onChange={(e) => setParts(e.target.value)} rows={4}
          placeholder={kind === "slides" ? "Slides or sections to make, one per line (optional)" : "Questions to write, one per line. Paste the whole list (optional)"}
          className="w-full resize-y rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm outline-none focus:border-app-accent" />
        <input value={how} onChange={(e) => setHow(e.target.value)} placeholder="How to hand it in (e.g. mail to ma'am, hand-written on Monday)"
          className="w-full rounded-control border border-app-border bg-app-surface px-3 py-2 text-sm outline-none focus:border-app-accent" />
        <Button type="submit" disabled={!title.trim() || !subj}>{assignment ? "Save" : "Add assignment"}</Button>
      </form>
    </div>
  );
}

/* ---------------- card ---------------- */
function AssignmentCard({
  a,
  showCourse,
  vault,
  onEdit,
  onAttach,
  onOpenNote,
}: {
  a: Assignment;
  showCourse: boolean;
  vault: Vault;
  onEdit: () => void;
  onAttach: (slot: "briefNoteId" | "workNoteId") => void;
  onOpenNote: (n: VaultNote) => void;
}) {
  const store = useAssignments();
  const focus = useFocusDay();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [part, setPart] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [confirmDel, setConfirmDel] = React.useState(false);
  const p = partsProgress(a);
  const d = daysLeft(a.due);
  const subject = getSubject(a.subjectId);
  const brief = a.briefNoteId ? vault.notes.find((n) => n.id === a.briefNoteId) : undefined;
  const work = a.workNoteId ? vault.notes.find((n) => n.id === a.workNoteId) : undefined;
  const late = a.status !== "submitted" && d !== null && d < 0;

  return (
    <article className="vc-tile overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-start gap-3 p-4 text-left">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] text-app-ink-muted">
            <span className="rounded-full border border-app-border px-1.5 py-px">{KIND_LABEL[a.kind]}</span>
            {showCourse && <span className="truncate">{subject?.title ?? a.subjectId}</span>}
          </div>
          <p className={cn("font-medium text-app-ink", a.status === "submitted" && "text-app-ink-muted line-through")}>{a.title}</p>
          <div className="flex items-center gap-3 text-xs">
            <span className={cn("font-semibold", late ? "text-red-600" : d !== null && d <= 2 && a.status !== "submitted" ? "text-app-accent" : "text-app-ink-muted")}>{dueLabel(a)}</span>
            {a.due && a.status !== "submitted" && <span className="text-app-ink-muted">{new Date(a.due + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</span>}
            <span className="text-app-ink-muted">{STATUS_LABEL[a.status]}</span>
            {p.total > 0 && <span className="ml-auto text-app-ink-muted">{p.done}/{p.total} done</span>}
          </div>
          {p.total > 0 && <Bar pct={p.pct} className="h-1" />}
        </div>
        <ChevronDown className={cn("mt-1 h-4 w-4 shrink-0 text-app-ink-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-app-border p-4">
          {/* parts */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-app-ink">{a.kind === "slides" ? "Slides / sections to make" : "What to write"}</p>
            <ul className="space-y-0.5">
              {a.parts.map((x) => (
                <li key={x.id} className="group/row flex items-start gap-2 rounded px-1 py-1 hover:bg-app-surface-muted">
                  <input type="checkbox" checked={x.done} onChange={() => store.togglePart(a.id, x.id)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]" />
                  <span className={cn("flex-1 text-sm leading-snug", x.done ? "text-app-ink-muted line-through" : "text-app-ink")}>{x.text}</span>
                  <button onClick={() => store.removePart(a.id, x.id)} aria-label="Remove" className="shrink-0 opacity-0 group-hover/row:opacity-100 focus:opacity-100"><Trash2 className="h-3.5 w-3.5 text-app-ink-muted" /></button>
                </li>
              ))}
            </ul>
            <form onSubmit={(e) => { e.preventDefault(); if (part.trim()) store.addParts(a.id, part.split(/\n+/)); setPart(""); }} className="flex gap-1.5">
              <input value={part} onChange={(e) => setPart(e.target.value)}
                onPaste={(e) => { const t = e.clipboardData.getData("text"); if (t.includes("\n")) { e.preventDefault(); store.addParts(a.id, t.split(/\n+/)); } }}
                placeholder="Add one, or paste the whole list" className="min-w-0 flex-1 rounded-control border border-app-border bg-app-surface px-2.5 py-1.5 text-sm outline-none focus:border-app-accent" />
              <button type="submit" aria-label="Add" className="rounded-control border border-app-border px-2.5 text-app-ink-muted hover:text-app-ink"><Plus className="h-4 w-4" /></button>
            </form>
          </div>

          {/* files */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-control border border-app-border p-2.5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-app-ink-muted">What the teacher sent</p>
              {brief ? (
                <div className="flex items-center gap-2 text-sm">
                  <button onClick={() => onOpenNote(brief)} className="inline-flex min-w-0 items-center gap-1.5 font-medium text-app-ink hover:underline"><FileText className="h-4 w-4 shrink-0" /><span className="truncate">{brief.title}</span></button>
                  <button onClick={() => onAttach("briefNoteId")} className="ml-auto shrink-0 text-[11px] text-app-ink-muted hover:text-app-ink">Change</button>
                </div>
              ) : (
                <button onClick={() => onAttach("briefNoteId")} className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)]"><Paperclip className="h-3.5 w-3.5" /> Add the PPT / PDF / photo</button>
              )}
            </div>
            <div className="rounded-control border border-app-border p-2.5">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-app-ink-muted">My work</p>
              {work ? (
                <div className="flex items-center gap-2 text-sm">
                  <button onClick={() => onOpenNote(work)} className="inline-flex min-w-0 items-center gap-1.5 font-medium text-app-ink hover:underline"><FileText className="h-4 w-4 shrink-0" /><span className="truncate">{work.title}</span></button>
                  <button onClick={() => onAttach("workNoteId")} className="ml-auto shrink-0 text-[11px] text-app-ink-muted hover:text-app-ink">Change</button>
                </div>
              ) : (
                <button onClick={() => onAttach("workNoteId")} className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-accent)]"><Paperclip className="h-3.5 w-3.5" /> Add my slides / photos of my answers</button>
              )}
            </div>
          </div>

          {/* links */}
          <div className="space-y-1.5">
            {a.links.map((l) => (
              <div key={l.id} className="group/row flex items-center gap-2 text-sm">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-app-ink-muted" />
                <a href={l.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-app-ink hover:underline">{l.label}</a>
                <ExternalLink className="h-3 w-3 shrink-0 text-app-ink-muted" />
                <button onClick={() => store.removeLink(a.id, l.id)} aria-label="Remove link" className="shrink-0 opacity-0 group-hover/row:opacity-100 focus:opacity-100"><Trash2 className="h-3.5 w-3.5 text-app-ink-muted" /></button>
              </div>
            ))}
            <form onSubmit={(e) => { e.preventDefault(); if (url.trim()) store.addLink(a.id, /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`, label.trim()); setUrl(""); setLabel(""); }} className="flex flex-wrap gap-1.5">
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Paste a link (Drive, Classroom, Docs…)" className="min-w-0 flex-[2] rounded-control border border-app-border bg-app-surface px-2.5 py-1.5 text-sm outline-none focus:border-app-accent" />
              <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name (optional)" className="min-w-0 flex-1 rounded-control border border-app-border bg-app-surface px-2.5 py-1.5 text-sm outline-none focus:border-app-accent" />
              <button type="submit" aria-label="Add link" className="rounded-control border border-app-border px-2.5 text-app-ink-muted hover:text-app-ink"><Plus className="h-4 w-4" /></button>
            </form>
          </div>

          {/* hand-in + notes */}
          <input defaultValue={a.how ?? ""} onBlur={(e) => store.patch(a.id, { how: e.target.value.trim() || undefined })} placeholder="How to hand it in (mail, hand-written on Monday…)"
            className="w-full rounded-control border border-app-border bg-app-surface px-2.5 py-1.5 text-sm outline-none focus:border-app-accent" />
          <textarea defaultValue={a.notes ?? ""} onBlur={(e) => store.patch(a.id, { notes: e.target.value.trim() || undefined })} rows={2} placeholder="Notes: what the teacher said, format, page limit…"
            className="w-full resize-y rounded-control border border-app-border bg-app-surface px-2.5 py-1.5 text-sm outline-none focus:border-app-accent" />

          {/* actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-control border border-app-border text-xs">
              {(["todo", "doing", "submitted"] as AssignmentStatus[]).map((s) => (
                <button key={s} onClick={() => store.setStatus(a.id, s)} className={cn("px-2.5 py-1.5", a.status === s ? "bg-app-accent text-white" : "text-app-ink-muted hover:text-app-ink")}>{STATUS_LABEL[s]}</button>
              ))}
            </div>
            {a.status !== "submitted" && (
              <Button size="sm" variant="ghost" onClick={() => { focus.addTask({ title: `${subject?.code ?? ""} · ${a.title}`.replace(/^ · /, ""), kind: "custom", subjectId: a.subjectId }); toast.success("Added to today's Focus", a.title); }}>
                <Timer className="h-4 w-4" /> Focus on it today
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onEdit}><Pencil className="h-4 w-4" /> Edit</Button>
            {confirmDel ? (
              <span className="ml-auto inline-flex items-center gap-2 text-xs">
                Delete this assignment?
                <Button size="sm" onClick={() => store.remove(a.id)}>Delete</Button>
                <button onClick={() => setConfirmDel(false)} className="text-app-ink-muted">Cancel</button>
              </span>
            ) : (
              <button onClick={() => setConfirmDel(true)} className="ml-auto text-xs text-app-ink-muted hover:text-red-600">Delete</button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

/* ---------------- list (page and course tab) ---------------- */
export function AssignmentList({ vault, subjectId }: { vault: Vault; subjectId?: string }) {
  const { assignments } = useAssignments();
  const [form, setForm] = React.useState<{ a?: Assignment } | null>(null);
  const [filter, setFilter] = React.useState("");
  const [showDone, setShowDone] = React.useState(false);
  const [attach, setAttach] = React.useState<{ a: Assignment; slot: "briefNoteId" | "workNoteId" } | null>(null);
  const [reading, setReading] = React.useState<VaultNote | null>(null);
  const store = useAssignments();

  const mine = assignments.filter((a) => (subjectId ? a.subjectId === subjectId : !filter || a.subjectId === filter));
  const courses = Array.from(new Set(assignments.map((a) => a.subjectId)));
  const vaultSubjects = Array.from(new Set(vault.notes.map((n) => n.courseId)));
  const byDue = (x: Assignment, y: Assignment) => (x.due || "9999").localeCompare(y.due || "9999");
  const open = mine.filter((a) => a.status !== "submitted").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-app-ink-muted">{mine.length === 0 ? "Nothing yet." : `${open} to do · ${mine.length - open} submitted`}</p>
        {!subjectId && courses.length > 1 && (
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-control border border-app-border bg-app-surface px-2 py-1 text-xs">
            <option value="">All courses</option>
            {courses.map((id) => (<option key={id} value={id}>{getSubject(id)?.title ?? id}</option>))}
          </select>
        )}
        <Button size="sm" className="ml-auto" onClick={() => setForm({})}><Plus className="h-4 w-4" /> New assignment</Button>
      </div>

      {mine.length === 0 && (
        <div className="space-y-2 rounded-card border border-dashed border-app-border px-6 py-12 text-center">
          <p className="font-display text-xl text-app-ink">No assignments yet</p>
          <p className="mx-auto max-w-sm text-sm text-app-ink-muted">When a teacher gives you a PPT or a few questions to write, add it here with the due date. Tick off each part as you finish it.</p>
          <Button onClick={() => setForm({})}><Plus className="h-4 w-4" /> Add the first one</Button>
        </div>
      )}

      {BUCKETS.map((b) => {
        const list = mine.filter((a) => bucketOf(a) === b.key).sort(byDue);
        if (!list.length) return null;
        const collapsed = b.key === "done" && !showDone;
        return (
          <section key={b.key} className="space-y-2">
            {b.key === "done" ? (
              <button onClick={() => setShowDone((s) => !s)} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-app-ink-muted">
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", collapsed && "-rotate-90")} /> {b.label} ({list.length})
              </button>
            ) : (
              <p className={cn("text-xs font-semibold uppercase tracking-wide", b.tone)}>{b.label} ({list.length})</p>
            )}
            {!collapsed && (
              <div className="space-y-2">
                {list.map((a) => (
                  <AssignmentCard key={a.id} a={a} showCourse={!subjectId} vault={vault} onEdit={() => setForm({ a })} onAttach={(slot) => setAttach({ a, slot })} onOpenNote={setReading} />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {form && <AssignmentForm subjectId={subjectId} vaultSubjects={vaultSubjects} assignment={form.a} onClose={() => setForm(null)} />}

      {attach && (
        <NoteEditorDialog
          open
          onOpenChange={(o) => !o && setAttach(null)}
          courseId={attach.a.subjectId}
          defaultSection={(attach.slot === "briefNoteId" ? "assignment" : "submission") as VaultSection}
          note={(attach.a[attach.slot] ? vault.notes.find((n) => n.id === attach.a[attach.slot]) : undefined) ?? null}
          onSave={async (input) => {
            const saved = await vault.saveNote({ ...input, title: input.title === "Untitled note" ? `${attach.a.title}${attach.slot === "workNoteId" ? " (my work)" : ""}` : input.title });
            store.patch(attach.a.id, { [attach.slot]: saved.id });
            return saved;
          }}
          onDelete={async (id) => {
            await vault.removeNote(id);
            store.patch(attach.a.id, { [attach.slot]: undefined });
          }}
          onAddImage={vault.addImage}
          onAddFile={vault.addFile}
        />
      )}
      {reading && <NoteReader note={reading} onClose={() => setReading(null)} onEdit={() => { const n = reading; setReading(null); const a = assignments.find((x) => x.briefNoteId === n.id || x.workNoteId === n.id); if (a) setAttach({ a, slot: a.briefNoteId === n.id ? "briefNoteId" : "workNoteId" }); }} onPractice={() => setReading(null)} />}
    </div>
  );
}
