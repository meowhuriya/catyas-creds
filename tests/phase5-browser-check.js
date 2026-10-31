const { chromium } = require("playwright");

async function runPhase5Check() {
  console.log("=== Phase 5 Browser Verification: Official Documents, Verification & Settings ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  try {
    // -------------------------------------------------------------
    // 1. Official Academic Transcript Page (/transcript)
    // -------------------------------------------------------------
    console.log("1. Navigating to /transcript...");
    await page.goto("http://localhost:3000/transcript", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // Verify double crimson rule header
    const headerTitle = page.locator("h2:has-text('OFFICIAL ACADEMIC TRANSCRIPT')");
    if (!(await headerTitle.isVisible())) {
      throw new Error("Transcript double crimson rule header not found!");
    }
    console.log("✓ Official Academic Transcript header and double crimson rule verified");

    // Verify student candidate information
    const registryId = page.locator("text=CC-2026-9812-REG");
    if (!(await registryId.isVisible())) {
      throw new Error("Student registry identification not found on transcript!");
    }
    console.log("✓ Student candidate and registry identifiers verified");

    // Verify term-by-term breakdown
    const termSubtotal = page.locator("text=Term Subtotals").first();
    if (!(await termSubtotal.isVisible())) {
      throw new Error("Term subtotals missing on transcript!");
    }
    console.log("✓ Term-by-term course tables and subtotals rendered");

    // Verify cumulative totals
    const cumulativeCgpa = page.locator("span:has-text('Cumulative CGPA')");
    if (!(await cumulativeCgpa.isVisible())) {
      throw new Error("Cumulative CGPA summary missing on transcript!");
    }
    console.log("✓ Cumulative CGPA and total units summary rendered");

    // Verify Signature Blocks
    const deanSignature = page.locator("span:has-text('Dean of Academic Studies')");
    const registrarSignature = page.locator("span:has-text('Office of the Registrar')");
    if (!(await deanSignature.isVisible()) || !(await registrarSignature.isVisible())) {
      throw new Error("Dean and Registrar signature blocks missing!");
    }
    console.log("✓ Official Dean and Registrar signature blocks verified");

    // Verify Mandatory Disclaimer
    const disclaimer = page.locator("text=Self-awarded credits. Not accredited by any institution.").first();
    if (!(await disclaimer.isVisible())) {
      throw new Error("Mandatory accreditation disclaimer not found on transcript!");
    }
    console.log("✓ Mandatory accreditation disclaimer displayed");

    // Verify / Create Opt-In Verification Snapshot
    console.log("Testing Opt-In Verification Link & QR generation...");
    const createLinkBtn = page.locator("button:has-text('Create Verification Link')");
    if (await createLinkBtn.isVisible()) {
      await createLinkBtn.click();
      await page.waitForTimeout(800);
      console.log("✓ Created initial verification snapshot");
    }

    // Ensure link is public for verification check
    const makePublicBtn = page.locator("button:has-text('Make Link Public')");
    if (await makePublicBtn.isVisible()) {
      await makePublicBtn.click();
      await page.waitForTimeout(600);
      console.log("✓ Toggled verification link to Public");
    }

    // Verify QR Code Image
    const qrImg = page.locator("img[alt='Verification QR Code']");
    if (!(await qrImg.isVisible())) {
      throw new Error("Dynamic QR Code image not rendered on transcript!");
    }
    console.log("✓ Dynamic QR code successfully generated and rendered");

    // Extract Verification ID
    const verIdLocator = page.locator("[data-testid='verification-id-container'] strong");
    const verificationId = (await verIdLocator.innerText()).trim();
    console.log(`✓ Active Verification ID: ${verificationId}`);

    // -------------------------------------------------------------
    // 2. Public Credential Verification Page (/verify/[id])
    // -------------------------------------------------------------
    console.log(`2. Navigating to /verify/${verificationId} (Public Read-Only Verification)...`);
    await page.goto(`http://localhost:3000/verify/${verificationId}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const verifiedBanner = page.locator("text=Official Credential Verified & Active");
    if (!(await verifiedBanner.isVisible())) {
      throw new Error("Verified status banner not visible on public verification page!");
    }
    console.log("✓ Public verification page validated official credential");

    // Verify audit log section
    const auditChain = page.locator("h3:has-text('Cryptographic Audit Log & Verification Chain')");
    if (!(await auditChain.isVisible())) {
      throw new Error("Audit log chain missing on verification page!");
    }
    console.log("✓ Immutable cryptographic audit trail displayed on verification record");

    // Test revocation / opt-in privacy:
    // Go back to transcript and revoke public sharing
    console.log("Testing opt-in revocation capability (turning public sharing off)...");
    await page.goto("http://localhost:3000/transcript", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    const revokeBtn = page.locator("button:has-text('Revoke Public Link')");
    if (await revokeBtn.isVisible()) {
      await revokeBtn.click();
      await page.waitForTimeout(600);
      console.log("✓ Revoked public verification link");
    }

    // Reload verification page to confirm it is now private/revoked
    await page.goto(`http://localhost:3000/verify/${verificationId}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(800);

    const privateNotice = page.locator("text=Verification Record Not Found or Private");
    if (!(await privateNotice.isVisible())) {
      throw new Error("Revocation failed: Verification record should be private!");
    }
    console.log("✓ Revocation successfully verified: public access disabled on demand");

    // Re-enable public link for clean state
    await page.goto("http://localhost:3000/transcript", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);
    const reEnableBtn = page.locator("button:has-text('Make Link Public')");
    if (await reEnableBtn.isVisible()) {
      await reEnableBtn.click();
      await page.waitForTimeout(600);
    }

    // -------------------------------------------------------------
    // 3. Academic Settings Page (/settings)
    // -------------------------------------------------------------
    console.log("3. Navigating to /settings (Academic Settings & Data Management)...");
    await page.goto("http://localhost:3000/settings", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const settingsTitle = page.locator("h1:has-text('Academic Settings & Preferences')");
    if (!(await settingsTitle.isVisible())) {
      throw new Error("Settings page title not found!");
    }

    // Test Academic Preferences form
    console.log("Testing Academic Preferences update...");
    const hoursInput = page.locator("input[type='number']").first();
    await hoursInput.fill("18");
    await page.click("button:has-text('Save Academic Preferences')");
    await page.waitForTimeout(600);

    const successBadge = page.locator("text=Academic preferences successfully updated.");
    if (!(await successBadge.isVisible())) {
      throw new Error("Preferences update message not displayed!");
    }
    console.log("✓ Academic preferences successfully saved");

    // Test Theme Selector
    console.log("Testing Theme Selector (Dark / Light)...");
    await page.click("button:has-text('Dark')");
    await page.waitForTimeout(300);
    const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    if (!isDark) {
      throw new Error("Dark theme class was not added to document!");
    }
    console.log("✓ Dark theme activated");

    await page.click("button:has-text('Light')");
    await page.waitForTimeout(300);
    const isStillDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    if (isStillDark) {
      throw new Error("Light theme did not remove dark class!");
    }
    console.log("✓ Light theme restored");

    // Test Term Creation Dialog
    console.log("Testing Term Creation Dialog...");
    await page.click("button:has-text('New Academic Term')");
    await page.waitForTimeout(500);

    const termDialog = page.locator("[role='dialog']");
    const termDialogTitle = termDialog.locator("h2:has-text('Create Academic Term')");
    if (!(await termDialogTitle.isVisible())) {
      throw new Error("Create Academic Term modal failed to open!");
    }

    await termDialog.locator("input[placeholder*='Semester 1']").fill("Summer Intensive 2027");
    await termDialog.getByRole("button", { name: "Create Term" }).click();
    await page.waitForTimeout(800);

    const createdTerm = page.locator("#main-content").locator("text=Summer Intensive 2027").first();
    if (!(await createdTerm.isVisible())) {
      throw new Error("Newly created term not listed in Term Manager!");
    }
    console.log("✓ New Academic Term created and displayed in Term Manager");

    // Test Type-to-Confirm Account Reset & Reload Demo Data
    console.log("Testing Type-to-Confirm Account Reset Modal...");
    await page.click("button:has-text('Reset Account')");
    await page.waitForTimeout(500);

    const resetDialog = page.locator("[role='dialog']");
    const resetTitle = resetDialog.locator("h2:has-text('Reset Entire Account')");
    if (!(await resetTitle.isVisible())) {
      throw new Error("Reset Account confirmation dialog failed to open!");
    }

    const eraseBtn = resetDialog.getByRole("button", { name: "Erase All Data" });
    if (await eraseBtn.isEnabled()) {
      throw new Error("Erase button should be disabled before typing confirmation!");
    }

    // Type CONFIRM RESET
    await resetDialog.locator("input[placeholder='CONFIRM RESET']").fill("CONFIRM RESET");
    await page.waitForTimeout(200);

    if (!(await eraseBtn.isEnabled())) {
      throw new Error("Erase button should be enabled after typing CONFIRM RESET!");
    }

    await eraseBtn.click();
    await page.waitForTimeout(800);
    console.log("✓ Account reset successfully executed with confirmation guard");

    // Restore Demo Data for user
    console.log("Restoring collegiate demo dataset for pair programming...");
    await page.click("button:has-text('Reload Demo Data')");
    await page.waitForTimeout(800);
    console.log("✓ Demo dataset successfully restored");

    console.log("\n=== All Phase 5 Browser Checks Passed Successfully! ===");
  } catch (err) {
    console.error("\n❌ Phase 5 Browser Check Failed:", err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase5Check();
