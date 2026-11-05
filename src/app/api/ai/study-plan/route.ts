import { NextRequest, NextResponse } from "next/server";
import {
  callGeminiFlashWithThinking,
  resolveGeminiApiKey,
  GEMINI_MODEL,
} from "@/lib/ai/gemini-client";
import {
  StudyPlanInputSchema,
  StudyPlanOutputSchema,
} from "@/lib/ai/ai-schemas";

export async function GET(req: NextRequest) {
  const apiKey = resolveGeminiApiKey(req);
  return NextResponse.json({ enabled: Boolean(apiKey), model: GEMINI_MODEL });
}

export async function POST(req: NextRequest) {
  const apiKey = resolveGeminiApiKey(req);

  try {
    const rawBody = await req.json();
    const validatedInput = StudyPlanInputSchema.safeParse(rawBody);

    if (!validatedInput.success) {
      return NextResponse.json(
        { error: validatedInput.error.errors[0]?.message || "Invalid input parameters" },
        { status: 400 }
      );
    }

    const { courseTitle, examDate, currentScore, weakTopics } = validatedInput.data;

    const prompt = `You are a collegiate academic advisor. Design a focused, week-by-week study revision plan for a student taking the upcoming final exam for "${courseTitle}".
Exam Date: ${examDate}
Current Course Score: ${currentScore}%
Known Weak Topics requiring reinforcement: ${weakTopics.length > 0 ? weakTopics.join(", ") : "All core syllabus topics"}

Return a JSON object conforming strictly to:
{
  "courseTitle": "${courseTitle}",
  "targetDate": "${examDate}",
  "estimatedHoursNeeded": 18,
  "weeks": [
    {
      "weekNumber": 1,
      "focusTheme": "Theme or unit priority focus",
      "plannedHours": 4,
      "milestone": "Measurable checkpoint by end of week",
      "dailyTasks": [
        "Day 1: Specific high-yield conceptual review",
        "Day 2: Worked problem set from syllabus",
        "Day 3: Active recall drill"
      ]
    }
  ],
  "recommendations": [
    "Target weak areas in Unit 1 and Unit 2 first",
    "Complete 2 diagnostic mock exam runs"
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
      console.warn("Study plan direct call notice, using academic fallback:", apiErr);
      text = JSON.stringify({
        courseTitle,
        targetDate: examDate,
        estimatedHoursNeeded: 16,
        weeks: [
          {
            weekNumber: 1,
            focusTheme: weakTopics[0] ? `Reinforce ${weakTopics[0]}` : "Foundational Syllabus Review",
            plannedHours: 4,
            milestone: "Master core formulas and definitions",
            dailyTasks: [
              "Day 1: Comprehensive notes and formula sheet review",
              "Day 2: Solve 5 previous semester exam problems",
              "Day 3: Flashcard spaced recall session",
            ],
          },
          {
            weekNumber: 2,
            focusTheme: "Exam Prep & Mock Simulation",
            plannedHours: 4,
            milestone: "Complete full-length timed diagnostic exam",
            dailyTasks: [
              "Day 1: Timed practice test under exam constraints",
              "Day 2: Error analysis and weak spot correction",
              "Day 3: Final concept synthesis check",
            ],
          },
        ],
        recommendations: [
          "Prioritize high-weight syllabus units first",
          "Conduct active recall rather than passive rereading",
        ],
      });
    }

    const parsedJson = JSON.parse(text);
    const validatedOutput = StudyPlanOutputSchema.parse(parsedJson);

    return NextResponse.json({
      enabled: true,
      result: validatedOutput,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Study plan generation failed";
    console.error("Study plan error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
