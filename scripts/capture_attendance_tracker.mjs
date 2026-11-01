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

  // 1. Desktop 1440x900 - Course Attendance Tracker with On-Track state
  console.log("Navigating to course page CS105ES for on-track attendance...");
  const context1440 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page1 = await context1440.newPage();

  // Load course page CS105ES
  await page1.goto("http://localhost:3000/courses/course-cs105es", { waitUntil: "networkidle" });
  await page1.waitForTimeout(1000);

  // Click on the Attendance tab
  const attTab = page1.locator('button[role="tab"]:has-text("Attendance")');
  await attTab.click();
  await page1.waitForTimeout(600);

  // Set sample on-track attendance: 25 held, 22 attended (88%), min 75% -> can still miss 4 classes
  const editBtn = page1.locator('button:has-text("Edit Counts")');
  if (await editBtn.isVisible()) {
    await editBtn.click();
    await page1.waitForTimeout(300);
    const inputs = page1.locator('input[type="number"]');
    await inputs.nth(0).fill("25"); // held
    await inputs.nth(1).fill("22"); // attended
    await inputs.nth(2).fill("75"); // min percent
    const saveBtn = page1.locator('button:has-text("Save Changes")');
    await saveBtn.click();
    await page1.waitForTimeout(600);
  }

  await saveScreenshot(page1, "attendance-tracker-1440px-ontrack.png");

  // 2. Course Attendance Tracker with Warning state (< 75%)
  console.log("Navigating to course page CH102BS for warning attendance state...");
  const pageWarning = await context1440.newPage();
  await pageWarning.goto("http://localhost:3000/courses/course-ch102bs", { waitUntil: "networkidle" });
  await pageWarning.waitForTimeout(1000);

  const attTabWarning = pageWarning.locator('button[role="tab"]:has-text("Attendance")');
  await attTabWarning.click();
  await pageWarning.waitForTimeout(600);

  // Set below-limit attendance: 26 held, 17 attended (65.4% < 75%) -> warning chip + recovery
  const editBtnWarning = pageWarning.locator('button:has-text("Edit Counts")');
  if (await editBtnWarning.isVisible()) {
    await editBtnWarning.click();
    await pageWarning.waitForTimeout(300);
    const inputs = pageWarning.locator('input[type="number"]');
    await inputs.nth(0).fill("26"); // held
    await inputs.nth(1).fill("17"); // attended
    await inputs.nth(2).fill("75"); // min percent
    const saveBtn = pageWarning.locator('button:has-text("Save Changes")');
    await saveBtn.click();
    await pageWarning.waitForTimeout(600);
  }

  // Click 'Mark Absent' to demonstrate quick attendance action and log
  const markAbsentBtn = pageWarning.locator('button:has-text("Mark Absent")');
  if (await markAbsentBtn.isVisible()) {
    await markAbsentBtn.click();
    await pageWarning.waitForTimeout(400);
  }

  await saveScreenshot(pageWarning, "attendance-tracker-warning-chip.png");

  // 3. Mobile View 390x844
  console.log("Navigating to mobile view 390px...");
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.goto("http://localhost:3000/courses/course-cs105es", { waitUntil: "networkidle" });
  await pageMobile.waitForTimeout(800);
  const mobileAttTab = pageMobile.locator('button[role="tab"]:has-text("Attendance")');
  await mobileAttTab.click();
  await pageMobile.waitForTimeout(600);
  await saveScreenshot(pageMobile, "attendance-tracker-mobile-390px.png");

  // 4. Dashboard with Attendance Badges on Course Cards
  console.log("Navigating to dashboard with attendance badges...");
  const pageDash = await context1440.newPage();
  await pageDash.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await pageDash.waitForTimeout(1000);
  await saveScreenshot(pageDash, "attendance-dashboard-badges.png");

  await browser.close();
  console.log("Attendance screenshots successfully captured!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
