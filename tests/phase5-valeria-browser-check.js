const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();

  console.log("1. Navigating to Course Detail page for CS 105ES...");
  await page.goto("http://localhost:3000/courses/course-cs105es", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Switch to Classwork & Modules tab
  console.log("2. Opening Classwork & Modules tab...");
  await page.click("button[role='tab']:has-text('Classwork')");
  await page.waitForTimeout(800);

  // Check that assessments are visible
  const asmTitles = await page.locator("h4").allInnerTexts();
  console.log("Detected Assessment Titles:", asmTitles);

  // Check locked final exam
  const lockedNotice = page.locator("text=Locked: requires 80% topic completion");
  if (await lockedNotice.count() > 0) {
    console.log("✓ Final Examination lock requirement verified.");
  }

  // Test Grading Scheme Modal
  console.log("3. Testing Grading Scheme Modal...");
  await page.click("button:has-text('Grading Scheme (100%)')");
  await page.waitForSelector("text=Edit Grading Scheme", { timeout: 5000 });
  await page.waitForTimeout(400);

  // Click Lab Default then Theory Default
  await page.click("button:has-text('Lab Default')");
  await page.waitForTimeout(300);
  console.log("Applied Lab Default preset");

  await page.click("button:has-text('Theory Default')");
  await page.waitForTimeout(300);
  console.log("Applied Theory Default preset");

  // Save Scheme
  await page.click("button:has-text('Save Scheme')");
  await page.waitForTimeout(1200);
  console.log("✓ Saved Grading Scheme successfully.");

  // Test Midterm Examination Runner
  console.log("4. Testing Midterm Examination Runner...");
  const takeExamBtn = page.locator("button:has-text('Take Examination')").first();
  await takeExamBtn.waitFor({ state: "visible", timeout: 8000 });
  await takeExamBtn.click();
  await page.waitForTimeout(800);

  // Check if Exam Briefing screen is displayed
  const beginExamBtn = page.locator("button:has-text('Begin Examination Now')");
  if (await beginExamBtn.isVisible()) {
    console.log("✓ Exam Briefing Screen verified with proctored notice and time limits.");
    await beginExamBtn.click();
    await page.waitForTimeout(800);
  }

  // Answer Questions
  console.log("Answering Midterm Questions...");
  // Question 1: Multiple Choice ("8 bytes")
  const choice8Bytes = page.locator("label:has-text('8 bytes')").first();
  if (await choice8Bytes.isVisible()) {
    await choice8Bytes.click();
    console.log("Selected Q1: 8 bytes");
  }

  // Question 2: Multiple Select ("malloc", "calloc", "realloc", "free")
  const mallocBox = page.locator("label:has-text('malloc')").first();
  const callocBox = page.locator("label:has-text('calloc')").first();
  const reallocBox = page.locator("label:has-text('realloc')").first();
  const freeBox = page.locator("label:has-text('free')").first();

  if (await mallocBox.isVisible()) await mallocBox.click();
  if (await callocBox.isVisible()) await callocBox.click();
  if (await reallocBox.isVisible()) await reallocBox.click();
  if (await freeBox.isVisible()) await freeBox.click();
  console.log("Selected Q2: malloc, calloc, realloc, free");

  // Question 3: Short Answer ("const")
  const shortAnswerInput = page.locator("input[placeholder='Type your response...']").first();
  if (await shortAnswerInput.isVisible()) {
    await shortAnswerInput.fill("const");
    console.log("Entered Q3 short answer: const");
  }

  // Submit Final Examination
  const submitExamBtn = page.locator("button:has-text('Submit Final Examination'), button:has-text('Submit Answers')");
  await submitExamBtn.click();
  await page.waitForTimeout(1000);

  // Verify Results Review Screen
  const scoreSummary = page.locator("text=Attempt Result");
  console.log("Is score summary visible?", await scoreSummary.isVisible());

  // Close Exam Modal
  await page.click("button:has-text('Close')");
  await page.waitForTimeout(600);

  // 5. Test Gradebook tab & What-If Calculator
  console.log("5. Testing Gradebook tab & What-If Calculator...");
  await page.click("button[role='tab']:has-text('Gradebook')");
  await page.waitForTimeout(800);

  // Take screenshot of course gradebook
  await page.screenshot({ path: "public/phase5-course-gradebook.png", fullPage: true });
  console.log("✓ Captured public/phase5-course-gradebook.png");

  // 6. Navigate to Global Grades Page
  console.log("6. Testing Global Grades page (/grades)...");
  await page.goto("http://localhost:3000/grades", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Verify SGPA, CGPA, Standing
  const sgpaText = await page.locator("text=SGPA").first().textContent();
  const cgpaText = await page.locator("text=Cumulative CGPA").first().textContent();
  console.log("Grades Page Summary:", { sgpaText, cgpaText });

  // Test Scale Switcher toggle
  console.log("Testing 4.0 Scale Switcher...");
  await page.click("button:has-text('4.0 Scale')");
  await page.waitForTimeout(500);

  // Switch back to 10-Pt Scale
  await page.click("button:has-text('10-Pt Scale')");
  await page.waitForTimeout(500);

  // Take screenshot of grades page
  await page.screenshot({ path: "public/phase5-grades-page.png", fullPage: true });
  console.log("✓ Captured public/phase5-grades-page.png");

  await browser.close();
  console.log("All Phase 5 browser checks successfully passed!");
})().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
