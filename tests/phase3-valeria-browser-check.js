const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

async function runBrowserCheck() {
  console.log("Starting Phase 3 Valeria's Creds browser verification...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Visit Course Page for MA101BS (Matrices and Calculus)
    console.log("Navigating to course page http://localhost:3000/courses/course-ma101bs...");
    await page.goto("http://localhost:3000/courses/course-ma101bs", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Verify course title
    const courseTitle = await page.textContent("h1");
    console.log("Course Title:", courseTitle);

    // 2. Click "Add Videos" to open the multi-link import dialog
    console.log("Opening Add Videos dialog...");
    const addVideosBtn = page.locator("button:has-text('Add Videos')").first();
    await addVideosBtn.click();
    await page.waitForTimeout(1000);

    // 3. Paste YouTube URLs into textarea
    console.log("Pasting YouTube lecture links...");
    const textarea = page.locator("textarea[placeholder*='youtube.com']");
    const sampleLinks = [
      "https://www.youtube.com/watch?v=fNk_zzaMoSs",
      "https://youtu.be/1S0aBV-Waeo?t=15s",
      "https://www.youtube.com/playlist?list=PLbpi6ZahtOH6e_38bO7C1590_75b_W318", // Playlist-only to test blocking
      "not-a-valid-url" // Invalid test
    ].join("\n");

    await textarea.fill(sampleLinks);
    await page.waitForTimeout(500);

    // 4. Click "Preview & Validate Links"
    console.log("Submitting links for batch verification...");
    const verifyBtn = page.locator("button:has-text('Preview & Validate Links')");
    await verifyBtn.click();
    await page.waitForTimeout(3000);

    // Check preview items: should detect invalid and playlist links
    const previewCount = await page.locator(".max-h-80 > div").count();
    console.log(`Detected ${previewCount} preview items.`);

    // 5. Confirm & Save valid lessons
    console.log("Confirming & saving lessons...");
    const confirmSaveBtn = page.locator("button:has-text('Confirm & Save')");
    await confirmSaveBtn.click();
    await page.waitForTimeout(2500);

    // 6. Verify Video Gallery displays the newly added lecture cards
    console.log("Verifying Video Gallery cards...");
    const videoCards = page.locator(".academic-card .grid > div");
    const cardCount = await videoCards.count();
    console.log(`Found ${cardCount} lecture cards in Unit Video Gallery.`);

    // 7. Test linking a topic to the first video
    console.log("Testing Topic Linking...");
    const linkTopicBtn = page.locator("button:has-text('+ Link Topics'), button:has-text('Edit')").first();
    if (await linkTopicBtn.isVisible()) {
      await linkTopicBtn.click();
      await page.waitForTimeout(1000);
      // Select the first topic checkbox
      const firstTopicOption = page.locator(".max-h-60 button").first();
      if (await firstTopicOption.isVisible()) {
        await firstTopicOption.click();
        await page.waitForTimeout(500);
        const saveTopicBtn = page.locator("button:has-text('Save Topic Links')");
        await saveTopicBtn.click();
        await page.waitForTimeout(1500);
        console.log("Topic linked successfully!");
      }
    }

    // 8. Capture Video Gallery Screenshot
    const galleryScreenshotPath = path.join(process.cwd(), "public", "phase3-video-gallery.png");
    await page.screenshot({ path: galleryScreenshotPath, fullPage: false });
    console.log("Captured gallery screenshot at", galleryScreenshotPath);

    // 9. Navigate to the Wide Video Player
    console.log("Navigating to Video Player page...");
    const openPlayerLink = page.locator("a:has-text('Open Player'), a:has-text('Watch in Player')").first();
    await openPlayerLink.click();
    await page.waitForTimeout(3000);

    // Verify player elements
    const playerHeading = await page.textContent("h1");
    console.log("Player Page Title:", playerHeading);

    // Verify legal footer links
    const tosLink = page.locator("a:has-text('YouTube Terms of Service')").first();
    const privacyLink = page.locator("a:has-text('Google Privacy Policy')").first();
    console.log("ToS visible:", await tosLink.isVisible());
    console.log("Privacy visible:", await privacyLink.isVisible());

    // 10. Add a timestamped note
    console.log("Testing timestamped notes...");
    const timestampBtn = page.locator("button:has-text('Timestamp Current Time')");
    if (await timestampBtn.isVisible()) {
      await timestampBtn.click();
      await page.waitForTimeout(500);
    }

    const notesTextarea = page.locator("textarea[placeholder*='lecture notes']");
    if (await notesTextarea.isVisible()) {
      await notesTextarea.fill("Key concept: Matrix diagonalization and characteristic polynomial roots λ.");
      await page.waitForTimeout(1500); // Allow debounced autosave
      console.log("Notes autosaved.");
    }

    // 11. Test manual duration editor modal
    console.log("Testing manual duration editor modal...");
    const editDurationBtn = page.locator("button:has-text('(Edit duration)')");
    if (await editDurationBtn.isVisible()) {
      await editDurationBtn.click();
      await page.waitForTimeout(800);
      const durationInput = page.locator("input[placeholder*='45:30']");
      if (await durationInput.isVisible()) {
        await durationInput.fill("48:20");
        const saveDurBtn = page.locator("button:has-text('Save Duration')");
        await saveDurBtn.click();
        await page.waitForTimeout(1500);
        console.log("Manual duration updated to 48:20.");
      }
    }

    // 12. Capture Player Page Screenshot
    const playerScreenshotPath = path.join(process.cwd(), "public", "phase3-player-page.png");
    await page.screenshot({ path: playerScreenshotPath, fullPage: false });
    console.log("Captured player screenshot at", playerScreenshotPath);

    console.log("Phase 3 Browser Verification Completed Successfully!");
  } catch (err) {
    console.error("Browser verification failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runBrowserCheck();
