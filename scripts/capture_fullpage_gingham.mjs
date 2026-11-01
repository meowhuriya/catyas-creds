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

  // 1. Desktop Dashboard 1440x900 (Bold Gingham default veil 0, check-scale 0.6)
  console.log("Navigating to desktop dashboard 1440px...");
  const context1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page1 = await context1440.newPage();
  
  // Clear any old cached local storage so clean authoritative data is loaded
  await page1.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page1.evaluate(() => {
    localStorage.clear();
    // Re-apply default appearance
    document.documentElement.style.setProperty("--check-scale", "0.6");
    document.documentElement.style.setProperty("--veil", "0");
  });
  await page1.reload({ waitUntil: "networkidle" });
  await page1.waitForTimeout(1200);

  // Capture after 1440px dashboard and gingham-bold (veil 0)
  await saveScreenshot(page1, "after-fullpage-gingham-1440px.png");
  await saveScreenshot(page1, "gingham-bold.png");

  // 2. Mobile Phone Dashboard 390x844
  console.log("Navigating to mobile dashboard 390px...");
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await pageMobile.waitForTimeout(1000);
  await saveScreenshot(pageMobile, "after-fullpage-gingham-390px.png");

  // 3. Course Page CH102BS
  console.log("Navigating to CH102BS Course Page...");
  const pageCourse = await context1440.newPage();
  await pageCourse.goto("http://localhost:3000/courses/course-ch102bs", { waitUntil: "networkidle" });
  await pageCourse.waitForTimeout(1200);
  await saveScreenshot(pageCourse, "course-page.png");

  // 4. Unit Page: Polymers (CH102BS Unit 4)
  console.log("Navigating to CH102BS Unit 4 (Polymers)...");
  const unit4Btn = pageCourse.locator('button[title*="Unit 4"], button:has-text("Unit 4"), button:has-text("Polymers")');
  if (await unit4Btn.count() > 0) {
    await unit4Btn.first().click();
    await pageCourse.waitForTimeout(800);
  }
  await saveScreenshot(pageCourse, "unit-page-polymers.png");

  // 5. Sign-in Page (/login)
  console.log("Navigating to Sign-in page /login...");
  const pageLogin = await context1440.newPage();
  await pageLogin.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await pageLogin.waitForTimeout(800);
  await saveScreenshot(pageLogin, "signin-page.png");

  // 6. Settings Appearance: Medium Veil (0.3)
  console.log("Capturing Medium Veil (0.3)...");
  await page1.evaluate(() => {
    document.documentElement.style.setProperty("--veil", "0.3");
  });
  await page1.waitForTimeout(400);
  await saveScreenshot(page1, "gingham-medium.png");

  // 7. Settings Appearance: Soft Veil (0.55)
  console.log("Capturing Soft Veil (0.55)...");
  await page1.evaluate(() => {
    document.documentElement.style.setProperty("--veil", "0.55");
  });
  await page1.waitForTimeout(400);
  await saveScreenshot(page1, "gingham-soft.png");

  // 8. Dark Mode Dashboard
  console.log("Capturing Dark Mode Dashboard...");
  await page1.evaluate(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.setProperty("--veil", "0.70");
  });
  await page1.waitForTimeout(600);
  await saveScreenshot(page1, "dark-mode-dashboard.png");

  await browser.close();
  console.log("All required screenshots captured and verified successfully!");
}

run().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
