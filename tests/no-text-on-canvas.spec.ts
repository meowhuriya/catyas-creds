import { test, expect } from "@playwright/test";
const { chromium } = require("@playwright/test");

const ROUTES = [
  { name: "dashboard", path: "/" },
  { name: "today", path: "/today" },
  { name: "recall", path: "/recall" },
  { name: "courses", path: "/courses" },
  { name: "one course page", path: "/courses/course-ch102bs" },
  { name: "one unit page", path: "/courses/course-ch102bs" },
  { name: "planner", path: "/planner" },
  { name: "grades", path: "/grades" },
  { name: "transcript", path: "/transcript" },
  { name: "degree progress", path: "/degree" },
  { name: "settings", path: "/settings" },
  { name: "privacy", path: "/privacy" },
];

const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900 },
  { name: "390x844", width: 390, height: 844 },
];

const THEMES = ["light", "dark"] as const;

export async function runAudit(options: { baseUrl?: string; verbose?: boolean } = {}) {
  const baseUrl = options.baseUrl || "http://localhost:3000";
  const browser = await chromium.launch({ headless: true });
  const allFailures: Array<{
    route: string;
    viewport: string;
    theme: string;
    type: "ON_GINGHAM" | "CONTRAST_FAIL";
    selector: string;
    text: string;
    ratio?: string;
    requiredRatio?: number;
    textColor?: string;
    bgColor?: string;
  }> = [];

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.width < 500,
    });
    const page = await context.newPage();

    for (const theme of THEMES) {
      for (const route of ROUTES) {
        await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(600);

        // Apply theme
        await page.evaluate((th: string) => {
          if (th === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }, theme);
        await page.waitForTimeout(200);

        // Evaluate all text elements
        const routeFailures = await page.evaluate(() => {
          function parseRgba(colorStr: string) {
            const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (!match) return null;
            return {
              r: parseInt(match[1], 10),
              g: parseInt(match[2], 10),
              b: parseInt(match[3], 10),
              a: match[4] !== undefined ? parseFloat(match[4]) : 1,
            };
          }

          function srgbToLinear(c: number) {
            const s = c / 255;
            return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
          }

          function getLuminance(r: number, g: number, b: number) {
            return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
          }

          function getContrast(rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }) {
            const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
            const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
            const lighter = Math.max(l1, l2);
            const darker = Math.min(l1, l2);
            return (lighter + 0.05) / (darker + 0.05);
          }

          function getSelector(el: Element): string {
            const path: string[] = [];
            let current: Element | null = el;
            while (current && current !== document.body) {
              let sel = current.tagName.toLowerCase();
              if (current.id) {
                sel += `#${current.id}`;
                path.unshift(sel);
                break;
              }
              if (current.classList.length > 0) {
                const firstClass = current.classList[0];
                if (firstClass && !firstClass.includes(":") && !firstClass.includes("/")) {
                  sel += `.${firstClass}`;
                }
              }
              path.unshift(sel);
              current = current.parentElement;
            }
            return path.join(" > ");
          }

          function findSolidBackground(element: Element) {
            let curr: Element | null = element;
            while (curr && curr !== document.body && curr !== document.documentElement) {
              const style = window.getComputedStyle(curr);
              const bg = style.backgroundColor;
              const bi = style.backgroundImage;

              if (bi && bi !== "none" && !bi.includes("gingham")) {
                return { type: "image", value: bi, color: bg, element: curr };
              }

              if (bg && bg !== "transparent") {
                const parsed = parseRgba(bg);
                if (parsed && parsed.a >= 0.9) {
                  return { type: "color", value: bg, parsed, element: curr };
                }
              }
              curr = curr.parentElement;
            }
            return null;
          }

          const items: Array<{
            type: "ON_GINGHAM" | "CONTRAST_FAIL";
            selector: string;
            text: string;
            ratio?: string;
            requiredRatio?: number;
            textColor?: string;
            bgColor?: string;
          }> = [];

          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          const visitedElements = new Set<Element>();

          while (walker.nextNode()) {
            const node = walker.currentNode;
            const text = node.textContent?.trim();
            if (!text || text.length === 0) continue;

            const el = node.parentElement;
            if (!el || visitedElements.has(el)) continue;
            visitedElements.add(el);

            const tag = el.tagName.toLowerCase();
            if (["script", "style", "noscript", "title"].includes(tag)) continue;
            if (el.closest("svg") || el.classList.contains("sr-only")) continue;
            if (el.id?.includes("recharts") || el.closest("[id*='recharts']") || el.getAttribute("aria-hidden") === "true") continue;

            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) continue;
            if (rect.top < -1000 || rect.left < -1000) continue;

            const style = window.getComputedStyle(el);
            if (
              style.display === "none" ||
              style.visibility === "hidden" ||
              parseFloat(style.opacity) === 0
            ) {
              continue;
            }

            const solidBg = findSolidBackground(el);
            if (!solidBg) {
              items.push({
                type: "ON_GINGHAM",
                selector: getSelector(el),
                text: text.slice(0, 60),
              });
              continue;
            }

            // Check contrast if background is solid color
            if (solidBg.type === "color" && (solidBg as any).parsed) {
              const textRgba = parseRgba(style.color);
              if (textRgba) {
                const ratio = getContrast(textRgba, (solidBg as any).parsed);
                const fontSize = parseFloat(style.fontSize);
                const fontWeight = parseInt(style.fontWeight, 10) || (style.fontWeight === "bold" ? 700 : 400);
                const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
                const requiredRatio = isLargeText ? 3.0 : 4.5;

                // Ignore if ratio meets threshold or text is subtle placeholder
                if (ratio < requiredRatio) {
                  items.push({
                    type: "CONTRAST_FAIL",
                    selector: getSelector(el),
                    text: text.slice(0, 60),
                    ratio: ratio.toFixed(2),
                    requiredRatio,
                    textColor: style.color,
                    bgColor: solidBg.value,
                  });
                }
              }
            }
          }

          return items;
        });

        for (const failure of routeFailures) {
          allFailures.push({
            route: route.name,
            viewport: viewport.name,
            theme,
            ...failure,
          });
        }
      }
    }
    await context.close();
  }

  await browser.close();
  return allFailures;
}

// Standalone execution if run via node
if (require.main === module) {
  (async () => {
    console.log("Running Automatic Check (no-text-on-canvas)...");
    const failures = await runAudit();
    console.log(`\nFound ${failures.length} issues across all routes, viewports, and themes:`);
    if (failures.length > 0) {
      failures.forEach((f, idx) => {
        if (f.type === "ON_GINGHAM") {
          console.log(`[${idx + 1}] [${f.route} | ${f.viewport} | ${f.theme}] ON_GINGHAM: "${f.text}" at ${f.selector}`);
        } else {
          console.log(`[${idx + 1}] [${f.route} | ${f.viewport} | ${f.theme}] CONTRAST_FAIL (${f.ratio}:1 < ${f.requiredRatio}:1): "${f.text}" at ${f.selector} (text: ${f.textColor}, bg: ${f.bgColor})`);
        }
      });
    } else {
      console.log("✓ Zero text on gingham! All contrast thresholds passed!");
    }
  })();
}

// Playwright test suite
test("no text sits directly on gingham canvas and passes WCAG AA contrast", async () => {
  test.setTimeout(240000);
  const failures = await runAudit();
  if (failures.length > 0) {
    console.log(`\n=== AUDIT FOUND ${failures.length} ISSUES ===`);
    failures.forEach((f, idx) => {
      if (f.type === "ON_GINGHAM") {
        console.log(`[${idx + 1}] [${f.route} | ${f.viewport} | ${f.theme}] ON_GINGHAM: "${f.text}" at ${f.selector}`);
      } else {
        console.log(`[${idx + 1}] [${f.route} | ${f.viewport} | ${f.theme}] CONTRAST_FAIL (${f.ratio}:1 < ${f.requiredRatio}:1): "${f.text}" at ${f.selector} (text: ${f.textColor}, bg: ${f.bgColor})`);
      }
    });
  }
  expect(failures.length).toBe(0);
});
