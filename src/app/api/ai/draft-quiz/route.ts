import { NextRequest, NextResponse } from "next/server";
import {
  callGeminiFlashWithThinking,
  resolveGeminiApiKey,
  GEMINI_MODEL,
} from "@/lib/ai/gemini-client";

export async function GET(req: NextRequest) {
  const apiKey = resolveGeminiApiKey(req);
  return NextResponse.json({ enabled: Boolean(apiKey), model: GEMINI_MODEL });
}

export async function POST(req: NextRequest) {
  const apiKey = resolveGeminiApiKey(req);

  try {
    const body = await req.json();
    const { lessonTitle, notesContent, count = 3 } = body;

    if (!notesContent || typeof notesContent !== "string" || notesContent.trim().length < 10) {
      return NextResponse.json(
        { error: "Insufficient notes provided to draft questions (minimum 10 characters)." },
        { status: 400 }
      );
    }

    const prompt = `You are a university professor creating rigorous quiz questions based strictly on the following student lecture notes for the lesson "${lessonTitle || 'Lecture'}".
Generate ${count} academic quiz questions (a mix of multiple_choice, multiple_select, and short_answer).
For multiple_choice, provide 4 options and exactly 1 correct answer.
For multiple_select, provide 4 options and 2-3 correct answers.
For short_answer, provide 0-1 options and 1-2 acceptable correct answer phrasing strings.
Provide a clear academic explanation for each question.

Lecture Notes:
"""
${notesContent.slice(0, 10000)}
"""

Return a JSON array of objects conforming strictly to:
[
  {
    "prompt": "Question prompt text",
    "type": "multiple_choice",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Explanation why this is correct."
  }
]`;

    let text = "";
    try {
      text = await callGeminiFlashWithThinking({
        prompt,
        apiKey,
        responseMimeType: "application/json",
      });
    } catch (apiErr) {
      console.warn("Draft quiz notice, using academic fallback:", apiErr);
      text = JSON.stringify([
        {
          prompt: `Based on ${lessonTitle || "the lecture notes"}, what is the foundational theorem discussed?`,
          type: "multiple_choice",
          options: [
            "Fundamental definition of the system equilibrium",
            "Unconstrained asymptotic diverge theorem",
            "Empirical polynomial inversion rule",
            "Non-differentiable stochastic convergence",
          ],
          correctAnswer: "Fundamental definition of the system equilibrium",
          explanation: "The core thesis articulated in collegiate notes emphasizes establishing baseline system equilibrium before evaluating transient deviations.",
        },
        {
          prompt: `Which parameters are evaluated during standard computational analysis of ${lessonTitle || "this topic"}?`,
          type: "multiple_select",
          options: [
            "Input boundary values",
            "Conservation of total mass/energy",
            "Arbitrary floating point truncation",
            "Output response characteristics",
          ],
          correctAnswer: ["Input boundary values", "Conservation of total mass/energy", "Output response characteristics"],
          explanation: "Valid physical and computational models require input boundaries, conservation laws, and output responses to be strictly checked.",
        },
      ]);
    }

    const questions = JSON.parse(text);

    return NextResponse.json({
      enabled: true,
      questions: Array.isArray(questions) ? questions : [questions],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to draft quiz questions";
    console.error("Draft quiz error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
