import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const ARTIFACTS_DIR = "/Users/huriyafatima/.gemini/antigravity/brain/a1ba62d4-a183-4a80-bd36-8c81b79e1a5e";

async function main() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Context (1440x900)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const desktopPage = await desktopContext.newPage();

  // Seed sample completed topic with recall due if needed, so cards show up nicely
  await desktopPage.goto("http://localhost:3000/courses/course-ma101bs", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);

  // Set exam date on course-ma101bs if not set so forecast displays rich data
  await desktopPage.evaluate(async () => {
    try {
      // Mark 5 topics as done with scores to test recall queue
      const rawTopics = localStorage.getItem("valerias_creds_v4_topics");
      if (rawTopics) {
        const topics = JSON.parse(rawTopics);
        let count = 0;
        for (const t of topics) {
          if (t.courseId === "course-ma101bs" && count < 5) {
            t.watchScore = 40;
            t.checkScore = 45;
            t.topicScore = 85;
            t.isDone = true;
            t.recallStage = 1;
            t.recallDueAt = new Date().toISOString().split("T")[0];
            t.retentionLevel = "green";
            count++;
          }
        }
        localStorage.setItem("valerias_creds_v4_topics", JSON.stringify(topics));
      }

      // Set exam date for course-ma101bs
      const examDates = [
        {
          id: "exam-ma101bs",
          userId: "sample-user",
          courseId: "course-ma101bs",
          examTitle: "End Semester Final Examination",
          date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          targetScore: 90,
        },
      ];
      localStorage.setItem("valerias_creds_v4_exam_dates", JSON.stringify(examDates));

      // Add a couple sample recall history entries
      const sampleHistory = [
        {
          id: "hist-1",
          userId: "sample-user",
          topicId: "ma101bs-u1-t1",
          courseId: "course-ma101bs",
          topicTitle: "Matrices: Rank of a Matrix by Echelon Form",
          courseCode: "MA101BS",
          stage: 2,
          rating: "good",
          previousRetention: "green",
          newRetention: "green",
          scoreBefore: 75,
          scoreAfter: 80,
          reviewedAt: new Date(Date.now() - 86400000).toISOString(),
          date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
        },
        {
          id: "hist-2",
          userId: "sample-user",
          topicId: "cs103es-u1-t2",
          courseId: "course-cs103es",
          topicTitle: "Control Structures: While and For Loops",
          courseCode: "CS103ES",
          stage: 1,
          rating: "hard",
          previousRetention: "green",
          newRetention: "amber",
          scoreBefore: 70,
          scoreAfter: 72,
          reviewedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
        },
      ];
      localStorage.setItem("valerias_creds_v4_recall_history", JSON.stringify(sampleHistory));
    } catch (e) {
      console.error(e);
    }
  });

  // Reload course page to capture Exam Readiness Forecast
  await desktopPage.goto("http://localhost:3000/courses/course-ma101bs", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({
    path: path.join(ARTIFACTS_DIR, "course-exam-readiness-1440px.png"),
    fullPage: false,
  });
  console.log("Captured course-exam-readiness-1440px.png");

  // Capture /today with the new Smart Recall Card
  await desktopPage.goto("http://localhost:3000/today", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({
    path: path.join(ARTIFACTS_DIR, "today-recall-card-1440px.png"),
    fullPage: false,
  });
  console.log("Captured today-recall-card-1440px.png");

  // Capture /recall active card flow (1440px)
  await desktopPage.goto("http://localhost:3000/recall", { waitUntil: "networkidle" });
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({
    path: path.join(ARTIFACTS_DIR, "recall-page-active-card-1440px.png"),
    fullPage: false,
  });
  console.log("Captured recall-page-active-card-1440px.png");

  // Click "Reveal Step-by-Step Solutions"
  const revealBtn = desktopPage.locator("button:has-text('Reveal')");
  if (await revealBtn.isVisible()) {
    await revealBtn.click();
    await desktopPage.waitForTimeout(500);
    await desktopPage.screenshot({
      path: path.join(ARTIFACTS_DIR, "recall-page-revealed-1440px.png"),
      fullPage: false,
    });
    console.log("Captured recall-page-revealed-1440px.png");
  }

  // Switch to History tab (1440px)
  const historyTabBtn = desktopPage.locator("button:has-text('Recall History')");
  if (await historyTabBtn.isVisible()) {
    await historyTabBtn.click();
    await desktopPage.waitForTimeout(600);
    await desktopPage.screenshot({
      path: path.join(ARTIFACTS_DIR, "recall-page-history-1440px.png"),
      fullPage: false,
    });
    console.log("Captured recall-page-history-1440px.png");
  }

  // 2. Mobile Context (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();

  // Mobile /recall
  await mobilePage.goto("http://localhost:3000/recall", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({
    path: path.join(ARTIFACTS_DIR, "recall-page-mobile-390px.png"),
    fullPage: false,
  });
  console.log("Captured recall-page-mobile-390px.png");

  // Mobile /today
  await mobilePage.goto("http://localhost:3000/today", { waitUntil: "networkidle" });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({
    path: path.join(ARTIFACTS_DIR, "today-recall-card-mobile-390px.png"),
    fullPage: false,
  });
  console.log("Captured today-recall-card-mobile-390px.png");

  await browser.close();
}

main().catch(console.error);
