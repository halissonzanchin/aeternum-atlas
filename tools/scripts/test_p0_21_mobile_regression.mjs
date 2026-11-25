import puppeteer from "puppeteer-core";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const artifactDir = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
];

function getBrowserPath() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Neither Chrome nor Edge was found on this system.");
}

const VIEWPORTS = [
  { name: "iPhone SE (Portrait)", width: 320, height: 568, isMobile: true, hasTouch: true },
  { name: "iPhone 14/15 (Portrait)", width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: "iPhone 14/15 (Landscape)", width: 844, height: 390, isMobile: true, hasTouch: true },
  { name: "iPhone Pro Max (Portrait)", width: 430, height: 932, isMobile: true, hasTouch: true },
  { name: "iPhone Pro Max (Landscape)", width: 932, height: 430, isMobile: true, hasTouch: true },
  { name: "Android Pixel (Portrait)", width: 360, height: 800, isMobile: true, hasTouch: true },
  { name: "iPad / Tablet (Portrait)", width: 768, height: 1024, isMobile: true, hasTouch: true },
  { name: "Desktop Laptop", width: 1366, height: 768, isMobile: false, hasTouch: false },
  { name: "Desktop Full HD", width: 1920, height: 1080, isMobile: false, hasTouch: false }
];

async function startViteServer() {
  console.log("Starting Vite preview server...");
  const proc = spawn("npx.cmd", ["vite", "preview", "--port", "5174", "--strictPort"], {
    cwd: rootDir,
    stdio: ["pipe", "pipe", "pipe"],
    shell: true
  });

  return new Promise((resolve, reject) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        proc.kill();
        reject(new Error("Timeout waiting for Vite dev server to start on port 5174"));
      }
    }, 15000);

    proc.stdout.on("data", (data) => {
      const msg = data.toString();
      if (msg.includes("5174") || msg.includes("Local:")) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log("Vite dev server ready at http://localhost:5174");
          resolve(proc);
        }
      }
    });

    proc.stderr.on("data", (data) => {
      console.error("[Vite stderr]:", data.toString());
    });

    proc.on("error", (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(err);
      }
    });
  });
}

async function main() {
  console.log("=== P0.21-MOBILE.1 — AUTOMATED RESPONSIVE REGRESSION SUITE ===");
  const browserPath = getBrowserPath();
  console.log("Using browser at:", browserPath);

  let viteProc;
  let browser;
  const results = {
    timestamp: new Date().toISOString(),
    viewportsTested: VIEWPORTS.length,
    testsPassed: 0,
    testsFailed: 0,
    failures: [],
    details: []
  };

  try {
    viteProc = await startViteServer();

    browser = await puppeteer.launch({
      executablePath: browserPath,
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1920,1080"
      ]
    });

    const page = await browser.newPage();
    const BASE_URL = "http://localhost:5174";

    for (const vp of VIEWPORTS) {
      console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch
      });

      // 1. TEST LOGIN PAGE
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForSelector(".atlas-auth-card", { timeout: 10000 });
      await new Promise(r => setTimeout(r, 600));

      const loginMetrics = await page.evaluate(() => {
        const body = document.body;
        const doc = document.documentElement;
        const scrollWidth = doc.scrollWidth;
        const clientWidth = doc.clientWidth;
        const hasHorizontalOverflow = scrollWidth > clientWidth + 1;

        // Check input font size
        const emailInput = document.querySelector('input[name="email"]');
        const passInput = document.querySelector('input[name="password"]');
        const emailFontSize = emailInput ? window.getComputedStyle(emailInput).fontSize : null;
        const passFontSize = passInput ? window.getComputedStyle(passInput).fontSize : null;

        // Check Marina Orb absence
        const tutor = document.querySelector("#atlas-ai-tutor");
        const orb = document.querySelector(".atlas-ai-orb");
        const marinaBadge = document.querySelector(".atlas-ai-orb__badge");

        // Check login card visibility & unified structure
        const card = document.querySelector(".atlas-auth-card");
        const cardRect = card ? card.getBoundingClientRect() : null;
        const shell = document.querySelector(".atlas-auth-shell");
        const story = document.querySelector(".atlas-auth-story");
        const submitBtn = document.querySelector(".atlas-auth-submit");
        const forgotLink = document.querySelector(".atlas-auth-forgot-link");
        const footerRow = document.querySelector(".atlas-auth-footer-row");
        const passToggle = document.querySelector(".atlas-auth-password__toggle");

        const shellRadius = shell ? window.getComputedStyle(shell).borderRadius : null;
        const storyBorderBottom = story ? window.getComputedStyle(story).borderBottomWidth : null;

        return {
          scrollWidth,
          clientWidth,
          hasHorizontalOverflow,
          emailFontSize,
          passFontSize,
          tutorMounted: Boolean(tutor || orb || marinaBadge),
          cardVisible: Boolean(cardRect && cardRect.width > 0 && cardRect.height > 0),
          cardWidth: cardRect?.width,
          cardHeight: cardRect?.height,
          shellRadius,
          storyBorderBottom,
          hasSubmitBtn: Boolean(submitBtn),
          hasForgotLink: Boolean(forgotLink),
          hasFooterRow: Boolean(footerRow),
          hasPassToggle: Boolean(passToggle)
        };
      });

      // Assertions for Login
      let loginPass = true;
      if (loginMetrics.hasHorizontalOverflow) {
        loginPass = false;
        results.failures.push(`${vp.name} /login: Horizontal overflow detected (scrollWidth=${loginMetrics.scrollWidth}, clientWidth=${loginMetrics.clientWidth})`);
      }
      if (loginMetrics.tutorMounted) {
        loginPass = false;
        results.failures.push(`${vp.name} /login: FAIL-CLOSED VIOLATION - Marina Orb / Tutor mounted on public login route!`);
      }
      if (vp.isMobile) {
        const emailPx = parseFloat(loginMetrics.emailFontSize || "0");
        const passPx = parseFloat(loginMetrics.passFontSize || "0");
        if (emailPx < 15.5 || passPx < 15.5) {
          loginPass = false;
          results.failures.push(`${vp.name} /login: iOS WebKit auto-zoom risk - input font size < 16px (email=${loginMetrics.emailFontSize}, pass=${loginMetrics.passFontSize})`);
        }
        if (!loginMetrics.hasSubmitBtn || !loginMetrics.hasForgotLink || !loginMetrics.hasFooterRow) {
          loginPass = false;
          results.failures.push(`${vp.name} /login: Mobile unified hierarchy incomplete (submit, recovery link or footer row missing)!`);
        }
      }
      if (!loginMetrics.cardVisible) {
        loginPass = false;
        results.failures.push(`${vp.name} /login: Login card not visible in viewport!`);
      }

      if (loginPass) results.testsPassed++;
      else results.testsFailed++;

      // Save screenshot for key viewports
      if (vp.name.includes("iPhone 14/15") || vp.name.includes("Desktop Laptop") || vp.name.includes("Desktop Full HD")) {
        const cleanName = vp.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const shotPath = path.join(artifactDir, `p0_21_screenshot_login_${cleanName}.png`);
        await page.screenshot({ path: shotPath, fullPage: false });
        console.log(`Saved screenshot: ${shotPath}`);

        if (vp.isMobile && !vp.name.includes("Landscape")) {
          const fullShotPath = path.join(artifactDir, `p0_21_screenshot_login_${cleanName}_full.png`);
          await page.screenshot({ path: fullShotPath, fullPage: true });
          console.log(`Saved full page screenshot: ${fullShotPath}`);
        }
      }

      // 2. TEST PROGRAMA BETA
      await page.goto(`${BASE_URL}/programa-beta`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForSelector(".atlas-auth-card--beta", { timeout: 10000 });
      await new Promise(r => setTimeout(r, 600));

      const betaMetrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const scrollWidth = doc.scrollWidth;
        const clientWidth = doc.clientWidth;
        const hasHorizontalOverflow = scrollWidth > clientWidth + 1;

        // Check inputs in beta form
        const nameInput = document.querySelector('input[name="fullName"]');
        const nameFontSize = nameInput ? window.getComputedStyle(nameInput).fontSize : null;

        // Check Marina Orb absence
        const tutor = document.querySelector("#atlas-ai-tutor");
        const orb = document.querySelector(".atlas-ai-orb");
        const marinaBadge = document.querySelector(".atlas-ai-orb__badge");

        // Check prelaunch banner
        const prelaunchBanner = document.querySelector(".beta-prelaunch-banner");

        return {
          scrollWidth,
          clientWidth,
          hasHorizontalOverflow,
          nameFontSize,
          tutorMounted: Boolean(tutor || orb || marinaBadge),
          prelaunchBannerVisible: Boolean(prelaunchBanner)
        };
      });

      let betaPass = true;
      if (betaMetrics.hasHorizontalOverflow) {
        betaPass = false;
        results.failures.push(`${vp.name} /programa-beta: Horizontal overflow detected (scrollWidth=${betaMetrics.scrollWidth}, clientWidth=${betaMetrics.clientWidth})`);
      }
      if (betaMetrics.tutorMounted) {
        betaPass = false;
        results.failures.push(`${vp.name} /programa-beta: FAIL-CLOSED VIOLATION - Marina Orb / Tutor mounted on beta page!`);
      }
      if (vp.isMobile) {
        const namePx = parseFloat(betaMetrics.nameFontSize || "0");
        if (namePx < 15.5) {
          betaPass = false;
          results.failures.push(`${vp.name} /programa-beta: iOS WebKit auto-zoom risk - input font size < 16px (name=${betaMetrics.nameFontSize})`);
        }
      }
      if (!betaMetrics.prelaunchBannerVisible) {
        betaPass = false;
        results.failures.push(`${vp.name} /programa-beta: Pre-launch banner not visible!`);
      }

      if (betaPass) results.testsPassed++;
      else results.testsFailed++;

      if (vp.name.includes("iPhone 14/15") || vp.name.includes("Desktop Laptop") || vp.name.includes("Desktop Full HD")) {
        const cleanName = vp.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const shotPath = path.join(artifactDir, `p0_21_screenshot_beta_${cleanName}.png`);
        await page.screenshot({ path: shotPath, fullPage: false });
        console.log(`Saved screenshot: ${shotPath}`);

        if (vp.isMobile && !vp.name.includes("Landscape")) {
          const fullShotPath = path.join(artifactDir, `p0_21_screenshot_beta_${cleanName}_full.png`);
          await page.screenshot({ path: fullShotPath, fullPage: true });
          console.log(`Saved full page screenshot: ${fullShotPath}`);
        }
      }

      // 3. TEST HOME & ATLAS 360° SPHERE TYPOGRAPHY
      await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForSelector(".cinematic-public-header", { timeout: 10000 });
      await new Promise(r => setTimeout(r, 600));

      const homeMetrics = await page.evaluate(async (isMobile) => {
        const doc = document.documentElement;
        const scrollWidth = doc.scrollWidth;
        const clientWidth = doc.clientWidth;
        const hasHorizontalOverflow = scrollWidth > clientWidth + 1;

        // Check Marina Orb absence on home
        const tutor = document.querySelector("#atlas-ai-tutor");
        const orb = document.querySelector(".atlas-ai-orb");

        // Check Atlas 360° Central Core Typography
        const core = document.querySelector(".p4-orbit-core");
        const coreStrong = core ? core.querySelector("strong") : null;
        const coreStrongText = coreStrong ? coreStrong.textContent.trim() : "";
        const coreWhiteSpace = coreStrong ? window.getComputedStyle(coreStrong).whiteSpace : null;
        const coreStrongRect = coreStrong ? coreStrong.getBoundingClientRect() : null;
        const coreRect = core ? core.getBoundingClientRect() : null;

        const coreFontSize = coreStrong ? parseFloat(window.getComputedStyle(coreStrong).fontSize) : 0;
        const isSingleLine = Boolean(coreStrongRect && coreFontSize > 0 && coreStrongRect.height <= coreFontSize * 1.55);
        const fitsInCore = Boolean(coreStrongRect && coreRect && coreStrongRect.width <= coreRect.width + 2);
        const is360Unbroken = coreStrongText === "360°";

        let drawerTested = false;
        let drawerHasLogin = false;
        let drawerHasBeta = false;
        let drawerHasControls = false;

        if (isMobile) {
          const toggle = document.querySelector(".public-mobile-nav-toggle");
          if (toggle) {
            toggle.click();
            await new Promise(r => setTimeout(r, 300));
            const drawer = document.querySelector("#public-mobile-nav-drawer");
            if (drawer) {
              drawerTested = true;
              drawerHasLogin = Boolean(drawer.querySelector(".public-mobile-login"));
              drawerHasBeta = Boolean(drawer.querySelector(".public-mobile-beta"));
              drawerHasControls = Boolean(drawer.querySelector(".public-mobile-nav-controls"));
            }
          }
        }

        return {
          scrollWidth,
          clientWidth,
          hasHorizontalOverflow,
          tutorMounted: Boolean(tutor || orb),
          coreStrongText,
          coreWhiteSpace,
          isSingleLine,
          fitsInCore,
          is360Unbroken,
          drawerTested,
          drawerHasLogin,
          drawerHasBeta,
          drawerHasControls
        };
      }, vp.isMobile);

      let homePass = true;
      if (homeMetrics.hasHorizontalOverflow) {
        homePass = false;
        results.failures.push(`${vp.name} / (Home): Horizontal overflow detected`);
      }
      if (homeMetrics.tutorMounted) {
        homePass = false;
        results.failures.push(`${vp.name} / (Home): FAIL-CLOSED VIOLATION - Marina Orb mounted on home!`);
      }
      if (!homeMetrics.is360Unbroken || !homeMetrics.isSingleLine) {
        homePass = false;
        results.failures.push(`${vp.name} / (Home): Atlas 360° typography wrapped or broken! (text="${homeMetrics.coreStrongText}", singleLine=${homeMetrics.isSingleLine})`);
      }
      if (!homeMetrics.fitsInCore) {
        homePass = false;
        results.failures.push(`${vp.name} / (Home): Atlas 360° overflow outside central sphere bounds!`);
      }
      if (vp.isMobile && (!homeMetrics.drawerTested || !homeMetrics.drawerHasLogin || !homeMetrics.drawerHasBeta || !homeMetrics.drawerHasControls)) {
        homePass = false;
        results.failures.push(`${vp.name} / (Home): Mobile nav drawer missing feature parity items!`);
      }

      if (homePass) results.testsPassed++;
      else results.testsFailed++;

      if (vp.name === "iPhone 14/15 (Portrait)" || vp.name === "Desktop Laptop") {
        const cleanName = vp.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const shotPath = path.join(artifactDir, `p0_21_screenshot_home_${cleanName}.png`);
        await page.screenshot({ path: shotPath, fullPage: false });
        console.log(`Saved screenshot: ${shotPath}`);

        if (vp.name === "iPhone 14/15 (Portrait)") {
          const drawerShotPath = path.join(artifactDir, "p0_21_screenshot_home_mobile_drawer.png");
          await page.screenshot({ path: drawerShotPath, fullPage: false });
          console.log(`Saved drawer screenshot: ${drawerShotPath}`);
        }

        const coreEl = await page.$(".p4-orbit-core");
        if (coreEl) {
          const coreShotPath = path.join(artifactDir, `p0_21_screenshot_home_atlas_360_${cleanName}.png`);
          await coreEl.screenshot({ path: coreShotPath });
          console.log(`Saved Atlas 360 core screenshot: ${coreShotPath}`);
        }
      }

      results.details.push({
        viewport: vp.name,
        dimensions: `${vp.width}x${vp.height}`,
        loginMetrics,
        betaMetrics,
        homeMetrics
      });
    }

    // 4. CAPTURE LIGHT THEME PROOFS (Login & Beta on mobile portrait & desktop)
    console.log("\nCapturing Light Theme screenshots...");
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForSelector(".atlas-auth-card", { timeout: 10000 });
    await page.evaluate(() => {
      document.documentElement.classList.add("a26-theme-light");
      document.body.classList.add("a26-theme-light");
    });
    await new Promise(r => setTimeout(r, 400));
    const lightLoginMobilePath = path.join(artifactDir, "p0_21_screenshot_login_light_mobile.png");
    await page.screenshot({ path: lightLoginMobilePath, fullPage: false });
    console.log(`Saved screenshot: ${lightLoginMobilePath}`);

    await page.goto(`${BASE_URL}/programa-beta`, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForSelector(".atlas-auth-card--beta", { timeout: 10000 });
    await page.evaluate(() => {
      document.documentElement.classList.add("a26-theme-light");
      document.body.classList.add("a26-theme-light");
    });
    await new Promise(r => setTimeout(r, 400));
    const lightBetaMobilePath = path.join(artifactDir, "p0_21_screenshot_beta_light_mobile.png");
    await page.screenshot({ path: lightBetaMobilePath, fullPage: false });
    console.log(`Saved screenshot: ${lightBetaMobilePath}`);

    console.log("\n=== TEST RESULTS SUMMARY ===");
    console.log(`Total Checks: ${results.testsPassed + results.testsFailed}`);
    console.log(`Passed: ${results.testsPassed}`);
    console.log(`Failed: ${results.testsFailed}`);

    if (results.failures.length > 0) {
      console.log("\nFailures:");
      results.failures.forEach(f => console.log(`  - ❌ ${f}`));
    } else {
      console.log("\n🎉 ALL RESPONSIVE, GEOMETRIC AND OPTICAL CHECKS PASSED WITH 100% SUCCESS!");
    }

    const reportPath = path.join(artifactDir, "p0_21_mobile_regression_results.json");
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), "utf-8");
    console.log(`Saved JSON results to: ${reportPath}`);

  } finally {
    if (browser) await browser.close();
    if (viteProc) {
      console.log("Shutting down Vite dev server...");
      viteProc.kill();
    }
  }

  process.exit(results.failures.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
