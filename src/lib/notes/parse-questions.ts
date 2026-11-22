export interface ParsedItem {
  text: string;
  chapter?: string;
  marks?: number;
}

const HEADING = /^\s*(unit|chapter|module|section|part|topic)\s*[-–:.]?\s*([ivx\d]+)?\s*[-–:.]?\s*(.*)$/i;
const NUMBERED = /^\s*(?:q(?:uestion)?\.?\s*)?(\d{1,3})\s*[.)\]:-]\s+(\S.*)$/i;
const LETTER_PART = /^\s*\(?[a-z]\)\s+/i;

function marksIn(s: string): number | undefined {
  const m = s.match(/[\[(]\s*(\d{1,2})\s*(?:marks?|m)?\s*[\])]\s*$/i) || s.match(/\b(\d{1,2})\s*(?:marks?|m)\s*$/i);
  return m ? Number(m[1]) : undefined;
}


/**
 * "Q1 · 2M  Title" style banks (a header line, then the question, then the answer after a gap).
 * Reads only the question text and ignores the worked answers that follow.
 */
function parseMarkedBank(text: string): ParsedItem[] {
  const HDR = /^Q\s*(\d{1,3})\s*[·•.\-:|]\s*(\d{1,2})\s*M(?:arks?)?\b\s*(.*)$/i;
  const out: ParsedItem[] = [];
  let chapter = "";
  let cur: { text: string; title: string; marks: number; chapter: string; open: boolean } | null = null;
  let unit: "none" | "num" | "title" = "none";
  let unitNum = "";
  const flush = () => {
    if (cur) {
      const t = (cur.text || cur.title).replace(/\s+/g, " ").trim();
      if (t) out.push({ text: t, chapter: cur.chapter || undefined, marks: cur.marks });
    }
    cur = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      if (cur && cur.text) cur.open = false; // a gap after the question means the answer starts
      continue;
    }
    if (/^UNIT\b/i.test(line) && line.length < 20) {
      flush();
      unit = "num";
      continue;
    }
    if (unit === "num" && /^\d{1,2}$/.test(line)) {
      unitNum = String(Number(line));
      unit = "title";
      continue;
    }
    if (unit === "title") {
      chapter = `Unit ${unitNum}: ${line.slice(0, 70)}`;
      unit = "none";
      continue;
    }
    const h = line.match(HDR);
    if (h) {
      flush();
      cur = { text: "", title: (h[3] || "").trim(), marks: Number(h[2]), chapter, open: true };
      continue;
    }
    if (cur && cur.open) cur.text += (cur.text ? " " : "") + line;
  }
  flush();
  return out;
}

/**
 * Pulls numbered questions out of plain text without any AI: instant and free.
 * Returns [] when the text doesn't look like a numbered list.
 */
export function parseQuestions(text: string): ParsedItem[] {
  const marked = parseMarkedBank(text);
  if (marked.length >= 3) return marked;
  const lines = text.split(/\r?\n/);
  const out: ParsedItem[] = [];
  let chapter = "";
  let cur: ParsedItem | null = null;
  const flush = () => {
    if (cur) {
      cur.text = cur.text.replace(/\s+/g, " ").trim();
      cur.marks = cur.marks ?? marksIn(cur.text);
      if (cur.text.length > 8) out.push(cur);
    }
    cur = null;
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^#{1,3}\s/.test(line) && !NUMBERED.test(line)) {
      flush();
      chapter = line.replace(/^#+\s*/, "").slice(0, 80);
      continue;
    }
    const h = line.match(HEADING);
    if (h && line.length < 90 && !NUMBERED.test(line)) {
      flush();
      chapter = line.slice(0, 80);
      continue;
    }
    const n = line.match(NUMBERED);
    if (n) {
      flush();
      cur = { text: n[2], chapter: chapter || undefined };
    } else if (cur) {
      if (LETTER_PART.test(line) || line.length > 0) cur.text += " " + line;
    }
  }
  flush();
  return out.length >= 3 ? out : [];
}

/** Splits long text into pieces (at paragraph breaks) so each AI call stays quick. */
export function chunkText(text: string, size = 6000): string[] {
  const out: string[] = [];
  let buf = "";
  for (const para of text.split(/\n{1,}/)) {
    if (buf.length + para.length + 1 > size && buf) {
      out.push(buf);
      buf = "";
    }
    buf += para + "\n";
  }
  if (buf.trim()) out.push(buf);
  return out;
}
