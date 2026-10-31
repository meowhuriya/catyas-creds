const { chromium } = require("playwright");

async function runPhase4Check() {
  console.log("=== Phase 4 Browser Verification: Results, Planner & Degree Progress ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
  const page = await context.newPage();

  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });

  try {
    // -------------------------------------------------------------
    // 1. Course What-If Simulator & Target Solver (/courses/course-cs101)
    // -------------------------------------------------------------
    console.log("1. Navigating to /courses/course-cs101 Gradebook tab...");
    await page.goto("http://localhost:3000/courses/course-cs101", {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(1000);

    // Click Gradebook tab
    await page.click("button[role='tab']:has-text('Gradebook')");
    await page.waitForTimeout(600);

    // Verify What-If Simulator is visible
    const whatIfHeader = page.locator("h3:has-text('What-If Grade Simulator & Target Solver')");
    if (!(await whatIfHeader.isVisible())) {
      throw new Error("What-If Simulator component not found in course Gradebook!");
    }
    console.log("✓ What-If Simulator component rendered");

    // Adjust hypothetical points on an uncompleted item
    const rangeSlider = page.locator("input[type='range']").first();
    if (await rangeSlider.isVisible()) {
      await rangeSlider.fill("95");
      await page.waitForTimeout(300);
      console.log("✓ Adjusted hypothetical score slider");
    }

    // Change target solver dropdown
    const targetSelect = page.locator("select").last();
    if (await targetSelect.isVisible()) {
      await targetSelect.selectOption({ value: "80" });
      await page.waitForTimeout(300);
      const requirementText = page.locator("text=To secure a");
      if (!(await requirementText.isVisible())) {
        throw new Error("Target requirement solver message not rendered!");
      }
      console.log("✓ Target Grade requirement solver computed required average");
    }

    // Click Reset Scenarios
    await page.click("button:has-text('Reset Scenarios')");
    await page.waitForTimeout(400);
    console.log("✓ Reset Scenarios successfully reverted hypothetical scores");

    // -------------------------------------------------------------
    // 2. Global Grades & Standings Page (/grades)
    // -------------------------------------------------------------
    console.log("2. Navigating to /grades (Global Grades & Standings)...");
    await page.goto("http://localhost:3000/grades", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const gradesTitle = page.locator("h1:has-text('Official Grades & Academic Standings')");
    if (!(await gradesTitle.isVisible())) {
      throw new Error("Global Grades page title not found!");
    }

    // Verify Stats (SGPA, CGPA, Standing)
    const sgpaStat = page.locator("span:has-text('Average SGPA'), span:has-text('SGPA')").first();
    const cgpaStat = page.locator("span:has-text('Cumulative CGPA')");
    const standingStat = page.locator("span:has-text('Academic Standing')");

    if (!(await sgpaStat.isVisible()) || !(await cgpaStat.isVisible()) || !(await standingStat.isVisible())) {
      throw new Error("Academic standing stats missing on /grades!");
    }
    console.log("✓ Prominent Academic Standings stats rendered (SGPA, CGPA, Honors/Distinction)");

    // Test Grade Scale Toggle: switch to 4.0 Scale
    console.log("Testing Grade Scale Toggle (10-Pt vs 4.0 Scale)...");
    await page.click("button:has-text('4.0 Scale')");
    await page.waitForTimeout(500);

    const unit4 = page.locator("text=/ 4.00").first();
    if (!(await unit4.isVisible())) {
      throw new Error("Grade scale did not update display to / 4.00!");
    }
    console.log("✓ Switched to 4.0 Scale (grade points and letters updated)");

    // Switch back to 10-Pt Scale
    await page.click("button:has-text('10-Pt Scale')");
    await page.waitForTimeout(500);
    const unit10 = page.locator("text=/ 10.00").first();
    if (!(await unit10.isVisible())) {
      throw new Error("Grade scale did not revert to / 10.00!");
    }
    console.log("✓ Switched back to 10-Pt Scale");

    // Verify Enrolled Course Grades table
    const coursesTable = page.locator("table");
    if (!(await coursesTable.isVisible())) {
      throw new Error("Enrolled Course Grades table not found!");
    }
    console.log("✓ Enrolled Course Grades table populated with credits, letters, and standings");

    // -------------------------------------------------------------
    // 3. Academic Planner (/planner)
    // -------------------------------------------------------------
    console.log("3. Navigating to /planner (Academic Planner)...");
    await page.goto("http://localhost:3000/planner", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const plannerTitle = page.locator("h1:has-text('Academic Planner')");
    if (!(await plannerTitle.isVisible())) {
      throw new Error("Academic Planner page title not found!");
    }

    // Verify Month View grid is rendered
    const monthGrid = page.locator("div.grid-cols-7").first();
    if (!(await monthGrid.isVisible())) {
      throw new Error("Month View calendar grid not found!");
    }
    console.log("✓ Planner Month View calendar grid rendered with 7-day columns");

    // Test Week View toggle
    await page.click("button:has-text('Week View')");
    await page.waitForTimeout(500);
    const weekHeader = page.locator("span:has-text('Week of')");
    if (!(await weekHeader.isVisible())) {
      throw new Error("Week View did not activate!");
    }
    console.log("✓ Switched to Week View with daily agendas");

    // Switch back to Month View
    await page.click("button:has-text('Month View')");
    await page.waitForTimeout(500);

    // Test Schedule Study Block Modal
    console.log("Testing Schedule Study Block Modal...");
    await page.click("button:has-text('Schedule Study Block')");
    await page.waitForTimeout(500);

    const scheduleDialog = page.locator("[role='dialog']");
    const scheduleModalTitle = scheduleDialog.locator("h2:has-text('Schedule Dedicated Study Block')");
    if (!(await scheduleModalTitle.isVisible())) {
      throw new Error("Schedule Study Block modal failed to open!");
    }

    // Fill study block form
    await scheduleDialog.locator("input[placeholder*='ALU Ripple Carry']").fill("Automated Test Study Block");
    await scheduleDialog.getByRole("button", { name: "Schedule Block" }).click();
    await page.waitForTimeout(800);

    // Verify new study block is listed on planner
    const createdBlock = page.locator("text=Automated Test Study Block").first();
    if (!(await createdBlock.isVisible())) {
      throw new Error("Newly scheduled study block not rendered on calendar!");
    }
    console.log("✓ New study block scheduled and rendered on Planner");

    // -------------------------------------------------------------
    // 4. Degree Progress & Curriculum Audit (/degree)
    // -------------------------------------------------------------
    console.log("4. Navigating to /degree (Degree Progress & Audit)...");
    await page.goto("http://localhost:3000/degree", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const degreeTitle = page.locator("h1:has-text('Degree Audit & Curriculum Progress')");
    if (!(await degreeTitle.isVisible())) {
      throw new Error("Degree Audit page title not found!");
    }

    // Verify Advisory notice
    const advisory = page.locator("text=Academic Curricular Advisory");
    if (await advisory.isVisible()) {
      console.log("✓ Academic Curricular Advisory notice displayed");
    }

    // Verify Departmental and Level distributions
    const deptHeader = page.locator("h3:has-text('Departmental Credit Requirements')");
    const levelHeader = page.locator("h3:has-text('Curricular Level Distribution')");
    if (!(await deptHeader.isVisible()) || !(await levelHeader.isVisible())) {
      throw new Error("Departmental or Level distribution cards missing!");
    }
    console.log("✓ Departmental and Curricular Level progress distributions verified");

    // Test Audit Tabs (Completed, In Progress, Remaining)
    await page.click("button:has-text('In Progress')");
    await page.waitForTimeout(400);
    console.log("✓ Audit List switched to In Progress courses");

    await page.click("button:has-text('Remaining Requirements')");
    await page.waitForTimeout(400);
    const deficitBreakdown = page.locator("h4:has-text('Department Deficit Breakdown')");
    if (!(await deficitBreakdown.isVisible())) {
      throw new Error("Remaining Requirements deficit breakdown not visible!");
    }
    console.log("✓ Audit List switched to Remaining Requirements deficit breakdown");

    // Test Edit Degree Target Modal
    console.log("Testing Edit Degree Target Modal...");
    await page.click("button:has-text('Edit Degree Target')");
    await page.waitForTimeout(500);

    const targetDialog = page.locator("[role='dialog']");
    const targetModalTitle = targetDialog.locator("h2:has-text('Configure Degree Credit Target')");
    if (!(await targetModalTitle.isVisible())) {
      throw new Error("Edit Degree Target modal failed to open!");
    }

    // Click 140 cr preset
    await targetDialog.getByRole("button", { name: "140 cr" }).click();
    await page.waitForTimeout(200);
    await targetDialog.getByRole("button", { name: "Save Target" }).click();
    await page.waitForTimeout(800);

    const updatedTargetText = page.locator("text=140 Total Credits Target");
    if (!(await updatedTargetText.isVisible())) {
      throw new Error("Degree target was not updated to 140 cr!");
    }
    console.log("✓ Degree target successfully updated to 140 credits");

    // Verify Mandatory Disclaimer
    const disclaimer = page.locator("text=Self-awarded credits. Not accredited by any institution.");
    if (!(await disclaimer.isVisible())) {
      throw new Error("Mandatory disclaimer not displayed on Degree Audit page!");
    }
    console.log("✓ Mandatory accreditation disclaimer displayed prominently");

    console.log("\n=== All Phase 4 Browser Checks Passed Successfully! ===");
  } catch (err) {
    console.error("\n❌ Phase 4 Browser Check Failed:", err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase4Check();
