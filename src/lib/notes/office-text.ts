"use client";

/**
 * Pulls plain text out of .docx / .pptx files in the browser (they're zip files of XML),
 * so Gemini can read Q-banks uploaded as Word files or decks. No extra libraries needed.
 */

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzip(buf: ArrayBuffer, want: (name: string) => boolean): Promise<Map<string, string>> {
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);
  // Find the end-of-central-directory record.
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a valid Office file");
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const out = new Map<string, string>();
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) break;
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOff = view.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (!want(name)) continue;
    const lNameLen = view.getUint16(localOff + 26, true);
    const lExtraLen = view.getUint16(localOff + 28, true);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const raw = bytes.subarray(start, start + compSize);
    const data = method === 0 ? raw : method === 8 ? await inflateRaw(raw) : null;
    if (data) out.set(name, dec.decode(data));
  }
  return out;
}

function xmlToText(xml: string, paraTag: string, textTag: string): string {
  return xml
    .split(new RegExp(`</${paraTag}>`))
    .map((chunk) =>
      Array.from(chunk.matchAll(new RegExp(`<${textTag}(?:\\s[^>]*)?>([^<]*)</${textTag}>`, "g")))
        .map((m) => m[1])
        .join("")
    )
    .map((l) => l.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim())
    .filter(Boolean)
    .join("\n");
}

import { legacyDocToText } from "@/lib/notes/doc-text";

export async function officeToText(blob: Blob, name: string): Promise<string | null> {
  const lower = name.toLowerCase();
  const buf = await blob.arrayBuffer();
  if (lower.endsWith(".docx")) {
    const files = await unzip(buf, (n) => n === "word/document.xml");
    const xml = files.get("word/document.xml");
    return xml ? xmlToText(xml, "w:p", "w:t") : null;
  }
  if (lower.endsWith(".pptx")) {
    const files = await unzip(buf, (n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
    const slides = Array.from(files.entries()).sort(
      (a, b) => Number(a[0].match(/(\d+)\.xml$/)?.[1]) - Number(b[0].match(/(\d+)\.xml$/)?.[1])
    );
    return slides.map(([, xml], i) => `--- Slide ${i + 1} ---\n${xmlToText(xml, "a:p", "a:t")}`).join("\n");
  }
  if (lower.endsWith(".doc")) return legacyDocToText(buf);
  if (lower.endsWith(".txt") || lower.endsWith(".md") || lower.endsWith(".csv")) return await blob.text();
  return null;
}
