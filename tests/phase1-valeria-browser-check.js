const { chromium } = require("playwright");

async function run() {
  console.log("Starting browser check for Valeria's Creds Phase 1...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();

  // Navigate to localhost
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // Reset demo storage to ensure fresh seed load
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // 1. Check title & brand
  const pageTitle = await page.title();
  console.log("Page Title:", pageTitle);
  if (!pageTitle.includes("Valeria’s Creds")) {
    throw new Error(`Expected 'Valeria’s Creds' in title, got: ${pageTitle}`);
  }

  // 2. Check brand header & sidebar
  const brandWordmark = await page.textContent("header, aside");
  console.log("Brand present in sidebar:", brandWordmark.includes("Valeria’s Creds"));

  // 3. Check Bento Hero text
  const heroHeading = await page.locator("h1").textContent();
  console.log("Hero Heading:", heroHeading);

  // 4. Check Sem 1 Courses count
  const sem1Cards = await page.locator(".academic-card-hover").count();
  console.log("Sem 1 Course Cards Rendered:", sem1Cards);
  if (sem1Cards !== 9) {
    console.warn(`Expected 9 courses in Semester 1, found: ${sem1Cards}`);
  }

  // Check specific course codes in Semester 1
  const bodyText = await page.innerText("body");
  const expectedSem1Codes = [
    "MA101BS",
    "CH102BS",
    "EN103HS",
    "EC104ES",
    "CS105ES",
    "CH106BS",
    "CS107ES",
    "EN108HS",
    "ME109ES",
  ];
  for (const code of expectedSem1Codes) {
    const hasCode = bodyText.includes(code);
    console.log(`Course ${code} present in Sem 1:`, hasCode);
    if (!hasCode) throw new Error(`Missing expected Sem 1 course: ${code}`);
  }

  // 5. Test switching to Semester 2
  const sem2Button = page.locator("button:has-text('Semester 2')").first();
  if (await sem2Button.isVisible()) {
    console.log("Clicking Semester 2 button...");
    await sem2Button.click();
    await page.waitForTimeout(500);

    const sem2Cards = await page.locator(".academic-card-hover").count();
    console.log("Sem 2 Course Cards Rendered:", sem2Cards);

    const bodyTextSem2 = await page.innerText("body");
    const expectedSem2Codes = [
      "MA201BS",
      "PH202BS",
      "ME203ES",
      "EE204ES",
      "CS205ES",
      "PH206BS",
      "CS207ES",
      "CS208ES",
      "EE209ES",
      "CS210ES",
    ];
    for (const code of expectedSem2Codes) {
      const hasCode = bodyTextSem2.includes(code);
      console.log(`Course ${code} present in Sem 2:`, hasCode);
      if (!hasCode) throw new Error(`Missing expected Sem 2 course: ${code}`);
    }

    // Switch back to Semester 1 for screenshot
    const sem1Button = page.locator("button:has-text('Semester 1')").first();
    await sem1Button.click();
    await page.waitForTimeout(500);
  }

  // 6. Check Right Rail & Insights Row elements
  const hasHeatmap = await page.locator("text=12-Week Study Matrix").isVisible();
  const hasWeeklyChart = await page.locator("text=Weekly Study Hours").isVisible();
  console.log("Study Heatmap Visible:", hasHeatmap);
  console.log("Weekly Chart Visible:", hasWeeklyChart);

  // 7. Take screenshot of Phase 1 Bento Dashboard
  const screenshotPath = "/Users/huriyafatima/catyas-creds/public/phase1-valeria-dashboard.png";
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to ${screenshotPath}`);

  await browser.close();
  console.log("Phase 1 browser check PASSED successfully!");
}

run().catch((err) => {
  console.error("Browser check failed:", err);
  process.exit(1);
});
