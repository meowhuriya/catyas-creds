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

export async function pdfToText(data: ArrayBuffer): Promise<string> {
  const lib = await loadPdfJs();
  const doc = await lib.getDocument({ data }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    // Rebuild lines from text positions so numbered questions start on their own line.
    let line = "";
    let lastY: number | null = null;
    const lines: string[] = [];
    for (const it of content.items as any[]) {
      const y = it.transform?.[5] as number;
      if (lastY !== null && Math.abs(y - lastY) > 2) {
        lines.push(line);
        if (Math.abs(y - lastY) > 22) lines.push(""); // a bigger gap = a paragraph break
        line = "";
      }
      line += it.str + (it.hasEOL ? "\n" : "");
      lastY = y;
    }
    if (line) lines.push(line);
    pages.push(lines.join("\n"));
  }
  return pages.join("\n");
}
