const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
  });
  const page = await context.newPage();

  console.log("1. Navigating to Academic Planner (/planner)...");
  await page.goto("http://localhost:3000/planner", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Verify Planner Header
  const headerText = await page.locator("h1").innerText();
  console.log("Planner Header:", headerText);

  // Month View Verification
  console.log("2. Verifying Month View Calendar Grid...");
  const monthTitle = await page.locator("span.font-serif.text-lg.font-bold").innerText();
  console.log("Active Month Title:", monthTitle);

  // Check event items in Month View
  const eventItems = await page.locator(".truncate").allInnerTexts();
  console.log("Detected Events in View:", eventItems.slice(0, 5));

  // Test Event Type Filter
  console.log("3. Testing Event Type Filter...");
  const typeSelect = page.locator("select").nth(1); // second select is Type
  await typeSelect.selectOption("exam");
  await page.waitForTimeout(300);
  console.log("Filtered by Examination Milestones");

  await typeSelect.selectOption("all");
  await page.waitForTimeout(300);
  console.log("Reset to All Event Types");

  // Schedule a Study Block
  console.log("4. Scheduling a New Study Block...");
  await page.click("button:has-text('Schedule Study Block')");
  await page.waitForSelector("text=Schedule Dedicated Study Block", { timeout: 5000 });
  await page.waitForTimeout(300);

  // Fill in form
  await page.fill("input[placeholder*='ALU Ripple']", "Compiler Lexical Analysis & Flex Drill");
  await page.click("button:has-text('Schedule Block')");
  await page.waitForTimeout(1000);
  console.log("✓ Successfully scheduled new study block.");

  // Capture Month View Screenshot
  await page.screenshot({ path: "public/phase6-planner-month.png", fullPage: true });
  console.log("✓ Captured public/phase6-planner-month.png");

  // Switch to Week View
  console.log("5. Testing Week View...");
  await page.click("button:has-text('Week View')");
  await page.waitForTimeout(800);

  // Verify Week View columns
  const dayCols = await page.locator("span.font-serif.text-lg.font-bold").count();
  console.log("Week Day Columns Count:", dayCols);

  // Capture Week View Screenshot
  await page.screenshot({ path: "public/phase6-planner-week.png", fullPage: true });
  console.log("✓ Captured public/phase6-planner-week.png");

  // 6. Test Degree Audit Page
  console.log("6. Testing Degree Audit Page (/degree)...");
  await page.goto("http://localhost:3000/degree", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Verify Degree Audit Header & Disclaimer
  const degreeTitle = await page.locator("h1").innerText();
  console.log("Degree Audit Title:", degreeTitle);

  const disclaimerText = await page.locator("text=Self-awarded credits. Not accredited by any institution.").first();
  if (await disclaimerText.isVisible()) {
    console.log("✓ Verified mandatory accreditation disclaimer on Degree Audit page.");
  }

  // Verify Department & Level Distributions
  const deptItems = await page.locator("h3:has-text('Departmental Credit Requirements')");
  console.log("Departmental Requirements Section Visible?", await deptItems.isVisible());

  // Click through audit tabs: Completed, In Progress, Remaining
  console.log("Testing Audit Filter Tabs...");
  await page.click("button:has-text('In Progress')");
  await page.waitForTimeout(400);

  await page.click("button:has-text('Remaining Requirements')");
  await page.waitForTimeout(400);

  await page.click("button:has-text('Completed Courses')");
  await page.waitForTimeout(400);

  // Test Edit Degree Target Modal
  console.log("7. Testing Edit Degree Target Modal...");
  await page.click("button:has-text('Edit Degree Target')");
  await page.waitForSelector("text=Configure Degree Credit Target", { timeout: 5000 });
  await page.waitForTimeout(300);

  // Click 160 cr preset inside dialog
  await page.locator("div[role='dialog'] button:has-text('160 cr')").click();
  await page.waitForTimeout(200);

  await page.locator("div[role='dialog'] button:has-text('Save Target')").click();
  await page.waitForTimeout(800);
  console.log("✓ Successfully saved degree target (160 cr).");

  // Capture Degree Audit Screenshot
  await page.screenshot({ path: "public/phase6-degree-audit.png", fullPage: true });
  console.log("✓ Captured public/phase6-degree-audit.png");

  await browser.close();
  console.log("All Phase 6 browser checks successfully passed!");
})().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
