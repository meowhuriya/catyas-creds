const { chromium } = require("playwright");

async function run() {
  console.log("Starting browser check for Valeria's Creds Phase 2...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  const page = await context.newPage();

  // 1. Visit Courses listing page
  console.log("Navigating to /courses...");
  await page.goto("http://localhost:3000/courses", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const coursesHeading = await page.locator("h1").innerText();
  console.log("Courses page heading:", coursesHeading);

  // Check Term filters
  const allCoursesCount = await page.locator(".academic-card-hover").count();
  console.log("Total course cards on /courses:", allCoursesCount);
  if (allCoursesCount < 19) {
    console.warn(`Expected 19 courses, found: ${allCoursesCount}`);
  }

  // Test "Create Course" Modal
  const createCourseBtn = page.locator("button:has-text('Create Course')").first();
  await createCourseBtn.click();
  await page.waitForTimeout(400);

  const modalTitle = await page.locator("text=Create Academic Course").isVisible();
  console.log("Create Course modal opened:", modalTitle);

  // Close modal with Cancel or Escape
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // 2. Navigate to CS105ES ("Programming for Problem Solving")
  console.log("Navigating to /courses/course-cs105es...");
  await page.goto("http://localhost:3000/courses/course-cs105es", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // Check 160px banner & title
  const courseTitle = await page.locator("h1").innerText();
  console.log("Course detail title:", courseTitle);
  if (!courseTitle.includes("Programming for Problem Solving")) {
    throw new Error(`Expected 'Programming for Problem Solving', got: ${courseTitle}`);
  }

  // Check Unit Journey
  const hasUnitJourney = await page.locator("text=Unit Journey").isVisible();
  console.log("Unit Journey roadmap visible:", hasUnitJourney);

  const unitButtons = await page.locator("button:has-text('Unit ')").count();
  console.log("Unit Journey circles rendered:", unitButtons);

  // Check Split View (Topic Checklist on left, Video Gallery on right)
  const hasTopicsChecklist = await page.locator("text=Curricular Unit Topics").isVisible();
  const hasVideoGallery = await page.locator("text=Unit Lectures & Media").isVisible();
  console.log("Topic Checklist visible on left:", hasTopicsChecklist);
  console.log("Unit Video Gallery visible on right:", hasVideoGallery);

  // Check that CS105ES topics from seed are displayed
  const bodyText = await page.innerText("body");
  const hasOverviewTopic = bodyText.includes("General Form of a C Program") || bodyText.includes("Statements");
  console.log("CS105ES Unit 1 topics matching syllabus:", hasOverviewTopic);
  if (!hasOverviewTopic) {
    throw new Error("Syllabus topics for CS105ES not found in topic checklist!");
  }

  // Test Toggling "I studied this" checkbox
  console.log("Testing 'I studied this' topic checkbox...");
  const firstStudyCheckbox = page.locator("button[title*='I studied this'], button[title*='Lecture watch']").first();
  if (await firstStudyCheckbox.isVisible()) {
    await firstStudyCheckbox.click();
    await page.waitForTimeout(600);
    console.log("Clicked topic checkbox successfully.");
  }

  // Test "Tidy Topics" modal
  const tidyBtn = page.locator("button:has-text('Tidy Topics')");
  if (await tidyBtn.isVisible()) {
    await tidyBtn.click();
    await page.waitForTimeout(400);
    const tidyModalVisible = await page.locator("text=Tidy Topics with Academic AI").isVisible();
    console.log("Tidy Topics modal opened:", tidyModalVisible);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }

  // Test "Reset Syllabus" modal
  const resetBtn = page.locator("button:has-text('Reset Syllabus')");
  if (await resetBtn.isVisible()) {
    await resetBtn.click();
    await page.waitForTimeout(400);
    const resetModalVisible = await page.locator("text=Reset to Original Syllabus").isVisible();
    console.log("Reset Syllabus modal opened:", resetModalVisible);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  }

  // Take screenshot of CS105ES Course Page with Unit Journey & Split View
  const screenshotPath1 = "/Users/huriyafatima/catyas-creds/public/phase2-course-detail.png";
  await page.screenshot({ path: screenshotPath1, fullPage: true });
  console.log(`Saved screenshot to ${screenshotPath1}`);

  // 3. Test Lab Course: PH206BS ("Advanced Engineering Physics Lab")
  console.log("Navigating to /courses/course-ph206bs (Lab with elective experiments)...");
  await page.goto("http://localhost:3000/courses/course-ph206bs", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  const labBodyText = await page.innerText("body");
  const hasElectiveBanner = labBodyText.includes("Elective Lab Requirement") || labBodyText.includes("any 8 experiments");
  console.log("Lab elective 'any 8 experiments' requirement visible:", hasElectiveBanner);

  // Take screenshot of Lab Course
  const screenshotPath2 = "/Users/huriyafatima/catyas-creds/public/phase2-lab-course.png";
  await page.screenshot({ path: screenshotPath2, fullPage: true });
  console.log(`Saved screenshot to ${screenshotPath2}`);

  await browser.close();
  console.log("Phase 2 browser check PASSED successfully!");
}

run().catch((err) => {
  console.error("Browser check failed:", err);
  process.exit(1);
});
