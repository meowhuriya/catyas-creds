import { NextRequest, NextResponse } from "next/server";
import { callGeminiFlashWithThinking, resolveGeminiApiKey } from "@/lib/ai/gemini-client";

export const maxDuration = 60;

const MAX_PDF_BYTES = 12 * 1024 * 1024;

function parseJson(text: string): any {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

/**
 * Best-effort: read a link-shared Drive file / Google Doc / Slides / Sheet as PDF so Gemini can study it.
 * Only builds Google URLs from an extracted file id, never fetches arbitrary hosts.
 */
function exportUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host === "docs.google.com") {
    const m = u.pathname.match(/^\/(document|presentation|spreadsheets)\/d\/([\w-]{10,})/);
    if (!m) return null;
    if (m[1] === "presentation") return `https://docs.google.com/presentation/d/${m[2]}/export/pdf`;
    return `https://docs.google.com/${m[1]}/d/${m[2]}/export?format=pdf`;
  }
  if (host === "drive.google.com") {
    if (/\/folders\//.test(u.pathname)) return null;
    const id = u.pathname.match(/\/file\/d\/([\w-]{10,})/)?.[1] ?? u.searchParams.get("id");
    return id && /^[\w-]{10,}$/.test(id) ? `https://drive.google.com/uc?export=download&id=${id}` : null;
  }
  return null;
}

async function fetchAsPdf(raw: string): Promise<{ mimeType: string; data: string } | null> {
  const url = exportUrl(raw);
  if (!url) return null;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    if (!type.includes("pdf")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_PDF_BYTES) return null;
    return { mimeType: "application/pdf", data: buf.toString("base64") };
  } catch {
    return null;
  }
}

async function gather(body: any) {
  const images: Array<{ mimeType: string; data: string }> = [];
  let read = 0;
  let skipped = 0;
  const links: string[] = Array.isArray(body.links)
    ? body.links.map(String)
    : (Array.isArray(body.driveIds) ? body.driveIds : []).map((id: string) => `https://drive.google.com/file/d/${id}/view`);
  for (const link of links.slice(0, 3)) {
    const pdf = await fetchAsPdf(link);
    if (pdf) {
      images.push(pdf);
      read++;
    } else skipped++;
  }
  for (const img of (Array.isArray(body.images) ? body.images : []).slice(0, 4)) {
    if (img?.mimeType && img?.data) {
      images.push({ mimeType: String(img.mimeType), data: String(img.data) });
      read++;
    }
  }
  return { images, read, skipped, noteText: String(body.text ?? "").slice(0, 20000) };
}

const NOTHING =
  "I couldn't read anything from this. Write a few lines in the note, add photos, or share the Drive file / Google Doc as 'Anyone with the link'.";

export async function POST(req: NextRequest) {
  const apiKey = resolveGeminiApiKey(req);
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 503 });

  try {
    const body = await req.json();

    if (body.mode === "check") {
      const prompt = `You are a strict but kind JNTUH examiner marking a student's answer.
Subject: ${String(body.subject ?? "").slice(0, 200)}
Question: ${String(body.question ?? "").slice(0, 1500)}
Reference answer: ${String(body.modelAnswer ?? "").slice(0, 3000)}
Student's answer: ${String(body.studentAnswer ?? "").slice(0, 3000)}

Return JSON only: {"score": <0-10 integer>, "verdict": "<one short line>", "feedback": "<2-4 simple sentences on what was good and what to fix>", "missing": ["key point missed", "..."]}`;
      const text = await callGeminiFlashWithThinking({ prompt, apiKey, responseMimeType: "application/json" });
      return NextResponse.json(parseJson(text));
    }

    if (body.mode === "extract") {
      const { images, noteText } = await gather(body);
      if (!noteText.trim() && images.length === 0) return NextResponse.json({ error: NOTHING }, { status: 422 });
      const ask =
        body.kind === "questions"
          ? `This material is a question bank or exam paper. List EVERY question as its own item, in order. Keep the question number and marks if shown (e.g. "Q3 (10M): Explain ..."). Shorten very long questions to under 160 characters but keep their meaning. Skip instructions, headers and answers.`
          : `List the distinct exam topics and subtopics this material covers, in the order they appear. 4 to 25 items, each under 10 words, specific (e.g. "Rank of a matrix by echelon form", not "Matrices").`;
      const prompt = `You are helping a JNTUH first-year B.Tech student build a revision checklist.
Subject: ${String(body.subject ?? "").slice(0, 200)}
${noteText ? `Notes:\n"""\n${noteText}\n"""` : "Use the attached material."}

${ask}
Return JSON only: {"items": ["...", "..."]}`;
      const text = await callGeminiFlashWithThinking({ prompt, apiKey, responseMimeType: "application/json", images });
      const parsed = parseJson(text);
      const items = (Array.isArray(parsed?.items) ? parsed.items : []).map((x: unknown) => String(x).trim()).filter(Boolean).slice(0, 80);
      if (items.length === 0) throw new Error("No items");
      return NextResponse.json({ items });
    }

    const count = Math.min(Math.max(Number(body.count) || 5, 3), 12);
    const kind: string = ["mcq", "short", "viva", "mix"].includes(body.kind) ? body.kind : "mix";
    const { images, read, skipped, noteText } = await gather(body);

    if (!noteText.trim() && images.length === 0) {
      return NextResponse.json({ error: NOTHING }, { status: 422 });
    }

    const kindRule =
      kind === "mcq"
        ? "All questions must be type mcq."
        : kind === "short"
          ? "All questions must be type short (answer in 3-6 lines, like a university exam)."
          : kind === "viva"
            ? "All questions must be type viva (short spoken-style questions with crisp answers)."
            : "Mix of mcq, short and viva questions.";

    const prompt = `You are an experienced JNTUH (R25) professor setting practice questions for a first-year B.Tech student.
Subject: ${String(body.subject ?? "").slice(0, 200)}
Note title: ${String(body.noteTitle ?? "").slice(0, 200)}
${noteText ? `Student's notes:\n"""\n${noteText}\n"""` : "Use the attached study material."}

Create ${count} questions strictly based on this material. ${kindRule}
Write in simple English. Return JSON only:
{"questions":[{"type":"mcq"|"short"|"viva","prompt":"...","options":["A","B","C","D"] (mcq only),"answer":"exact correct option text for mcq, or a model answer for short/viva","explanation":"simple-words explanation","topic":"2-4 word topic name","note":"title of the note (the # heading) this question came from"}]}`;

    const text = await callGeminiFlashWithThinking({
      prompt,
      apiKey,
      responseMimeType: "application/json",
      images,
    });
    const parsed = parseJson(text);
    if (!Array.isArray(parsed?.questions) || parsed.questions.length === 0) throw new Error("No questions returned");
    return NextResponse.json({ questions: parsed.questions, sources: { read, skipped } });
  } catch (err) {
    console.error("practice route error", err);
    return NextResponse.json({ error: "Gemini couldn't generate that right now. Try again in a moment." }, { status: 502 });
  }
}
