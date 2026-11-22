import { NextRequest, NextResponse } from "next/server";
import { callGeminiFlashWithThinking, resolveGeminiApiKey } from "@/lib/ai/gemini-client";

export const maxDuration = 60;

/** Splits today's study minutes across subjects/chapters. The app then picks the exact questions. */
export async function POST(req: NextRequest) {
  const apiKey = resolveGeminiApiKey(req);
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is missing on this server." }, { status: 503 });
  try {
    const body = await req.json();
    const subjects = (Array.isArray(body.subjects) ? body.subjects : []).slice(0, 25);
    const budget = Math.max(20, Math.min(720, Number(body.budgetMin) || 120));
    if (!subjects.length) return NextResponse.json({ error: "No open questions to plan." }, { status: 400 });

    const prompt = `You are a study coach for a JNTUH first-year B.Tech student preparing for exams.
Today she has about ${budget} minutes of study time left. Here is what is still not mastered, per subject and chapter
(open = questions left, weak = scored low before, untried = never attempted, avgMin = minutes per question, daysLeft = days to that subject's next exam or null):
${JSON.stringify(subjects)}

Plan TODAY only. Split the minutes across subjects and chapters:
- Subjects with closer exams and more weak questions get more time; don't ignore a subject whose exam is very close.
- Prefer finishing weak and untried questions in a chapter over spreading thin; 2-6 blocks total.
- count * avgMin for all blocks should add up to roughly ${budget} minutes. Never exceed "open" for a chapter.
- Use the exact subject "id" and chapter "name" strings given ("" means no chapter).
Return JSON only:
{"blocks":[{"subjectId":"...","chapter":"...","count":3,"why":"short reason, max 8 words"}],"message":"one encouraging sentence about today's plan"}`;

    const text = await callGeminiFlashWithThinking({ prompt, apiKey, responseMimeType: "application/json", thinkingBudget: 1024 });
    const parsed = JSON.parse(text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim());
    return NextResponse.json({ blocks: Array.isArray(parsed.blocks) ? parsed.blocks : [], message: String(parsed.message ?? "") });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return NextResponse.json({ error: `Gemini couldn't plan right now${msg ? `: ${msg.slice(0, 160)}` : ""}` }, { status: 502 });
  }
}
