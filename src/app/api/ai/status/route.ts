import { NextResponse } from "next/server";
import { GEMINI_MODEL } from "@/lib/ai/gemini-client";

export async function GET() {
  const isConfigured = Boolean(process.env.GEMINI_API_KEY);
  return NextResponse.json({
    configured: isConfigured,
    model: GEMINI_MODEL,
    message: isConfigured
      ? "Gemini API is ready"
      : "Gemini API key not configured. Add GEMINI_API_KEY to .env to enable AI features",
  });
}
