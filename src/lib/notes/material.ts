"use client";

import { idbGet } from "@/lib/notes/vault-db";
import { VaultMedia, VaultNote } from "@/lib/notes/vault-types";

export interface NoteMaterial {
  text: string;
  links: string[];
  images: { mimeType: string; data: string }[];
}

/** Everything Gemini can read from these notes: text, Drive/Docs links, and up to 4 photos. */
export async function collectMaterial(notes: VaultNote[]): Promise<NoteMaterial> {
  const text = notes.map((n) => `# ${n.title}\n${n.body}`).join("\n\n");
  const links = notes.flatMap((n) => n.links.filter((l) => l.kind === "drive").map((l) => l.url));
  const images: NoteMaterial["images"] = [];
  for (const n of notes) {
    for (const id of n.mediaIds) {
      if (images.length >= 4) break;
      const m = await idbGet<VaultMedia>("media", id).catch(() => undefined);
      const parts = m?.dataUrl?.match(/^data:(.+?);base64,(.+)$/);
      if (parts) images.push({ mimeType: parts[1], data: parts[2] });
    }
  }
  return { text, links, images };
}
