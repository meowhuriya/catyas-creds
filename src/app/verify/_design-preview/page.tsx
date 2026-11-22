"use client";
import { BentoHero } from "@/components/dashboard/bento-hero";
import { SubjectArt } from "@/components/brand/subject-art";
import { LogoMark, Wordmark } from "@/components/brand/logo";
import { subjectsFor, subjectColor } from "@/lib/notes/curriculum";
import { SparkleField } from "@/components/fx/sparkle-field";
import { TiltFx } from "@/components/fx/tilt-fx";
import { Sidebar } from "@/components/shell/sidebar";
import { AppearanceControl } from "@/components/shell/appearance-control";

export default function DesignPreview() {
  const subs = subjectsFor(1, 1).slice(0, 6);
  return (
    <div className="relative z-10 flex gap-6 p-4 text-app-ink">
      <div className="hidden md:block"><Sidebar collapsed={false} onToggle={() => {}} /></div>
      <div className="flex-1 space-y-8 p-4">
      <TiltFx />
      <div className="flex items-center justify-between"><div className="flex items-center gap-3"><LogoMark size={44} /><Wordmark size="md" /></div><AppearanceControl /></div>
      <BentoHero studentName="Huriya Fatima" coursesCount={9} totalCredits={20} overallProgressPercent={34} streakDays={4} />
      <div className="grid grid-cols-3 gap-4">
        {subs.map((s) => (
          <div key={s.id} className="group vc-tile overflow-hidden">
            <SubjectArt code={s.code} title={s.title} hue={subjectColor(s)} label="Theory" />
            <div className="p-4"><h3 className="font-display text-[17px] text-[var(--color-ink)]">{s.title}</h3><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-app-ink-muted">{s.code} · {s.credits} credits</p></div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
