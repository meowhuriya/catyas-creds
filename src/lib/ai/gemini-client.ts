import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-3.8-flash";

export function getGeminiClient(): { client: GoogleGenAI; error: null } | { client: null; error: string } {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      client: null,
      error: "Gemini API key not configured. Add GEMINI_API_KEY to .env to enable AI features",
    };
  }
  return {
    client: new GoogleGenAI({ apiKey }),
    error: null,
  };
}
