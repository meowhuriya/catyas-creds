import { NextRequest, NextResponse } from "next/server";
import {
  callGeminiFlashWithThinking,
  resolveGeminiApiKey,
  GEMINI_MODEL,
} from "@/lib/ai/gemini-client";
import {
  TidyTopicsInputSchema,
  TidyTopicsOutputSchema,
} from "@/lib/ai/ai-schemas";

export async function GET(req: NextRequest) {
  const apiKey = resolveGeminiApiKey(req);
  return NextResponse.json({ enabled: Boolean(apiKey), model: GEMINI_MODEL });
}

export async function POST(req: NextRequest) {
  const apiKey = resolveGeminiApiKey(req);

  try {
    const rawBody = await req.json();
    const validatedInput = TidyTopicsInputSchema.safeParse(rawBody);

    if (!validatedInput.success) {
      return NextResponse.json(
        { error: validatedInput.error.errors[0]?.message || "Invalid input parameters" },
        { status: 400 }
      );
    }

    const { rawTopics } = validatedInput.data;

    const prompt = `You are a university academic registrar polishing course syllabus topics.
Clean each raw topic title:
- Remove numbering prefixes (e.g. "1. ", "a) ")
- Remove lecture hour markers (e.g. "8 L", "10 Hours", "6 hrs")
- Remove trailing punctuation (periods, semicolons)
- Capitalize properly and ensure standard academic formatting.
- Preserve the precise technical subject matter.

Raw Topics:
${JSON.stringify(rawTopics, null, 2)}

Return a JSON object conforming strictly to:
{
  "refinedTopics": [
    {
      "original": "Original raw string",
      "cleaned": "Cleaned canonical academic topic title"
    }
  ]
}`;

    let text = "";
    try {
      text = await callGeminiFlashWithThinking({
        prompt,
        apiKey,
        responseMimeType: "application/json",
      });
    } catch (apiErr) {
      console.warn("Tidy topics notice, using algorithmic cleaner fallback:", apiErr);
      text = JSON.stringify({
        refinedTopics: rawTopics.map((item) => {
          const raw = typeof item === "string" ? item : (item as any).title || "";
          const cleaned = raw
            .replace(/^(\d+[\.\)]|[a-zA-Z][\.\)])\s*/, "")
            .replace(/\[\d+L?\]|\(\d+L?\)|\b\d+\s*(hours?|hrs?|L)\b/gi, "")
            .replace(/[:;.]+$/, "")
            .trim();
          return { original: raw, cleaned: cleaned || raw };
        }),
      });
    }

    const parsedJson = JSON.parse(text);
    const validatedOutput = TidyTopicsOutputSchema.parse(parsedJson);

    return NextResponse.json({
      enabled: true,
      result: validatedOutput,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Tidy topics generation failed";
    console.error("Tidy topics error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
