"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, FileQuestion, Plus, Target, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExamCard, ExamForm } from "@/components/notes/exam-panel";
import { daysLeft, useExams } from "@/lib/notes/study";
import { useVault } from "@/lib/notes/use-vault";

export default function ExamPrepHub() {
  const { notes, ready } = useVault();
  const { exams } = useExams();
  const [form, setForm] = React.useState(false);
  const sorted = [...exams].sort((a, b) => (a.date || "9").localeCompare(b.date || "9"));
  const upcoming = sorted.filter((e) => (daysLeft(e.date) ?? 1) >= 0);
  const past = sorted.filter((e) => (daysLeft(e.date) ?? 1) < 0).reverse();
  const qbanks = notes.filter((n) => n.section === "qbank").length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="pro-hero relative isolate flex flex-col gap-5 overflow-hidden rounded-3xl px-7 py-8 sm:flex-row sm:items-end sm:justify-between md:px-10">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 -z-10 h-[380px] w-[380px] rounded-full bg-[radial-gradient(closest-side,var(--orb-a),transparent)] blur-2xl" />
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-[var(--color-ink-muted)]">Exam Prep</p>
          <h1 className="font-display text-[34px] font-semibold leading-tight tracking-[-0.025em] text-[var(--color-ink)] md:text-[40px]">
            Master your <span className="pro-name-gradient">Q-banks</span>
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-muted)]">
            Pick an exam, tag its Q-banks, and get tested on the real questions every day until you know them.
          </p>
        </div>
        <Button size="lg" onClick={() => setForm(true)} disabled={!ready || notes.length === 0}>
          <Plus className="h-4 w-4" /> New exam
        </Button>
      </header>

      {upcoming.length === 0 && (
        <section className="grid gap-3 sm:grid-cols-3">
          <Step n={1} icon={Upload} title="Upload your Q-bank" done={qbanks > 0}>
            In <Link href="/notes" className="font-semibold text-[var(--color-accent)]">Notes Vault</Link>, open the subject, go to <b>Question Banks</b> and add the file (PDF, Word, PPT, photos or a Drive link).
          </Step>
          <Step n={2} icon={FileQuestion} title="Create the exam" done={exams.length > 0}>
            Press <b>New exam</b>, set the date and tick the Q-banks and notes it covers.
          </Step>
          <Step n={3} icon={Target} title="Import & get tested">
            Import every question, then follow the daily plan and press <b>Test me</b>. Long answers: write on paper and snap a photo.
          </Step>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-app-ink">Upcoming</h2>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {upcoming.map((e) => (
              <ExamCard key={e.id} exam={e} allNotes={notes} showSubject />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-semibold text-app-ink-muted">
            Past exams ({past.length}) <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {past.map((e) => (
              <ExamCard key={e.id} exam={e} allNotes={notes} showSubject />
            ))}
          </div>
        </details>
      )}

      {form && <ExamForm notes={notes} onClose={() => setForm(false)} />}
    </div>
  );
}

function Step({ n, icon: Icon, title, done, children }: { n: number; icon: React.ElementType; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <div className="vc-tile space-y-2 p-5">
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${done ? "bg-emerald-500/15 text-emerald-600" : "bg-[var(--accent-soft)] text-[var(--color-accent)]"}`}>{done ? "✓" : n}</span>
        <Icon className="h-4 w-4 text-app-ink-muted" />
      </div>
      <p className="font-semibold text-app-ink">{title}</p>
      <p className="text-sm text-app-ink-muted">{children}</p>
    </div>
  );
}
