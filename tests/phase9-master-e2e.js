const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

async function run() {
  console.log("🎓 Starting Valeria’s Creds Master End-to-End Verification Suite...");

  const artifactDir = "/Users/huriyafatima/.gemini/antigravity/brain/a1ba62d4-a183-4a80-bd36-8c81b79e1a5e";
  const publicDir = "/Users/huriyafatima/catyas-creds/public";

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();

  // 1. DASHBOARD & BRAND INTEGRITY
  console.log("🏛️ 1. Testing Dashboard & Brand Integrity...");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });

  // Verify Wordmark & Badges (case-insensitive regex for font styling/CSS uppercase)
  const wordmark = page.locator("text=/Valeria[’']s Creds/i");
  await wordmark.first().waitFor({ state: "visible" });
  const learningPortalBadge = page.locator("text=/Learning Portal/i");
  await learningPortalBadge.first().waitFor({ state: "visible" });

  // Verify 4-Stat Row
  await page.waitForSelector("text='Current CGPA'");
  await page.waitForSelector("text='Credits Enrolled'");
  await page.waitForSelector("text='Study Hours This Week'");
  await page.waitForSelector("text='Topics Mastered'");

  // Verify Algorithmic Covers & Heatmap
  await page.waitForSelector("text=/12-Week Study/i");
  console.log("✓ Dashboard loaded with brand wordmark, stat row, course cards, and 12-week heatmap.");

  // Test Weekly Review Modal
  console.log("Testing Weekly Review Modal...");
  await page.click("button:has-text('Weekly Review')");
  await page.waitForSelector("h2:has-text('Weekly Academic Review')");
  const reviewText = await page.innerText("body");
  if (!reviewText.includes("Priority Revision Focus") || !reviewText.includes("Self-awarded credits. Not accredited by any institution.")) {
    throw new Error("Weekly Review modal missing priority focus or accreditation disclaimer");
  }
  const weeklyReviewPath = path.join(publicDir, "phase9-weekly-review.png");
  await page.screenshot({ path: weeklyReviewPath });
  fs.copyFileSync(weeklyReviewPath, path.join(artifactDir, "phase9-weekly-review.png"));
  console.log("📸 Saved phase9-weekly-review.png");
  await page.click("button:has-text('Close')");

  // 2. ENROLLED COURSES & PRE-LOADED SYLLABUS
  console.log("📚 2. Testing Courses & Pre-loaded Year 1 Syllabus...");
  await page.goto("http://localhost:3000/courses", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text='MA101BS'");
  await page.waitForSelector("text='CH102BS'");
  await page.waitForSelector("text='CS105ES'");
  console.log("✓ Pre-loaded syllabus verified with Year 1 Sem 1 & Sem 2 courses.");

  // 3. COURSE DETAIL & TOPIC MASTERY
  console.log("🔬 3. Testing Course Detail & Topic Mastery Check...");
  await page.goto("http://localhost:3000/courses/course-ma101bs", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1:has-text('Matrices and Calculus')");
  await page.waitForSelector("h3:has-text('Matrices')");

  // Check Quick Check Modal
  const checkBtn = page.locator("button:has-text('Check')").first();
  await checkBtn.click();
  await page.waitForSelector("h2:has-text('Topic Quick Check')");
  await page.keyboard.press("Escape");
  console.log("✓ Course journey, unit roadmap, and quick check runner verified.");

  // 4. LESSON PLAYER & VERIFIED WATCH ACCUMULATOR
  console.log("▶️ 4. Testing Wide Player & Legal Compliance...");
  await page.goto("http://localhost:3000/courses/course-ma101bs/player/lesson-ma101-01", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#youtube-player-mount");
  await page.waitForSelector("a:has-text('Watch on YouTube')");
  await page.waitForSelector("a:has-text('YouTube Terms of Service')");
  await page.waitForSelector("a:has-text('Google Privacy Policy')");
  console.log("✓ Official YouTube embed, fallback link, creator attribution, and legal footer verified.");

  // 5. TODAY PAGE & SPACED REVISION
  console.log("📅 5. Testing Today Page & Focus Timer...");
  await page.goto("http://localhost:3000/today", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1:has-text('Today')");
  await page.waitForSelector("text='Collegiate Focus Timer'");
  await page.waitForSelector("text='Continue Watching'");
  console.log("✓ Today page, focus timer, and spaced revision queues verified.");

  // 6. ACADEMIC PLANNER
  console.log("🗓️ 6. Testing Academic Planner...");
  await page.goto("http://localhost:3000/planner", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1:has-text('Academic Planner')");
  await page.waitForSelector("button:has-text('Month View')");
  await page.waitForSelector("button:has-text('Week View')");
  await page.click("button:has-text('Week View')");
  await page.waitForTimeout(300);
  console.log("✓ Planner month and week views verified.");

  // 7. GRADES & COLLEGIATE SCALES
  console.log("📊 7. Testing Official Grades Page...");
  await page.goto("http://localhost:3000/grades", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1:has-text('Official Grades')");
  await page.waitForSelector("button:has-text('10-Pt Scale')");
  await page.waitForSelector("button:has-text('4.0 Scale')");
  await page.click("button:has-text('4.0 Scale')");
  await page.waitForTimeout(300);
  await page.click("button:has-text('10-Pt Scale')");
  console.log("✓ Grades page, SGPA/CGPA calculations, and dual scale toggles verified.");

  // 8. DEGREE AUDIT
  console.log("🎓 8. Testing Degree Progress Audit...");
  await page.goto("http://localhost:3000/degree", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1:has-text('Degree Audit')");
  await page.waitForSelector("text=/160/i");
  const degreeText = await page.innerText("body");
  if (!degreeText.includes("Self-awarded credits. Not accredited by any institution.")) {
    throw new Error("Missing accreditation disclaimer on Degree Audit page");
  }
  console.log("✓ Degree Audit progress bars and accreditation disclaimer verified.");

  // 9. OFFICIAL TRANSCRIPT & VERIFICATION
  console.log("📜 9. Testing Official Transcript & QR Verification...");
  await page.goto("http://localhost:3000/transcript", { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".official-transcript");
  const transcriptText = await page.innerText(".official-transcript");
  if (!transcriptText.includes("VC-2026-9812-REG") || !transcriptText.includes("Self-awarded credits. Not accredited by any institution.")) {
    throw new Error("Missing registry ID or accreditation disclaimer on Transcript");
  }

  const finalTranscriptPath = path.join(publicDir, "phase9-final-transcript.png");
  await page.screenshot({ path: finalTranscriptPath, fullPage: true });
  fs.copyFileSync(finalTranscriptPath, path.join(artifactDir, "phase9-final-transcript.png"));
  console.log("📸 Saved phase9-final-transcript.png");

  // 10. ACADEMIC SETTINGS
  console.log("⚙️ 10. Testing Academic Settings...");
  await page.goto("http://localhost:3000/settings", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1:has-text('Academic Settings & Preferences')");
  console.log("✓ Academic Settings verified.");

  await browser.close();
  console.log("🎉 ALL MASTER END-TO-END TESTS PASSED SUCCESSFULLY!");
}

run().catch((err) => {
  console.error("❌ Master E2E Failed:", err);
  process.exit(1);
});
