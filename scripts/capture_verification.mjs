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

  // 1. Desktop Dashboard 1440x900 (Real zero values, Soft gingham)
  console.log("Navigating to desktop dashboard...");
  const context1 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page1 = await context1.newPage();
  await page1.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page1.waitForTimeout(1000);
  await saveScreenshot(page1, "after-1440px-dashboard.png");
  await saveScreenshot(page1, "gingham-soft.png");

  // 2. Mobile Phone Dashboard 390x844
  console.log("Navigating to mobile dashboard...");
  const context2 = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page2 = await context2.newPage();
  await page2.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page2.waitForTimeout(1000);
  await saveScreenshot(page2, "after-390px-dashboard.png");

  // 3. Unit Page Polymers (CH102BS Unit 4)
  console.log("Navigating to CH102BS Unit 4 (Polymers)...");
  const page3 = await context1.newPage();
  await page3.goto("http://localhost:3000/courses/course-ch102bs", { waitUntil: "networkidle" });
  await page3.waitForTimeout(1000);
  // Click on Unit 4 (Polymers) button in the roadmap
  const unit4Btn = page3.locator('button[title*="Unit 4"]');
  if (await unit4Btn.count() > 0) {
    await unit4Btn.first().click();
    await page3.waitForTimeout(600);
  }
  await saveScreenshot(page3, "unit-page-polymers.png");

  // 4. Gingham Medium (alpha 0.20)
  console.log("Capturing gingham medium...");
  await page1.evaluate(() => {
    document.documentElement.style.setProperty("--check-alpha", "0.20");
  });
  await page1.waitForTimeout(400);
  await saveScreenshot(page1, "gingham-medium.png");

  // 5. Gingham Bold (alpha 0.30)
  console.log("Capturing gingham bold...");
  await page1.evaluate(() => {
    document.documentElement.style.setProperty("--check-alpha", "0.30");
  });
  await page1.waitForTimeout(400);
  await saveScreenshot(page1, "gingham-bold.png");

  // 6. Plain Paper
  console.log("Capturing plain paper...");
  await page1.evaluate(() => {
    document.documentElement.dataset.bg = "plain";
  });
  await page1.waitForTimeout(400);
  await saveScreenshot(page1, "plain-paper.png");

  // 7. My Own Image (with Dim & Blur)
  console.log("Capturing my own image...");
  await page1.evaluate(() => {
    document.documentElement.dataset.bg = "custom";
    document.documentElement.style.setProperty("--custom-bg-image", "url('/cats-original.png')");
    document.documentElement.style.setProperty("--custom-dim", "0.30");
    document.documentElement.style.setProperty("--custom-blur", "4px");
  });
  await page1.waitForTimeout(500);
  await saveScreenshot(page1, "my-own-image.png");

  // 8. Dark Mode Dashboard
  console.log("Capturing dark mode dashboard...");
  await page1.evaluate(() => {
    document.documentElement.dataset.bg = "gingham";
    document.documentElement.style.removeProperty("--custom-bg-image");
    document.documentElement.style.removeProperty("--custom-dim");
    document.documentElement.style.removeProperty("--custom-blur");
    document.documentElement.classList.add("dark");
    document.documentElement.style.setProperty("--check-alpha", "0.10");
  });
  await page1.waitForTimeout(500);
  await saveScreenshot(page1, "dark-mode-dashboard.png");

  await browser.close();
  console.log("All screenshots captured and copied successfully!");
}

run().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
