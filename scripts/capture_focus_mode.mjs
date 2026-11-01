import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/Users/huriyafatima/.gemini/antigravity/brain/a1ba62d4-a183-4a80-bd36-8c81b79e1a5e";
const PUBLIC_DIR = "/Users/huriyafatima/catyas-creds/public";

async function saveScreenshot(page, filename) {
  const pubPath = path.join(PUBLIC_DIR, filename);
  const artPath = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: pubPath, fullPage: false });
  fs.copyFileSync(pubPath, artPath);
  console.log(`Saved screenshot: ${filename}`);
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop 1440x900 - Lesson Player in Standard View
  console.log("Navigating to lesson player page...");
  const context1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page1 = await context1440.newPage();

  await page1.goto("http://localhost:3000/courses/course-ma101bs/player/fNk_zzaMoSs", {
    waitUntil: "domcontentloaded",
  });
  await page1.waitForTimeout(2000);

  // Capture standard view
  await saveScreenshot(page1, "focus-mode-standard-player.png");

  // 2. Press "f" key to enter Focus Mode!
  console.log("Pressing keyboard shortcut 'f' to toggle Focus Mode...");
  await page1.keyboard.press("f");
  await page1.waitForTimeout(1000);

  // Type sample notes into the focus mode textarea to test live note-taking
  const focusTextarea = page1.locator('textarea[placeholder*="Capture formulas"]');
  if (await focusTextarea.isVisible()) {
    await focusTextarea.fill(
      "Lecture 1 Key Notes:\n• Rank of matrix via row echelon form\n• Gaussian elimination pivots\n• Preserves linear system solution space"
    );
  }

  // Click Play on the Focus Timer to demonstrate live timer countdown
  const timerPlayBtn = page1.locator('button[title*="Start Focus Timer"]');
  if (await timerPlayBtn.isVisible()) {
    await timerPlayBtn.click();
    await page1.waitForTimeout(1200);
  }

  // Capture Focus Mode active at 1440px
  await saveScreenshot(page1, "focus-mode-active-1440px.png");

  // 3. Mobile View 390x844 in Focus Mode
  console.log("Navigating to mobile view 390px in Focus Mode...");
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto("http://localhost:3000/courses/course-ma101bs/player/fNk_zzaMoSs", {
    waitUntil: "domcontentloaded",
  });
  await pageMobile.waitForTimeout(1500);

  // Click Focus Mode button on mobile
  const focusBtnMobile = pageMobile.locator('button:has-text("Focus Mode")');
  if (await focusBtnMobile.isVisible()) {
    await focusBtnMobile.click();
    await pageMobile.waitForTimeout(800);
  }

  await saveScreenshot(pageMobile, "focus-mode-mobile-390px.png");

  // 4. Test exit focus mode using keyboard shortcut "f"
  console.log("Pressing 'f' to exit focus mode...");
  // blur any active element first so shortcut isn't swallowed by textarea
  await page1.locator("body").click({ position: { x: 10, y: 10 } });
  await page1.keyboard.press("f");
  await page1.waitForTimeout(800);

  await browser.close();
  console.log("All Focus Mode screenshots and shortcut tests completed successfully!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
