import puppeteer from "puppeteer-core";
import { getCredential } from "./get_cred_helper.mjs";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";
import fs from "node:fs";
import path from "node:path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const LOCAL_URL = "http://localhost:5173";

const TEST_EMAIL = "atlas-e2e-ai-tutor@aeternumatlas.com";
const TEST_USER_ID = "825b2496-ecec-4b67-8343-f8aa3578c224";

async function runTest() {
  console.log("================================================================================");
  console.log("P0.21-REC.01 — ACADEMIC & VISUAL REGRESSION RECOVERY VERIFICATION SUITE");
  console.log("================================================================================");

  // 1. Reset user session in DB to clear any locks
  console.log("[1/6] Saneando e liberando sessão do usuário de teste no Supabase...");
  await runSupabaseSql(`SELECT public.admin_reset_user_session('${TEST_USER_ID}'::uuid, 'rec01_verification');`);
  const password = getCredential("AeternumAtlas:AutomationTestAccount");

  const results = {
    timestamp: new Date().toISOString(),
    tests: {},
    allPassed: true
  };

  // 2. Launch Browser at 1536x960 (Landscape Tablet Resolution from Incident)
  console.log("[2/6] Iniciando navegador Edge Headless em resolução 1536x960 (Tablet Android Horizontal)...");
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--window-size=1536,960"
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1536, height: 960 });

  page.on("console", msg => {
    if (msg.type() === "error") {
      console.log("   [BROWSER ERROR LOG]:", msg.text());
    }
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Public Home `/` (Landscape tablet 1536x960)
    // -------------------------------------------------------------------------
    console.log("[3/6] Testando Home Pública `/` em 1536x960...");
    await page.goto(`${LOCAL_URL}/`, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise(r => setTimeout(r, 1200));

    const publicHomeMetrics = await page.evaluate(() => {
      const header = document.querySelector(".atlas-header, header, .a26-shell__header");
      const ctaButtons = Array.from(document.querySelectorAll("header button, header a, .atlas-header a, .atlas-header button"));
      const hero = document.querySelector(".hero, .solar-system, [class*='hero'], [class*='solar']");
      return {
        headerFound: Boolean(header),
        buttonCount: ctaButtons.length,
        heroFound: Boolean(hero)
      };
    });

    const publicScreenshotPath = path.join(ARTIFACT_DIR, "rec01_public_home_tablet.png");
    await page.screenshot({ path: publicScreenshotPath, fullPage: false });
    console.log(`[Screenshot 1/5] Salvo: ${publicScreenshotPath}`);

    results.tests.publicHome = {
      passed: publicHomeMetrics.headerFound,
      metrics: publicHomeMetrics
    };

    // -------------------------------------------------------------------------
    // Real UI Login via `/login?redirect=%2Fmodels`
    // -------------------------------------------------------------------------
    console.log("[4/6] Executando autenticação institucional via interface de Login...");
    await page.goto(`${LOCAL_URL}/login?redirect=%2Fmodels`, { waitUntil: "networkidle2", timeout: 20000 });
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });

    await page.evaluate((em, pw) => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"]');
      const passInput = document.querySelector('input[type="password"], input[name="password"]');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      nativeSetter.call(emailInput, em);
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      emailInput.dispatchEvent(new Event("change", { bubbles: true }));

      nativeSetter.call(passInput, pw);
      passInput.dispatchEvent(new Event("input", { bubbles: true }));
      passInput.dispatchEvent(new Event("change", { bubbles: true }));
    }, TEST_EMAIL, password);

    await new Promise(r => setTimeout(r, 600));

    const submitBtn = await page.$('button[type="submit"], button.atlas-auth-submit');
    if (!submitBtn) throw new Error("Botão de submit de login não encontrado.");
    await submitBtn.click();

    console.log("   Aguardando redirecionamento pós-login para /models...");
    await page.waitForFunction(() => window.location.pathname.includes("/models"), { timeout: 20000 });
    await new Promise(r => setTimeout(r, 2500));

    // -------------------------------------------------------------------------
    // TEST 2: Models Catalog `/models`
    // -------------------------------------------------------------------------
    console.log("[5/6] Testando Catálogo de Modelos 3D `/models` pós-login...");
    await page.waitForSelector(".models-page-aog, .models-hero-aog, .a26-shell", { timeout: 15000 });

    // Wait for models cards to appear (or loader to finish)
    await page.waitForFunction(() => {
      return !document.querySelector(".a26-loading-state, [role='progressbar']") &&
             (document.querySelectorAll(".model-card, .model-card-aog").length > 0 ||
              document.querySelector(".models-source-notice") !== null);
    }, { timeout: 15000 }).catch(() => console.log("   (Timeout aguardando cards ou notice)"));

    await new Promise(r => setTimeout(r, 1000));

    const modelsMetrics = await page.evaluate(() => {
      const noticeBanner = document.querySelector(".models-source-notice, .a26-banner, [role='status']");
      const noticeText = noticeBanner ? noticeBanner.textContent.trim() : "";

      const cards = document.querySelectorAll(".model-card, .model-card-aog");
      const cardTitles = Array.from(cards).map(c => {
        const titleEl = c.querySelector("h3, h4, .model-card__title, .model-card-aog__taxonomy span");
        return titleEl ? titleEl.textContent.trim() : "";
      });

      const brandCopyStrong = document.querySelector(".a26-shell__brand-copy strong");
      const brandContainer = document.querySelector(".a26-shell__brand");

      let brandTruncated = false;
      let brandText = "";
      let brandMetrics = null;

      if (brandCopyStrong) {
        brandText = brandCopyStrong.textContent.trim();
        const isOverflowing = brandCopyStrong.scrollWidth > brandCopyStrong.clientWidth;
        brandTruncated = isOverflowing;
        brandMetrics = {
          scrollWidth: brandCopyStrong.scrollWidth,
          clientWidth: brandCopyStrong.clientWidth,
          offsetWidth: brandCopyStrong.offsetWidth,
          containerWidth: brandContainer ? brandContainer.clientWidth : 0
        };
      }

      const rolePill = document.querySelector(".a26-shell__brand-copy small");
      const roleText = rolePill ? rolePill.textContent.trim() : "";

      const hasFallbackWarning = noticeText.includes("Nenhum registro institucional foi retornado");

      return {
        noticeText,
        hasFallbackWarning,
        cardCount: cards.length,
        cardTitles,
        brandText,
        brandTruncated,
        brandMetrics,
        roleText
      };
    });

    console.log("   [Models Metrics]:", JSON.stringify(modelsMetrics, null, 2));

    const modelsScreenshotPath = path.join(ARTIFACT_DIR, "rec01_models_catalog_tablet.png");
    await page.screenshot({ path: modelsScreenshotPath, fullPage: false });
    console.log(`[Screenshot 2/5] Salvo: ${modelsScreenshotPath}`);

    const modelsPass = !modelsMetrics.hasFallbackWarning &&
                       modelsMetrics.cardCount >= 2 &&
                       !modelsMetrics.brandTruncated &&
                       modelsMetrics.brandText.includes("AETERNUM ATLAS");

    results.tests.modelsCatalog = {
      passed: modelsPass,
      metrics: modelsMetrics
    };
    if (!modelsPass) results.allPassed = false;

    // -------------------------------------------------------------------------
    // TEST 3: Academic Dashboard `/student/home`
    // -------------------------------------------------------------------------
    console.log("[6/6] Testando Dashboard Acadêmico `/student/home` & Atlas AI Tutor...");
    await page.goto(`${LOCAL_URL}/student/home`, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));

    const studentHomeMetrics = await page.evaluate(() => {
      const reviewPanel = document.querySelector(".a26-review-panel, [aria-label*='Painel de Revisões']");
      const reviewText = reviewPanel ? reviewPanel.textContent : "";

      const hasSuggestedFocus = reviewText.includes("Foco sugerido:");
      const hasConsolidated = reviewText.includes("Desempenho consolidado:");

      const focusMatch = reviewText.match(/Foco sugerido:\s*([^\n\r]+)/);
      const consolidatedMatch = reviewText.match(/Desempenho consolidado:\s*([^\n\r]+)/);

      const focusSystem = focusMatch ? focusMatch[1].trim() : null;
      const consolidatedSystem = consolidatedMatch ? consolidatedMatch[1].trim() : null;

      const isContradictory = focusSystem && consolidatedSystem && focusSystem === consolidatedSystem;

      const chronometerNote = document.querySelector(".a26-chronometer-chart__period-note");
      const noteText = chronometerNote ? chronometerNote.textContent.trim() : "";

      return {
        reviewPanelFound: Boolean(reviewPanel),
        hasSuggestedFocus,
        hasConsolidated,
        focusSystem,
        consolidatedSystem,
        isContradictory,
        chronometerNoteText: noteText
      };
    });

    console.log("   [Student Home Metrics]:", JSON.stringify(studentHomeMetrics, null, 2));

    const studentScreenshotPath = path.join(ARTIFACT_DIR, "rec01_student_home_tablet.png");
    await page.screenshot({ path: studentScreenshotPath, fullPage: false });
    console.log(`[Screenshot 3/5] Salvo: ${studentScreenshotPath}`);

    const studentPass = studentHomeMetrics.reviewPanelFound && !studentHomeMetrics.isContradictory;
    results.tests.studentDashboard = {
      passed: studentPass,
      metrics: studentHomeMetrics
    };
    if (!studentPass) results.allPassed = false;

    // -------------------------------------------------------------------------
    // TEST 4: Atlas AI Tutor Panel on 1536x960
    // -------------------------------------------------------------------------
    console.log("   Abrindo Atlas AI Tutor em 1536x960...");
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("aeternum:open-tutor", {
        detail: { prompt: "Olá Tutor, verifique o posicionamento do painel no tablet." }
      }));
    });
    await new Promise(r => setTimeout(r, 1500));

    const tutorMetrics1536 = await page.evaluate(() => {
      const panel = document.querySelector(".upe-ai-panel");
      const trigger = document.querySelector(".upe-ai-trigger");
      const input = document.querySelector(".upe-ai-composer textarea, .upe-ai-composer input");

      if (!panel) return { panelFound: false };

      const panelRect = panel.getBoundingClientRect();
      const triggerRect = trigger ? trigger.getBoundingClientRect() : null;
      const inputRect = input ? input.getBoundingClientRect() : null;

      const fitsViewport = panelRect.top >= 0 &&
                           panelRect.bottom <= window.innerHeight &&
                           panelRect.right <= window.innerWidth;

      let hasCollision = false;
      if (triggerRect && inputRect) {
        const inputOverlapX = Math.max(0, Math.min(inputRect.right, triggerRect.right) - Math.max(inputRect.left, triggerRect.left));
        const inputOverlapY = Math.max(0, Math.min(inputRect.bottom, triggerRect.bottom) - Math.max(inputRect.top, triggerRect.top));
        hasCollision = (inputOverlapX * inputOverlapY) > 0;
      }

      return {
        panelFound: true,
        panelRect: {
          top: panelRect.top,
          bottom: panelRect.bottom,
          left: panelRect.left,
          right: panelRect.right,
          width: panelRect.width,
          height: panelRect.height
        },
        windowHeight: window.innerHeight,
        windowWidth: window.innerWidth,
        fitsViewport,
        hasCollision,
        inputVisible: Boolean(input && inputRect.height > 0)
      };
    });

    console.log("   [Tutor Metrics 1536x960]:", JSON.stringify(tutorMetrics1536, null, 2));

    const tutorScreenshotPath = path.join(ARTIFACT_DIR, "rec01_tutor_open_tablet.png");
    await page.screenshot({ path: tutorScreenshotPath, fullPage: false });
    console.log(`[Screenshot 4/5] Salvo: ${tutorScreenshotPath}`);

    const tutorPass1536 = tutorMetrics1536.panelFound && tutorMetrics1536.fitsViewport && !tutorMetrics1536.hasCollision;
    results.tests.tutorTablet1536 = {
      passed: tutorPass1536,
      metrics: tutorMetrics1536
    };
    if (!tutorPass1536) results.allPassed = false;

    // -------------------------------------------------------------------------
    // TEST 5: Atlas AI Tutor Panel on Compact Tablet Landscape (1024x600)
    // -------------------------------------------------------------------------
    console.log("   Redimensionando viewport para Tablet Compacto Landscape (1024x600)...");
    await page.setViewport({ width: 1024, height: 600 });
    await new Promise(r => setTimeout(r, 1000));

    const tutorMetrics1024 = await page.evaluate(() => {
      const panel = document.querySelector(".upe-ai-panel");
      const trigger = document.querySelector(".upe-ai-trigger");

      if (!panel) return { panelFound: false };

      const panelRect = panel.getBoundingClientRect();
      const triggerRect = trigger ? trigger.getBoundingClientRect() : null;

      const fitsViewport = panelRect.top >= 0 &&
                           panelRect.bottom <= window.innerHeight + 5;

      return {
        panelFound: true,
        panelRect: {
          top: panelRect.top,
          bottom: panelRect.bottom,
          height: panelRect.height
        },
        triggerRect: triggerRect ? {
          width: triggerRect.width,
          height: triggerRect.height
        } : null,
        windowHeight: window.innerHeight,
        fitsViewport
      };
    });

    console.log("   [Tutor Metrics 1024x600]:", JSON.stringify(tutorMetrics1024, null, 2));

    const tutorCompactScreenshotPath = path.join(ARTIFACT_DIR, "rec01_tutor_compact_tablet.png");
    await page.screenshot({ path: tutorCompactScreenshotPath, fullPage: false });
    console.log(`[Screenshot 5/5] Salvo: ${tutorCompactScreenshotPath}`);

    const tutorPass1024 = tutorMetrics1024.panelFound && tutorMetrics1024.fitsViewport;
    results.tests.tutorCompact1024 = {
      passed: tutorPass1024,
      metrics: tutorMetrics1024
    };
    if (!tutorPass1024) results.allPassed = false;

  } finally {
    await browser.close();
  }

  console.log("\n================================================================================");
  console.log("RESUMO DA AUDITORIA P0.21-REC.01:");
  console.log("--------------------------------------------------------------------------------");
  for (const [testName, data] of Object.entries(results.tests)) {
    console.log(`- ${testName.padEnd(25)}: ${data.passed ? "APROVADO [PASS]" : "FALHOU [FAIL]"}`);
  }
  console.log(`\nSTATUS FINAL: ${results.allPassed ? "TODOS OS CRITÉRIOS APROVADOS (100%)" : "EXISTEM FALHAS"}`);
  console.log("================================================================================");

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "rec01_verification_results.json"),
    JSON.stringify(results, null, 2),
    "utf8"
  );

  return results.allPassed;
}

runTest()
  .then(passed => {
    if (!passed) process.exit(1);
    process.exit(0);
  })
  .catch(err => {
    console.error("Erro fatal durante o teste:", err);
    process.exit(1);
  });
