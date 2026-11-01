"use client";

import * as React from "react";
import {
  Binary,
  Code,
  Compass,
  Cpu,
  Layers,
  FlaskConical,
  GraduationCap,
  Hammer,
  Languages,
  PenTool,
  Sigma,
  Sparkles,
  Zap,
  BookOpen,
} from "lucide-react";
import { TOKENS, CourseTagKey } from "@/styles/tokens";

interface AlgorithmicCoverProps {
  courseCode: string;
  courseTitle: string;
  department: string;
  colorTag: string;
  height?: number; // 96 for card, 160 for course detail banner
  className?: string;
}

// Map department / title to appropriate academic icon
function getSubjectIcon(code: string, dept: string, title: string) {
  const c = code.toUpperCase();
  const d = dept.toLowerCase();
  const t = title.toLowerCase();

  if (c.startsWith("MA") || d.includes("math")) return Sigma;
  if (c.startsWith("CH") || d.includes("chem")) return FlaskConical;
  if (c.startsWith("PH") || d.includes("phys")) return Compass;
  if (c.startsWith("EN") || d.includes("english") || d.includes("humanities")) return Languages;
  if (c.startsWith("EC") || d.includes("electronic")) return Cpu;
  if (c.startsWith("EE") || d.includes("electrical")) return Zap;
  if (c.startsWith("ME") || d.includes("mechanic") || t.includes("workshop") || t.includes("drawing")) return Hammer;
  if (c.startsWith("CS") || d.includes("computer") || t.includes("programming") || t.includes("data structure") || t.includes("python")) return Code;
  return BookOpen;
}

// Generate deterministic pattern variant from string hash
function getHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function AlgorithmicCover({
  courseCode,
  courseTitle,
  department,
  colorTag,
  height = 96,
  className = "",
}: AlgorithmicCoverProps) {
  const tagColor =
    TOKENS.colors.courseTags[colorTag as CourseTagKey]?.hex ||
    TOKENS.colors.courseTags.slate.hex;

  const Icon = getSubjectIcon(courseCode, department, courseTitle);
  const hash = getHash(courseCode + courseTitle);
  const patternType = hash % 4; // 0: concentric arcs, 1: dot grid, 2: diagonal lines, 3: contour waves

  // Base background is a deep, rich dark tone derived from the course color
  const darkBase = "#12141A";

  return (
    <div
      className={`relative w-full overflow-hidden select-none flex items-center justify-between ${className}`}
      style={{
        height: `${height}px`,
        backgroundColor: darkBase,
      }}
    >
      {/* Background SVG Pattern */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`grad-${courseCode}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={tagColor} stopOpacity="0.45" />
            <stop offset="100%" stopColor={tagColor} stopOpacity="0.08" />
          </linearGradient>

          {/* Dot Grid Pattern */}
          <pattern id={`dots-${courseCode}`} x1="0" y1="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill={tagColor} fillOpacity="0.25" />
          </pattern>

          {/* Diagonal Stripes Pattern */}
          <pattern id={`stripes-${courseCode}`} width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="20" stroke={tagColor} strokeWidth="1.5" strokeOpacity="0.2" />
          </pattern>
        </defs>

        {/* Ambient Gradient Wash */}
        <rect width="100%" height="100%" fill={`url(#grad-${courseCode})`} />

        {/* Generative Geometric Details */}
        {patternType === 0 && (
          // Concentric Arcs
          <g stroke={tagColor} strokeWidth="1.2" fill="none" opacity="0.35">
            <circle cx="90%" cy="50%" r="30" />
            <circle cx="90%" cy="50%" r="55" />
            <circle cx="90%" cy="50%" r="80" />
            <circle cx="90%" cy="50%" r="110" />
            <circle cx="90%" cy="50%" r="145" />
          </g>
        )}

        {patternType === 1 && (
          // Dot Grid with Radial Fade
          <rect width="100%" height="100%" fill={`url(#dots-${courseCode})`} />
        )}

        {patternType === 2 && (
          // Diagonal Architectural Stripes
          <rect width="100%" height="100%" fill={`url(#stripes-${courseCode})`} />
        )}

        {patternType === 3 && (
          // Contour Topographic Waves
          <g stroke={tagColor} strokeWidth="1.2" fill="none" opacity="0.3">
            <path d="M-20,20 Q60,70 140,20 T300,40 T460,20 T620,50" />
            <path d="M-20,40 Q60,90 140,40 T300,60 T460,40 T620,70" />
            <path d="M-20,60 Q60,110 140,60 T300,80 T460,60 T620,90" />
            <path d="M-20,80 Q60,130 140,80 T300,100 T460,80 T620,110" />
          </g>
        )}
      </svg>

      {/* Large Serif Course Code Watermark */}
      <span
        className="absolute left-4 top-1/2 -translate-y-1/2 font-serif font-black tracking-tighter pointer-events-none select-none text-white/[0.07]"
        style={{ fontSize: height > 120 ? "72px" : "44px" }}
      >
        {courseCode}
      </span>

      {/* Left Accent Color Indicator */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: tagColor }}
      />

      {/* Course Meta Label Overlay */}
      <div className="relative z-10 px-4 flex flex-col justify-center">
        <span
          className="font-sans font-semibold text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-control inline-block w-fit mb-1 backdrop-blur-md"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            color: "#FFFFFF",
            border: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          {courseCode}
        </span>
        <span className="text-[11px] text-white/70 font-medium tracking-wide">
          {department}
        </span>
      </div>

      {/* Lucide Subject Icon in Glassmorphism Circle */}
      <div className="relative z-10 pr-4">
        <div
          className="flex items-center justify-center rounded-full backdrop-blur-md border border-white/20 shadow-sm"
          style={{
            width: height > 120 ? "48px" : "36px",
            height: height > 120 ? "48px" : "36px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <Icon
            className="text-white"
            style={{ width: height > 120 ? "24px" : "18px", height: height > 120 ? "24px" : "18px" }}
          />
        </div>
      </div>
    </div>
  );
}
