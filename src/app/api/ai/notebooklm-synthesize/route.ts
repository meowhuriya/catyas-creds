import { NextRequest, NextResponse } from "next/server";
import { callGeminiFlashWithThinking, resolveGeminiApiKey } from "@/lib/ai/gemini-client";

interface SourceItem {
  id: string;
  title: string;
  content: string;
  type?: string;
}

interface SynthesizeRequestBody {
  mode: "briefing" | "study_guide" | "faq" | "audio_overview" | "chat";
  projectTitle: string;
  sources: SourceItem[];
  userQuery?: string;
  history?: Array<{ role: "user" | "model"; content: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const body: SynthesizeRequestBody = await req.json();
    const { mode, projectTitle, sources, userQuery, history } = body;

    if (!sources || sources.length === 0) {
      return NextResponse.json(
        { error: "At least one source is required to synthesize research." },
        { status: 400 }
      );
    }

    const apiKey = resolveGeminiApiKey(req);

    // Format all sources with clean Markdown indexing
    const formattedSources = sources
      .map(
        (src, idx) =>
          `[Source ${idx + 1}: "${src.title}" (${src.type || "Document"})]\n${src.content.trim()}`
      )
      .join("\n\n---\n\n");

    if (mode === "briefing") {
      const prompt = `You are NotebookLM's Senior Academic Synthesis Engine.
Synthesize an executive academic Briefing Document for the research project "${projectTitle}" based strictly on the provided research sources.

Sources provided:
${formattedSources}

Instructions:
1. Formulate an overarching Executive Summary (core thesis, research objectives, and fundamental premise).
2. Key Findings & Methodology: Break down the primary models, algorithms, empirical observations, or theoretical frameworks.
3. Comparative Analysis / Strengths & Trade-offs: Note limitations, boundary conditions, or edge cases.
4. Actionable Next Steps / Future Research Directions.
5. Ground every factual claim with explicit citations formatted like [Source 1] or [Source 2].

Format your response in structured Markdown with clean headings, bullet points, and bold terms.`;

      const result = await callGeminiFlashWithThinking({
        prompt,
        apiKey,
        responseMimeType: "text/plain",
        systemInstruction:
          "You are an expert academic research assistant grounded in NotebookLM methodology. Cite sources accurately. Never invent facts.",
      });

      return NextResponse.json({ markdown: result });
    }

    if (mode === "study_guide") {
      const prompt = `You are NotebookLM's Academic Study Guide Generator.
Generate a comprehensive, rigorous Academic Study Guide for the project "${projectTitle}" based strictly on the provided sources.

Sources provided:
${formattedSources}

Structure your response with:
1. **Core Concept Mastery Matrix**: Define the 4-6 most critical terms, formulas, or architecture components.
2. **Key Theorems, Algorithms & Formulas**: Trace the underlying logic or derivation steps.
3. **Synthesis & Comprehension Questions**: Provide 4 short-answer exam/interview questions followed immediately by bulleted model answers citing the exact sources.
4. **Glossary of Academic Terminology**: Concise, precise definitions of domain terms.

Ground claims with [Source 1], [Source 2], etc. Return well-formatted Markdown.`;

      const result = await callGeminiFlashWithThinking({
        prompt,
        apiKey,
        responseMimeType: "text/plain",
        systemInstruction:
          "You are a master academic curriculum designer producing publication-ready study guides grounded strictly in provided sources.",
      });

      return NextResponse.json({ markdown: result });
    }

    if (mode === "faq") {
      const prompt = `You are NotebookLM's FAQ Generator.
Generate 5 high-impact, technical Frequently Asked Questions (and detailed, grounded answers) for the project "${projectTitle}" using only the provided sources.

Sources:
${formattedSources}

Return a valid JSON array of objects with the exact schema:
[
  {
    "question": "string",
    "answer": "string",
    "citation": "Source 1, para 2"
  }
]`;

      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
            citation: { type: "string" },
          },
          required: ["question", "answer", "citation"],
        },
      };

      const result = await callGeminiFlashWithThinking({
        prompt,
        apiKey,
        responseMimeType: "application/json",
        responseSchema: schema,
      });

      let parsed = [];
      try {
        parsed = JSON.parse(result);
      } catch {
        parsed = [];
      }

      return NextResponse.json({ faq: parsed });
    }

    if (mode === "audio_overview") {
      const prompt = `You are the executive producer behind NotebookLM's world-famous "Audio Overview" Deep Dive podcasts.
Produce an engaging, lively, conversational podcast script between two academic co-hosts discussing the research project "${projectTitle}".

Hosts:
- **Alex**: The curious, perceptive host who sets the stage, uses intuitive real-world analogies, and asks the sharp "why does this matter?" questions.
- **Sam**: The analytical technical specialist who breaks down the exact mechanisms, algorithms, trade-offs, and empirical findings.

Source Material:
${formattedSources}

Format Rules:
1. Dynamic, natural conversational dialogue with vocal enthusiasm, natural interruptions, interjections ("Exactly!", "Right, but think about it this way...", "That's the crazy part!").
2. 8 to 14 dialogue turns in total.
3. Keep it accessible yet intellectually rigorous, referencing the specific concepts in the sources.
4. Provide a creative episode title and estimated duration.

Return a JSON object conforming exactly to this schema:
{
  "title": "string",
  "duration": "string (e.g. 3 min)",
  "dialogue": [
    {
      "speaker": "Alex",
      "text": "string",
      "emotion": "excited | curious | thoughtful | explanatory"
    },
    {
      "speaker": "Sam",
      "text": "string",
      "emotion": "excited | curious | thoughtful | explanatory"
    }
  ]
}`;

      const schema = {
        type: "object",
        properties: {
          title: { type: "string" },
          duration: { type: "string" },
          dialogue: {
            type: "array",
            items: {
              type: "object",
              properties: {
                speaker: { type: "string", enum: ["Alex", "Sam"] },
                text: { type: "string" },
                emotion: { type: "string" },
              },
              required: ["speaker", "text"],
            },
          },
        },
        required: ["title", "duration", "dialogue"],
      };

      const result = await callGeminiFlashWithThinking({
        prompt,
        apiKey,
        responseMimeType: "application/json",
        responseSchema: schema,
      });

      let parsedAudio;
      try {
        parsedAudio = JSON.parse(result);
      } catch {
        parsedAudio = {
          title: `${projectTitle} - Audio Overview`,
          duration: "3 min",
          dialogue: [
            {
              speaker: "Alex",
              text: `Welcome back to the lab briefing! Today we are taking a deep dive into ${projectTitle}.`,
              emotion: "curious",
            },
            {
              speaker: "Sam",
              text: `This is a fascinating breakdown. Looking across the sources, the core breakthrough is how this changes the fundamental performance trade-offs.`,
              emotion: "explanatory",
            },
          ],
        };
      }

      return NextResponse.json({ audioOverview: parsedAudio });
    }

    if (mode === "chat") {
      const q = userQuery || "Summarize the key findings.";
      const prompt = `You are NotebookLM's Grounded Academic Assistant.
Answer the following user query about the research project "${projectTitle}" based STRICTLY on the provided sources.

Query: "${q}"

Sources:
${formattedSources}

Instructions:
1. Provide a direct, technically precise answer.
2. Ground every non-trivial claim with explicit source citations like [Source 1] or [Source 2].
3. If the answer cannot be found in the sources, explicitly state: "Based on the provided research sources, this specific detail is not covered."

Return clean Markdown.`;

      const result = await callGeminiFlashWithThinking({
        prompt,
        apiKey,
        responseMimeType: "text/plain",
        systemInstruction:
          "You are an academic researcher. Ground all responses in the provided sources. Cite sources precisely with [Source X].",
      });

      return NextResponse.json({ answer: result });
    }

    return NextResponse.json({ error: "Unknown synthesis mode" }, { status: 400 });
  } catch (err: any) {
    console.error("NotebookLM synthesis error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to synthesize research" },
      { status: 500 }
    );
  }
}
