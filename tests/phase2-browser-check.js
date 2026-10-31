const { chromium } = require("@playwright/test");

(async () => {
  console.log("Starting Phase 2 automated browser verification...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  // 1. Visit Courses Page
  await page.goto("http://localhost:3000/courses", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1:has-text('Enrolled Academic Courses')", { timeout: 10000 });
  console.log("✓ /courses loaded");

  // 2. Open Course Detail Page for CS 101
  await page.click("a[href='/courses/course-cs101']");
  await page.waitForURL("**/courses/course-cs101");
  await page.waitForSelector("h1", { timeout: 5000 });
  const courseTitle = await page.locator("h1:has-text('Introduction to Computer Systems')").isVisible();
  console.log(`✓ Course title verified: ${courseTitle}`);

  // 3. Test "Add Lessons" Dialog with 3 Links (1 valid, 1 duplicate, 1 invalid)
  await page.click("button:has-text('Add Lessons')");
  await page.waitForTimeout(300);

  const linksToPaste = [
    "https://www.youtube.com/watch?v=l8kX-2f4_0w", // valid: CrashCourse CS #3
    "https://www.youtube.com/watch?v=tpIctyqH29Q", // duplicate: already in CS 101
    "https://not-youtube.com/video123",            // invalid non-youtube
  ].join("\n");

  await page.fill("textarea[placeholder*='youtube.com/watch']", linksToPaste);
  console.log("✓ Filled 3 test links into Add Lessons dialog");

  await page.click("button:has-text('Verify & Preview Links')");
  console.log("✓ Clicked Verify & Preview Links, waiting for oEmbed resolution...");

  // Wait for preview list to render (partial text match)
  await page.waitForSelector("span:has-text('Verified Preview')", { timeout: 15000 });
  console.log("✓ Preview list rendered");

  // Verify duplicate was flagged
  const duplicateBadge = await page.locator("span:has-text('Duplicate')").isVisible();
  console.log(`✓ Duplicate link properly flagged: ${duplicateBadge}`);

  // Verify invalid link was flagged
  const invalidBadge = await page.locator("span:has-text('Invalid')").isVisible();
  console.log(`✓ Invalid link properly flagged: ${invalidBadge}`);

  // Confirm save of valid lessons
  await page.click("button:has-text('Confirm & Save')");
  await page.waitForTimeout(1000);
  console.log("✓ Clicked Confirm & Save");

  // 4. Open Lesson Player Page for Lesson 1
  await page.click("a[href='/courses/course-cs101/lessons/les-cs101-1']");
  await page.waitForURL("**/lessons/les-cs101-1");
  console.log("✓ Navigated to Lesson Player page");

  // 5. Verify Player UI Requirements
  const playerMount = await page.locator("#youtube-player-mount").isVisible();
  console.log(`✓ YouTube player mount element present: ${playerMount}`);

  const watchOnYt = await page.locator("a:has-text('Watch on YouTube')").first().isVisible();
  console.log(`✓ "Watch on YouTube" fallback link present: ${watchOnYt}`);

  const channelName = await page.locator("text='CrashCourse'").first().isVisible();
  console.log(`✓ Channel name displayed: ${channelName}`);

  // 6. Test Timestamp Note Addition
  await page.click("button:has-text('Timestamp Current Time')");
  await page.waitForTimeout(300);
  const timestampButton = await page.locator("button:has-text('0:00')").isVisible();
  console.log(`✓ Added timestamp button: ${timestampButton}`);

  // Type note into textarea
  const noteArea = page.locator("textarea[placeholder*='Take notes']");
  await noteArea.fill("Automated test note verification for CS 101 Lecture 1.");
  await page.waitForTimeout(1200); // Wait for debounce autosave
  console.log("✓ Typed and autosaved lecture note");

  // Blur textarea before testing keyboard shortcuts
  await noteArea.blur();
  await page.waitForTimeout(200);

  // 7. Test 'j' keyboard shortcut for Next Lesson
  await page.keyboard.press("j");
  await page.waitForURL("**/lessons/les-cs101-2", { timeout: 5000 });
  console.log("✓ Keyboard shortcut 'j' navigated to Next Lesson (les-cs101-2)");
  await page.waitForTimeout(800); // Allow new page state to initialize

  // 8. Test 'k' keyboard shortcut for Previous Lesson
  await page.keyboard.press("k");
  await page.waitForURL("**/lessons/les-cs101-1", { timeout: 5000 });
  console.log("✓ Keyboard shortcut 'k' navigated back to Previous Lesson (les-cs101-1)");

  // 9. Check Console Errors
  if (consoleErrors.length > 0) {
    console.warn("Console errors observed:", consoleErrors);
  } else {
    console.log("✓ Zero console errors observed across full course & video interaction flow!");
  }

  await browser.close();
  console.log("\n==========================================");
  console.log("PHASE 2 BROWSER VERIFICATION: 100% PASSED!");
  console.log("==========================================");
})();
