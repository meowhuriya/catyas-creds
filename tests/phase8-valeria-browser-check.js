const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

async function run() {
  console.log("🚀 Starting Phase 8 Browser & API Verification...");

  const artifactDir = "/Users/huriyafatima/.gemini/antigravity/brain/a1ba62d4-a183-4a80-bd36-8c81b79e1a5e";
  const publicDir = "/Users/huriyafatima/catyas-creds/public";

  // 1. DIRECT API ENDPOINT VERIFICATION (Graceful Fallback & Schemas)
  console.log("📡 1. Testing AI Server Route Handlers without GEMINI_API_KEY...");

  const statusRes = await fetch("http://localhost:3000/api/ai/status");
  const statusData = await statusRes.json();
  if (statusData.configured !== false) {
    throw new Error("Expected configured: false when GEMINI_API_KEY is unset");
  }
  if (!statusData.message.includes("Gemini API key not configured")) {
    throw new Error("Missing informative unconfigured message in /api/ai/status");
  }
  console.log("✓ /api/ai/status returned expected unconfigured status and model reference.");

  const routes = [
    { url: "/api/ai/course-builder", body: { syllabusText: "Sample test syllabus text" } },
    { url: "/api/ai/quick-check", body: { topicTitle: "Linear Algebra" } },
    { url: "/api/ai/topic-chat", body: { topicTitle: "Matrix Rank", action: "explain" } },
    { url: "/api/ai/study-plan", body: { courseTitle: "Matrices", examDate: "2026-12-01", currentScore: 50, weakTopics: [] } },
    { url: "/api/ai/tidy-topics", body: { rawTopics: ["1. Test topic"] } },
  ];

  for (const r of routes) {
    const res = await fetch(`http://localhost:3000${r.url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r.body),
    });
    if (res.status !== 503) {
      throw new Error(`Expected status 503 for ${r.url} when unconfigured, got ${res.status}`);
    }
    const data = await res.json();
    if (!data.error.includes("Gemini API key not configured")) {
      throw new Error(`Expected graceful error message for ${r.url}, got: ${data.error}`);
    }
    console.log(`✓ ${r.url} returned 503 with standard unconfigured guidance.`);
  }

  // 2. PLAYWRIGHT BROWSER UI VERIFICATION
  console.log("🌐 2. Launching browser for AI UI verification...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Test A: Course Builder from Syllabus Modal on /courses
  console.log("Testing Course Builder from Syllabus on /courses...");
  await page.goto("http://localhost:3000/courses", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("button:has-text('Draft with AI')");
  await page.click("button:has-text('Draft with AI')");

  await page.waitForSelector("h2:has-text('AI Course Builder from Syllabus')");
  const builderText = await page.innerText("body");
  if (!builderText.includes("Gemini API key not configured")) {
    throw new Error("Missing unconfigured notice in AI Course Builder modal");
  }

  const courseBuilderPath = path.join(publicDir, "phase8-ai-course-builder.png");
  await page.screenshot({ path: courseBuilderPath });
  fs.copyFileSync(courseBuilderPath, path.join(artifactDir, "phase8-ai-course-builder.png"));
  console.log("📸 Saved phase8-ai-course-builder.png");

  // Close modal
  await page.click("button:has-text('Cancel')");

  // Test B: Topic AI Assistant Modal on /courses/course-ma101bs
  console.log("Testing Topic AI Assistant Modal on course detail page...");
  await page.goto("http://localhost:3000/courses/course-ma101bs", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("button:has-text('AI')");

  // Click AI button on first topic
  const firstAiBtn = page.locator("button:has-text('AI')").first();
  await firstAiBtn.click();

  await page.waitForSelector("h2:has-text('Topic AI Assistant:')");
  await page.waitForSelector("button:has-text('Explain Simply')");
  await page.waitForSelector("button:has-text('Test Me')");
  await page.waitForSelector("button:has-text('Flashcards')");

  const topicAiText = await page.innerText("body");
  if (!topicAiText.includes("Gemini API key not configured")) {
    throw new Error("Missing unconfigured notice in Topic AI Assistant modal");
  }

  // Click tabs to verify responsiveness
  await page.click("button:has-text('Test Me')");
  await page.waitForTimeout(300);
  await page.click("button:has-text('Flashcards')");
  await page.waitForTimeout(300);

  const topicAssistantPath = path.join(publicDir, "phase8-ai-topic-assistant.png");
  await page.screenshot({ path: topicAssistantPath });
  fs.copyFileSync(topicAssistantPath, path.join(artifactDir, "phase8-ai-topic-assistant.png"));
  console.log("📸 Saved phase8-ai-topic-assistant.png");

  // Close Topic AI modal
  await page.click("button:has-text('Close')");

  // Test C: Quick Check AI Drafter Tab
  console.log("Testing Quick Check Modal AI Draft tab...");
  const firstCheckBtn = page.locator("button:has-text('Check')").first();
  await firstCheckBtn.click();

  await page.waitForSelector("button:has-text('Draft with AI')");
  await page.click("button:has-text('Draft with AI')");

  const quickCheckAiText = await page.innerText("body");
  if (!quickCheckAiText.includes("Gemini API key not configured")) {
    throw new Error("Missing unconfigured notice in Quick Check AI draft tab");
  }

  const quickCheckPath = path.join(publicDir, "phase8-ai-quick-check.png");
  await page.screenshot({ path: quickCheckPath });
  fs.copyFileSync(quickCheckPath, path.join(artifactDir, "phase8-ai-quick-check.png"));
  console.log("📸 Saved phase8-ai-quick-check.png");

  // Close Quick Check modal
  await page.click("button[aria-label='Close'], button:has-text('Close'), button:has-text('Back to Check')");
  await page.keyboard.press("Escape");

  // Test D: AI Study Plan Modal on /planner
  console.log("Testing AI Study Plan Drafter on /planner...");
  await page.goto("http://localhost:3000/planner", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("button:has-text('Draft Plan with AI')");
  await page.click("button:has-text('Draft Plan with AI')");

  await page.waitForSelector("h2:has-text('AI Exam Study Plan Drafter')");
  const studyPlanText = await page.innerText("body");
  if (!studyPlanText.includes("Gemini API key not configured")) {
    throw new Error("Missing unconfigured notice in AI Exam Study Plan Drafter");
  }

  const studyPlanPath = path.join(publicDir, "phase8-ai-study-plan.png");
  await page.screenshot({ path: studyPlanPath });
  fs.copyFileSync(studyPlanPath, path.join(artifactDir, "phase8-ai-study-plan.png"));
  console.log("📸 Saved phase8-ai-study-plan.png");

  // Close Study Plan modal
  await page.click("button:has-text('Cancel')");

  await browser.close();
  console.log("🎉 Phase 8 Verification Completed Successfully!");
}

run().catch((err) => {
  console.error("❌ Phase 8 Verification Failed:", err);
  process.exit(1);
});
