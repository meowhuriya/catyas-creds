"use client";

import * as React from "react";
import {
  Atom,
  Binary,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  ChartLine,
  Cloud,
  CodeXml,
  Cpu,
  Database,
  FlaskConical,
  Globe,
  Hammer,
  Languages,
  Layers,
  Leaf,
  Lock,
  Network,
  PenTool,
  Ruler,
  Scale,
  Shield,
  Sigma,
  Sparkles,
  Zap,
} from "lucide-react";

/** Picks a symbol from the subject's name/code. */
export function subjectGlyph(code: string, title: string): React.ElementType {
  const t = title.toLowerCase();
  const c = code.toUpperCase();
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  if (has("security", "cryptograph", "forensic", "penetration")) return Lock;
  if (has("network", "iot", "internet of things", "sensor")) return Network;
  if (has("database", "dbms", "data mining", "datasets", "retrieval")) return Database;
  if (has("machine learning", "deep learning", "artificial intelligence", "generative", "prompt", "vision", "nlp", "natural language")) return Brain;
  if (has("robot", "automation")) return Bot;
  if (has("cloud", "devops", "edge computing", "distributed")) return Cloud;
  if (has("statistic", "visualization", "analytics", "data science")) return ChartLine;
  if (has("chemistry")) return FlaskConical;
  if (has("physics", "quantum")) return Atom;
  if (has("electrical")) return Zap;
  if (has("electronic", "organization and architecture", "computing")) return Cpu;
  if (has("drawing", "graphics", "design", "ui ")) return PenTool;
  if (has("workshop", "mini project", "project work")) return Hammer;
  if (has("english", "communication", "language")) return Languages;
  if (has("environment", "sustainable", "nature")) return Leaf;
  if (has("economics", "management", "entrepreneur", "financial")) return Briefcase;
  if (has("ethics", "gender", "values", "knowledge system")) return Scale;
  if (has("automata", "compiler", "discrete", "graph theory", "algorithm")) return Binary;
  if (has("data structure")) return Layers;
  if (has("web", "full stack", "react", "django", "mobile", "flutter")) return Globe;
  if (has("software", "testing", "agile")) return Shield;
  if (has("research")) return Sparkles;
  if (c.startsWith("MA") || has("calculus", "matrices", "mathematic", "equations")) return Sigma;
  if (has("program", "python", "java", "scripting", "it workshop")) return CodeXml;
  if (has("measure")) return Ruler;
  return BookOpen;
}

/**
 * Original "ability card" banner for a subject: soft tinted glass, angled light
 * shards, sparkles and a diamond emblem with the subject's symbol.
 */
export function SubjectArt({
  code,
  title,
  hue,
  label,
  height = 84,
}: {
  code: string;
  title: string;
  hue: string;
  label?: string;
  height?: number;
}) {
  const Glyph = subjectGlyph(code, title);
  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <div aria-hidden className="absolute inset-0 bg-[var(--color-surface-muted)]" />
      <div
        aria-hidden
        className="absolute -right-10 -top-16 h-48 w-48 rounded-full opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
        style={{ background: `radial-gradient(closest-side, ${hue}, transparent)` }}
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-[var(--hair)]" />
      <div className="absolute left-5 top-1/2 -translate-y-1/2">
        <div
          className="pro-icon-tile grid h-11 w-11 place-items-center rounded-xl"
          style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 24px -12px ${hue}` }}
        >
          <Glyph className="h-5 w-5 text-[var(--color-accent)]" strokeWidth={1.7} />
        </div>
      </div>
      {label && (
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[11.5px] font-medium text-[var(--ink-faint)]">{label}</span>
      )}
    </div>
  );
}
