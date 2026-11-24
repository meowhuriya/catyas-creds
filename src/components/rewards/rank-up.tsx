"use client";

/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import { createPortal } from "react-dom";
import { Badge, chapterTiers, readBadges, tierRank, writeBadges, useBadges } from "@/lib/rewards/badges";
import { badgeSrc, tierById } from "@/lib/rewards/catalog";
import { examSubjects, scopedTopics, useExams, useNoteTopics } from "@/lib/notes/study";
import { useVault } from "@/lib/notes/use-vault";
import { getSubject } from "@/lib/notes/curriculum";
import { SoundEngine } from "@/lib/sound-engine";
import { cn } from "@/lib/utils";

/* ---------------- the rank-up screen ---------------- */
export function RankUpOverlay({ badge, more, onClose }: { badge: Badge; more: number; onClose: () => void }) {
  const t = tierById(badge.tier);
  React.useEffect(() => {
    SoundEngine.getInstance().playRankUp();
    const id = window.setTimeout(onClose, 5200);
    const k = (e: KeyboardEvent) => (e.key === "Escape" || e.key === "Enter") && onClose();
    window.addEventListener("keydown", k);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", k);
    };
  }, [badge.key, onClose]);
  const what = badge.kind === "exam" ? "Exam ready" : badge.kind === "qbank" ? "Q-bank conquered" : "Chapter rank up";
  const course = badge.courseId ? getSubject(badge.courseId)?.title : undefined;
  return createPortal(
    <div onClick={onClose} role="dialog" aria-label={`${t.name} badge earned`} className="vc-fade-in fixed inset-0 z-[320] flex cursor-pointer flex-col items-center justify-center overflow-hidden text-white" style={{ background: `radial-gradient(ellipse at 50% 42%, ${t.color}40 0%, #0d1117 48%, #05070a 100%)` }}>
      {/* sweeping light slash and frame lines, Valorant style */}
      <span aria-hidden className="vc-slash pointer-events-none absolute inset-y-0 left-0 w-[30%]" style={{ background: `linear-gradient(90deg, transparent, ${t.color}55, rgba(255,255,255,.35), ${t.color}55, transparent)` }} />
      <span aria-hidden className="pointer-events-none absolute left-[8%] right-[8%] top-[14%] h-px bg-white/10" />
      <span aria-hidden className="pointer-events-none absolute bottom-[14%] left-[8%] right-[8%] h-px bg-white/10" />
      <span aria-hidden className="pointer-events-none absolute left-[8%] top-[14%] h-6 w-px bg-white/40" />
      <span aria-hidden className="pointer-events-none absolute right-[8%] top-[14%] h-6 w-px bg-white/40" />

      <p className="vc-rise text-[12px] font-bold uppercase tracking-[0.6em] text-white/70">{what}</p>

      <div className="relative my-6 flex h-[260px] w-[340px] items-center justify-center">
        <span aria-hidden className="vc-ring absolute h-40 w-40 rounded-full border-2" style={{ borderColor: t.color }} />
        <span aria-hidden className="vc-halo absolute h-56 w-72 rounded-full blur-2xl" style={{ background: `radial-gradient(closest-side, ${t.color}aa, transparent)` }} />
        <img src={badgeSrc(badge.tier)} alt="" className="vc-rank-badge relative w-[300px] drop-shadow-[0_20px_40px_rgba(0,0,0,.6)]" draggable={false} />
      </div>

      <h2 className="vc-rise font-display text-[56px] font-bold uppercase leading-none tracking-[0.12em] md:text-[72px]" style={{ color: t.color, textShadow: `0 0 30px ${t.color}88`, animationDelay: "1s" }}>
        {t.name}
      </h2>
      <span aria-hidden className="vc-bar mt-4 h-[3px] w-64 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${t.color}, transparent)` }} />
      <p className="vc-rise mt-4 max-w-xl px-6 text-center text-lg font-medium text-white/90" style={{ animationDelay: "1.15s" }}>{badge.label}</p>
      {course && <p className="vc-rise mt-1 text-sm uppercase tracking-[0.25em] text-white/50" style={{ animationDelay: "1.25s" }}>{course}</p>}
      <p className="vc-rise absolute bottom-[8%] text-xs uppercase tracking-[0.4em] text-white/40" style={{ animationDelay: "1.6s" }}>
        {more > 0 ? `${more} more · tap to continue` : "Tap to continue"}
      </p>
    </div>,
    document.body
  );
}

/* ---------------- watches progress and awards badges ---------------- */
export function BadgeWatcher() {
  const { topics } = useNoteTopics();
  const { notes, ready } = useVault();
  const { exams } = useExams();
  const [queue, setQueue] = React.useState<Badge[]>([]);

  React.useEffect(() => {
    if (!ready) return;
    const store = readBadges();
    const have = new Set(store.badges.map((b) => b.key));
    const now = new Date().toISOString();
    const fresh: Badge[] = [];
    const add = (b: Omit<Badge, "earnedAt">) => {
      if (!have.has(b.key)) {
        have.add(b.key);
        fresh.push({ ...b, earnedAt: now });
      }
    };

    for (const n of notes) {
      const items = topics[n.id] ?? [];
      if (!items.length) continue;
      const groups = new Map<string, { done: number; total: number }>();
      for (const it of items) {
        const g = groups.get(it.chapter || "") ?? { done: 0, total: 0 };
        g.total++;
        if (it.done) g.done++;
        groups.set(it.chapter || "", g);
      }
      groups.forEach((g, ch) => {
        for (const tier of chapterTiers(Math.round((g.done / g.total) * 100), g.total))
          add({ key: `ch:${n.id}:${ch}:${tier}`, tier, kind: "chapter", noteId: n.id, chapter: ch, courseId: n.courseId, label: ch || n.title });
      });
      if (n.section === "qbank" && items.length >= 5 && items.every((i) => i.done))
        add({ key: `qb:${n.id}:challenger`, tier: "challenger", kind: "qbank", noteId: n.id, courseId: n.courseId, label: n.title });
    }
    for (const ex of exams) {
      const scoped = scopedTopics(ex, topics);
      const all = ex.noteIds.flatMap((id) => scoped[id] ?? []);
      if (all.length >= 5 && all.every((i) => i.done))
        add({ key: `ex:${ex.id}:grandmaster`, tier: "grandmaster", kind: "exam", examId: ex.id, courseId: examSubjects(ex)[0], label: ex.name });
    }

    if (!fresh.length && store.seeded) return;
    writeBadges({ seeded: true, badges: [...store.badges, ...fresh] });
    if (!store.seeded) return; // first run: everything you already had is saved quietly
    // Show the best new badge per chapter/exam (several at once when you tick a lot)
    const best = new Map<string, Badge>();
    for (const b of fresh) {
      const scope = b.kind === "chapter" ? `${b.noteId}:${b.chapter}` : b.key;
      const cur = best.get(scope);
      if (!cur || tierRank(b.tier) > tierRank(cur.tier)) best.set(scope, b);
    }
    const show = Array.from(best.values()).sort((a, b) => tierRank(b.tier) - tierRank(a.tier)).slice(0, 3);
    setQueue((q) => [...q, ...show]);
  }, [topics, notes, exams, ready]);

  if (!queue.length) return null;
  return <RankUpOverlay badge={queue[0]} more={queue.length - 1} onClose={() => setQueue((q) => q.slice(1))} />;
}

/* ---------------- small badge strip for a chapter ---------------- */
export function BadgeStrip({ badges, size = 34, className }: { badges: Badge[]; size?: number; className?: string }) {
  if (!badges.length) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {badges.map((b) => {
        const t = tierById(b.tier);
        return (
          <span key={b.key} title={`${t.name} · earned ${new Date(b.earnedAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`} className="flex items-center gap-1 rounded-full bg-[var(--ctl-fill)] py-0.5 pl-0.5 pr-2.5">
            <img src={badgeSrc(b.tier)} alt="" style={{ width: size, height: size * 0.66 }} className="object-contain" draggable={false} />
            <span className="text-[11px] font-semibold" style={{ color: t.color === "#CBD5E1" ? "#64748B" : t.color }}>{t.name}</span>
          </span>
        );
      })}
    </div>
  );
}

/** Badges earned in one chapter (live). */
export function ChapterBadges({ noteIds, chapter }: { noteIds: string[]; chapter: string }) {
  const all = useBadges();
  const mine = all.filter((b) => b.kind === "chapter" && noteIds.includes(b.noteId ?? "") && (b.chapter ?? "") === chapter).sort((a, b) => tierRank(b.tier) - tierRank(a.tier));
  if (!mine.length) return <p className="text-xs text-app-ink-muted">No badges yet: master 10% of this chapter for Iron.</p>;
  return <BadgeStrip badges={mine} />;
}
