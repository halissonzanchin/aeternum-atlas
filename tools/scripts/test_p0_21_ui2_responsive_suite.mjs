import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\halis\\.gemini\\antigravity\\brain\\b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

const VIEWPORTS = [
  { name: "2560x1440_ultrawide", width: 2560, height: 1440 },
  { name: "1920x1080_fhd", width: 1920, height: 1080 },
  { name: "1440x900_notebook", width: 1440, height: 900 },
  { name: "1366x768_notebook_hd", width: 1366, height: 768 },
  { name: "1280x720_notebook_compact", width: 1280, height: 720 },
  { name: "1180x820_intermediate", width: 1180, height: 820 },
  { name: "1024x768_tablet_land", width: 1024, height: 768 },
  { name: "820x1180_tablet_port_lg", width: 820, height: 1180 },
  { name: "768x1024_tablet_port", width: 768, height: 1024 },
  { name: "430x932_phone_pro_max", width: 430, height: 932 },
  { name: "390x844_phone_iphone12", width: 390, height: 844 },
  { name: "375x667_phone_se", width: 375, height: 667 },
  { name: "360x800_phone_android", width: 360, height: 800 },
  { name: "320x568_phone_compact", width: 320, height: 568 }
];

async function serveStaticDist(distPath, port = 4173) {
  const mimeTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".json": "application/json",
    ".woff2": "font/woff2"
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split("?")[0];
    let filePath = path.join(distPath, reqUrl === "/" ? "index.html" : reqUrl);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(distPath, "index.html");
    }
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || "application/octet-stream";
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end("Server Error");
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      }
    });
  });

  await new Promise((resolve) => server.listen(port, resolve));
  return server;
}

async function run() {
  const distPath = path.resolve("dist");
  console.log(`Starting preview server from ${distPath} on port 4173...`);
  const server = await serveStaticDist(distPath, 4173);
  const baseUrl = "http://localhost:4173";

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  const page = await browser.newPage();
  const results = {
    home: [],
    beta: [],
    atlas360: [],
    zoomLevels: [],
    languages: [],
    passedAll: true
  };

  try {
    console.log("\n========================================================");
    console.log("1. TESTING HOME PAGE HEADER & RESPONSIVENESS (14 Viewports)");
    console.log("========================================================");

    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
      await new Promise(r => setTimeout(r, 400));

      const homeMetrics = await page.evaluate(() => {
        const header = document.querySelector(".cinematic-public-header, .a26-public-header");
        const nav = document.querySelector(".public-home-nav");
        const actions = document.querySelector(".public-actions");
        const lang = document.querySelector(".public-header-language, .language-selector");
        const mobileToggle = document.querySelector(".public-mobile-nav-toggle");
        const navButtons = Array.from(document.querySelectorAll(".public-home-nav-button"));
        const loginBtn = document.querySelector(".public-login-button");
        const betaBtn = document.querySelector(".public-beta-cta");

        const headerBox = header ? header.getBoundingClientRect() : null;
        const actionsBox = actions ? actions.getBoundingClientRect() : null;
        const langBox = lang ? lang.getBoundingClientRect() : null;
        const mobileToggleBox = mobileToggle ? mobileToggle.getBoundingClientRect() : null;
        const navVisible = nav ? window.getComputedStyle(nav).display !== "none" : false;
        const toggleVisible = mobileToggle ? window.getComputedStyle(mobileToggle).display !== "none" : false;

        let navLangCollision = false;
        let lastNavBox = null;
        if (navVisible && langBox && navButtons.length > 0) {
          const lastBtn = navButtons[navButtons.length - 1];
          lastNavBox = lastBtn.getBoundingClientRect();
          if (lastNavBox.right > langBox.left) {
            navLangCollision = true;
          }
        }

        let buttonsOverlap = false;
        if (loginBtn && betaBtn) {
          const lBox = loginBtn.getBoundingClientRect();
          const bBox = betaBtn.getBoundingClientRect();
          if (lBox.right > bBox.left + 1) {
            buttonsOverlap = true;
          }
        }

        const bodyWidth = document.body.scrollWidth;
        const windowWidth = window.innerWidth;
        const hasHorizontalScroll = bodyWidth > windowWidth + 1;

        return {
          navVisible,
          toggleVisible,
          navLangCollision,
          buttonsOverlap,
          hasHorizontalScroll,
          headerHeight: headerBox ? headerBox.height : 0,
          lastNavBox,
          langBox,
          actionsBox
        };
      });

      // If mobile toggle is visible, test opening mobile drawer
      let drawerWorks = null;
      if (homeMetrics.toggleVisible) {
        await page.click(".public-mobile-nav-toggle");
        await new Promise(r => setTimeout(r, 300));
        drawerWorks = await page.evaluate(() => {
          const drawer = document.querySelector(".public-mobile-nav-drawer");
          if (!drawer) return { open: false, itemCount: 0 };
          const items = drawer.querySelectorAll(".public-mobile-nav-item");
          const style = window.getComputedStyle(drawer);
          return {
            open: style.display !== "none" && style.visibility !== "hidden",
            itemCount: items.length
          };
        });
        // Close drawer again
        await page.click(".public-mobile-nav-toggle");
        await new Promise(r => setTimeout(r, 200));
      }

      const pass = !homeMetrics.navLangCollision &&
                   !homeMetrics.buttonsOverlap &&
                   !homeMetrics.hasHorizontalScroll &&
                   (!homeMetrics.toggleVisible || (drawerWorks && drawerWorks.open && drawerWorks.itemCount === 5));

      if (!pass) results.passedAll = false;

      results.home.push({
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        ...homeMetrics,
        drawerWorks,
        pass
      });

      console.log(`[${vp.name}] Pass: ${pass} | NavVis: ${homeMetrics.navVisible} | ToggleVis: ${homeMetrics.toggleVisible} | CollideNavLang: ${homeMetrics.navLangCollision} | H-Scroll: ${homeMetrics.hasHorizontalScroll}`);

      if (["2560x1440_ultrawide", "1440x900_notebook", "1280x720_notebook_compact", "1024x768_tablet_land", "768x1024_tablet_port", "390x844_phone_iphone12", "320x568_phone_compact"].includes(vp.name)) {
        const screenshotPath = path.join(ARTIFACT_DIR, `suite_home_${vp.name}.png`);
        await page.screenshot({ path: screenshotPath });
      }
    }

    console.log("\n========================================================");
    console.log("2. TESTING BETA REGISTRATION PAGE (14 Viewports)");
    console.log("========================================================");

    for (const vp of VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`${baseUrl}/programa-beta`, { waitUntil: "networkidle0" });
      await new Promise(r => setTimeout(r, 400));

      const betaMetrics = await page.evaluate(() => {
        const story = document.querySelector(".atlas-auth-story--beta");
        const shell = document.querySelector(".atlas-auth-shell--beta");
        const formCard = document.querySelector(".atlas-auth-card--beta");
        const badge = document.querySelector(".beta-status-badge");
        const submitBtn = document.querySelector(".beta-submit-button");
        const cards = Array.from(document.querySelectorAll(".atlas-auth-capability"));

        if (!story) return { exists: false };

        const storyStyle = window.getComputedStyle(story);
        const storyBox = story.getBoundingClientRect();
        const badgeBox = badge ? badge.getBoundingClientRect() : null;

        const isSticky = storyStyle.position === "sticky";
        const hasMaxHeight = storyStyle.maxHeight !== "none";
        const hasInternalScroll = story.scrollHeight > story.clientHeight + 4;
        const overflowY = storyStyle.overflowY;

        let badgeOutOfBounds = false;
        if (badgeBox && storyBox) {
          if (badgeBox.bottom > storyBox.bottom + 2 || badgeBox.top < storyBox.top - 2) {
            badgeOutOfBounds = true;
          }
        }

        const bodyWidth = document.body.scrollWidth;
        const windowWidth = window.innerWidth;
        const hasHorizontalScroll = bodyWidth > windowWidth + 1;

        return {
          exists: true,
          position: storyStyle.position,
          isSticky,
          hasMaxHeight,
          maxHeight: storyStyle.maxHeight,
          overflowY,
          hasInternalScroll,
          scrollHeight: story.scrollHeight,
          clientHeight: story.clientHeight,
          badgeOutOfBounds,
          hasHorizontalScroll,
          cardCount: cards.length,
          hasSubmitBtn: !!submitBtn,
          submitBtnDisabled: submitBtn ? submitBtn.disabled : false
        };
      });

      const pass = betaMetrics.exists &&
                   !betaMetrics.isSticky &&
                   !betaMetrics.hasMaxHeight &&
                   !betaMetrics.hasInternalScroll &&
                   !betaMetrics.badgeOutOfBounds &&
                   !betaMetrics.hasHorizontalScroll &&
                   betaMetrics.cardCount === 3 &&
                   betaMetrics.hasSubmitBtn;

      if (!pass) results.passedAll = false;

      results.beta.push({
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        ...betaMetrics,
        pass
      });

      console.log(`[${vp.name}] Pass: ${pass} | Pos: ${betaMetrics.position} | MaxH: ${betaMetrics.maxHeight} | InternalScroll: ${betaMetrics.hasInternalScroll} | BadgeClipped: ${betaMetrics.badgeOutOfBounds}`);

      if (["2560x1440_ultrawide", "1440x900_notebook", "1280x720_notebook_compact", "1024x768_tablet_land", "768x1024_tablet_port", "390x844_phone_iphone12", "320x568_phone_compact"].includes(vp.name)) {
        const screenshotPath = path.join(ARTIFACT_DIR, `suite_beta_${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }
    }

    console.log("\n========================================================");
    console.log("3. TESTING ATLAS 360° ORBITAL COLLISION RESOLUTION");
    console.log("========================================================");

    // Test Atlas 360 across desktop, notebook and tablet viewports over multiple time samples
    const solarViewports = [
      { name: "1920x1080_fhd", width: 1920, height: 1080 },
      { name: "1440x900_notebook", width: 1440, height: 900 },
      { name: "1280x720_notebook_compact", width: 1280, height: 720 },
      { name: "1024x768_tablet_land", width: 1024, height: 768 }
    ];

    for (const sv of solarViewports) {
      await page.setViewport({ width: sv.width, height: sv.height });
      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
      await new Promise(r => setTimeout(r, 500));

      // Sample 5 intervals over 4 seconds
      let minCoreMargin = 999;
      let minInterPlanetMargin = 999;
      let coreCollisions = 0;
      let planetCollisions = 0;

      for (let s = 0; s < 5; s++) {
        const metrics = await page.evaluate(() => {
          const core = document.querySelector(".p4-orbit-core");
          const planets = Array.from(document.querySelectorAll(".p4-planet"));
          if (!core || planets.length === 0) return null;

          const coreRect = core.getBoundingClientRect();
          const coreCenter = { x: coreRect.left + coreRect.width / 2, y: coreRect.top + coreRect.height / 2 };
          const coreRadius = Math.max(coreRect.width, coreRect.height) / 2;

          const planetData = planets.map((p, idx) => {
            const rect = p.getBoundingClientRect();
            const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            const radius = Math.max(rect.width, rect.height) / 2;
            const distToCore = Math.hypot(center.x - coreCenter.x, center.y - coreCenter.y);
            const coreMargin = distToCore - (coreRadius + radius);
            return { idx, center, radius, distToCore, coreMargin };
          });

          let coreCollisionDetected = false;
          let minCore = 999;
          for (const p of planetData) {
            if (p.coreMargin < minCore) minCore = p.coreMargin;
            if (p.coreMargin <= 0) coreCollisionDetected = true;
          }

          let minBetween = 999;
          let planetCollisionDetected = false;
          for (let i = 0; i < planetData.length; i++) {
            for (let j = i + 1; j < planetData.length; j++) {
              const p1 = planetData[i];
              const p2 = planetData[j];
              const dist = Math.hypot(p1.center.x - p2.center.x, p1.center.y - p2.center.y);
              const margin = dist - (p1.radius + p2.radius);
              if (margin < minBetween) minBetween = margin;
              if (margin <= 0) planetCollisionDetected = true;
            }
          }

          return { minCore, minBetween, coreCollisionDetected, planetCollisionDetected };
        });

        if (metrics) {
          if (metrics.minCore < minCoreMargin) minCoreMargin = metrics.minCore;
          if (metrics.minBetween < minInterPlanetMargin) minInterPlanetMargin = metrics.minBetween;
          if (metrics.coreCollisionDetected) coreCollisions++;
          if (metrics.planetCollisionDetected) planetCollisions++;
        }
        await new Promise(r => setTimeout(r, 600));
      }

      const pass = coreCollisions === 0 && planetCollisions === 0 && minCoreMargin > 15;
      if (!pass) results.passedAll = false;

      results.atlas360.push({
        viewport: sv.name,
        minCoreMargin: Math.round(minCoreMargin),
        minInterPlanetMargin: Math.round(minInterPlanetMargin),
        coreCollisions,
        planetCollisions,
        pass
      });

      console.log(`[${sv.name}] Pass: ${pass} | MinCoreMargin: +${Math.round(minCoreMargin)}px | MinInterMargin: +${Math.round(minInterPlanetMargin)}px | CoreCollisions: ${coreCollisions}`);
    }

    console.log("\n========================================================");
    console.log("4. TESTING BROWSER ZOOM RESILIENCE (100%, 125%, 150%)");
    console.log("========================================================");

    const zoomLevels = [1.0, 1.25, 1.5];
    for (const zoom of zoomLevels) {
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: zoom });
      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
      await new Promise(r => setTimeout(r, 400));

      const zoomMetrics = await page.evaluate(() => {
        const header = document.querySelector(".cinematic-public-header");
        const lang = document.querySelector(".public-header-language, .language-selector");
        const navButtons = Array.from(document.querySelectorAll(".public-home-nav-button"));
        const nav = document.querySelector(".public-home-nav");
        const navVisible = nav ? window.getComputedStyle(nav).display !== "none" : false;

        let navLangCollision = false;
        if (navVisible && lang && navButtons.length > 0) {
          const lastBtn = navButtons[navButtons.length - 1];
          const bBox = lastBtn.getBoundingClientRect();
          const lBox = lang.getBoundingClientRect();
          if (bBox.right > lBox.left) navLangCollision = true;
        }

        const bodyWidth = document.body.scrollWidth;
        const windowWidth = window.innerWidth;
        const hasHorizontalScroll = bodyWidth > windowWidth + 1;

        return { navLangCollision, hasHorizontalScroll };
      });

      const pass = !zoomMetrics.navLangCollision && !zoomMetrics.hasHorizontalScroll;
      if (!pass) results.passedAll = false;
      results.zoomLevels.push({ zoom: `${Math.round(zoom * 100)}%`, ...zoomMetrics, pass });
      console.log(`[Zoom ${Math.round(zoom * 100)}%] Pass: ${pass} | CollideNavLang: ${zoomMetrics.navLangCollision} | H-Scroll: ${zoomMetrics.hasHorizontalScroll}`);
    }

    console.log("\n========================================================");
    console.log("5. TESTING MULTILINGUAL ALIGNMENT (pt, en, es, de)");
    console.log("========================================================");

    const testLanguages = ["pt", "en", "es", "de"];
    await page.setViewport({ width: 1366, height: 768 });

    for (const langCode of testLanguages) {
      await page.goto(`${baseUrl}/`, { waitUntil: "networkidle0" });
      // Set language in localStorage
      await page.evaluate((code) => {
        localStorage.setItem("aeternum_language", code);
      }, langCode);
      await page.reload({ waitUntil: "networkidle0" });
      await new Promise(r => setTimeout(r, 400));

      const langMetrics = await page.evaluate(() => {
        const lang = document.querySelector(".public-header-language, .language-selector");
        const navButtons = Array.from(document.querySelectorAll(".public-home-nav-button"));
        const nav = document.querySelector(".public-home-nav");
        const navVisible = nav ? window.getComputedStyle(nav).display !== "none" : false;

        let navLangCollision = false;
        if (navVisible && lang && navButtons.length > 0) {
          const lastBtn = navButtons[navButtons.length - 1];
          const bBox = lastBtn.getBoundingClientRect();
          const lBox = lang.getBoundingClientRect();
          if (bBox.right > lBox.left) navLangCollision = true;
        }

        const bodyWidth = document.body.scrollWidth;
        const windowWidth = window.innerWidth;
        const hasHorizontalScroll = bodyWidth > windowWidth + 1;

        return { navLangCollision, hasHorizontalScroll };
      });

      const pass = !langMetrics.navLangCollision && !langMetrics.hasHorizontalScroll;
      if (!pass) results.passedAll = false;
      results.languages.push({ lang: langCode, ...langMetrics, pass });
      console.log(`[Lang ${langCode.toUpperCase()}] Pass: ${pass} | CollideNavLang: ${langMetrics.navLangCollision} | H-Scroll: ${langMetrics.hasHorizontalScroll}`);
    }

  } finally {
    await browser.close();
    server.close();
  }

  const resultsPath = path.join(ARTIFACT_DIR, "p0_21_ui2_responsive_suite_results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n========================================================`);
  console.log(`FINAL SUITE RESULT: ${results.passedAll ? "PASSED ALL CRITERIA" : "FAILED"}`);
  console.log(`Results saved to ${resultsPath}`);
  console.log(`========================================================\n`);

  if (!results.passedAll) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
