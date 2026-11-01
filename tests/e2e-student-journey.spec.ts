import { test, expect } from "@playwright/test";

test.describe("Valeria's Creds — Comprehensive End-to-End Student Journey", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
  });

  test("1. Dashboard: Stat cards, Course cards, To-do list, and Continue Watching", async ({ page }) => {
    // Check main title & dashboard subtitle
    await expect(page.locator("h1")).toContainText(/Welcome back, Valeria/i);
    await expect(page.locator("text=Academic Dashboard")).toBeVisible();

    // Stat cards
    await expect(page.locator("text=Current CGPA").first()).toBeVisible();
    await expect(page.locator("text=Credits Earned").first()).toBeVisible();
    await expect(page.locator("text=Lessons Completed").first()).toBeVisible();
    await expect(page.locator("text=Total Study Time").first()).toBeVisible();

    // Course cards with 4px color indicator
    const courseCard = page.locator("a[href^='/courses/course-cs101']").first();
    await expect(courseCard).toBeVisible();

    // To-Do / Upcoming Deadlines Section
    await expect(page.locator("text=To-Do & Upcoming Deadlines")).toBeVisible();

    // Continue Watching Section
    await expect(page.locator("text=Continue Watching")).toBeVisible();

    // Footer compliance checks
    await expect(page.locator("text=Self-awarded credits. Not accredited by any institution.").first()).toBeVisible();
    await expect(page.locator("footer a[href='https://www.youtube.com/t/terms']")).toBeVisible();
    await expect(page.locator("footer a[href='https://policies.google.com/privacy']")).toBeVisible();
  });

  test("2. Global Keyboard Shortcuts & Navigation", async ({ page }) => {
    // Press '?' to open keyboard shortcuts dialog
    await page.keyboard.press("?");
    await page.waitForTimeout(300);

    const shortcutDialog = page.locator("[role='dialog']");
    await expect(shortcutDialog.getByRole("heading", { name: "Keyboard Shortcuts" })).toBeVisible();
    await expect(shortcutDialog.locator("text=Go to Academic Planner")).toBeVisible();

    // Close with Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Test sequence: 'g' then 'c' -> should navigate to /courses
    await page.keyboard.press("g");
    await page.waitForTimeout(100);
    await page.keyboard.press("c");
    await page.waitForTimeout(800);

    await expect(page).toHaveURL(/\/courses/);
    await expect(page.locator("h1")).toContainText(/Enrolled Academic Courses/i);
  });

  test("3. Course Classwork, Syllabus & Notes tabs", async ({ page }) => {
    // Open CS 101 course using real demo ID
    await page.goto("/courses/course-cs101", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    await expect(page.locator("h1")).toContainText(/Introduction to Computer Systems/i);

    // Switch to Syllabus tab
    await page.click("button[role='tab']:has-text('Syllabus')");
    await page.waitForTimeout(300);
    await expect(page.locator("text=Official Syllabus Document")).toBeVisible();
    await expect(page.locator("text=1. Course Overview & Description")).toBeVisible();
    await expect(page.locator("button:has-text('Print Syllabus')")).toBeVisible();

    // Switch to Notes tab
    await page.click("button[role='tab']:has-text('Notes')");
    await page.waitForTimeout(300);
    await expect(page.locator("text=Von Neumann Architecture")).toBeVisible();

    // Switch back to Classwork tab
    await page.click("button[role='tab']:has-text('Classwork')");
    await page.waitForTimeout(300);
    await expect(page.locator("text=Module 1: Machine Architecture & Data Representation")).toBeVisible();
  });

  test("4. Lesson Player: IFrame Embed, Watch Tracking, Channel Name & Notes", async ({ page }) => {
    await page.goto("/courses/course-cs101/lessons/les-cs101-1", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    // Channel name display
    await expect(page.locator("text=CrashCourse").first()).toBeVisible();

    // Fallback "Watch on YouTube" link (non-negotiable YouTube rule)
    const ytFallback = page.locator("a:has-text('Watch on YouTube')");
    await expect(ytFallback).toBeVisible();
    await expect(ytFallback).toHaveAttribute("href", /youtube\.com\/watch/);

    // YouTube iframe player presence
    const iframe = page.locator("iframe[src*='youtube.com/embed']");
    await expect(iframe).toBeVisible();

    // Notes panel with timestamp button
    await expect(page.locator("text=Lecture Notes & Timestamps")).toBeVisible();
    const timestampBtn = page.locator("button:has-text('Timestamp Current Time')");
    await expect(timestampBtn).toBeVisible();
  });

  test("5. Assessment Engine: Quiz Runner & Rubric Assignment Submission", async ({ page }) => {
    await page.goto("/courses/course-cs101", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1:has-text('Introduction to Computer Systems')");

    // 5A: Open Quiz Runner from Classwork tab
    const quizBtn = page.locator("button:has-text('Review / Retake Quiz'), button:has-text('Start Quiz')").first();
    await quizBtn.waitFor({ state: "visible" });
    await quizBtn.click();
    await page.waitForTimeout(600);

    const dialog = page.locator("[role='dialog']");
    await expect(dialog.locator("h2:has-text('Quiz 1: Fundamentals of Binary & Logic Gates')")).toBeVisible();

    // If retake button visible, click it
    const retakeBtn = dialog.getByRole("button", { name: /^Retake Quiz$/ });
    if (await retakeBtn.isVisible()) {
      await retakeBtn.click();
      await page.waitForTimeout(400);
    }

    // Select answers
    await dialog.locator("label:has-text('XOR')").click();
    await dialog.locator("label:has-text('Full Adder')").click();

    // Submit answers
    await dialog.getByRole("button", { name: "Submit Answers" }).click();
    await page.waitForTimeout(800);

    // Verify Score Summary
    await expect(dialog.locator("text=Attempt Result")).toBeVisible();
    await dialog.getByRole("button", { name: "Close" }).first().click();
    await page.waitForTimeout(500);

    // 5B: Open Assignment Submission with Rubric
    const assignBtn = page.locator("button:has-text('Update Submission & Rubric'), button:has-text('Submit Assignment')").first();
    await assignBtn.waitFor({ state: "visible" });
    await assignBtn.click();
    await page.waitForTimeout(600);

    const rubricDialog = page.locator("[role='dialog']");
    await expect(rubricDialog.locator("h2:has-text('Assignment 1: ALU Microarchitecture Design')")).toBeVisible();

    // Enter required justification (>= 10 chars)
    const justificationInput = rubricDialog.locator("textarea").first();
    await justificationInput.fill("Comprehensive ALU logic simulation with extensive truth table verification.");

    // Submit Assignment
    const submitAssignBtn = rubricDialog.getByRole("button", { name: /Update Submission|Submit & Self-Assess/ });
    await submitAssignBtn.click();
    await page.waitForTimeout(600);

    // Verify dialog closes
    await expect(rubricDialog).not.toBeVisible();
  });

  test("6. What-If Grade Simulator & Global Standings (/grades)", async ({ page }) => {
    await page.goto("/courses/course-cs101", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    await page.click("button[role='tab']:has-text('Gradebook')");
    await page.waitForTimeout(400);

    // What-If header
    await expect(page.locator("h3:has-text('What-If Grade Simulator & Target Solver')")).toBeVisible();

    // Target solver select
    const targetSelect = page.locator("select").last();
    if (await targetSelect.isVisible()) {
      await targetSelect.selectOption({ value: "80" });
      await page.waitForTimeout(300);
      await expect(page.locator("text=To secure a")).toBeVisible();
    }

    // Navigate to Global Grades
    await page.goto("/grades", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    await expect(page.locator("h1:has-text('Official Grades & Academic Standings')")).toBeVisible();
    await expect(page.locator("span:has-text('Cumulative CGPA')")).toBeVisible();

    // Toggle 10-point vs 4.0 scale
    const scaleBtn4 = page.locator("button:has-text('4.0 Scale')");
    await scaleBtn4.click();
    await page.waitForTimeout(200);
    await expect(page.locator("text=/ 4.00").first()).toBeVisible();

    const scaleBtn10 = page.locator("button:has-text('10-Pt Scale')");
    await scaleBtn10.click();
    await page.waitForTimeout(200);
    await expect(page.locator("text=/ 10.00").first()).toBeVisible();
  });

  test("7. Academic Planner: Week/Month views & Study Block Scheduler", async ({ page }) => {
    await page.goto("/planner", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    await expect(page.locator("h1")).toContainText(/Academic Planner/i);

    // Toggle Week view
    await page.click("button:has-text('Week View')");
    await page.waitForTimeout(300);
    await expect(page.locator("span:has-text('Week of')")).toBeVisible();

    // Toggle back to Month view
    await page.click("button:has-text('Month View')");
    await page.waitForTimeout(300);

    // Open Schedule Study Block dialog
    await page.click("button:has-text('Schedule Study Block')");
    await page.waitForTimeout(300);

    const blockDialog = page.locator("[role='dialog']");
    await expect(blockDialog.locator("h2:has-text('Schedule Dedicated Study Block')")).toBeVisible();

    await blockDialog.locator("input[placeholder*='ALU Ripple Carry']").fill("Dynamic Programming Mastery");
    await blockDialog.getByRole("button", { name: "Schedule Block" }).click();
    await page.waitForTimeout(500);

    // Verify newly scheduled block in calendar
    await expect(page.locator("text=Dynamic Programming Mastery").first()).toBeVisible();
  });

  test("8. Degree Progress Audit (/degree)", async ({ page }) => {
    await page.goto("/degree", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    await expect(page.locator("h1:has-text('Degree Audit & Curriculum Progress')")).toBeVisible();
    await expect(page.locator("text=Total Credits Completed")).toBeVisible();
    await expect(page.locator("text=Academic Curricular Advisory")).toBeVisible();
    await expect(page.locator("text=Departmental Credit Requirements")).toBeVisible();

    // Required disclaimer
    await expect(page.locator("text=Self-awarded credits. Not accredited by any institution.").first()).toBeVisible();
  });

  test("9. Official Transcript & Public Verification Engine (/transcript & /verify/[id])", async ({ page }) => {
    await page.goto("/transcript", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    // Official Header and Double Crimson Rule
    await expect(page.locator("h2:has-text('OFFICIAL ACADEMIC TRANSCRIPT')")).toBeVisible();
    await expect(page.locator("text=Dean of Academic Studies")).toBeVisible();
    await expect(page.locator("text=Office of the Registrar")).toBeVisible();

    // Required disclaimer
    await expect(page.locator("text=Self-awarded credits. Not accredited by any institution.").first()).toBeVisible();

    // Ensure Public Verification is issued
    const createBtn = page.locator("button:has-text('Create Verification Link')");
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(600);
    }

    // Dynamic QR code should be generated
    const qrImg = page.locator("img[alt='Verification QR Code']");
    await expect(qrImg).toBeVisible();

    // Check verification ID
    const verIdContainer = page.locator("[data-testid='verification-id-container'] strong");
    await expect(verIdContainer).toBeVisible();
    const verId = await verIdContainer.innerText();
    expect(verId).toMatch(/^VER-/);

    // Navigate to public verification URL
    await page.goto(`/verify/${verId}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    await expect(page.locator("text=Official Credential Verified & Active")).toBeVisible();
    await expect(page.locator("text=Verified Coursework Records")).toBeVisible();
    await expect(page.locator("text=Cryptographic Audit Log & Verification Chain")).toBeVisible();
    await expect(page.locator(`text=${verId}`).first()).toBeVisible();
  });

  test("10. Academic Settings & Data Portability (/settings)", async ({ page }) => {
    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    await expect(page.locator("h1:has-text('Academic Settings & Preferences')")).toBeVisible();

    // Grading scale selector
    await expect(page.locator("text=Collegiate Grade Scale")).toBeVisible();

    // Theme selector
    const darkBtn = page.locator("#main-content button:has-text('Dark')");
    await darkBtn.click();
    await page.waitForTimeout(300);

    // Verify dark class applied to root
    const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    expect(isDark).toBe(true);

    // Switch back to light
    const lightBtn = page.locator("#main-content button:has-text('Light')");
    await lightBtn.click();
    await page.waitForTimeout(300);

    const isLight = await page.evaluate(() => !document.documentElement.classList.contains("dark"));
    expect(isLight).toBe(true);

    // Term Manager
    await expect(page.locator("text=Academic Term Manager")).toBeVisible();

    // Data Export & Backup button
    await expect(page.locator("button:has-text('Export JSON Backup')")).toBeVisible();
  });
});
