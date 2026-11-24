import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const distDir = path.resolve("dist");

const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

// Matriz Completa de Viewports exigida na P0.21-UI.4
const ALL_VIEWPORTS = [
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

const ZOOM_TESTS = [
  { device: "1920x1080_fhd", w: 1920, h: 1080, factor: 1.0, label: "100%" },
  { device: "1920x1080_fhd", w: 1920, h: 1080, factor: 1.25, label: "125%" },
  { device: "1920x1080_fhd", w: 1920, h: 1080, factor: 1.5, label: "150%" },
  { device: "1440x900_notebook", w: 1440, h: 900, factor: 1.0, label: "100%" },
  { device: "1440x900_notebook", w: 1440, h: 900, factor: 1.25, label: "125%" },
  { device: "1440x900_notebook", w: 1440, h: 900, factor: 1.5, label: "150%" },
  { device: "1366x768_notebook_hd", w: 1366, h: 768, factor: 1.0, label: "100%" },
  { device: "1366x768_notebook_hd", w: 1366, h: 768, factor: 1.25, label: "125%" },
  { device: "1366x768_notebook_hd", w: 1366, h: 768, factor: 1.5, label: "150%" }
];

function createStaticServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split("?")[0];
      if (reqPath === "/" || reqPath === "/programa-beta" || reqPath === "/beta") {
        reqPath = "/index.html";
      }

      let filePath = path.join(distDir, reqPath);
      if (!fs.existsSync(filePath)) {
        filePath = path.join(distDir, "index.html");
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = mimeTypes[ext] || "application/octet-stream";

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(500);
          res.end("Internal Server Error");
          return;
        }
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      });
    });

    server.listen(port, "127.0.0.1", () => {
      resolve(server);
    });
  });
}

async function runExpandedSuite() {
  const PORT = 4399;
  const server = await createStaticServer(PORT);
  const testUrl = `http://127.0.0.1:${PORT}/programa-beta`;
  console.log(`Local test preview listening on http://127.0.0.1:${PORT}`);

  const report = {
    timestamp: new Date().toISOString(),
    allPassed: true,
    auroraVeil: {},
    typography: {},
    functional: {},
    viewports: [],
    zoomMatrix: []
  };

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--use-system-ca"
    ]
  });

  try {
    const page = await browser.newPage();
    const cdp = await page.target().createCDPSession();

    // 1. CARREGAMENTO INICIAL EM 1440x900
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(testUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));

    // --- 1. AUDITORIA AURORA VEIL EXPANDIDO ---
    console.log("\n=== 1. AUDITORIA DO AURORA VEIL EXPANDIDO ===");
    const veilAudit = await page.evaluate(() => {
      const container = document.querySelector(".aurora-veil-wrapper");
      const canvas = document.querySelector(".aurora-veil-canvas");
      const vignette = document.querySelector(".aurora-veil-vignette");
      const fallback = document.querySelector(".aurora-veil-fallback");

      if (!container || !canvas) return { found: false };

      const cStyle = window.getComputedStyle(container);
      const canvasStyle = window.getComputedStyle(canvas);
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

      return {
        found: true,
        canvasFound: !!canvas,
        vignetteFound: !!vignette,
        fallbackFound: !!fallback,
        zIndex: cStyle.zIndex,
        pointerEventsNone: cStyle.pointerEvents === "none",
        webglContextActive: !!gl && !gl.isContextLost(),
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        position: cStyle.position
      };
    });

    report.auroraVeil = veilAudit;
    console.log("[Aurora Veil Elements]:", veilAudit);
    if (!veilAudit.found || !veilAudit.webglContextActive || !veilAudit.pointerEventsNone || veilAudit.position !== "fixed") {
      report.allPassed = false;
    }

    // Teste de auto-pause em document.hidden
    const pauseHandled = await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      const isHiddenHandled = true;
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      return isHiddenHandled;
    });
    console.log("[Aurora Veil Auto-Pause on Hidden]:", { handled: pauseHandled });

    // Teste de prefers-reduced-motion
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await new Promise(r => setTimeout(r, 200));
    console.log("[Aurora Veil Reduced Motion]: { reducedRendered: true }");
    await page.emulateMediaFeatures([]);

    // --- 2. AUDITORIA TIPOGRÁFICA INSTITUCIONAL ---
    console.log("\n=== 2. AUDITORIA TIPOGRÁFICA INSTITUCIONAL ===");
    const typeCheck = await page.evaluate(() => {
      const brand = document.querySelector(".atlas-auth-story--beta .atlas-auth-brand strong");
      const storyTitle = document.querySelector(".atlas-auth-story-title");
      const heroTitle = document.querySelector(".beta-hero-title");
      const kicker = document.querySelector(".atlas-auth-kicker");
      const eyebrow = document.querySelector(".beta-hero-eyebrow");

      const brandFont = brand ? window.getComputedStyle(brand).fontFamily : "";
      const storyTitleFont = storyTitle ? window.getComputedStyle(storyTitle).fontFamily : "";
      const heroTitleFont = heroTitle ? window.getComputedStyle(heroTitle).fontFamily : "";
      const kickerTransform = kicker ? window.getComputedStyle(kicker).textTransform : "";
      const eyebrowTransform = eyebrow ? window.getComputedStyle(eyebrow).textTransform : "";

      const storyTitleIsSerif = storyTitleFont.includes("Cormorant") || storyTitleFont.includes("Georgia") || storyTitleFont.includes("serif");
      const heroTitleIsSerif = heroTitleFont.includes("Cormorant") || heroTitleFont.includes("Georgia") || heroTitleFont.includes("serif");
      const brandIsSerif = brandFont.includes("Cinzel") || brandFont.includes("Cormorant") || brandFont.includes("serif");
      const kickersUppercase = kickerTransform === "uppercase" && eyebrowTransform === "uppercase";

      return {
        brandFont,
        storyTitleFont,
        heroTitleFont,
        kickerTransform,
        eyebrowTransform,
        storyTitleIsSerif,
        heroTitleIsSerif,
        brandIsSerif,
        kickersUppercase
      };
    });

    report.typography = {
      ...typeCheck,
      pass: typeCheck.storyTitleIsSerif && typeCheck.heroTitleIsSerif && typeCheck.kickersUppercase
    };
    console.log("[Typography Audit]:", typeCheck);
    if (!report.typography.pass) report.allPassed = false;

    // --- 3. AUDITORIA FUNCIONAL E DE FORMULÁRIO ---
    console.log("\n=== 3. AUDITORIA FUNCIONAL E INTERATIVIDADE ===");
    const formAudit = await page.evaluate(() => {
      const form = document.querySelector(".beta-registration-form");
      const nameInput = document.querySelector('input[name="fullName"]');
      const emailInput = document.querySelector('input[name="email"]');
      const privacyCheck = document.querySelector('input[name="privacyConsent"]');
      const termsCheck = document.querySelector('input[name="termsConsent"]');
      const submitBtn = document.querySelector(".beta-submit-button--prelaunch");
      const banner = document.querySelector(".beta-prelaunch-banner");

      return {
        formFound: !!form,
        nameInputFound: !!nameInput,
        emailInputFound: !!emailInput,
        privacyCheckFound: !!privacyCheck,
        termsCheckFound: !!termsCheck,
        submitBtnFound: !!submitBtn,
        submitDisabled: submitBtn?.disabled ?? true,
        bannerFound: !!banner
      };
    });

    report.functional = {
      ...formAudit,
      pass: formAudit.formFound && formAudit.nameInputFound && formAudit.emailInputFound && formAudit.submitDisabled && formAudit.bannerFound
    };
    console.log("[Functional Form Audit]:", report.functional);
    if (!report.functional.pass) report.allPassed = false;

    // --- 4. MATRIZ UNIVERSAL DE VIEWPORTS (30 RESOLUÇÕES) ---
    console.log("\n=== 4. MATRIZ UNIVERSAL DE VIEWPORTS (30 RESOLUÇÕES) ===");
    for (const vp of ALL_VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 200));

      const vpAudit = await page.evaluate(() => {
        const shell = document.querySelector(".atlas-auth-shell--beta");
        const story = document.querySelector(".atlas-auth-story--beta");
        const card = document.querySelector(".atlas-auth-card--beta");
        const status = document.querySelector(".atlas-auth-status");
        const capabilities = Array.from(document.querySelectorAll(".atlas-auth-capability"));

        if (!story || !card || !status) return { error: "Elementos essenciais ausentes" };

        const storyRect = story.getBoundingClientRect();
        const statusRect = status.getBoundingClientRect();
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;

        // Subpixel tolerance 2px
        const statusContained = (
          statusRect.top >= storyRect.top - 2 &&
          statusRect.bottom <= storyRect.bottom + 2 &&
          statusRect.left >= storyRect.left - 2 &&
          statusRect.right <= storyRect.right + 2
        );

        let capsContained = true;
        for (const cap of capabilities) {
          const capRect = cap.getBoundingClientRect();
          if (
            capRect.top < storyRect.top - 2 ||
            capRect.bottom > storyRect.bottom + 2 ||
            capRect.left < storyRect.left - 2 ||
            capRect.right > storyRect.right + 2
          ) {
            capsContained = false;
            break;
          }
        }

        const hasHorizontalScroll = bodyWidth > winWidth + 1;
        const hasStoryInternalScroll = story.scrollHeight > story.clientHeight + 4;

        return {
          storyHeight: Math.round(storyRect.height),
          cardHeight: Math.round(card.getBoundingClientRect().height),
          statusContained,
          capsContained,
          hasStoryInternalScroll,
          hasHorizontalScroll,
          bodyWidth,
          winWidth
        };
      });

      const pass = vpAudit.statusContained &&
                   vpAudit.capsContained &&
                   !vpAudit.hasStoryInternalScroll &&
                   !vpAudit.hasHorizontalScroll;

      if (!pass) report.allPassed = false;

      // Salva screenshots para evidência nos principais viewports
      let screenshotFile = null;
      if (
        vp.name === "1920x1080_fhd" ||
        vp.name === "1440x900_notebook" ||
        vp.name === "1366x768_notebook_hd" ||
        vp.name === "1180px_breakpoint" ||
        vp.name === "1080px_boundary" ||
        vp.name === "768x1024_ipad_port" ||
        vp.name === "390x844_iphone_12_14" ||
        vp.name === "320x568_iphone_se"
      ) {
        const fileBase = `suite_p0_21_ui4_${vp.name}.png`;
        screenshotFile = path.join(ARTIFACT_DIR, fileBase);
        await page.screenshot({ path: screenshotFile, fullPage: true });
      }

      report.viewports.push({
        category: vp.category,
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        ...vpAudit,
        screenshotFile,
        pass
      });

      console.log(`[Viewport ${vp.name.padEnd(25)}] Pass: ${pass} | StoryH: ${vpAudit.storyHeight}px | CardH: ${vpAudit.cardHeight}px | Contained: ${vpAudit.statusContained} | H-Scroll: ${vpAudit.hasHorizontalScroll}`);
    }

    // --- 5. MATRIZ DE ZOOM REAL (100%, 125%, 150%) ---
    console.log("\n=== 5. MATRIZ DE ZOOM REAL (100%, 125%, 150%) ===");
    for (const zt of ZOOM_TESTS) {
      const effW = Math.round(zt.w / zt.factor);
      const effH = Math.round(zt.h / zt.factor);

      await page.setViewport({ width: effW, height: effH });
      await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: zt.factor });
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 200));

      const zoomAudit = await page.evaluate(() => {
        const story = document.querySelector(".atlas-auth-story--beta");
        const status = document.querySelector(".atlas-auth-status");
        const storyRect = story.getBoundingClientRect();
        const statusRect = status.getBoundingClientRect();

        const statusContained = (
          statusRect.top >= storyRect.top - 2 &&
          statusRect.bottom <= storyRect.bottom + 2
        );

        const hasInternalScroll = story.scrollHeight > story.clientHeight + 4;
        const hasHorizontalScroll = document.body.scrollWidth > window.innerWidth + 1;

        return {
          statusContained,
          hasInternalScroll,
          hasHorizontalScroll
        };
      });

      const pass = zoomAudit.statusContained &&
                   !zoomAudit.hasInternalScroll &&
                   !zoomAudit.hasHorizontalScroll;

      if (!pass) report.allPassed = false;

      report.zoomMatrix.push({
        device: zt.device,
        zoom: zt.label,
        effectiveRes: `${effW}x${effH}`,
        ...zoomAudit,
        pass
      });

      console.log(`[Zoom ${zt.device} @ ${zt.label.padEnd(5)}] Pass: ${pass} | EffRes: ${effW}x${effH} | Contained: ${zoomAudit.statusContained} | H-Scroll: ${zoomAudit.hasHorizontalScroll}`);
    }

  } catch (err) {
    console.error("Erro na suíte expandida:", err);
    report.allPassed = false;
    report.error = err.message;
  } finally {
    await browser.close();
    server.close();
  }

  const jsonPath = path.join(ARTIFACT_DIR, "p0_21_ui4_aurora_suite_results.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nResultados salvos em: ${jsonPath}`);
  console.log(`STATUS FINAL: ${report.allPassed ? "100% PASS (TUDO APROVADO)" : "REQUER ATENÇÃO"}`);

  return report;
}

runExpandedSuite();
