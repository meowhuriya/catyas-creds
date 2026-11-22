import { GoogleGenAI } from "@google/genai";

export const GEMINI_MODEL = "gemini-2.5-flash";
export const GEMINI_FALLBACK_MODEL = "gemini-2.0-flash";

/**
 * Resolves the Gemini API key. Order: per-request `x-gemini-key` header, then the
 * server-only GEMINI_API_KEY env var. Returns "" when no key is configured.
 * Never hardcode a key here, and never use a NEXT_PUBLIC_ variable (it ships to browsers).
 */
export function resolveGeminiApiKey(
  req?: { headers?: { get: (name: string) => string | null } } | null
): string {
  return req?.headers?.get("x-gemini-key") || process.env.GEMINI_API_KEY || "";
}

export function getGeminiClient(
  req?: { headers?: { get: (name: string) => string | null } } | null
): { client: GoogleGenAI | null; error: string | null } {
  const apiKey = resolveGeminiApiKey(req);
  if (!apiKey) {
    return { client: null, error: "GEMINI_API_KEY is not configured" };
  }
  return { client: new GoogleGenAI({ apiKey }), error: null };
}

export interface GeminiCallParams {
  prompt: string;
  apiKey?: string;
  responseMimeType?: "application/json" | "text/plain";
  responseSchema?: any;
  systemInstruction?: string;
  images?: Array<{ mimeType: string; data: string }>;
  thinkingBudget?: number;
}

export async function callGeminiFlashWithThinking({
  prompt,
  apiKey,
  responseMimeType = "application/json",
  responseSchema,
  systemInstruction,
  images = [],
  thinkingBudget = 8192,
}: GeminiCallParams): Promise<string> {
  const resolvedKey = apiKey || resolveGeminiApiKey();
  if (!resolvedKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  // Try gemini-2.5-flash with high thinking budget, then gemini-3.8-flash if 404
  const modelsToTry = [GEMINI_MODEL, GEMINI_FALLBACK_MODEL];
  let lastError: Error | null = null;
  let realError: Error | null = null; // first non-"model not found" failure: the one worth showing

  for (const model of modelsToTry) {
    try {
      const contentsParts: any[] = [];
      for (const img of images) {
        contentsParts.push({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data,
          },
        });
      }
      contentsParts.push({ text: prompt });

      const requestBody: any = {
        contents: [{ role: "user", parts: contentsParts }],
        generationConfig: {
          responseMimeType,
          thinkingConfig: { thinkingBudget },
        },
      };

      if (responseSchema) {
        requestBody.generationConfig.responseSchema = responseSchema;
      }
      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      // Try 1: x-goog-api-key header (Google's recommended way; works for AIza and newer AQ. keys)
      const base = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      let res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": resolvedKey },
        body: JSON.stringify(requestBody),
      });

      // Try 2: query parameter, then Bearer token, if the first was refused
      if (!res.ok && res.status !== 404) {
        const attempts: { url: string; headers: Record<string, string> }[] = [
          { url: `${base}?key=${resolvedKey}`, headers: { "Content-Type": "application/json" } },
          { url: base, headers: { "Content-Type": "application/json", Authorization: `Bearer ${resolvedKey}` } },
        ];
        for (const attempt of attempts) {
          try {
            const r = await fetch(attempt.url, { method: "POST", headers: attempt.headers, body: JSON.stringify(requestBody) });
            if (r.ok) {
              res = r;
              break;
            }
          } catch {}
        }
      }

      let data = await res.json();

      // Keys that start with "AQ." are often Vertex AI (express mode) keys: retry on the Vertex endpoint.
      if (data.error && data.error.code !== 404) {
        try {
          const vRes = await fetch(
            `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent?key=${resolvedKey}`,
            { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) }
          );
          const vData = await vRes.json();
          if (!vData.error) data = vData;
          else console.warn("[gemini] Vertex endpoint also failed:", vData.error?.message);
        } catch {}
      }

      if (data.error) {
        // If 404 model not found (e.g. gemini-2.5-flash deprecated for key), continue to fallback model
        if (data.error.code === 404 || data.error.status === "NOT_FOUND") {
          lastError = new Error(`Model ${model} not found: ${data.error.message}`);
          continue;
        }
        throw new Error(data.error.message || `Gemini API error: ${res.status}`);
      }

      const text = data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      lastError = err;
      if (err?.message?.includes("not found") || err?.message?.includes("404")) {
        continue;
      }
      if (!realError) realError = err;
    }
  }

  // Also attempt SDK fallback if direct REST encountered issue
  try {
    const ai = new GoogleGenAI({ apiKey: resolvedKey });
    const sdkRes = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: responseMimeType as any,
        responseSchema,
      },
    });
    if (sdkRes.text) return sdkRes.text;
  } catch (sdkErr: any) {
    try {
      const ai = new GoogleGenAI({ apiKey: resolvedKey });
      const sdkRes = await ai.models.generateContent({
        model: GEMINI_FALLBACK_MODEL,
        contents: prompt,
        config: {
          responseMimeType: responseMimeType as any,
          responseSchema,
        },
      });
      if (sdkRes.text) return sdkRes.text;
    } catch {}
  }

  throw realError || lastError || new Error("Gemini generation failed across all models");
}
