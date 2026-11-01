const { chromium } = require("@playwright/test");

(async () => {
  console.log("Starting Exam Prep Mode screenshots capture with saved milestone...");
  const browser = await chromium.launch({ headless: true });

  const artifactDir = "/Users/huriyafatima/.gemini/antigravity/brain/a1ba62d4-a183-4a80-bd36-8c81b79e1a5e";

  // 1. Desktop 1440px viewport
  const contextDesktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await contextDesktop.newPage();

  // Load CH102BS course page
  console.log("Navigating to CH102BS course page...");
  await page.goto("http://localhost:3000/courses/course-ch102bs", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(1500);

  // Click on "Exam Prep" tab
  console.log("Clicking on Exam Prep tab...");
  const examPrepTab = page.locator("button:has-text('Exam Prep')").first();
  await examPrepTab.click();
  await page.waitForTimeout(800);

  // Open exam milestone editor and save a milestone
  const changeExamBtn = page.locator("button:has-text('Change Exam Date')").first();
  if (await changeExamBtn.isVisible()) {
    await changeExamBtn.click();
    await page.waitForTimeout(400);

    // Click "In 3 Weeks" preset
    const presetBtn = page.locator("button:has-text('In 3 Weeks')").first();
    if (await presetBtn.isVisible()) {
      await presetBtn.click();
      await page.waitForTimeout(300);
    }

    // Save exam milestone
    const saveBtn = page.locator("button:has-text('Save Exam Milestone')").first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(800);
    }
  }

  // Screenshot 1: Desktop 1440px Exam Prep Mode
  const desktopPath = `${artifactDir}/exam-prep-mode-1440px.png`;
  await page.screenshot({ path: desktopPath, fullPage: true });
  console.log(`✓ Saved desktop screenshot to ${desktopPath}`);

  // 2. Mobile 390px viewport
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await contextMobile.newPage();
  await mobilePage.goto("http://localhost:3000/courses/course-ch102bs", {
    waitUntil: "domcontentloaded",
  });
  await mobilePage.waitForTimeout(1500);

  const mobileExamPrepTab = mobilePage.locator("button:has-text('Exam Prep')").first();
  await mobileExamPrepTab.click();
  await mobilePage.waitForTimeout(800);

  const mobilePath = `${artifactDir}/exam-prep-mode-mobile-390px.png`;
  await mobilePage.screenshot({ path: mobilePath, fullPage: true });
  console.log(`✓ Saved mobile screenshot to ${mobilePath}`);

  // 3. Dashboard with course card exam badge
  console.log("Navigating to dashboard...");
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const dashboardPath = `${artifactDir}/exam-prep-dashboard-card.png`;
  await page.screenshot({ path: dashboardPath, fullPage: false });
  console.log(`✓ Saved dashboard screenshot to ${dashboardPath}`);

  await browser.close();
  console.log("All screenshots captured successfully!");
})();
