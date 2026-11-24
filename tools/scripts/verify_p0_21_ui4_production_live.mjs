import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const PROD_URL = "https://www.aeternumatlas.com/programa-beta";

// Matriz de 30 Viewports exigida na P0.21-UI.4
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

async function runLiveProductionVerification() {
  console.log("=== AETERNUM ATLAS — P0.21-UI.4: CERTIFICAÇÃO LIVE EM PRODUÇÃO ===");
  console.log(`Alvo de Produção: ${PROD_URL}`);

  const report = {
    timestamp: new Date().toISOString(),
    targetUrl: PROD_URL,
    gitCommit: "4f92a19f1f6253d78fc8fdb2a9198e03753e4ad6",
    pr: 50,
    allPassed: true,
    auroraVeil: {},
    glassOptics: {},
    stickyFloat: {},
    viewports: [],
    zoomMatrix: [],
    screenshots: []
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
    const resp = await page.goto(PROD_URL, { waitUntil: "networkidle2", timeout: 35000 });
    const httpStatus = resp ? resp.status() : null;
    report.httpStatus = httpStatus;
    console.log(`HTTP Status: ${httpStatus}`);
    if (httpStatus !== 200) {
      report.allPassed = false;
      console.error(`Erro: HTTP status não é 200 (recebido: ${httpStatus})`);
    }

    // Aguardar WebGL e animações
    await new Promise(r => setTimeout(r, 2000));

    // --- 1. AUDITORIA AURORA VEIL EXPANSION & WEBGL ---
    console.log("\n=== 1. AUDITORIA LIVE AURORA VEIL EXPANSION & WEBGL ===");
    const veilAudit = await page.evaluate(() => {
      const wrapper = document.querySelector(".aurora-veil-wrapper, .aurora-veil-background");
      const canvas = document.querySelector(".aurora-veil-canvas");
      const vignette = document.querySelector(".aurora-veil-vignette");
      const fallback = document.querySelector(".aurora-veil-fallback");

      if (!wrapper || !canvas) {
        return { found: false, wrapperFound: !!wrapper, canvasFound: !!canvas };
      }

      const wStyle = window.getComputedStyle(wrapper);
      const cStyle = window.getComputedStyle(canvas);
      const vStyle = vignette ? window.getComputedStyle(vignette) : null;
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

      return {
        found: true,
        canvasFound: !!canvas,
        vignetteFound: !!vignette,
        fallbackFound: !!fallback,
        zIndex: wStyle.zIndex,
        position: wStyle.position,
        pointerEvents: wStyle.pointerEvents,
        webglContextActive: !!gl && !gl.isContextLost(),
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        vignetteOpacity: vStyle ? vStyle.opacity : null,
        vignettePointerEvents: vStyle ? vStyle.pointerEvents : null
      };
    });

    report.auroraVeil = {
      ...veilAudit,
      pass: veilAudit.found &&
            veilAudit.webglContextActive &&
            veilAudit.pointerEvents === "none" &&
            veilAudit.position === "fixed"
    };

    console.log("[Live Aurora Veil Audit]:", report.auroraVeil);
    if (!report.auroraVeil.pass) report.allPassed = false;

    // --- 2. AUDITORIA DE TRANSLUCIDEZ ÓPTICA (LIQUID GLASS) ---
    console.log("\n=== 2. AUDITORIA DE TRANSLUCIDEZ ÓPTICA (LIQUID GLASS) ===");
    const glassAudit = await page.evaluate(() => {
      const story = document.querySelector(".atlas-auth-story--beta");
      const card = document.querySelector(".atlas-auth-card--beta");

      if (!story || !card) return { found: false };

      const storyBg = window.getComputedStyle(story).backgroundColor;
      const cardBg = window.getComputedStyle(card).backgroundColor;

      // Esperado:
      // story: rgba(2, 12, 18, 0.68)
      // card: rgba(2, 12, 18, 0.72)
      return {
        found: true,
        storyBg,
        cardBg,
        storyHasTranslucency: storyBg.includes("rgba") || storyBg.includes("0.68"),
        cardHasTranslucency: cardBg.includes("rgba") || cardBg.includes("0.72")
      };
    });

    report.glassOptics = {
      ...glassAudit,
      pass: glassAudit.found && glassAudit.storyHasTranslucency && glassAudit.cardHasTranslucency
    };
    console.log("[Live Glass Optics Audit]:", report.glassOptics);
    if (!report.glassOptics.pass) report.allPassed = false;

    // --- 3. AUDITORIA DE STICKY FLOAT NO DESKTOP ---
    console.log("\n=== 3. AUDITORIA DE STICKY FLOAT NO DESKTOP ===");
    await page.setViewport({ width: 1440, height: 900 });
    const stickyAudit = await page.evaluate(() => {
      const story = document.querySelector(".atlas-auth-story--beta");
      if (!story) return { found: false };

      const style = window.getComputedStyle(story);
      return {
        found: true,
        position: style.position,
        top: style.top,
        alignSelf: style.alignSelf,
        isSticky: style.position === "sticky",
        hasAlignSelfStart: style.alignSelf === "start"
      };
    });

    report.stickyFloat = {
      ...stickyAudit,
      pass: stickyAudit.found && stickyAudit.isSticky && stickyAudit.hasAlignSelfStart
    };
    console.log("[Live Sticky Float Audit]:", report.stickyFloat);
    if (!report.stickyFloat.pass) report.allPassed = false;

    // --- 4. MATRIZ DE 30 VIEWPORTS UNIVERSAIS ---
    console.log("\n=== 4. MATRIZ LIVE DE 30 VIEWPORTS UNIVERSAIS ===");
    for (const vp of ALL_VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 450));

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

      // Captura screenshots chave para comprovação de produção
      let screenshotFile = null;
      if (
        vp.name === "1920x1080_fhd" ||
        vp.name === "1440x900_notebook" ||
        vp.name === "1366x768_notebook_hd" ||
        vp.name === "390x844_iphone_12_14" ||
        vp.name === "1180px_breakpoint"
      ) {
        let fileBase = "";
        if (vp.name === "1920x1080_fhd") fileBase = "live_prod_ui4_aurora_beta_1920x1080_fhd.png";
        else if (vp.name === "1440x900_notebook") fileBase = "live_prod_ui4_aurora_beta_1440x900_notebook.png";
        else if (vp.name === "1366x768_notebook_hd") fileBase = "live_prod_ui4_aurora_beta_1366x768_notebook_hd.png";
        else if (vp.name === "390x844_iphone_12_14") fileBase = "live_prod_ui4_aurora_beta_390x844_mobile.png";
        else if (vp.name === "1180px_breakpoint") fileBase = "live_prod_ui4_aurora_beta_1180px_intermediate.png";

        screenshotFile = path.join(ARTIFACT_DIR, fileBase);
        await page.screenshot({ path: screenshotFile, fullPage: true });
        report.screenshots.push({ viewport: vp.name, path: screenshotFile });
      }

      report.viewports.push({
        viewport: vp.name,
        category: vp.category,
        width: vp.width,
        height: vp.height,
        ...vpAudit,
        pass
      });

      console.log(`[Live VP ${vp.name.padEnd(26)}] Pass: ${pass} | StoryH: ${vpAudit.storyHeight}px | CardH: ${vpAudit.cardHeight}px | H-Scroll: ${vpAudit.hasHorizontalScroll}`);
    }

    // --- 5. MATRIZ LIVE DE ZOOM REAL (100%, 125%, 150%) ---
    console.log("\n=== 5. MATRIZ LIVE DE ZOOM REAL (100%, 125%, 150%) ===");
    for (const zt of ZOOM_TESTS) {
      const effW = Math.round(zt.w / zt.factor);
      const effH = Math.round(zt.h / zt.factor);

      await page.setViewport({ width: effW, height: effH });
      await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: zt.factor });
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 450));

      const zoomAudit = await page.evaluate(() => {
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        const story = document.querySelector(".atlas-auth-story--beta");
        const status = document.querySelector(".atlas-auth-status");
        const card = document.querySelector(".atlas-auth-card--beta");

        if (!story || !status || !card) return { error: "Elementos ausentes" };

        const storyRect = story.getBoundingClientRect();
        const statusRect = status.getBoundingClientRect();

        const statusContained = (
          statusRect.top >= storyRect.top - 2 &&
          statusRect.bottom <= storyRect.bottom + 2 &&
          statusRect.left >= storyRect.left - 2 &&
          statusRect.right <= storyRect.right + 2
        );

        const hasHorizontalScroll = bodyWidth > winWidth + 1;
        const hasStoryInternalScroll = story.scrollHeight > story.clientHeight + 4;

        return {
          statusContained,
          hasStoryInternalScroll,
          hasHorizontalScroll,
          bodyWidth,
          winWidth
        };
      });

      const pass = zoomAudit.statusContained &&
                   !zoomAudit.hasStoryInternalScroll &&
                   !zoomAudit.hasHorizontalScroll;

      if (!pass) report.allPassed = false;

      // Captura screenshots zoom chave
      let screenshotFile = null;
      if (zt.device === "1440x900_notebook" && zt.factor === 1.25) {
        screenshotFile = path.join(ARTIFACT_DIR, "live_prod_ui4_aurora_beta_1440x900_zoom_125.png");
        await page.screenshot({ path: screenshotFile, fullPage: true });
        report.screenshots.push({ type: "zoom_125", path: screenshotFile });
      } else if (zt.device === "1366x768_notebook_hd" && zt.factor === 1.5) {
        screenshotFile = path.join(ARTIFACT_DIR, "live_prod_ui4_aurora_beta_1366x768_zoom_150.png");
        await page.screenshot({ path: screenshotFile, fullPage: true });
        report.screenshots.push({ type: "zoom_150", path: screenshotFile });
      }

      report.zoomMatrix.push({
        device: zt.device,
        label: zt.label,
        factor: zt.factor,
        effectiveWidth: effW,
        effectiveHeight: effH,
        ...zoomAudit,
        pass
      });

      console.log(`[Live Zoom ${zt.device} @ ${zt.label.padEnd(5)}] Pass: ${pass} | Contained: ${zoomAudit.statusContained} | H-Scroll: ${zoomAudit.hasHorizontalScroll}`);
    }

    // Salvar relatório JSON
    const reportPath = path.join(ARTIFACT_DIR, "p0_21_ui4_production_live_results.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`\nRelatório de Homologação em Produção salvo em: ${reportPath}`);
    console.log(`STATUS FINAL DE HOMOLOGAÇÃO EM PRODUÇÃO: ${report.allPassed ? "PASS (100% SUCESSO)" : "FAIL"}`);

  } catch (err) {
    console.error("Erro durante verificação em produção:", err);
    report.allPassed = false;
  } finally {
    await browser.close();
  }
}

runLiveProductionVerification();
