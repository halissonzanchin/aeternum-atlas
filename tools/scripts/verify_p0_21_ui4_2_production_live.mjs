import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const PROD_URL = "https://www.aeternumatlas.com/programa-beta";

// 30 Viewports Universais
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
  console.log("=== AETERNUM ATLAS — P0.21-UI.4.2: CERTIFICAÇÃO LIVE EM PRODUÇÃO ===");
  console.log(`Alvo de Produção: ${PROD_URL}`);

  const report = {
    timestamp: new Date().toISOString(),
    targetUrl: PROD_URL,
    gitCommit: "61ac6bc1f08bba85bfa884203af00bdb092acf68",
    pr: 51,
    allPassed: true,
    httpStatus: null,
    rootTransformFixed: false,
    scrollContinuity: [],
    heightGuard: {},
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

    // 1. CARREGAMENTO INICIAL
    await page.setViewport({ width: 1440, height: 900 });
    console.log(`\nNavegando para ${PROD_URL}...`);
    const resp = await page.goto(PROD_URL, { waitUntil: "networkidle2", timeout: 35000 });
    report.httpStatus = resp ? resp.status() : null;
    console.log(`HTTP Status: ${report.httpStatus}`);
    if (report.httpStatus !== 200) report.allPassed = false;

    await new Promise(r => setTimeout(r, 2000));

    // --- 1. AUDITORIA DE ELIMINAÇÃO DA CAUSA-RAIZ NO DOM ---
    console.log("\n=== 1. AUDITORIA DA CAUSA-RAIZ NO DOM (CONTAINING BLOCK / LAYERS) ===");
    const rootAudit = await page.evaluate(() => {
      const root = document.getElementById("root");
      const body = document.body;
      const html = document.documentElement;
      const veil = document.querySelector(".aurora-veil-wrapper");
      const shell = document.querySelector(".atlas-auth-shell--beta");
      const slot = document.querySelector(".atlas-auth-panel-slot--beta");

      const rootCS = window.getComputedStyle(root);
      const bodyCS = window.getComputedStyle(body);
      const htmlCS = window.getComputedStyle(html);
      const shellCS = window.getComputedStyle(shell);
      const slotCS = window.getComputedStyle(slot);

      return {
        rootTransform: rootCS.transform,
        rootAnimation: rootCS.animationName,
        bodyBgColor: bodyCS.backgroundColor,
        htmlBgColor: htmlCS.backgroundColor,
        shellBackdropFilter: shellCS.backdropFilter || shellCS.webkitBackdropFilter || "none",
        slotBgColor: slotCS.backgroundColor,
        slotPadding: slotCS.padding,
        isRootTransformNone: rootCS.transform === "none",
        isBodyBgObsidian: bodyCS.backgroundColor === "rgb(1, 6, 9)",
        isSlotBgTransparent: slotCS.backgroundColor === "rgba(0, 0, 0, 0)" || slotCS.backgroundColor === "transparent",
        isSlotPaddingZero: slotCS.padding === "0px"
      };
    });

    console.log("[Root & Layers Audit]:", rootAudit);
    report.rootAudit = rootAudit;
    if (!rootAudit.isRootTransformNone || !rootAudit.isBodyBgObsidian || !rootAudit.isSlotBgTransparent || !rootAudit.isSlotPaddingZero) {
      report.allPassed = false;
      console.error("FALHA: Regras de contenção arquitetural não foram atendidas no DOM de produção!");
    }

    // --- 2. AUDITORIA DE CONTINUIDADE DO AURORA VEIL EM 7 POSIÇÕES DE SCROLL ---
    console.log("\n=== 2. AUDITORIA LIVE DE CONTINUIDADE DO AURORA VEIL EM 7 POSIÇÕES DE SCROLL ===");
    const scrollTargetSections = [
      { id: "1_top", name: "1. Topo da página", selector: ".atlas-auth-card__topline" },
      { id: "2_form_start", name: "2. Início do formulário", selector: "input[name='fullName']" },
      { id: "3_form_mid", name: "3. Meio do formulário", selector: "input[name='academicTerm']" },
      { id: "4_motivation", name: "4. Área de motivação", selector: "textarea[name='motivation']" },
      { id: "5_lgpd", name: "5. Consentimentos LGPD", selector: ".beta-consent-container" },
      { id: "6_buttons", name: "6. Botões finais", selector: ".beta-actions-container" },
      { id: "7_bottom", name: "7. Final completo da página", selector: null }
    ];

    for (const sec of scrollTargetSections) {
      if (sec.selector) {
        await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
        }, sec.selector);
      } else {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      }
      await new Promise(r => setTimeout(r, 450));

      const scrollAudit = await page.evaluate(() => {
        const veil = document.querySelector(".aurora-veil-wrapper");
        const canvas = document.querySelector(".aurora-veil-canvas");
        const vr = veil ? veil.getBoundingClientRect() : null;
        const cr = canvas ? canvas.getBoundingClientRect() : null;
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;

        const veilCoversViewport = vr &&
          Math.abs(vr.top) < 2 &&
          Math.abs(vr.bottom - winHeight) < 2 &&
          Math.abs(vr.left) < 2 &&
          Math.abs(vr.width - winWidth) < 2;

        const hasHorizontalScroll = bodyWidth > winWidth + 1;

        return {
          scrollY: Math.round(window.scrollY),
          veilTop: vr ? Math.round(vr.top) : null,
          veilBottom: vr ? Math.round(vr.bottom) : null,
          veilHeight: vr ? Math.round(vr.height) : null,
          veilCoversViewport,
          hasHorizontalScroll
        };
      });

      const pass = scrollAudit.veilCoversViewport && !scrollAudit.hasHorizontalScroll;
      if (!pass) report.allPassed = false;

      const filename = `live_prod_ui4_2_scroll_${sec.id}.png`;
      const filePath = path.join(ARTIFACT_DIR, filename);
      await page.screenshot({ path: filePath, fullPage: false });
      report.screenshots.push({ section: sec.name, path: filePath });

      report.scrollContinuity.push({
        section: sec.name,
        ...scrollAudit,
        pass
      });

      console.log(`[Live Scroll ${sec.name.padEnd(28)}] Pass: ${pass} | ScrollY: ${scrollAudit.scrollY}px | VeilTop: ${scrollAudit.veilTop} | VeilBottom: ${scrollAudit.veilBottom} | CoversVP: ${scrollAudit.veilCoversViewport}`);
    }

    // --- 3. AUDITORIA LIVE DO HEIGHT GUARD NO DESKTOP ---
    console.log("\n=== 3. AUDITORIA LIVE DO HEIGHT GUARD DO PAINEL ESQUERDO ===");
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 300));
    const tallSticky = await page.evaluate(() => {
      const story = document.querySelector(".atlas-auth-story--beta");
      return window.getComputedStyle(story).position === "sticky";
    });

    await page.setViewport({ width: 1440, height: 720 });
    await new Promise(r => setTimeout(r, 300));
    const shortStatic = await page.evaluate(() => {
      const story = document.querySelector(".atlas-auth-story--beta");
      return window.getComputedStyle(story).position === "static";
    });

    const heightGuardPass = tallSticky && shortStatic;
    report.heightGuard = { tallSticky, shortStatic, pass: heightGuardPass };
    if (!heightGuardPass) report.allPassed = false;
    console.log(`[Live Height Guard] Desktop 900px Sticky: ${tallSticky} | Short 720px Static: ${shortStatic} | Pass: ${heightGuardPass}`);

    // --- 4. MATRIZ LIVE DE 30 VIEWPORTS UNIVERSAIS ---
    console.log("\n=== 4. MATRIZ LIVE DE 30 VIEWPORTS UNIVERSAIS ===");
    for (const vp of ALL_VIEWPORTS) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 400));

      const vpAudit = await page.evaluate(() => {
        const shell = document.querySelector(".atlas-auth-shell--beta");
        const story = document.querySelector(".atlas-auth-story--beta");
        const card = document.querySelector(".atlas-auth-card--beta");
        const status = document.querySelector(".atlas-auth-status");
        const capabilities = Array.from(document.querySelectorAll(".atlas-auth-capability"));
        const veil = document.querySelector(".aurora-veil-wrapper");

        if (!story || !card || !status || !veil) return { error: "Elementos ausentes" };

        const storyRect = story.getBoundingClientRect();
        const statusRect = status.getBoundingClientRect();
        const veilRect = veil.getBoundingClientRect();
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;

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

        const veilFixedToViewport = (
          Math.abs(veilRect.top) < 2 &&
          Math.abs(veilRect.bottom - winHeight) < 2
        );

        const hasHorizontalScroll = bodyWidth > winWidth + 1;
        const hasStoryInternalScroll = story.scrollHeight > story.clientHeight + 4;

        return {
          statusContained,
          capsContained,
          veilFixedToViewport,
          hasStoryInternalScroll,
          hasHorizontalScroll,
          storyHeight: Math.round(storyRect.height),
          cardHeight: Math.round(card.getBoundingClientRect().height)
        };
      });

      const pass = vpAudit.statusContained &&
                   vpAudit.capsContained &&
                   vpAudit.veilFixedToViewport &&
                   !vpAudit.hasStoryInternalScroll &&
                   !vpAudit.hasHorizontalScroll;

      if (!pass) report.allPassed = false;

      // Screenshots chave de produção
      if (
        vp.name === "1920x1080_fhd" ||
        vp.name === "1440x900_notebook" ||
        vp.name === "1366x768_notebook_hd" ||
        vp.name === "390x844_iphone_12_14"
      ) {
        let fileBase = `live_prod_ui4_2_${vp.name === "390x844_iphone_12_14" ? "390x844_mobile" : vp.name}.png`;
        const filePath = path.join(ARTIFACT_DIR, fileBase);
        await page.screenshot({ path: filePath, fullPage: true });
        report.screenshots.push({ viewport: vp.name, path: filePath });
      }

      report.viewports.push({
        viewport: vp.name,
        category: vp.category,
        width: vp.width,
        height: vp.height,
        ...vpAudit,
        pass
      });

      console.log(`[Live VP ${vp.name.padEnd(26)}] Pass: ${pass} | StoryH: ${vpAudit.storyHeight}px | CardH: ${vpAudit.cardHeight}px | VeilFixed: ${vpAudit.veilFixedToViewport} | H-Scroll: ${vpAudit.hasHorizontalScroll}`);
    }

    // --- 5. MATRIZ LIVE DE ZOOM REAL ---
    console.log("\n=== 5. MATRIZ LIVE DE ZOOM REAL (100%, 125%, 150%) ===");
    for (const zt of ZOOM_TESTS) {
      const effW = Math.round(zt.w / zt.factor);
      const effH = Math.round(zt.h / zt.factor);

      await page.setViewport({ width: effW, height: effH });
      await cdp.send("Emulation.setPageScaleFactor", { pageScaleFactor: zt.factor });
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(r => setTimeout(r, 400));

      const zoomAudit = await page.evaluate(() => {
        const bodyWidth = document.body.scrollWidth;
        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        const story = document.querySelector(".atlas-auth-story--beta");
        const status = document.querySelector(".atlas-auth-status");
        const veil = document.querySelector(".aurora-veil-wrapper");

        if (!story || !status || !veil) return { error: "Elementos ausentes" };

        const storyRect = story.getBoundingClientRect();
        const statusRect = status.getBoundingClientRect();
        const veilRect = veil.getBoundingClientRect();

        const statusContained = (
          statusRect.top >= storyRect.top - 2 &&
          statusRect.bottom <= storyRect.bottom + 2 &&
          statusRect.left >= storyRect.left - 2 &&
          statusRect.right <= storyRect.right + 2
        );

        const veilCovers = Math.abs(veilRect.top) < 2 && Math.abs(veilRect.bottom - winHeight) < 2;
        const hasHorizontalScroll = bodyWidth > winWidth + 1;
        const hasStoryInternalScroll = story.scrollHeight > story.clientHeight + 4;

        return {
          statusContained,
          veilCovers,
          hasStoryInternalScroll,
          hasHorizontalScroll
        };
      });

      const pass = zoomAudit.statusContained &&
                   zoomAudit.veilCovers &&
                   !zoomAudit.hasStoryInternalScroll &&
                   !zoomAudit.hasHorizontalScroll;

      if (!pass) report.allPassed = false;

      if (zt.device === "1440x900_notebook" && zt.factor === 1.25) {
        const filePath = path.join(ARTIFACT_DIR, "live_prod_ui4_2_1440x900_zoom_125.png");
        await page.screenshot({ path: filePath, fullPage: true });
        report.screenshots.push({ type: "zoom_125", path: filePath });
      } else if (zt.device === "1366x768_notebook_hd" && zt.factor === 1.5) {
        const filePath = path.join(ARTIFACT_DIR, "live_prod_ui4_2_1366x768_zoom_150.png");
        await page.screenshot({ path: filePath, fullPage: true });
        report.screenshots.push({ type: "zoom_150", path: filePath });
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

      console.log(`[Live Zoom ${zt.device} @ ${zt.label.padEnd(5)}] Pass: ${pass} | Contained: ${zoomAudit.statusContained} | VeilCovers: ${zoomAudit.veilCovers} | H-Scroll: ${zoomAudit.hasHorizontalScroll}`);
    }

    const reportPath = path.join(ARTIFACT_DIR, "p0_21_ui4_2_production_live_results.json");
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
