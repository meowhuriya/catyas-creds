"use client";

import { idbGet } from "@/lib/notes/vault-db";
import { loadFileBlob } from "@/lib/notes/vault-files";
import { pdfToText } from "@/lib/notes/pdf-text";
import { officeToText } from "@/lib/notes/office-text";
import { VaultMedia, VaultNote } from "@/lib/notes/vault-types";

export interface NoteMaterial {
  text: string;
  links: string[];
  images: { mimeType: string; data: string }[];
  warnings: string[];
}

/** PDFs sent straight to the server must stay small (hosting request limit is ~4.5 MB). */
const INLINE_PDF_BYTES = 3 * 1024 * 1024;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/**
 * Everything Gemini can read from these notes: typed text, uploaded Word/PowerPoint/text files,
 * small PDFs, photos, and Drive / Google Docs links (the server fetches those).
 */
export async function collectMaterial(notes: VaultNote[], uid: string | null = null): Promise<NoteMaterial> {
  const textParts: string[] = [];
  const images: NoteMaterial["images"] = [];
  const warnings: string[] = [];
  let inlineBytes = 0;

  for (const n of notes) {
    textParts.push(`# ${n.title}\n${n.body}`);
    for (const f of n.files) {
      try {
        const lower = f.name.toLowerCase();
        if (/\.(docx|pptx|txt|md|csv)$/.test(lower)) {
          const blob = await loadFileBlob(uid, f);
          const t = await officeToText(blob, f.name);
          if (t) textParts.push(`## File: ${f.name}\n${t}`);
        } else if (lower.endsWith(".pdf")) {
          try {
            const blob0 = await loadFileBlob(uid, f);
            const t = await pdfToText(await blob0.arrayBuffer());
            if (t.replace(/\s/g, "").length > 200) {
              textParts.push(`## File: ${f.name}\n${t}`);
              continue;
            }
            warnings.push(`${f.name} looks scanned (no text inside), so it needs AI to read.`);
          } catch {
            /* fall through to AI */
          }
          if (inlineBytes + f.size > INLINE_PDF_BYTES) {
            warnings.push(`${f.name} is too big to send from here (over 3 MB). Put it on Drive, share as "Anyone with the link", and paste the link in the note.`);
            continue;
          }
          const blob = await loadFileBlob(uid, f);
          images.push({ mimeType: "application/pdf", data: toBase64(await blob.arrayBuffer()) });
          inlineBytes += f.size;
        } else if (/\.(png|jpe?g|webp)$/.test(lower) && f.size < 1_500_000) {
          const blob = await loadFileBlob(uid, f);
          images.push({ mimeType: f.mime || "image/jpeg", data: toBase64(await blob.arrayBuffer()) });
          inlineBytes += f.size;
        } else if (/\.(doc|ppt)$/.test(lower)) {
          warnings.push(`${f.name} is an old Office format. Save it as .docx/.pptx or PDF so AI can read it.`);
        }
      } catch (e) {
        warnings.push(`Couldn't open ${f.name}: ${e instanceof Error ? e.message : "unknown error"}`);
      }
    }
    for (const id of n.mediaIds) {
      if (images.length >= 6) break;
      const m = await idbGet<VaultMedia>("media", id).catch(() => undefined);
      const parts = m?.dataUrl?.match(/^data:(.+?);base64,(.+)$/);
      if (parts) images.push({ mimeType: parts[1], data: parts[2] });
    }
  }
  const links: string[] = [];
  for (const l of notes.flatMap((n) => n.links.filter((x) => x.kind === "drive").map((x) => x.url))) {
    try {
      const res = await fetch(`/api/drive-file?url=${encodeURIComponent(l)}`);
      if (!res.ok) throw new Error("fetch");
      const t = await pdfToText(await res.arrayBuffer());
      if (t.replace(/\s/g, "").length > 200) {
        textParts.push(`## Drive link\n${t}`);
        continue;
      }
    } catch {
      /* AI can still try this link */
    }
    links.push(l);
  }
  return { text: textParts.join("\n\n").slice(0, 400000), links, images, warnings };
}
