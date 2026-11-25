import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = process.cwd();

// Portable artifact directory resolution via env vars or default folder
const rawArtifactDir = process.env.ARTIFACT_DIR || process.env.OUTPUT_DIR;
const artifactDir = rawArtifactDir ? rawArtifactDir.trim() : path.join(rootDir, "test-artifacts");
fs.mkdirSync(artifactDir, { recursive: true });

// Cross-platform browser detection for Puppeteer fallback
const PLATFORM_BROWSER_PATHS = {
  win32: [
    process.env.CHROME_PATH,
    process.env.BROWSER_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ],
  darwin: [
    process.env.CHROME_PATH,
    process.env.BROWSER_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
  ],
  linux: [
    process.env.CHROME_PATH,
    process.env.BROWSER_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ]
};

function getPuppeteerBrowserPath() {
  const candidates = PLATFORM_BROWSER_PATHS[process.platform] || [];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
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

function isPortListening(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function stopViteServer(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", proc.pid.toString(), "/T", "/F"], { stdio: "ignore" });
    } else {
      try {
        process.kill(-proc.pid, "SIGTERM");
      } catch {
        proc.kill("SIGTERM");
      }
    }
  } catch (_) {}
}

async function startViteServer() {
  const alreadyListening = await isPortListening(5174);
  if (alreadyListening) {
    console.log("Vite preview server is already active at http://localhost:5174");
    return null;
  }

  console.log("Starting Vite preview server...");
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const proc = spawn(npxCmd, ["vite", "preview", "--port", "5174", "--strictPort"], {
    cwd: rootDir,
    stdio: "inherit",
    shell: process.platform === "win32",
    detached: process.platform !== "win32"
  });

  const start = Date.now();
  while (Date.now() - start < 15000) {
    await new Promise(r => setTimeout(r, 400));
    if (await isPortListening(5174)) {
      console.log("Vite preview server ready at http://localhost:5174");
      return proc;
    }
  }

  stopViteServer(proc);
  throw new Error("Timeout waiting for Vite preview server to start on port 5174");
}

// Exportable assertion functions for automated regression and simulated failure verification
export function assertLoginMetrics(vp, metrics, failures = []) {
  let pass = true;
  if (metrics.hasHorizontalOverflow) {
    pass = false;
    failures.push(`${vp.name} /login: Horizontal overflow detected (scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth})`);
  }
  if (metrics.tutorMounted) {
    pass = false;
    failures.push(`${vp.name} /login: FAIL-CLOSED VIOLATION - Marina Orb / Tutor mounted on public login route!`);
  }
  if (vp.isMobile) {
    const emailPx = parseFloat(metrics.emailFontSize || "0");
    const passPx = parseFloat(metrics.passFontSize || "0");
    if (emailPx < 15.5 || passPx < 15.5) {
      pass = false;
      failures.push(`${vp.name} /login: iOS WebKit auto-zoom risk - input font size < 16px (email=${metrics.emailFontSize}, pass=${metrics.passFontSize})`);
    }
    if (!metrics.hasSubmitBtn || !metrics.hasForgotLink || !metrics.hasFooterRow) {
      pass = false;
      failures.push(`${vp.name} /login: Mobile unified hierarchy incomplete (submit, recovery link or footer row missing)!`);
    }
  }
  if (!metrics.cardVisible) {
    pass = false;
    failures.push(`${vp.name} /login: Login card not visible in viewport!`);
  }
  return pass;
}

export function assertBetaMetrics(vp, metrics, failures = []) {
  let pass = true;
  if (metrics.hasHorizontalOverflow) {
    pass = false;
    failures.push(`${vp.name} /programa-beta: Horizontal overflow detected (scrollWidth=${metrics.scrollWidth}, clientWidth=${metrics.clientWidth})`);
  }
  if (metrics.tutorMounted) {
    pass = false;
    failures.push(`${vp.name} /programa-beta: FAIL-CLOSED VIOLATION - Marina Orb / Tutor mounted on beta page!`);
  }
  if (vp.isMobile) {
    const namePx = parseFloat(metrics.nameFontSize || "0");
    if (namePx < 15.5) {
      pass = false;
      failures.push(`${vp.name} /programa-beta: iOS WebKit auto-zoom risk - input font size < 16px (name=${metrics.nameFontSize})`);
    }
  }
  if (!metrics.prelaunchBannerVisible) {
    pass = false;
    failures.push(`${vp.name} /programa-beta: Pre-launch banner not visible!`);
  }
  return pass;
}

export function assertHomeMetrics(vp, metrics, failures = []) {
  let pass = true;
  if (metrics.hasHorizontalOverflow) {
    pass = false;
    failures.push(`${vp.name} / (Home): Horizontal overflow detected`);
  }
  if (metrics.tutorMounted) {
    pass = false;
    failures.push(`${vp.name} / (Home): FAIL-CLOSED VIOLATION - Marina Orb mounted on home!`);
  }
  if (!metrics.is360Unbroken || !metrics.isSingleLine) {
    pass = false;
    failures.push(`${vp.name} / (Home): Atlas 360° typography wrapped or broken! (text="${metrics.coreStrongText}", singleLine=${metrics.isSingleLine})`);
  }
  if (!metrics.fitsInCore) {
    pass = false;
    failures.push(`${vp.name} / (Home): Atlas 360° overflow outside central sphere bounds!`);
  }
  if (vp.isMobile && (!metrics.drawerTested || !metrics.drawerHasLogin || !metrics.drawerHasBeta || !metrics.drawerHasControls)) {
    pass = false;
    failures.push(`${vp.name} / (Home): Mobile nav drawer missing feature parity items!`);
  }
  return pass;
}

// Unified Browser Runner Interface supporting Playwright (Chromium & WebKit) with Puppeteer fallback
class BrowserRunner {
  static async create() {
    const args = process.argv.slice(2);
    let engine = (process.env.BROWSER_ENGINE || "").toLowerCase();
    if (args.includes("--webkit")) engine = "webkit";
    else if (args.includes("--chromium")) engine = "chromium";
    else if (args.includes("--puppeteer")) engine = "puppeteer";

    // 1. Try Playwright WebKit if requested
    if (engine === "webkit") {
      try {
        const pw = await import("playwright");
        console.log("Attempting to launch Playwright WebKit (genuine Safari engine)...");
        const browser = await pw.webkit.launch({ headless: true });
        console.log("Playwright WebKit initialized successfully.");
        return new PlaywrightEngine(browser, "webkit");
      } catch (e) {
        console.error("Playwright WebKit failed to launch:", e.message);
        throw e;
      }
    }

    // 2. Try Playwright Chromium if requested or as default
    if (engine === "chromium" || !engine) {
      try {
        const pw = await import("playwright");
        console.log("Attempting to launch Playwright Chromium...");
        const browser = await pw.chromium.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu"
          ]
        });
        console.log("Playwright Chromium initialized successfully.");
        return new PlaywrightEngine(browser, "chromium");
      } catch (e) {
        if (engine === "chromium") {
          console.error("Playwright Chromium failed to launch:", e.message);
          throw e;
        }
        console.warn("Playwright Chromium failed to launch:", e.message);
      }
    }

    // 3. Fallback to Puppeteer Core
    console.log("Falling back to puppeteer-core...");
    const puppeteer = (await import("puppeteer-core")).default;
    const browserPath = getPuppeteerBrowserPath();
    if (!browserPath) {
      throw new Error("No browser executable found for Puppeteer. Set CHROME_PATH or install Playwright.");
    }
    console.log("Launching Puppeteer with executable:", browserPath);
    const browser = await puppeteer.launch({
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
    return new PuppeteerEngine(browser);
  }
}

class PlaywrightEngine {
  constructor(browser, engineName) {
    this.browser = browser;
    this.engineName = `playwright-${engineName}`;
  }

  async init(defaultVp) {
    this.context = await this.browser.newContext({
      viewport: { width: defaultVp.width, height: defaultVp.height },
      isMobile: defaultVp.isMobile,
      hasTouch: defaultVp.hasTouch
    });
    this.page = await this.context.newPage();
    return this.page;
  }

  async setViewport(vp) {
    await this.page.setViewportSize({ width: vp.width, height: vp.height });
  }

  async close() {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }
}

class PuppeteerEngine {
  constructor(browser) {
    this.browser = browser;
    this.engineName = "puppeteer-core";
  }

  async init(defaultVp) {
    this.page = await this.browser.newPage();
    await this.page.setViewport({
      width: defaultVp.width,
      height: defaultVp.height,
      isMobile: defaultVp.isMobile,
      hasTouch: defaultVp.hasTouch
    });
    return this.page;
  }

  async setViewport(vp) {
    await this.page.setViewport({
      width: vp.width,
      height: vp.height,
      isMobile: vp.isMobile,
      hasTouch: vp.hasTouch
    });
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}

async function main() {
  console.log("=== P0.21-MOBILE.1 — AUTOMATED RESPONSIVE REGRESSION SUITE ===");
  console.log("Artifact Directory:", artifactDir);

  let viteProc;
  let runner;
  const results = {
    timestamp: new Date().toISOString(),
    engine: null,
    viewportsTested: VIEWPORTS.length,
    testsPassed: 0,
    testsFailed: 0,
    failures: [],
    details: []
  };

  try {
    viteProc = await startViteServer();
    runner = await BrowserRunner.create();
    results.engine = runner.engineName;
    console.log("Active Testing Engine:", runner.engineName);

    const BASE_URL = "http://localhost:5174";
    const page = await runner.init(VIEWPORTS[0]);

    for (const vp of VIEWPORTS) {
      console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})...`);
      await runner.setViewport(vp);

      // 1. TEST LOGIN PAGE
      await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForSelector(".atlas-auth-card", { timeout: 15000 });
      await new Promise(r => setTimeout(r, 600));

      const loginMetrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const scrollWidth = doc.scrollWidth;
        const clientWidth = doc.clientWidth;
        const hasHorizontalOverflow = scrollWidth > clientWidth + 1;

        // Check input font size
        const emailInput = document.querySelector('input[name="email"]');
        const passInput = document.querySelector('input[name="password"]');
        const emailFontSize = emailInput ? window.getComputedStyle(emailInput).fontSize : null;
        const passFontSize = passInput ? window.getComputedStyle(passInput).fontSize : null;

        // Check Marina Orb absence (fail-closed contract)
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
      const loginPass = assertLoginMetrics(vp, loginMetrics, results.failures);
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
      await page.goto(`${BASE_URL}/programa-beta`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForSelector(".atlas-auth-card--beta", { timeout: 15000 });
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

      // Assertions for Programa Beta
      const betaPass = assertBetaMetrics(vp, betaMetrics, results.failures);
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
      await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForSelector(".cinematic-public-header", { timeout: 15000 });
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

      // Assertions for Home
      const homePass = assertHomeMetrics(vp, homeMetrics, results.failures);
      if (homePass) results.testsPassed++;
      else results.testsFailed++;

      if (vp.name === "iPhone 14/15 (Portrait)" || vp.name === "Desktop Laptop") {
        const cleanName = vp.name.toLowerCase().replace(/[^a-z0-9]/g, "_");

        if (vp.name === "iPhone 14/15 (Portrait)") {
          // Take drawer screenshot while open
          const drawerShotPath = path.join(artifactDir, "p0_21_screenshot_home_mobile_drawer.png");
          await page.screenshot({ path: drawerShotPath, fullPage: false });
          console.log(`Saved drawer screenshot: ${drawerShotPath}`);

          // Close drawer to photograph unobstructed Home Hero
          await page.evaluate(() => {
            const toggle = document.querySelector(".public-mobile-nav-toggle");
            if (toggle) toggle.click();
          });
          await new Promise(r => setTimeout(r, 400));
        }

        const shotPath = path.join(artifactDir, `p0_21_screenshot_home_${cleanName}.png`);
        await page.screenshot({ path: shotPath, fullPage: false });
        console.log(`Saved screenshot: ${shotPath}`);

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

    // 4. CAPTURE LIGHT THEME PROOFS (Login & Beta on mobile portrait)
    console.log("\nCapturing Light Theme screenshots...");
    await runner.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector(".atlas-auth-card", { timeout: 15000 });
    await page.evaluate(() => {
      document.documentElement.classList.add("a26-theme-light");
      document.body.classList.add("a26-theme-light");
    });
    await new Promise(r => setTimeout(r, 400));
    const lightLoginMobilePath = path.join(artifactDir, "p0_21_screenshot_login_light_mobile.png");
    await page.screenshot({ path: lightLoginMobilePath, fullPage: false });
    console.log(`Saved screenshot: ${lightLoginMobilePath}`);

    await page.goto(`${BASE_URL}/programa-beta`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector(".atlas-auth-card--beta", { timeout: 15000 });
    await page.evaluate(() => {
      document.documentElement.classList.add("a26-theme-light");
      document.body.classList.add("a26-theme-light");
    });
    await new Promise(r => setTimeout(r, 400));
    const lightBetaMobilePath = path.join(artifactDir, "p0_21_screenshot_beta_light_mobile.png");
    await page.screenshot({ path: lightBetaMobilePath, fullPage: false });
    console.log(`Saved screenshot: ${lightBetaMobilePath}`);

    console.log("\n=== TEST RESULTS SUMMARY ===");
    console.log(`Engine: ${runner.engineName}`);
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
    if (runner) await runner.close();
    if (viteProc) {
      console.log("Shutting down Vite preview server...");
      stopViteServer(viteProc);
    }
  }

  process.exit(results.failures.length > 0 ? 1 : 0);
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMainModule) {
  main().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
}
