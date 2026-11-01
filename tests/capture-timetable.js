const { chromium } = require("@playwright/test");

(async () => {
  console.log("Starting Timetable screenshots capture...");
  const browser = await chromium.launch({ headless: true });

  const artifactDir = "/Users/huriyafatima/.gemini/antigravity/brain/a1ba62d4-a183-4a80-bd36-8c81b79e1a5e";

  // 1. Desktop 1440px Today Page with Timetable
  const contextDesktop = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await contextDesktop.newPage();

  console.log("Navigating to /today...");
  await page.goto("http://localhost:3000/today", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);

  const todayPath = `${artifactDir}/today-timetable-schedule-1440px.png`;
  await page.screenshot({ path: todayPath, fullPage: true });
  console.log(`✓ Saved desktop Today screenshot to ${todayPath}`);

  // 2. Desktop 1440px Planner Weekly Timetable
  console.log("Navigating to /planner?view=timetable...");
  await page.goto("http://localhost:3000/planner?view=timetable", {
    waitUntil: "domcontentloaded",
  });
  await page.waitForTimeout(1500);

  const plannerPath = `${artifactDir}/planner-weekly-timetable-1440px.png`;
  await page.screenshot({ path: plannerPath, fullPage: true });
  console.log(`✓ Saved desktop Planner Timetable screenshot to ${plannerPath}`);

  // 3. Mobile 390px Today Page
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await contextMobile.newPage();

  console.log("Navigating to /today on mobile...");
  await mobilePage.goto("http://localhost:3000/today", { waitUntil: "domcontentloaded" });
  await mobilePage.waitForTimeout(1500);

  const mobileTodayPath = `${artifactDir}/today-timetable-mobile-390px.png`;
  await mobilePage.screenshot({ path: mobileTodayPath, fullPage: true });
  console.log(`✓ Saved mobile Today screenshot to ${mobileTodayPath}`);

  // 4. Mobile 390px Planner Weekly Timetable
  console.log("Navigating to /planner?view=timetable on mobile...");
  await mobilePage.goto("http://localhost:3000/planner?view=timetable", {
    waitUntil: "domcontentloaded",
  });
  await mobilePage.waitForTimeout(1500);

  const mobilePlannerPath = `${artifactDir}/planner-weekly-timetable-mobile-390px.png`;
  await mobilePage.screenshot({ path: mobilePlannerPath, fullPage: true });
  console.log(`✓ Saved mobile Planner Timetable screenshot to ${mobilePlannerPath}`);

  await browser.close();
  console.log("All timetable screenshots captured successfully!");
})();
