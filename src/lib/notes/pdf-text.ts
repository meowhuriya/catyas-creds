"use client";

/** Reads text out of a PDF in the browser (pdf.js from a CDN). No AI, no size limit. */
const BASE = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";

let loading: Promise<any> | null = null;

function loadPdfJs(): Promise<any> {
  const w = window as any;
  if (w.pdfjsLib) return Promise.resolve(w.pdfjsLib);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = BASE + "pdf.min.js";
      s.onload = () => {
        w.pdfjsLib.GlobalWorkerOptions.workerSrc = BASE + "pdf.worker.min.js";
        resolve(w.pdfjsLib);
      };
      s.onerror = () => {
        loading = null;
        reject(new Error("Couldn't load the PDF reader (check your internet)."));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

interface TextItem {
  str: string;
  transform?: number[];
  width?: number;
  height?: number;
}

/**
 * Puts a page's text pieces back in reading order by where they sit on the page (top to bottom,
 * left to right), because scanned / OCR'd PDFs store them in a scrambled order.
 */
export function itemsToText(items: TextItem[]): string {
  const pieces = items
    .filter((it) => it.str && it.str.trim() && it.transform)
    .map((it) => ({ s: it.str, x: it.transform![4], y: it.transform![5], w: it.width ?? it.str.length * 4, h: it.height || Math.abs(it.transform![3]) || 9 }))
    .sort((a, b) => b.y - a.y);
  const lines: { y: number; parts: typeof pieces }[] = [];
  for (const p of pieces) {
    const last = lines[lines.length - 1];
    if (last && Math.abs(p.y - last.y) <= Math.max(2.5, p.h * 0.4)) last.parts.push(p);
    else lines.push({ y: p.y, parts: [p] });
  }
  const out: string[] = [];
  let prevY: number | null = null;
  for (const ln of lines) {
    ln.parts.sort((a, b) => a.x - b.x);
    let t = "";
    let endX = 0;
    ln.parts.forEach((p, i) => {
      if (i > 0 && p.x - endX > 1.2 && !t.endsWith(" ") && !p.s.startsWith(" ")) t += " ";
      t += p.s;
      endX = p.x + p.w;
    });
    if (prevY !== null && prevY - ln.y > 22) out.push(""); // a bigger gap = a paragraph break
    out.push(t.replace(/\s+/g, " ").trim());
    prevY = ln.y;
  }
  return out.join("\n");
}

export async function pdfToText(data: ArrayBuffer): Promise<string> {
  const lib = await loadPdfJs();
  const doc = await lib.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    pages.push(itemsToText(content.items as TextItem[]));
  }
  return pages.join("\n");
}
