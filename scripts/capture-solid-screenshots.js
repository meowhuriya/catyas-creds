const { chromium } = require("@playwright/test");
const path = require("path");

const ARTIFACT_DIR = "/Users/huriyafatima/.gemini/antigravity/brain/a1ba62d4-a183-4a80-bd36-8c81b79e1a5e";

async function capture() {
  const browser = await chromium.launch({ headless: true });
  
  // 1. Desktop 1440x900
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Dashboard screenshot
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "dashboard-solid-surface-1440px.png"),
    fullPage: false,
  });
  console.log("Captured dashboard-solid-surface-1440px.png");

  // Sidebar focused screenshot (crop of sidebar area)
  const sidebarEl = page.locator("aside").first();
  if (await sidebarEl.isVisible()) {
    await sidebarEl.screenshot({
      path: path.join(ARTIFACT_DIR, "sidebar-layout-fixed-1440px.png"),
    });
    console.log("Captured sidebar-layout-fixed-1440px.png");
  }

  // Unit page screenshot
  await page.goto("http://localhost:3000/courses/course-ch102bs", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  // Scroll to topic checklist
  await page.evaluate(() => {
    const parent = document.querySelector("#main-content")?.parentElement;
    if (parent) parent.scrollTop = 900;
  });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "unit-page-solid-surface-1440px.png"),
    fullPage: false,
  });
  console.log("Captured unit-page-solid-surface-1440px.png");

  // Mobile 390x844 screenshot
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto("http://localhost:3000/courses/course-ch102bs", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({
    path: path.join(ARTIFACT_DIR, "unit-page-solid-surface-390px.png"),
    fullPage: false,
  });
  console.log("Captured unit-page-solid-surface-390px.png");

  await browser.close();
  console.log("All screenshots captured successfully!");
}

capture().catch(console.error);
