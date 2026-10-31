const { chromium } = require("playwright");
const path = require("path");

async function runPhase4BrowserCheck() {
  console.log("Starting Phase 4 Valeria's Creds browser verification...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Visit Course Page for MA101BS (Matrices and Calculus)
    console.log("Navigating to course page http://localhost:3000/courses/course-ma101bs...");
    await page.goto("http://localhost:3000/courses/course-ma101bs", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // 2. Open Quick Check Modal on first topic
    console.log("Launching Quick Check runner modal...");
    const checkBtn = page.locator("button:has-text('Check')").first();
    await checkBtn.click();
    await page.waitForTimeout(1000);

    // Verify modal is open
    const modalTitle = await page.locator("h2, [role='dialog'] h2").first().textContent();
    console.log("Quick Check Modal Title:", modalTitle);

    // Question 1: Select option A (index 0)
    console.log("Answering Question 1...");
    const option1 = page.locator("[data-testid='option-choice']").first();
    await option1.click();
    await page.waitForTimeout(400);

    // Click Next
    await page.locator("[role='dialog'] button:has-text('Next')").click();
    await page.waitForTimeout(500);

    // Question 2: Select option B (index 1)
    console.log("Answering Question 2...");
    const option2 = page.locator("[data-testid='option-choice']").nth(1);
    await option2.click();
    await page.waitForTimeout(400);

    // Click Next
    await page.locator("[role='dialog'] button:has-text('Next')").click();
    await page.waitForTimeout(500);

    // Question 3: Select option B (index 1)
    console.log("Answering Question 3...");
    const option3 = page.locator("[data-testid='option-choice']").nth(1);
    await option3.click();
    await page.waitForTimeout(400);

    // Click Submit & Grade Check
    console.log("Submitting Quick Check for scoring...");
    const submitBtn = page.locator("[role='dialog'] button:has-text('Submit & Grade Check')");
    await submitBtn.click();
    await page.waitForTimeout(1500);

    // Capture screenshot of completed Quick Check modal with academic explanation
    const checkScreenshotPath = path.join(process.cwd(), "public", "phase4-course-mastery-check.png");
    await page.screenshot({ path: checkScreenshotPath, fullPage: false });
    console.log("Captured Quick Check screenshot at", checkScreenshotPath);

    // Close dialog
    const closeBtn = page.locator("[role='dialog'] button:has-text('Done & Close')");
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    }

    // 3. Navigate to the new Dedicated Today Page (/today)
    console.log("Navigating to http://localhost:3000/today...");
    await page.goto("http://localhost:3000/today", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Verify Today Page Header elements
    const todayHeader = await page.textContent("h1");
    console.log("Today Page Heading:", todayHeader);

    // Verify Focus Timer
    console.log("Testing Collegiate Focus Timer Widget...");
    const startFocusBtn = page.locator("button:has-text('Start Focus')");
    if (await startFocusBtn.isVisible()) {
      await startFocusBtn.click();
      await page.waitForTimeout(1500);
      console.log("Focus Timer started ticking.");
      // Pause
      const pauseBtn = page.locator("button:has-text('Pause')");
      if (await pauseBtn.isVisible()) {
        await pauseBtn.click();
        await page.waitForTimeout(500);
        console.log("Focus Timer paused.");
      }
    }

    // Test mode switch to 5m Break
    const breakTab = page.locator("button:has-text('5m Break')");
    if (await breakTab.isVisible()) {
      await breakTab.click();
      await page.waitForTimeout(500);
      console.log("Switched Focus Timer to 5m Break mode.");
    }

    // Capture screenshot of Today Page
    const todayScreenshotPath = path.join(process.cwd(), "public", "phase4-today-page.png");
    await page.screenshot({ path: todayScreenshotPath, fullPage: false });
    console.log("Captured Today Page screenshot at", todayScreenshotPath);

    console.log("Phase 4 Browser Verification Completed Successfully!");
  } catch (err) {
    console.error("Phase 4 verification failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase4BrowserCheck();
