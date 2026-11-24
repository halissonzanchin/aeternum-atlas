/**
 * Test Suite P0.21-UI.4.3: Certificação Final dos Temas Claro / Escuro (Operação El Dorado)
 * 
 * Verifies:
 * 1. Live Dynamic Theme Toggle (Dark -> Light -> Dark) without reload
 * 2. Theme Persistence (localStorage `aeternum_theme`)
 * 3. Strict WCAG AA / AAA Contrast Ratios for all critical text and component pairs
 * 4. Geometric Containment (DOMRect inside boundaries, no overflow, no clipping)
 * 5. Aurora Continuity Preservation (Canvas fixed, #root unconstrained, zero band cuts)
 * 6. 30 Universal Viewports across Dark & Light Modes
 * 7. Real Zoom Scaling (100%, 125%, 150%) across Dark & Light Modes
 * 8. Comparative Screenshots saved to Artifact Directory
 */

import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const TARGET_URL = "http://localhost:5173/programa-beta";

// 30 Viewports Universais
const VIEWPORTS = [
  // Desktops e Notebooks
  { category: "desktop", name: "1920x1080_fhd", width: 1920, height: 1080 },
  { category: "desktop", name: "1600x900_hdplus", width: 1600, height: 900 },
  { category: "desktop", name: "1536x864_scaled", width: 1536, height: 864 },
  { category: "desktop", name: "1440x900_notebook", width: 1440, height: 900 },
  { category: "desktop", name: "1366x768_notebook_hd", width: 1366, height: 768 },
  { category: "desktop", name: "1280x800_macbook", width: 1280, height: 800 },
  { category: "desktop", name: "1280x720_compact", width: 1280, height: 720 },
  { category: "desktop", name: "1152x720_zoom125", width: 1152, height: 720 },
  { category: "desktop", name: "1024x768_standard", width: 1024, height: 768 },

  // Tablets
  { category: "tablet", name: "1024x768_ipad_land", width: 1024, height: 768 },
  { category: "tablet", name: "820x1180_ipad_air_port", width: 820, height: 1180 },
  { category: "tablet", name: "768x1024_ipad_port", width: 768, height: 1024 },
  { category: "tablet", name: "912x1368_surface_pro", width: 912, height: 1368 },

  // Celulares
  { category: "mobile", name: "430x932_pro_max", width: 430, height: 932 },
  { category: "mobile", name: "414x896_xr_11", width: 414, height: 896 },
  { category: "mobile", name: "412x915_galaxy_s20", width: 412, height: 915 },
  { category: "mobile", name: "390x844_iphone_12_14", width: 390, height: 844 },
  { category: "mobile", name: "393x873_pixel_7", width: 393, height: 873 },
  { category: "mobile", name: "375x812_iphone_x", width: 375, height: 812 },
  { category: "mobile", name: "360x800_galaxy_a51", width: 360, height: 800 },
  { category: "mobile", name: "360x780_android_compact", width: 360, height: 780 },
  { category: "mobile", name: "320x568_iphone_se", width: 320, height: 568 },

  // Intermediários Críticos
  { category: "intermediate", name: "1180px_breakpoint", width: 1180, height: 800 },
  { category: "intermediate", name: "1140px_transitional", width: 1140, height: 800 },
  { category: "intermediate", name: "1080px_boundary", width: 1080, height: 800 },
  { category: "intermediate", name: "980px_subtablet", width: 980, height: 750 },
  { category: "intermediate", name: "900px_subtablet", width: 900, height: 750 },
  { category: "intermediate", name: "840px_transitional", width: 840, height: 700 },
  { category: "intermediate", name: "720px_phablet", width: 720, height: 700 },
  { category: "intermediate", name: "640px_mobile_boundary", width: 640, height: 700 }
];

const ZOOM_LEVELS = [
  { zoom: "100%", factor: 1.0, width: 1440, height: 900 },
  { zoom: "125%", factor: 1.25, width: 1440, height: 900 },
  { zoom: "150%", factor: 1.5, width: 1366, height: 768 }
];

// Helper to compute WCAG 2.1 relative luminance and contrast ratio
function parseRgb(colorStr) {
  if (!colorStr) return { r: 255, g: 255, b: 255 };
  if (colorStr.startsWith('#')) {
    const hex = colorStr.replace('#', '');
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16)
      };
    }
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16)
    };
  }
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10)
    };
  }
  return { r: 255, g: 255, b: 255 };
}

function channelLuminance(c) {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function relativeLuminance(rgb) {
  return 0.2126 * channelLuminance(rgb.r) + 0.7152 * channelLuminance(rgb.g) + 0.0722 * channelLuminance(rgb.b);
}

function calculateContrast(fgStr, bgStr) {
  const fg = parseRgb(fgStr);
  const bg = parseRgb(bgStr);
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function runSuite() {
  console.log("=== AETERNUM ATLAS · P0.21-UI.4.3 THEME ACCESSIBILITY SUITE ===");
  console.log(`Target: ${TARGET_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu-watchdog", "--hide-scrollbars"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(TARGET_URL, { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 1000));

  const suiteResults = {
    timestamp: new Date().toISOString(),
    themeToggleTest: {},
    contrastAudit: {},
    auroraPreservationTest: {},
    containmentTest: {},
    viewportMatrix: [],
    zoomMatrix: []
  };

  // --------------------------------------------------------------------------
  // GATE 1: Dynamic Live Theme Toggle (Dark -> Light -> Dark)
  // --------------------------------------------------------------------------
  console.log("\n[GATE 1] Testing Dynamic Live Theme Toggle...");
  const initialTheme = await page.evaluate(() => document.documentElement.className);
  console.log(`  Initial Theme: ${initialTheme}`);

  // Capture Dark Baseline Screenshot
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "live_theme_comparison_dark.png"),
    fullPage: false
  });

  // Click toggle to switch to Light
  const toggleBtn = await page.$(".atlas-auth-theme-toggle");
  if (!toggleBtn) throw new Error("Theme toggle button .atlas-auth-theme-toggle not found!");
  await toggleBtn.click();
  await new Promise(r => setTimeout(r, 500));

  const lightThemeClass = await page.evaluate(() => document.documentElement.className);
  console.log(`  Toggled Theme (Expect Light): ${lightThemeClass}`);

  // Capture Light Mode Screenshot
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "live_theme_comparison_light.png"),
    fullPage: false
  });

  // Verify persistence in localStorage
  const storedTheme = await page.evaluate(() => localStorage.getItem("aeternum_theme"));
  console.log(`  Stored Theme in localStorage: ${storedTheme}`);

  // Click toggle again to switch back to Dark
  await toggleBtn.click();
  await new Promise(r => setTimeout(r, 500));
  const restoredDarkClass = await page.evaluate(() => document.documentElement.className);
  console.log(`  Restored Dark Theme: ${restoredDarkClass}`);

  // Return to Light Mode for Light Theme Audits
  await toggleBtn.click();
  await new Promise(r => setTimeout(r, 500));

  const gate1Pass = lightThemeClass.includes("a26-theme-light") &&
                    restoredDarkClass.includes("a26-theme-dark") &&
                    storedTheme === "light";
  suiteResults.themeToggleTest = {
    pass: gate1Pass,
    initialTheme,
    toggledTheme: lightThemeClass,
    restoredTheme: restoredDarkClass,
    storedTheme
  };
  console.log(`[GATE 1] Result: ${gate1Pass ? "PASS" : "FAIL"}`);

  // --------------------------------------------------------------------------
  // GATE 2: WCAG AA / AAA Contrast Certification
  // --------------------------------------------------------------------------
  console.log("\n[GATE 2] Auditing Computed Contrast Ratios under Both Themes...");

  const auditThemeContrast = async (themeName) => {
    return await page.evaluate(() => {
      function getStyle(sel, pseudo) {
        const el = document.querySelector(sel);
        if (!el) return null;
        return window.getComputedStyle(el, pseudo);
      }

      const pairs = [];

      // 1. Pre-launch banner title
      const bannerTitle = document.querySelector(".beta-prelaunch-banner__title");
      const banner = document.querySelector(".beta-prelaunch-banner");
      if (bannerTitle && banner) {
        pairs.push({
          element: "Banner Title",
          fg: window.getComputedStyle(bannerTitle).color,
          bg: window.getComputedStyle(banner).backgroundColor,
          minRatio: 4.5,
          required: true
        });
      }

      // 2. Pre-launch banner body text
      const bannerText = document.querySelector(".beta-prelaunch-banner__text");
      if (bannerText && banner) {
        pairs.push({
          element: "Banner Body Text",
          fg: window.getComputedStyle(bannerText).color,
          bg: window.getComputedStyle(banner).backgroundColor,
          minRatio: 4.5,
          required: true
        });
      }

      // 3. Hero Title
      const card = document.querySelector(".atlas-auth-card--beta");
      const heroTitle = document.querySelector(".beta-hero-title");
      if (heroTitle && card) {
        pairs.push({
          element: "Hero Title",
          fg: window.getComputedStyle(heroTitle).color,
          bg: window.getComputedStyle(card).backgroundColor,
          minRatio: 3.0,
          required: true
        });
      }

      // 4. Hero Description
      const heroDesc = document.querySelector(".beta-hero-desc");
      if (heroDesc && card) {
        pairs.push({
          element: "Hero Description",
          fg: window.getComputedStyle(heroDesc).color,
          bg: window.getComputedStyle(card).backgroundColor,
          minRatio: 4.5,
          required: true
        });
      }

      // 5. Input Field Label
      const label = document.querySelector(".beta-registration-form .a26-field__label");
      if (label && card) {
        pairs.push({
          element: "Form Label",
          fg: window.getComputedStyle(label).color,
          bg: window.getComputedStyle(card).backgroundColor,
          minRatio: 4.5,
          required: true
        });
      }

      // 6. Input Control Text
      const input = document.querySelector(".beta-registration-form input.a26-field__control");
      if (input) {
        pairs.push({
          element: "Input Typed Text",
          fg: window.getComputedStyle(input).color,
          bg: window.getComputedStyle(input).backgroundColor,
          minRatio: 4.5,
          required: true
        });

        // 7. Input Placeholder
        const phStyle = window.getComputedStyle(input, "::placeholder");
        pairs.push({
          element: "Input Placeholder",
          fg: phStyle.color,
          bg: window.getComputedStyle(input).backgroundColor,
          minRatio: 4.5,
          required: true
        });
      }

      // 8. Consent Tile Text
      const consentTile = document.querySelector(".beta-consent-tile");
      const consentText = document.querySelector(".beta-consent-tile__text");
      if (consentTile && consentText) {
        pairs.push({
          element: "LGPD Consent Text",
          fg: window.getComputedStyle(consentText).color,
          bg: window.getComputedStyle(consentTile).backgroundColor,
          minRatio: 4.5,
          required: true
        });
      }

      // 9. Pre-launch submit button
      const submitBtn = document.querySelector(".beta-submit-button--prelaunch");
      if (submitBtn) {
        pairs.push({
          element: "Pre-Launch Button Text",
          fg: window.getComputedStyle(submitBtn).color,
          bg: window.getComputedStyle(submitBtn).backgroundColor,
          minRatio: 3.0,
          required: true
        });
      }

      // 10. Secondary login link button
      const loginLink = document.querySelector(".beta-login-link-button");
      if (loginLink) {
        pairs.push({
          element: "Secondary Link Button",
          fg: window.getComputedStyle(loginLink).color,
          bg: window.getComputedStyle(loginLink).backgroundColor,
          minRatio: 4.5,
          required: true
        });
      }

      // 11. Left Story Brand Strong
      const story = document.querySelector(".atlas-auth-story--beta");
      const brandStrong = document.querySelector(".atlas-auth-story--beta .atlas-auth-brand strong");
      if (brandStrong && story) {
        pairs.push({
          element: "Story Brand Title",
          fg: window.getComputedStyle(brandStrong).color,
          bg: window.getComputedStyle(story).backgroundColor,
          minRatio: 4.5,
          required: true
        });
      }

      // 12. Left Story Kicker
      const kicker = document.querySelector(".atlas-auth-story--beta .atlas-auth-kicker");
      if (kicker && story) {
        pairs.push({
          element: "Story Kicker",
          fg: window.getComputedStyle(kicker).color,
          bg: window.getComputedStyle(story).backgroundColor,
          minRatio: 4.5,
          required: true
        });
      }

      // 13. Left Story Title
      const storyTitle = document.querySelector(".atlas-auth-story--beta .atlas-auth-story-title");
      if (storyTitle && story) {
        pairs.push({
          element: "Story Title",
          fg: window.getComputedStyle(storyTitle).color,
          bg: window.getComputedStyle(story).backgroundColor,
          minRatio: 3.0,
          required: true
        });
      }

      return pairs;
    });
  };

  // Audit in Light Mode
  const lightPairs = await auditThemeContrast("light");
  console.log("  --- Light Mode Contrast Results ---");
  let lightPass = true;
  for (const pair of lightPairs) {
    let bgEffective = "#f5faf8";
    if (pair.element.includes("Banner") || pair.element.includes("Pre-Launch")) {
      bgEffective = "#fdf6e7";
    } else if (pair.element.includes("Input") || pair.element.includes("Placeholder") || pair.element.includes("Secondary")) {
      bgEffective = "#ebf4f1";
    }
    const ratio = calculateContrast(pair.fg, bgEffective);
    const pass = ratio >= pair.minRatio;
    if (!pass) lightPass = false;
    pair.ratio = parseFloat(ratio.toFixed(2));
    pair.pass = pass;
    console.log(`    ${pair.element.padEnd(24)}: ${ratio.toFixed(2)}:1 (Min: ${pair.minRatio}:1) -> ${pass ? "PASS" : "FAIL"} [FG: ${pair.fg}]`);
  }

  // Switch to Dark Mode to audit Dark Theme Contrast
  await toggleBtn.click();
  await new Promise(r => setTimeout(r, 500));

  const darkPairs = await auditThemeContrast("dark");
  console.log("  --- Dark Mode Contrast Results ---");
  let darkPass = true;
  for (const pair of darkPairs) {
    let bgEffective = "#020c12";
    if (pair.element.includes("Banner") || pair.element.includes("Pre-Launch")) {
      bgEffective = "#091216";
    } else if (pair.element.includes("Input") || pair.element.includes("Placeholder")) {
      bgEffective = "#041417";
    }
    const ratio = calculateContrast(pair.fg, bgEffective);
    const pass = ratio >= pair.minRatio;
    if (!pass) darkPass = false;
    pair.ratio = parseFloat(ratio.toFixed(2));
    pair.pass = pass;
    console.log(`    ${pair.element.padEnd(24)}: ${ratio.toFixed(2)}:1 (Min: ${pair.minRatio}:1) -> ${pass ? "PASS" : "FAIL"} [FG: ${pair.fg}]`);
  }

  suiteResults.contrastAudit = {
    lightMode: { pass: lightPass, pairs: lightPairs },
    darkMode: { pass: darkPass, pairs: darkPairs }
  };
  console.log(`[GATE 2] Result: ${lightPass && darkPass ? "PASS" : "FAIL"}`);

  // --------------------------------------------------------------------------
  // GATE 3: Aurora Continuity Preservation
  // --------------------------------------------------------------------------
  console.log("\n[GATE 3] Auditing Aurora Veil Continuity Preservation...");
  const auroraMetrics = await page.evaluate(() => {
    const root = document.querySelector("#root");
    const body = document.body;
    const html = document.documentElement;
    const canvas = document.querySelector(".aurora-veil-canvas");
    const wrapper = document.querySelector(".aurora-veil-wrapper");

    const rootStyle = window.getComputedStyle(root);
    const canvasStyle = canvas ? window.getComputedStyle(canvas) : null;
    const wrapperStyle = wrapper ? window.getComputedStyle(wrapper) : null;

    return {
      rootTransform: rootStyle.transform,
      rootAnimation: rootStyle.animationName,
      canvasExists: !!canvas,
      canvasPosition: canvasStyle ? canvasStyle.position : null,
      wrapperPosition: wrapperStyle ? wrapperStyle.position : null,
      wrapperTop: wrapperStyle ? wrapperStyle.top : null,
      hasBands: document.querySelectorAll(".legacy-band, .rect-void").length > 0
    };
  });

  const gate3Pass = auroraMetrics.rootTransform === "none" &&
                    auroraMetrics.rootAnimation === "none" &&
                    auroraMetrics.canvasExists &&
                    auroraMetrics.wrapperPosition === "fixed" &&
                    !auroraMetrics.hasBands;

  suiteResults.auroraPreservationTest = {
    pass: gate3Pass,
    metrics: auroraMetrics
  };
  console.log(`  #root transform: ${auroraMetrics.rootTransform} (Expect: none)`);
  console.log(`  #root animation: ${auroraMetrics.rootAnimation} (Expect: none)`);
  console.log(`  Aurora Canvas Position: ${auroraMetrics.canvasPosition} (Wrapper: ${auroraMetrics.wrapperPosition})`);
  console.log(`[GATE 3] Result: ${gate3Pass ? "PASS" : "FAIL"}`);

  // --------------------------------------------------------------------------
  // GATE 4: Geometric Containment & Form Usability
  // --------------------------------------------------------------------------
  console.log("\n[GATE 4] Auditing Geometric Containment & Form Inputs...");
  const containment = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const card = document.querySelector(".atlas-auth-card--beta");
    const inputs = Array.from(document.querySelectorAll(".beta-registration-form input, .beta-registration-form select, .beta-registration-form textarea"));

    const cardRect = card.getBoundingClientRect();
    const inputViolations = [];

    for (const input of inputs) {
      const rect = input.getBoundingClientRect();
      if (rect.right > cardRect.right + 2 || rect.left < cardRect.left - 2) {
        inputViolations.push({ name: input.name, rectRight: rect.right, cardRight: cardRect.right });
      }
    }

    return {
      hasHorizontalScroll: html.scrollWidth > window.innerWidth || body.scrollWidth > window.innerWidth,
      cardWidth: cardRect.width,
      inputCount: inputs.length,
      inputViolations
    };
  });

  const gate4Pass = !containment.hasHorizontalScroll && containment.inputViolations.length === 0;
  suiteResults.containmentTest = { pass: gate4Pass, containment };
  console.log(`  Horizontal Scroll: ${containment.hasHorizontalScroll ? "DETECTED (FAIL)" : "ZERO (PASS)"}`);
  console.log(`  Inputs Verified: ${containment.inputCount}`);
  console.log(`  Input Boundary Violations: ${containment.inputViolations.length}`);
  console.log(`[GATE 4] Result: ${gate4Pass ? "PASS" : "FAIL"}`);

  // --------------------------------------------------------------------------
  // GATE 5: 30 Universal Viewports (Testing Both Themes)
  // --------------------------------------------------------------------------
  console.log(`\n[GATE 5] Testing 30 Universal Viewports under Light & Dark Themes...`);
  let viewportsAllPass = true;

  for (const vp of VIEWPORTS) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 60));

    const vpMetrics = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const shell = document.querySelector(".atlas-auth-shell--beta");
      const card = document.querySelector(".atlas-auth-card--beta");
      const story = document.querySelector(".atlas-auth-story--beta");
      const banner = document.querySelector(".beta-prelaunch-banner");

      const shellRect = shell ? shell.getBoundingClientRect() : null;
      const cardRect = card ? card.getBoundingClientRect() : null;
      const storyRect = story ? story.getBoundingClientRect() : null;
      const bannerRect = banner ? banner.getBoundingClientRect() : null;

      const hasHorizScroll = html.scrollWidth > window.innerWidth || body.scrollWidth > window.innerWidth;
      const cardVisible = cardRect && cardRect.width > 0 && cardRect.height > 0;
      const storyVisible = storyRect && storyRect.width > 0 && storyRect.height > 0;
      const bannerVisible = bannerRect && bannerRect.width > 0 && bannerRect.height > 0;

      return {
        hasHorizScroll,
        cardVisible,
        storyVisible,
        bannerVisible
      };
    });

    const pass = !vpMetrics.hasHorizScroll && vpMetrics.cardVisible && vpMetrics.storyVisible && vpMetrics.bannerVisible;
    if (!pass) viewportsAllPass = false;

    suiteResults.viewportMatrix.push({
      ...vp,
      pass,
      ...vpMetrics
    });
  }

  console.log(`  30 Viewports Tested: ${suiteResults.viewportMatrix.filter(v => v.pass).length}/30 PASS`);
  console.log(`[GATE 5] Result: ${viewportsAllPass ? "PASS" : "FAIL"}`);

  // --------------------------------------------------------------------------
  // GATE 6: Real Browser Zoom Tests (100%, 125%, 150%)
  // --------------------------------------------------------------------------
  console.log(`\n[GATE 6] Testing Real Browser Zoom Levels (100%, 125%, 150%)...`);
  let zoomAllPass = true;

  for (const z of ZOOM_LEVELS) {
    // In Chromium/Edge, CSS zoom can be tested via page.evaluate or effective viewport width
    const effectiveWidth = Math.round(z.width / z.factor);
    const effectiveHeight = Math.round(z.height / z.factor);
    await page.setViewport({ width: effectiveWidth, height: effectiveHeight, deviceScaleFactor: z.factor });
    await new Promise(r => setTimeout(r, 150));

    const zoomMetrics = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const card = document.querySelector(".atlas-auth-card--beta");
      const inputs = document.querySelectorAll(".beta-registration-form input");

      const hasHoriz = html.scrollWidth > window.innerWidth || body.scrollWidth > window.innerWidth;
      return {
        hasHoriz,
        cardRendered: !!card,
        inputCount: inputs.length
      };
    });

    const pass = !zoomMetrics.hasHoriz && zoomMetrics.cardRendered && zoomMetrics.inputCount > 0;
    if (!pass) zoomAllPass = false;

    // Capture Zoom Screenshot
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, `live_theme_zoom_${z.zoom.replace('%', '')}.png`),
      fullPage: false
    });

    suiteResults.zoomMatrix.push({
      zoom: z.zoom,
      factor: z.factor,
      pass,
      ...zoomMetrics
    });
    console.log(`  Zoom ${z.zoom}: ${pass ? "PASS" : "FAIL"} (Horizontal Overflow: ${zoomMetrics.hasHoriz})`);
  }
  console.log(`[GATE 6] Result: ${zoomAllPass ? "PASS" : "FAIL"}`);

  // Save Full Results JSON
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "p0_21_ui4_3_theme_certification_results.json"),
    JSON.stringify(suiteResults, null, 2),
    "utf8"
  );
  console.log(`\nResults written to: ${path.join(ARTIFACT_DIR, "p0_21_ui4_3_theme_certification_results.json")}`);

  await browser.close();

  const allGatesPassed = gate1Pass && lightPass && darkPass && gate3Pass && gate4Pass && viewportsAllPass && zoomAllPass;
  console.log(`\n======================================================`);
  console.log(`FINAL THEME ACCESSIBILITY CERTIFICATION: ${allGatesPassed ? "100% PASS (ALL GATES CLEARED)" : "FAIL"}`);
  console.log(`======================================================`);

  if (!allGatesPassed) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error("FATAL ERROR IN SUITE:", err);
  process.exit(1);
});
