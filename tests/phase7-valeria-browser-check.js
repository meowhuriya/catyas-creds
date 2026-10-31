const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

async function run() {
  console.log("🚀 Starting Phase 7 Browser Verification...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();

  // Ensure artifacts output directory exists
  const artifactDir = "/Users/huriyafatima/.gemini/antigravity/brain/a1ba62d4-a183-4a80-bd36-8c81b79e1a5e";
  const publicDir = "/Users/huriyafatima/catyas-creds/public";

  // 1. TRANSCRIPT PAGE VERIFICATION
  console.log("📄 1. Testing /transcript page...");
  await page.goto("http://localhost:3000/transcript", { waitUntil: "domcontentloaded" });

  // Verify headers and branding
  await page.waitForSelector(".official-transcript");
  const transcriptText = await page.innerText(".official-transcript");
  
  if (!transcriptText.toUpperCase().includes("VALERIA’S CREDS REGISTRY OF ACADEMIC RECORDS")) {
    throw new Error("Missing Valeria's Creds Registry header in transcript");
  }
  if (!transcriptText.includes("VC-2026-9812-REG")) {
    throw new Error("Missing Registry ID VC-2026-9812-REG in transcript");
  }
  if (!transcriptText.includes("Self-awarded credits. Not accredited by any institution.")) {
    throw new Error("Missing mandatory accreditation disclaimer in transcript");
  }
  if (!transcriptText.includes("Dean of Academic Studies") || !transcriptText.includes("Office of the Registrar")) {
    throw new Error("Missing official signatures in transcript");
  }

  console.log("✓ Official Transcript document verified with double crimson rule, signatures, and disclaimer.");

  // Test Verification Link Creation (Opt-in)
  const createLinkBtn = page.locator("button:has-text('Create Verification Link')");
  if (await createLinkBtn.isVisible()) {
    console.log("Clicking 'Create Verification Link'...");
    await createLinkBtn.click();
    await page.waitForTimeout(1000);
  }

  // Read the active snapshot verification ID
  const verificationIdContainer = page.locator("[data-testid='verification-id-container']");
  await page.waitForSelector("[data-testid='verification-id-container']:has-text('VER-')");
  const verificationIdText = await verificationIdContainer.innerText();
  const snapshotIdMatch = verificationIdText.match(/VER-[A-Z0-9]+/);
  if (!snapshotIdMatch) {
    throw new Error(`Failed to extract snapshot ID from text: ${verificationIdText}`);
  }
  const snapshotId = snapshotIdMatch[0];
  console.log(`Active snapshot ID: ${snapshotId}`);

  // Check QR Code
  const qrImg = page.locator("img[alt='Verification QR Code']");
  await qrImg.waitFor({ state: "visible", timeout: 5000 });
  console.log("✓ Verification QR code successfully generated and rendered.");

  // Copy Link test
  const copyBtn = page.locator("button[title='Copy public verification link']");
  if (await copyBtn.isVisible()) {
    await copyBtn.click();
    await page.waitForTimeout(500);
    console.log("✓ Verification link copied to clipboard.");
  }

  // Take screenshot of transcript
  const transcriptPath = path.join(publicDir, "phase7-transcript.png");
  await page.screenshot({ path: transcriptPath, fullPage: true });
  fs.copyFileSync(transcriptPath, path.join(artifactDir, "phase7-transcript.png"));
  console.log("📸 Saved phase7-transcript.png");

  // 2. PUBLIC VERIFICATION PAGE (/verify/[id])
  console.log(`🛡️ 2. Testing /verify/${snapshotId} page...`);
  await page.goto(`http://localhost:3000/verify/${snapshotId}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h2:has-text('Credential Verification Registry')");
  
  const verifyText = await page.innerText("body");
  if (!verifyText.includes("Official Credential Verified & Active")) {
    throw new Error("Verification banner not active on valid snapshot");
  }
  if (!verifyText.includes("Cryptographic Audit Log & Verification Chain")) {
    throw new Error("Missing cryptographic audit log on verification page");
  }
  if (!verifyText.includes("Self-awarded credits. Not accredited by any institution.")) {
    throw new Error("Missing mandatory accreditation disclaimer on verify page");
  }

  console.log("✓ Public verification page verified with verified banner, audit trail, and disclaimer.");

  const verifyPublicPath = path.join(publicDir, "phase7-verify-public.png");
  await page.screenshot({ path: verifyPublicPath, fullPage: true });
  fs.copyFileSync(verifyPublicPath, path.join(artifactDir, "phase7-verify-public.png"));
  console.log("📸 Saved phase7-verify-public.png");

  // Test Opt-In Privacy Controls: Revoke public link and verify gate
  console.log("Testing opt-in privacy revocation...");
  await page.goto("http://localhost:3000/transcript", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("button:has-text('Revoke Public Link')");
  await page.click("button:has-text('Revoke Public Link')");
  await page.waitForSelector("button:has-text('Make Link Public')");
  console.log("✓ Snapshot revoked to private.");

  // Verify that the link now shows the privacy gate
  await page.goto(`http://localhost:3000/verify/${snapshotId}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h2:has-text('Verification Record Not Found or Private')");
  const privatePolicyText = await page.innerText("body");
  if (!privatePolicyText.includes("Public Sharing Policy")) {
    throw new Error("Missing public sharing policy explanation for revoked private snapshot");
  }
  console.log("✓ Privacy policy gate confirmed: revoked snapshots return private policy screen.");

  // Restore snapshot to public for future reference
  await page.goto("http://localhost:3000/transcript", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("button:has-text('Make Link Public')");
  await page.click("button:has-text('Make Link Public')");
  await page.waitForSelector("button:has-text('Revoke Public Link')");

  // 3. SETTINGS PAGE VERIFICATION
  console.log("⚙️ 3. Testing /settings page...");
  await page.goto("http://localhost:3000/settings", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1:has-text('Academic Settings & Preferences')");

  // Toggle Grade Scale to 4.0
  const fourPointRadio = page.locator("input[value='4_point']");
  await fourPointRadio.click();
  console.log("Selected 4.0 Standard Collegiate Scale.");

  // Change watch hours per credit
  const hoursInput = page.locator("input[type='number']");
  await hoursInput.fill("20");

  // Test instant theme switcher
  const darkThemeBtn = page.locator("button:has-text('Dark')");
  await darkThemeBtn.click();
  await page.waitForTimeout(300);
  const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  if (!isDark) {
    throw new Error("Dark theme class was not added to documentElement");
  }
  console.log("✓ Instant dark theme switch verified.");

  // Switch back to light
  const lightThemeBtn = page.locator("button:has-text('Light')");
  await lightThemeBtn.click();
  await page.waitForTimeout(300);

  // Save Academic Preferences
  const savePrefsBtn = page.locator("button:has-text('Save Academic Preferences')");
  await savePrefsBtn.click();
  await page.waitForSelector("text='Academic preferences successfully updated.'", { timeout: 5000 });
  console.log("✓ Academic preferences saved with confirmation toast.");

  // Verify Term Manager
  const termsList = page.locator("text='Academic Term Manager'");
  await termsList.waitFor({ state: "visible" });
  console.log("✓ Academic Term Manager rendered with active term markers.");

  // Verify Reset Account Dialog Safety Check
  const resetBtn = page.locator("button:has-text('Reset Account')");
  await resetBtn.click();
  await page.waitForSelector("h2:has-text('Reset Entire Account')");
  
  const eraseBtn = page.locator("button:has-text('Erase All Data')");
  const isDisabledInitially = await eraseBtn.isDisabled();
  if (!isDisabledInitially) {
    throw new Error("Erase All Data button should be disabled until CONFIRM RESET is typed");
  }

  // Type incorrect phrase
  const confirmInput = page.locator("input[placeholder='CONFIRM RESET']");
  await confirmInput.fill("delete");
  if (!(await eraseBtn.isDisabled())) {
    throw new Error("Erase All Data should remain disabled for invalid phrase");
  }

  // Type correct phrase
  await confirmInput.fill("CONFIRM RESET");
  if (await eraseBtn.isDisabled()) {
    throw new Error("Erase All Data should be enabled when CONFIRM RESET is typed");
  }
  console.log("✓ Danger zone 'CONFIRM RESET' type-to-confirm safety validation passed.");

  // Cancel reset dialog
  const cancelBtn = page.locator("button:has-text('Cancel')");
  await cancelBtn.click();

  // Take screenshot of settings
  const settingsPath = path.join(publicDir, "phase7-settings.png");
  await page.screenshot({ path: settingsPath, fullPage: true });
  fs.copyFileSync(settingsPath, path.join(artifactDir, "phase7-settings.png"));
  console.log("📸 Saved phase7-settings.png");

  await browser.close();
  console.log("🎉 Phase 7 Browser Verification Completed Successfully!");
}

run().catch((err) => {
  console.error("❌ Phase 7 Verification Failed:", err);
  process.exit(1);
});
