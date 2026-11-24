import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const PROD_URL = "https://www.aeternumatlas.com/programa-beta";

const REQUIRED_VIEWPORTS = [
  { name: "1920x1080_fhd", width: 1920, height: 1080 },
  { name: "1440x900_notebook", width: 1440, height: 900 },
  { name: "1366x768_notebook_hd", width: 1366, height: 768 },
  { name: "1280x720_notebook_compact", width: 1280, height: 720 },
  { name: "1024x768_tablet_land", width: 1024, height: 768 },
  { name: "768x1024_tablet_port", width: 768, height: 1024 },
  { name: "430x932_phone_pro_max", width: 430, height: 932 },
  { name: "390x844_phone_iphone12", width: 390, height: 844 },
  { name: "360x800_phone_android", width: 360, height: 800 },
  { name: "320x568_phone_compact", width: 320, height: 568 }
];

const ZOOM_LEVELS = [
  { label: "100%", factor: 1.0 },
  { label: "125%", factor: 1.25 },
  { label: "150%", factor: 1.5 }
];

async function runLiveVerification() {
  console.log("=== AETERNUM ATLAS — P0.21-UI.3 MASTER: HOMOLOGAÇÃO EM PRODUÇÃO ===");
  console.log(`Alvo de Produção: ${PROD_URL}`);

  const report = {
    timestamp: new Date().toISOString(),
    targetUrl: PROD_URL,
    gitCommit: "78b62afcba768d71582aeb3c350eb5e8a93e555f",
    pr: 49,
    allPassed: true,
    auroraVeil: {},
    typography: {},
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
    console.log(`\nNavegando para ${PROD_URL}...`);
    const resp = await page.goto(PROD_URL, { waitUntil: "networkidle2", timeout: 30000 });
    const httpStatus = resp ? resp.status() : null;
    report.httpStatus = httpStatus;
    console.log(`HTTP Status: ${httpStatus}`);
    if (httpStatus !== 200) report.allPassed = false;

    // Aguardar WebGL e animações iniciarem
    await new Promise(r => setTimeout(r, 1500));

    // --- AUDITORIA AURORA VEIL ---
    console.log("\n=== 1. AUDITORIA LIVE AURORA VEIL WEBGL ===");
    const veilAudit = await page.evaluate(() => {
      const container = document.querySelector(".aurora-veil-wrapper, .aurora-veil-background");
      const canvas = document.querySelector(".aurora-veil-canvas");
      const vignette = document.querySelector(".aurora-veil-vignette");
      const fallback = document.querySelector(".aurora-veil-fallback");

      if (!container || !canvas) return { found: false, containerFound: !!container, canvasFound: !!canvas };

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
        canvasHeight: canvas.height
      };
    });

    report.auroraVeil = veilAudit;
    console.log("[Live Aurora Veil]:", veilAudit);
    if (!veilAudit.found || !veilAudit.webglContextActive || !veilAudit.pointerEventsNone) {
      report.allPassed = false;
    }

    // --- AUDITORIA TIPOGRÁFICA ---
    console.log("\n=== 2. AUDITORIA LIVE TIPOGRÁFICA INSTITUCIONAL ===");
    const typeAudit = await page.evaluate(() => {
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
      ...typeAudit,
      pass: typeAudit.storyTitleIsSerif && typeAudit.heroTitleIsSerif && typeAudit.kickersUppercase
    };
    console.log("[Live Typography Audit]:", report.typography);
    if (!report.typography.pass) report.allPassed = false;

    // --- MATRIZ DE 10 VIEWPORTS ---
    console.log("\n=== 3. MATRIZ LIVE DE 10 VIEWPORTS (RESPONSIVIDADE E CONTENÇÃO) ===");
    for (const vp of REQUIRED_VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 600));

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

        // Tolerância de subpixel 2px
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
          storyScrollHeight: story.scrollHeight,
          storyClientHeight: story.clientHeight,
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

      // Captura screenshots chave para os artefatos
      let screenshotFile = null;
      if (
        vp.name === "1920x1080_fhd" ||
        vp.name === "1440x900_notebook" ||
        vp.name === "1366x768_notebook_hd" ||
        vp.name === "390x844_phone_iphone12"
      ) {
        const fileBase = `live_prod_ui3_aurora_beta_${vp.name === "390x844_phone_iphone12" ? "390x844_mobile" : vp.name}.png`;
        screenshotFile = path.join(ARTIFACT_DIR, fileBase);
        await page.screenshot({ path: screenshotFile, fullPage: true });
      }

      report.viewports.push({
        viewport: vp.name,
        width: vp.width,
        height: vp.height,
        ...vpAudit,
        screenshotFile,
        pass
      });

      console.log(`[Live Viewport ${vp.name}] Pass: ${pass} | StoryH: ${vpAudit.storyHeight}px | CardH: ${vpAudit.cardHeight}px | StatusContained: ${vpAudit.statusContained} | H-Scroll: ${vpAudit.hasHorizontalScroll}`);
    }

    // --- MATRIZ DE ZOOM REAL (100%, 125%, 150%) ---
    console.log("\n=== 4. MATRIZ LIVE DE ZOOM REAL (100%, 125%, 150%) ===");
    for (const dt of [
      { name: "1920x1080_fhd", w: 1920, h: 1080 },
      { name: "1440x900_notebook", w: 1440, h: 900 },
      { name: "1366x768_notebook_hd", w: 1366, h: 768 }
    ]) {
      for (const zoom of ZOOM_LEVELS) {
        const effW = Math.round(dt.w / zoom.factor);
        const effH = Math.round(dt.h / zoom.factor);

        await page.setViewport({ width: effW, height: effH });
        await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: zoom.factor });
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(r => setTimeout(r, 450));

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

        let zoomScreenshot = null;
        if (
          (dt.name === "1440x900_notebook" && zoom.label === "125%") ||
          (dt.name === "1366x768_notebook_hd" && zoom.label === "150%")
        ) {
          const fileBase = `live_prod_ui3_aurora_beta_${dt.name}_zoom_${zoom.label.replace("%", "")}.png`;
          zoomScreenshot = path.join(ARTIFACT_DIR, fileBase);
          await page.screenshot({ path: zoomScreenshot, fullPage: true });
        }

        report.zoomMatrix.push({
          device: dt.name,
          zoom: zoom.label,
          effectiveRes: `${effW}x${effH}`,
          ...zoomAudit,
          zoomScreenshot,
          pass
        });

        console.log(`[Live Zoom ${dt.name} @ ${zoom.label}] Pass: ${pass} | EffRes: ${effW}x${effH} | StatusContained: ${zoomAudit.statusContained} | H-Scroll: ${zoomAudit.hasHorizontalScroll}`);
      }
    }

  } catch (err) {
    console.error("Erro na validação em produção:", err);
    report.allPassed = false;
    report.error = err.message;
  } finally {
    await browser.close();
  }

  const jsonPath = path.join(ARTIFACT_DIR, "p0_21_ui3_production_live_results.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nRelatório de Produção salvo em: ${jsonPath}`);
  console.log(`STATUS FINAL DE PRODUÇÃO: ${report.allPassed ? "100% PASS (PRODUÇÃO HOMOLOGADA)" : "REQUER ATENÇÃO"}`);

  return report;
}

runLiveVerification();
