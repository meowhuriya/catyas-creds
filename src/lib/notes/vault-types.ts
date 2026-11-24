export type VaultSection = "qbank" | "exam" | "viva" | "assignment" | "submission" | "notes";

export const VAULT_SECTIONS: { key: VaultSection; label: string; short: string; hint: string }[] = [
  { key: "qbank", label: "Question Banks", short: "Q-bank", hint: "Q-banks and previous papers: upload the file, import every question, then get tested on them" },
  { key: "exam", label: "Exam Important", short: "Exam", hint: "Important questions, formulas and teacher hints for exams" },
  { key: "viva", label: "Viva", short: "Viva", hint: "Viva questions, answers and lab points" },
  { key: "assignment", label: "Assignments", short: "Assignments", hint: "Assignment questions, submissions and deadlines" },
  { key: "submission", label: "My Submissions", short: "Submissions", hint: "Your own answers, PPTs, decks and files you submitted" },
  { key: "notes", label: "My Notes", short: "My notes", hint: "Your notes, handouts, photos and videos from class" },
];

export interface VaultLink {
  id: string;
  url: string;
  label: string;
  kind: "video" | "drive" | "link";
}

export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per file, synced in chunks through Firestore (no paid plan needed)

export interface VaultFileRef {
  id: string;
  name: string;
  size: number;
  mime: string;
  chunks: number;
}

export interface VaultNote {
  id: string;
  courseId: string;
  section: VaultSection;
  title: string;
  body: string;
  links: VaultLink[];
  mediaIds: string[];
  files: VaultFileRef[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VaultMedia {
  id: string;
  noteId: string;
  name: string;
  dataUrl: string;
  createdAt: string;
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function classifyLink(rawUrl: string): VaultLink | null {
  let url = rawUrl.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  const kind: VaultLink["kind"] = /(^|\.)youtube\.com$|^youtu\.be$/.test(host)
    ? "video"
    : host === "drive.google.com" || host === "docs.google.com"
      ? "drive"
      : "link";
  const label = kind === "video" ? "YouTube video" : kind === "drive" ? "Google Drive file" : host;
  return { id: newId("lnk"), url, label, kind };
}

export function youTubeThumb(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://i.ytimg.com/vi/${m[1]}/mqdefault.jpg` : null;
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

/** Turns a Drive / Docs / YouTube link into an embeddable URL (null = can't embed). */
export function toEmbedUrl(rawUrl: string): string | null {
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  const path = u.pathname;
  if (host === "drive.google.com") {
    const folder = path.match(/\/folders\/([\w-]+)/);
    if (folder) return `https://drive.google.com/embeddedfolderview?id=${folder[1]}#list`;
    const file = path.match(/\/file\/d\/([\w-]+)/) ?? null;
    const id = file?.[1] ?? u.searchParams.get("id");
    return id ? `https://drive.google.com/file/d/${id}/preview` : null;
  }
  if (host === "docs.google.com") {
    const m = path.match(/^\/(document|spreadsheets|presentation|forms)\/d\/([\w-]+)/);
    if (!m) return null;
    return m[1] === "forms"
      ? `https://docs.google.com/forms/d/${m[2]}/viewform?embedded=true`
      : `https://docs.google.com/${m[1]}/d/${m[2]}/preview`;
  }
  const yt = rawUrl.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (yt && /youtube\.com$|youtu\.be$/.test(host)) return `https://www.youtube.com/embed/${yt[1]}`;
  return null;
}

export function driveFileId(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "drive.google.com" && host !== "docs.google.com") return null;
    if (/\/folders\//.test(u.pathname)) return null;
    return u.pathname.match(/\/d\/([\w-]+)/)?.[1] ?? u.searchParams.get("id");
  } catch {
    return null;
  }
}

/** First-page thumbnail Drive generates for a shared file (null for folders/other links). */
export function driveThumb(rawUrl: string, width = 640): string | null {
  const id = driveFileId(rawUrl);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${width}` : null;
}

export function noteCover(note: Pick<VaultNote, "links">): string | null {
  for (const l of note.links) {
    const t = l.kind === "video" ? youTubeThumb(l.url) : driveThumb(l.url);
    if (t) return t;
  }
  return null;
}
