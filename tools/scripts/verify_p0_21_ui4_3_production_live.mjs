/**
 * Production Live Verification Script · Missão P0.21-UI.4.3
 * Homologação Final dos Temas Claro / Escuro em Produção Real
 * 
 * Target: https://www.aeternumatlas.com/programa-beta
 * Apex Redirect: https://aeternumatlas.com/programa-beta
 */

import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const PROD_URL = "https://www.aeternumatlas.com/programa-beta";

const VIEWPORTS = [
  { name: "1920x1080_fhd", width: 1920, height: 1080 },
  { name: "1440x900_notebook", width: 1440, height: 900 },
  { name: "1366x768_notebook_hd", width: 1366, height: 768 },
  { name: "1024x768_ipad_land", width: 1024, height: 768 },
  { name: "768x1024_ipad_port", width: 768, height: 1024 },
  { name: "390x844_mobile", width: 390, height: 844 },
  { name: "1180px_breakpoint", width: 1180, height: 800 }
];

function parseColor(str) {
  if (!str) return { r: 255, g: 255, b: 255 };
  if (str.startsWith('#')) {
    const hex = str.replace('#', '');
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
  const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return { r: parseInt(match[1], 10), g: parseInt(match[2], 10), b: parseInt(match[3], 10) };
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
  const fg = parseColor(fgStr);
  const bg = parseColor(bgStr);
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

async function verifyLiveProduction() {
  console.log("=== AETERNUM ATLAS · P0.21-UI.4.3 PRODUCTION LIVE VERIFICATION ===");
  console.log(`URL: ${PROD_URL}`);

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu-watchdog"]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(PROD_URL, { waitUntil: "networkidle0", timeout: 45000 });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Capture Dark Production Screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_prod_ui4_3_dark_1440x900.png") });

  // 2. Click Theme Toggle to Light Mode
  const toggleBtn = await page.$(".atlas-auth-theme-toggle");
  if (toggleBtn) {
    await toggleBtn.click();
    await new Promise(r => setTimeout(r, 800));
  }

  // 3. Capture Light Production Screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_prod_ui4_3_light_1440x900.png") });

  // 4. Capture Mobile Light Production Screenshot
  await page.setViewport({ width: 390, height: 844 });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live_prod_ui4_3_light_390x844_mobile.png") });

  // Return to Desktop 1440x900
  await page.setViewport({ width: 1440, height: 900 });
  await new Promise(r => setTimeout(r, 400));

  // 5. Evaluate Computed Contrast and DOM in Production
  const audit = await page.evaluate(() => {
    const bannerTitle = document.querySelector(".beta-prelaunch-banner__title");
    const bannerText = document.querySelector(".beta-prelaunch-banner__text");
    const input = document.querySelector(".beta-registration-form input.a26-field__control");
    const placeholderStyle = input ? window.getComputedStyle(input, "::placeholder") : null;
    const submitBtn = document.querySelector(".beta-submit-button--prelaunch");
    const loginLink = document.querySelector(".beta-login-link-button");
    const consentTitle = document.querySelector(".beta-consent-title");
    const heroTitle = document.querySelector(".beta-hero-title");

    return {
      themeClass: document.documentElement.className,
      bannerTitleColor: bannerTitle ? window.getComputedStyle(bannerTitle).color : null,
      bannerTextColor: bannerText ? window.getComputedStyle(bannerText).color : null,
      inputBg: input ? window.getComputedStyle(input).backgroundColor : null,
      inputColor: input ? window.getComputedStyle(input).color : null,
      placeholderColor: placeholderStyle ? placeholderStyle.color : null,
      submitColor: submitBtn ? window.getComputedStyle(submitBtn).color : null,
      loginLinkColor: loginLink ? window.getComputedStyle(loginLink).color : null,
      consentTitleColor: consentTitle ? window.getComputedStyle(consentTitle).color : null,
      heroTitleColor: heroTitle ? window.getComputedStyle(heroTitle).color : null
    };
  });

  const bannerTitleContrast = calculateContrast(audit.bannerTitleColor, "#fdf6e7");
  const bannerTextContrast = calculateContrast(audit.bannerTextColor, "#fdf6e7");
  const placeholderContrast = calculateContrast(audit.placeholderColor, "#ebf4f1");
  const inputContrast = calculateContrast(audit.inputColor, "#ebf4f1");
  const submitContrast = calculateContrast(audit.submitColor, "#fdf6e7");

  console.log(`Production Audit Results:`);
  console.log(`  Theme Class: ${audit.themeClass}`);
  console.log(`  Banner Title Contrast: ${bannerTitleContrast.toFixed(2)}:1 (Min 4.5:1) -> ${bannerTitleContrast >= 4.5 ? "PASS" : "FAIL"}`);
  console.log(`  Banner Text Contrast: ${bannerTextContrast.toFixed(2)}:1 (Min 4.5:1) -> ${bannerTextContrast >= 4.5 ? "PASS" : "FAIL"}`);
  console.log(`  Placeholder Contrast: ${placeholderContrast.toFixed(2)}:1 (Min 4.5:1) -> ${placeholderContrast >= 4.5 ? "PASS" : "FAIL"}`);
  console.log(`  Input Text Contrast: ${inputContrast.toFixed(2)}:1 (Min 4.5:1) -> ${inputContrast >= 4.5 ? "PASS" : "FAIL"}`);
  console.log(`  Submit Button Contrast: ${submitContrast.toFixed(2)}:1 (Min 3.0:1) -> ${submitContrast >= 3.0 ? "PASS" : "FAIL"}`);

  const liveResults = {
    timestamp: new Date().toISOString(),
    prodUrl: PROD_URL,
    audit,
    ratios: {
      bannerTitle: parseFloat(bannerTitleContrast.toFixed(2)),
      bannerText: parseFloat(bannerTextContrast.toFixed(2)),
      placeholder: parseFloat(placeholderContrast.toFixed(2)),
      input: parseFloat(inputContrast.toFixed(2)),
      submit: parseFloat(submitContrast.toFixed(2))
    },
    pass: bannerTitleContrast >= 4.5 && bannerTextContrast >= 4.5 && placeholderContrast >= 4.5
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "p0_21_ui4_3_production_live_results.json"),
    JSON.stringify(liveResults, null, 2),
    "utf8"
  );

  await browser.close();
  return liveResults;
}

if (process.argv[1].endsWith("verify_p0_21_ui4_3_production_live.mjs")) {
  verifyLiveProduction().catch(err => {
    console.error("Live Production Verification failed:", err);
    process.exit(1);
  });
}

export { verifyLiveProduction };
