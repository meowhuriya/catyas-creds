export type VaultSection = "exam" | "viva" | "assignment" | "submission" | "notes";

export const VAULT_SECTIONS: { key: VaultSection; label: string; short: string; hint: string }[] = [
  { key: "exam", label: "Exam Important", short: "Exam", hint: "Important questions, formulas and teacher hints for exams" },
  { key: "viva", label: "Viva", short: "Viva", hint: "Viva questions, answers and lab points" },
  { key: "assignment", label: "Assignments", short: "Assignments", hint: "Assignment questions, submissions and deadlines" },
  { key: "submission", label: "My Submissions", short: "Submissions", hint: "Your own answers, PPTs, decks and files you submitted" },
  { key: "notes", label: "Class Notes", short: "Notes", hint: "Notes, handouts, photos and videos your teachers share" },
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
