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
 * Pulls numbered questions out of plain text without any AI: instant and free.
 * Returns [] when the text doesn't look like a numbered list.
 */
export function parseQuestions(text: string): ParsedItem[] {
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
