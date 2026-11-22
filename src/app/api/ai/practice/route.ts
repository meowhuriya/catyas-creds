import { NextRequest, NextResponse } from "next/server";
import { callGeminiFlashWithThinking, resolveGeminiApiKey } from "@/lib/ai/gemini-client";

export const maxDuration = 60;

const SIMPLE = "Use simple, clear English a first-year student understands.";

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
  for (const img of (Array.isArray(body.images) ? body.images : []).slice(0, 8)) {
    if (img?.mimeType && img?.data) {
      images.push({ mimeType: String(img.mimeType), data: String(img.data) });
      read++;
    }
  }
  return { images, read, skipped, noteText: String(body.text ?? "").slice(0, 60000) };
}

const NOTHING =
  "I couldn't read anything from this. Write a few lines in the note, add photos, or share the Drive file / Google Doc as 'Anyone with the link'.";

export async function POST(req: NextRequest) {
  const apiKey = resolveGeminiApiKey(req);
  if (!apiKey) return NextResponse.json({ error: "AI isn't set up on this server yet: GEMINI_API_KEY is missing. On Vercel add it under Settings > Environment Variables and redeploy; locally put it in .env.local and restart npm run dev." }, { status: 503 });

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
      const isBank = body.kind === "questions";
      const ask = isBank
        ? `This material is a question bank / previous papers. List EVERY question as its own item, in order, across all units/chapters.
- "text": the question exactly as written (fix obvious typos; drop the number). If a question has parts (a), (b), keep them together as one item unless they are clearly separate questions.
- "chapter": the unit/chapter/module heading it falls under (e.g. "Unit 2: Matrices"), or "" if none.
- "marks": marks if shown or clearly implied (2, 3, 5, 10...), else 0.
Skip instructions, headers and answers. Do not invent questions.`
        : `List the distinct exam topics and subtopics this material covers, in order. 4 to 30 items.
- "text": a specific topic under 10 words (e.g. "Rank of a matrix by echelon form", not "Matrices").
- "chapter": the unit/chapter it belongs to, or "".
- "marks": 0.`;
      const prompt = `You are helping a JNTUH (R25) first-year B.Tech student turn study material into a revision checklist.
Subject: ${String(body.subject ?? "").slice(0, 200)}
${noteText ? `Material:\n"""\n${noteText}\n"""` : "Use the attached material."}

${ask}
Return JSON only: {"items": [{"text": "...", "chapter": "...", "marks": 0}]}`;
      const text = await callGeminiFlashWithThinking({ prompt, apiKey, responseMimeType: "application/json", images, thinkingBudget: 0 });
      const parsed = parseJson(text);
      const items = (Array.isArray(parsed?.items) ? parsed.items : [])
        .map((x: any) => (typeof x === "string" ? { text: x } : x))
        .map((x: any) => ({ text: String(x?.text ?? "").trim(), chapter: String(x?.chapter ?? "").trim() || undefined, marks: Number(x?.marks) || undefined }))
        .filter((x: any) => x.text)
        .slice(0, 400);
      if (items.length === 0) throw new Error("No items");
      return NextResponse.json({ items });
    }

    if (body.mode === "grade" || body.mode === "answer") {
      const question = String(body.question ?? "").slice(0, 2000);
      const marks = Number(body.marks) || 0;
      const reference = String(body.reference ?? "").slice(0, 20000);
      const typed = String(body.studentAnswer ?? "").slice(0, 6000);
      const photos = (Array.isArray(body.images) ? body.images : []).slice(0, 4).filter((i: any) => i?.mimeType && i?.data);
      const length =
        marks >= 8 ? "a full long answer (about 1.5-2 pages: intro, headed points, diagram description if relevant, conclusion)"
        : marks >= 4 ? "a medium answer (about half a page, key points)"
        : marks > 0 ? "a short answer (3-5 lines)"
        : "an answer of the length this question normally needs in a JNTUH exam";
      const modelAnswerRule = `Write "modelAnswer" the way a JNTUH professor expects for ${marks ? `${marks} marks` : "this question"}: ${length}. Use headings/points, formulas and steps where needed. ${SIMPLE}`;
      if (body.mode === "answer") {
        const prompt = `Subject: ${String(body.subject ?? "").slice(0, 200)}
Question: ${question}
${reference ? `Student's own notes (use them where relevant):\n"""\n${reference}\n"""` : ""}
${modelAnswerRule}
Also write "simple": the same idea explained in 3-5 very simple sentences, like explaining to a friend.
Return JSON only: {"modelAnswer": "...", "simple": "..."}`;
        const text = await callGeminiFlashWithThinking({ prompt, apiKey, responseMimeType: "application/json" });
        return NextResponse.json(parseJson(text));
      }
      if (!typed.trim() && photos.length === 0) return NextResponse.json({ error: "Type your answer or add a photo of it." }, { status: 400 });
      const prompt = `You are a fair JNTUH examiner. A first-year B.Tech student answered from memory (no book).
Subject: ${String(body.subject ?? "").slice(0, 200)}
Question${marks ? ` (${marks} marks)` : ""}: ${question}
${reference ? `Student's study notes for reference (the truth to compare against, where relevant):\n"""\n${reference}\n"""` : ""}
${typed.trim() ? `Student's typed answer:\n"""\n${typed}\n"""` : ""}
${photos.length ? `The student's handwritten answer is in the attached photo(s). Read it carefully. If some words are unreadable, say so in feedback but still grade what you can read.` : ""}

Grade it out of 10 like a real exam (content, key points, correctness, structure; for long answers also headings and diagrams).
${modelAnswerRule}
Return JSON only:
{"score": <0-10 integer>, "verdict": "<one short line>", "good": ["what they did well"], "missing": ["important point they missed or got wrong"], "tip": "<one practical tip to score more next time>", "modelAnswer": "...", "simple": "<the idea in 3-5 very simple sentences>"}`;
      const text = await callGeminiFlashWithThinking({ prompt, apiKey, responseMimeType: "application/json", images: photos });
      return NextResponse.json(parseJson(text));
    }

    if (body.mode === "twist") {
      const qs = (Array.isArray(body.questions) ? body.questions : []).slice(0, 20).map((q: any) => ({ text: String(q?.text ?? "").slice(0, 600), marks: Number(q?.marks) || 0 }));
      if (qs.length === 0) return NextResponse.json({ error: "No questions to twist." }, { status: 400 });
      const prompt = `These are questions from a JNTUH question bank (subject: ${String(body.subject ?? "").slice(0, 200)}).
${qs.map((q: any, i: number) => `${i + 1}. ${q.text}${q.marks ? ` (${q.marks}M)` : ""}`).join("\n")}

For EACH question write one new exam question that tests the SAME concept but is asked differently (different angle, application, numbers or wording), the way an examiner might twist it. Keep the same marks.
Return JSON only: {"questions": [{"text": "...", "marks": 0, "from": <index starting at 1>}]}`;
      const text = await callGeminiFlashWithThinking({ prompt, apiKey, responseMimeType: "application/json" });
      return NextResponse.json(parseJson(text));
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
    const msg = err instanceof Error ? err.message : "";
    const keyProblem = /api key|permission|unauth|invalid|403|401/i.test(msg);
    return NextResponse.json(
      { error: keyProblem ? `Google rejected the Gemini key: ${msg.slice(0, 160)}` : "Gemini couldn't do that right now. Try again in a moment." },
      { status: 502 }
    );
  }
}
