import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSecondsToTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function parseTimeToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(":").map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

export function cleanSyllabusTitle(s?: string): string {
  if (!s) return "";
  return s
    .replace(/\[\s*\d+\s*\]/g, "")
    .replace(/\b\d+\s*L\b/gi, "")
    .replace(/^[\s\-–•*]+/, "")
    .replace(/[\s:]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getYoutubeSearchUrl(courseTitle: string, unitTitle: string): string {
  const query = `${cleanSyllabusTitle(courseTitle)} ${cleanSyllabusTitle(unitTitle)}`.trim();
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}
