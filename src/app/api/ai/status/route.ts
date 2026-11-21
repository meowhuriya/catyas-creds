import { NextResponse } from "next/server";
import { GEMINI_MODEL, resolveGeminiApiKey } from "@/lib/ai/gemini-client";

export async function GET(req: Request) {
  const apiKey = resolveGeminiApiKey(req);
  const isConfigured = Boolean(apiKey);
  return NextResponse.json({
    configured: isConfigured,
    model: GEMINI_MODEL,
    message: isConfigured
      ? "Gemini API is ready"
      : "Set GEMINI_API_KEY in .env.local to enable AI features",
  });
}
