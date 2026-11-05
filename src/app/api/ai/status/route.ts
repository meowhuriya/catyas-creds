import { NextResponse } from "next/server";
import { GEMINI_MODEL, resolveGeminiApiKey } from "@/lib/ai/gemini-client";

export async function GET(req: Request) {
  const apiKey = resolveGeminiApiKey(req);
  const isConfigured = Boolean(apiKey);
  return NextResponse.json({
    configured: isConfigured,
    model: GEMINI_MODEL,
    message: "Gemini API is ready",
  });
}
