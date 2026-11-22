import { NextResponse } from "next/server";
import { GEMINI_MODEL, callGeminiFlashWithThinking, resolveGeminiApiKey } from "@/lib/ai/gemini-client";

/** GET /api/ai/status            -> is a key configured?
 *  GET /api/ai/status?check=1    -> also makes a tiny real call so you can see if the key works. */
export async function GET(req: Request) {
  const apiKey = resolveGeminiApiKey(req);
  const isConfigured = Boolean(apiKey);
  const check = new URL(req.url).searchParams.get("check");
  let working: boolean | undefined;
  let detail: string | undefined;
  if (isConfigured && check) {
    try {
      const out = await callGeminiFlashWithThinking({ prompt: "Reply with the word OK.", apiKey, responseMimeType: "text/plain" });
      working = /ok/i.test(out);
      detail = working ? "Gemini answered." : `Unexpected reply: ${out.slice(0, 80)}`;
    } catch (e) {
      working = false;
      detail = e instanceof Error ? e.message : String(e);
    }
  }
  return NextResponse.json({
    configured: isConfigured,
    working,
    detail,
    model: GEMINI_MODEL,
    message: !isConfigured
      ? "GEMINI_API_KEY is missing on this server. Locally: put it in .env.local and restart npm run dev. On Vercel: Project Settings > Environment Variables > add GEMINI_API_KEY, then Redeploy."
      : working === false
        ? "The key is set but Google rejected it. Create a fresh key in Google AI Studio, put it in GEMINI_API_KEY, and redeploy. See the detail line for Google's exact reason."
        : "Gemini API is ready",
  });
}
