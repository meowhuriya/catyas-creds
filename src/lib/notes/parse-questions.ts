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
/** A heading that stops on a joining word ("Eigenvalues, Cayley–Hamilton and") carries on to the next line. */
const DANGLING = /(?:\b(?:and|of|its|the|in|on|for|to|with|by|from|using|via|&)|[,–—:-])\s*$/i;
function joinTitle(title: string, next: string | undefined): string | null {
  if (!next || !DANGLING.test(title)) return null;
  const n = next.trim();
  if (!n || n.length > 60 || /^(in this unit|unit|experiment|q\s*\d|saq|laq|\d+[.)])/i.test(n) || /[.?]$/.test(n)) return null;
  return `${title} ${n}`;
}

function parseMarkedBank(text: string): ParsedItem[] {
  const HDR = /^Q\s*(\d{1,3})\s*[·•.\-:|]\s*(\d{1,2})\s*M(?:arks?)?\b\s*(.*)$/i;
  const out: ParsedItem[] = [];
  let chapter = "";
  let cur: { text: string; title: string; marks: number; chapter: string; open: boolean; tail?: boolean } | null = null;
  let unit: "none" | "num" | "title" | "more" = "none";
  let unitNum = "";
  const flush = () => {
    if (cur) {
      const t = (cur.text || cur.title).replace(/\s+/g, " ").trim();
      if (t) out.push({ text: t, chapter: cur.chapter || undefined, marks: cur.marks || undefined });
    }
    cur = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      if (cur && cur.text) {
        // "LAQ 3" + "Hardness" + gap: that short line is the end of the heading, the question comes next
        const t = cur.text.trim();
        if (!cur.tail && t.length < 36 && t.split(/\s+/).length <= 4 && !/[.?:;]$/.test(t) && !/^(define|state|what|why|how|explain|write|list|give|name)\b/i.test(t)) {
          cur.tail = true;
          cur.text = "";
        } else cur.open = false; // a gap after the question means the answer starts
      }
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
      unit = DANGLING.test(line) ? "more" : "none";
      continue;
    }
    if (unit === "more") {
      unit = "none";
      const j = joinTitle(chapter, line);
      if (j) {
        chapter = j.slice(0, 100);
        continue;
      }
    }
    const h = line.match(HDR);
    if (h) {
      flush();
      cur = { text: "", title: (h[3] || "").trim(), marks: Number(h[2]), chapter, open: true };
      continue;
    }
    const h2 = line.match(/^(SAQ|LAQ|Short Answer|Long Answer)\s*(?:Question)?\s*(\d{1,3})\s*[·•.\-:|]?\s*(.*)$/i);
    if (h2 && chapter && !(cur && cur.open && cur.text)) {
      flush();
      cur = { text: "", title: (h2[3] || "").trim(), marks: /^(laq|long)/i.test(h2[1]) ? LONG_MARKS : 0, chapter, open: true };
      continue;
    }
    if (cur && cur.open) cur.text += (cur.text ? " " : "") + line;
  }
  flush();
  return out;
}

/** A long answer / essay question is worth 5 marks. */
const LONG_MARKS = 5;
const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
/** "Unit 2", "Unit-II: Title", "Experiment 3", "Exp. No. 4 - Title" -> a chapter label (or null). */
export function chapterOf(line: string): string | null {
  if (line.length > 90) return null;
  const m = line.match(/^(unit|experiment|expt|exp|lab)\.?\s*(?:no\.?|number|#)?\s*[-–:.]?\s*([ivx]+|\d+)\b\s*[-–:.]?\s*(.*)$/i);
  if (!m) return null;
  const n = ROMAN[m[2].toUpperCase()] ?? Number(m[2]);
  if (!n) return null;
  const word = /^unit/i.test(m[1]) ? "Unit" : "Experiment";
  const title = m[3].trim();
  return `${word} ${n}${title ? ": " + title : ""}`.slice(0, 90);
}

const titleCase = (t: string) =>
  t.toLowerCase().replace(/(^|[\s(-])([a-z]+)/g, (_, a, w) => (a && /^(and|its|of|the|to|in|on|for|a|an|with|by|using|vs)$/.test(w) ? a + w : a + w[0].toUpperCase() + w.slice(1)));

/**
 * "UNIT – I: TITLE", then "Short Answer Questions" / "Long Answer Questions" tables with an
 * S.No. column. The number cell can sit before, between or beside the question's lines, so each
 * question is cut at the first line that ends a sentence after its number.
 */
function parseTableBank(text: string): ParsedItem[] {
  const out: ParsedItem[] = [];
  let chapter = "";
  let inSection = false;
  let secMarks: number | undefined;
  let toks: { m: boolean; t: string }[] = [];
  const flush = () => {
    if (inSection && toks.some((x) => x.m)) {
      const lines: string[] = [];
      const markerAt: number[] = []; // index in `lines` where each number appears (lines before it)
      for (const x of toks) {
        if (x.m) markerAt.push(lines.length);
        if (x.t) {
          lines.push(x.t);
          if (x.m) markerAt[markerAt.length - 1] = lines.length - 1; // inline: the number sits on this line
        }
      }
      let start = 0;
      for (let k = 0; k < markerAt.length && start < lines.length; k++) {
        let end = Math.max(markerAt[k], start);
        // a number between two lines belongs to the question that continues after it
        while (end < lines.length - 1 && !/[.?]\s*$/.test(lines[end])) end++;
        if (end === markerAt[k] - 1) end = markerAt[k];
        const t = lines.slice(start, end + 1).join(" ").replace(/\s+/g, " ").trim();
        if (t.length > 8) out.push({ text: t, chapter: chapter || undefined, marks: secMarks });
        start = end + 1;
      }
    }
    toks = [];
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const u = chapterOf(line);
    if (u) {
      flush();
      inSection = false;
      chapter = /^unit/i.test(u) ? u.replace(/^(Unit \d+: )(.*)$/, (_, a, b) => a + titleCase(b)) : u;
      continue;
    }
    if (/^(short|long) answer questions?\b/i.test(line) || /^(part|section)\s*-?\s*[a-c]\b/i.test(line)) {
      flush();
      inSection = true;
      secMarks = /^long/i.test(line) ? LONG_MARKS : undefined;
      continue;
    }
    if (/^s\.?\s*no\.?$/i.test(line)) continue;
    if (!inSection) continue;
    const m = line.match(/^(\d{1,2})(?:\s+|(?=[A-Z]))(\S.*)$/);
    if (/^\d{1,2}$/.test(line)) toks.push({ m: true, t: "" });
    else if (m) toks.push({ m: true, t: m[2] });
    else toks.push({ m: false, t: line });
  }
  flush();
  return out;
}

/**
 * Lab / viva banks: "EXPERIMENT 3: TITLE" headings (often OCR-garbled, with wrapped titles) and
 * questions that wrap over several lines. A question ends at its "?", or at the next number.
 */
function parseExperimentBank(text: string): ParsedItem[] {
  const HEAD = /^\W*[A-Za-z]{0,2}\s*(?:EXPERIMENT|XPERIMENT|PERIMENT|PERIMTENT|EXPT\.?|EXP\.?)\s*[-–:.#]*\s*(?:NO\.?)?\s*([IVXLivxl]+|\d+)\b\s*[-–:.]*\s*(.*)$/i;
  const NOISE = /^(a\s*manual of engineering chemistry|\d+\s*\|\s*pa\s*ge|viva\W*voce\b.*|\W*)$/i;
  const isCaps = (t: string) => {
    const letters = t.replace(/[^A-Za-z]/g, "");
    return letters.length > 2 && letters.replace(/[^A-Z]/g, "").length / letters.length > 0.7 && !/\?/.test(t);
  };
  type Sec = { printed: number; title: string; items: string[] };
  const secs: Sec[] = [];
  let cur: Sec | null = null;
  let buf = "";
  let titleMode = false;
  const push = (q: string) => {
    if (!cur) return;
    if (/^write the necessary/i.test(q) && cur.items.length) cur.items[cur.items.length - 1] += " " + q;
    else if (q.length > 8 && q.split(/\s+/).length >= 2 && !isCaps(q)) cur.items.push(q); // ALL-CAPS lines are leftover heading text
  };
  const flush = () => {
    const t = buf.replace(/\s+/g, " ").trim();
    buf = "";
    // two questions on one line ("What is conductance? What are its units?") are split
    for (const part of t.split(/(?<=\?)\s+(?=[A-Z])/)) push(part);
  };
  /** Finish every question in the buffer that already ends with "?"; keep an unfinished tail. */
  const drain = () => {
    const t = buf.replace(/\s+/g, " ").trim();
    const parts = t.split(/(?<=\?)\s+(?=[A-Z])/);
    const tail = parts[parts.length - 1];
    const done = /\?\s*$/.test(tail) || /^write the necessary/i.test(tail) ? parts : parts.slice(0, -1);
    for (const part of done) push(part);
    buf = done.length === parts.length ? "" : tail;
  };
  for (const raw of text.split(/\r?\n/)) {
    const t = raw.trim();
    if (!t || NOISE.test(t)) continue;
    const h = t.match(HEAD);
    if (h) {
      flush();
      const tok = h[1].toUpperCase().replace(/L/g, "I");
      const printed = /^\d+$/.test(tok) ? Number(tok) : (ROMAN[tok] ?? NaN);
      cur = { printed, title: h[2].trim(), items: [] };
      secs.push(cur);
      titleMode = true;
      continue;
    }
    if (!cur) continue;
    const num = t.match(/^([\d$]{1,2})\s*[.)]?\s*(?=[A-Z]|$)(.*)$/);
    const isNum = !!num && (num[2].length === 0 || /\s/.test(t.charAt(num[1].length)) || /^[\d$]{1,2}[.)]/.test(t));
    if (titleMode) {
      if (!isNum && (isCaps(t) || /^[A-Z]{2,3}$/.test(t))) {
        cur.title += " " + t;
        continue;
      }
      titleMode = false;
    }
    if (isNum && num) {
      flush();
      buf = num[2].trim();
    } else buf = buf ? buf + " " + t : t;
    drain();
  }
  flush();
  const withItems = secs.filter((x) => x.items.length);
  const increasing = withItems.every((x, i) => Number.isFinite(x.printed) && (i === 0 || x.printed > withItems[i - 1].printed));
  const out: ParsedItem[] = [];
  withItems.forEach((x, i) => {
    const n = increasing ? x.printed : i + 1;
    const title = fixOcr(titleCase(x.title.replace(/[#$]/g, "").replace(/[.\s]+$/, "").replace(/\s+/g, " ").trim())).slice(0, 120);
    const chapter = `Experiment ${n}${title ? ": " + title : ""}`;
    for (const it of x.items) out.push({ text: it, chapter });
  });
  return withItems.length >= 2 && out.length >= 3 ? out : [];
}

/**
 * Plain outline: "Unit-1" headings, "2 marks questions" / "Essay type questions" section lines,
 * then one question per line (Word's automatic list numbers are not part of the text).
 */
function parseOutline(text: string): ParsedItem[] {
  const out: ParsedItem[] = [];
  let chapter = "";
  let marks: number | undefined;
  let sections = 0;
  let units = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const oc = chapterOf(line);
    if (oc) {
      units++;
      chapter = oc;
      continue;
    }
    const sm = line.match(/^(\d{1,2})\s*[- ]?marks?\b.*$/i);
    if (sm && line.length < 60) {
      marks = Number(sm[1]);
      sections++;
      continue;
    }
    if (/^(essay|long|short|descriptive)\b.*questions?\b/i.test(line) && line.length < 60) {
      marks = /short/i.test(line) ? undefined : LONG_MARKS;
      sections++;
      continue;
    }
    if (!chapter) continue;
    const numbered = /^\s*(?:q(?:uestion)?\.?\s*)?\d{1,3}\s*[.)\]:-]\s*/i.test(line);
    const t = line.replace(/^\s*(?:q(?:uestion)?\.?\s*)?\d{1,3}\s*[.)\]:-]\s*/i, "").trim();
    // A question that wraps onto the next line: the next line starts in lower case, or the last one
    // stopped on a comma / joining word ("...functions with" + "input arguments...").
    const prev = out[out.length - 1];
    if (!numbered && prev && prev.chapter === chapter && prev.marks === marks && (/^[a-z(&*]/.test(t) || /,\s*$/.test(prev.text))) {
      prev.text = `${prev.text} ${t}`;
      continue;
    }
    if (line.length < 12) continue;
    if (t.length > 8) out.push({ text: t, chapter, marks });
  }
  return units >= 2 || (units >= 1 && sections >= 1) ? out : [];
}

/**
 * Pulls numbered questions out of plain text without any AI: instant and free.
 * Returns [] when the text doesn't look like a numbered list.
 */
/** Joins "Unit 2: Eigenvalues and" + "Quadratic Forms" when a unit / experiment heading wraps. */
function joinWrappedHeadings(text: string): string {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l || !chapterOf(l) || !DANGLING.test(l)) continue;
    let k = i + 1;
    while (k < lines.length && !lines[k].trim()) k++;
    const j = joinTitle(l, lines[k]);
    if (j) {
      lines[i] = j;
      lines.splice(i + 1, k - i);
    }
  }
  return lines.join("\n");
}

/** Common OCR slips in scanned lab manuals: joined words and misread letters. */
function fixOcr(t: string): string {
  return t
    .replace(/\b([A-Za-z]{5,})(of|with)\b/g, (m, a, b) => (/^(waterpro|bullet)/i.test(a) ? m : `${a} ${b}`))
    .replace(/\bW[vV]ith\b/g, "with")
    .replace(/\bH-1on\b/gi, "H-Ion")
    .replace(/\bPh\b/g, "pH")
    .replace(/\bMeteric\b/gi, "Metric")
    .replace(/\bAstandard\b/gi, "a Standard")
    .replace(/\bHydroxde\b/gi, "Hydroxide")
    .replace(/\bIchromate\b/gi, "Dichromate")
    .replace(/\bNylon\s*6[.,]\s*6\b/gi, "Nylon 6,6")
    .replace(/\bisthe\b/gi, "is the")
    .replace(/\b([Oo])fthe\b/g, "of the")
    .replace(/\b(how|of|for|is|do|in|on|with|what)(the|a|you)\b/gi, "$1 $2")
    .replace(/\bamixture\b/gi, "a mixture")
    .replace(/\btwO\b/g, "two")
    .replace(/\bHCI\s*Vs\b/g, "HCl vs")
    .replace(/\bHCI\b/g, "HCl")
    .replace(/(conductometric|potentiometric)(titration)/gi, "$1 $2")
    .replace(/\s{2,}/g, " ");
}

const SUP: Record<string, string> = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "−": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", n: "ⁿ", i: "ⁱ", x: "ˣ", y: "ʸ" };
const SUB: Record<string, string> = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋", "−": "₋", "=": "₌", "(": "₍", ")": "₎", a: "ₐ", e: "ₑ", o: "ₒ", x: "ₓ", n: "ₙ" };
/** H_2O → H₂O, Ca^(2+) → Ca²⁺ when every character has a small form; otherwise keeps ^( ) / _( ). */
function smallScripts(t: string): string {
  const conv = (body: string, map: Record<string, string>) => ([...body].every((c) => map[c]) ? [...body].map((c) => map[c]).join("") : null);
  return t
    .replace(/\^\(([^()]{1,10})\)|\^([0-9+\-−nixy])/g, (m, a, b) => conv(a ?? b, SUP) ?? m)
    .replace(/_\(([^()]{1,10})\)|_([0-9+\-−aeoxn])/g, (m, a, b) => conv(a ?? b, SUB) ?? m);
}

/** Tidies one question: e^(sin x) style powers, spacing around punctuation. */
function tidy(t: string): string {
  return smallScripts(fixOcr(t))
    .replace(/\s+([,.;:?!)\]])/g, "$1")
    .replace(/([(\[])\s+/g, "$1")
    .replace(/\^\((\S)\)/g, "^$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function parseQuestions(text: string): ParsedItem[] {
  return parseAll(joinWrappedHeadings(text)).map((q) => ({ ...q, text: tidy(q.text), chapter: q.chapter ? tidy(q.chapter) : q.chapter }));
}

function parseAll(text: string): ParsedItem[] {
  const marked = parseMarkedBank(text);
  if (marked.length >= 3) return marked;
  const table = parseTableBank(text);
  if (table.length >= 3) return table;
  const lab = parseExperimentBank(text);
  if (lab.length >= 3) return lab;
  const outline = parseOutline(text);
  if (outline.length >= 3) return outline;
  const lines = text.split(/\r?\n/);
  const out: ParsedItem[] = [];
  let chapter = "";
  let sectionMarks: number | undefined;
  let cur: ParsedItem | null = null;
  const flush = () => {
    if (cur) {
      cur.text = cur.text.replace(/\s+/g, " ").trim();
      cur.marks = cur.marks ?? marksIn(cur.text) ?? sectionMarks;
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
    const sm = line.match(/^(\d{1,2})\s*[- ]?marks?\b.*$/i);
    if (sm && line.length < 60) {
      flush();
      sectionMarks = Number(sm[1]);
      continue;
    }
    if (/^(essay|long|descriptive)\b.*questions?/i.test(line) && line.length < 60) {
      flush();
      sectionMarks = LONG_MARKS;
      continue;
    }
    const ch = NUMBERED.test(line) ? null : chapterOf(line);
    if (ch) {
      flush();
      chapter = ch;
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

/** Joins lines that are really one sentence wrapped by the PDF (next line starts in lower case, or the last ended on a comma). */
export function reflowLines(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const l = raw.trim();
    if (!l) {
      out.push("");
      continue;
    }
    const prev = out[out.length - 1];
    if (prev && (/^[a-z(&*]/.test(l) || /,\s*$/.test(prev))) out[out.length - 1] = `${prev} ${l}`;
    else out.push(l);
  }
  return out.filter(Boolean);
}
