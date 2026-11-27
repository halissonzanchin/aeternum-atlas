import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Portabilidade de artefatos
const ARTIFACT_DIR = process.env.ARTIFACT_DIR ||
  (fs.existsSync("C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3")
    ? "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3"
    : path.resolve(process.cwd(), "artifacts"));

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const LOCAL_URL = process.env.VITE_DEV_URL || "http://localhost:5173";
const IS_LIVE_MODE = process.argv.includes("--live");

// Descoberta dinâmica de executável Chromium/Edge/Chrome
function findBrowserExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const isWin = process.platform === "win32";
  const candidates = isWin ? [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(os.homedir(), "AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe")
  ] : [
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Nenhum navegador compatível localizado. Configure PUPPETEER_EXECUTABLE_PATH.");
}

const ANDROID_TABLET_UA = "Mozilla/5.0 (Linux; Android 13; SM-X906B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Safari/537.36";

// Fixtures sintéticas canônicas (REC-R1-01 e REC-R1-06)
const FIXTURE_USER_ID = "825b2496-ecec-4b67-8343-f8aa3578c224";
const FIXTURE_INSTITUTION_ID = "11111111-1111-1111-1111-111111111111";

const FIXTURE_USER = {
  id: FIXTURE_USER_ID,
  email: "atlas-e2e-ai-tutor@aeternumatlas.com",
  role: "student",
  status: "active",
  name: "Estudante Aeternum Oficial",
  institution_id: FIXTURE_INSTITUTION_ID,
  avatar_url: "",
  app_metadata: { role: "student" }
};

const FIXTURE_MODELS_3D = [
  {
    id: "abb93126-c9be-4938-8eca-161f56864781",
    institution_id: FIXTURE_INSTITUTION_ID,
    title: "Coração Humano — Modelo Superficial 3D",
    slug: "coracao-humano-superficial",
    sketchfab_url: "https://sketchfab.com/3d-models/corazon-humano-3d-modelo-fd61a9605f4148a9b5274463f7adbcb5",
    embed_url: "https://sketchfab.com/models/fd61a9605f4148a9b5274463f7adbcb5/embed",
    status: "active",
    anatomical_system: "Sistema cardiovascular",
    anatomical_region: "Tórax",
    difficulty_level: "intermediario",
    tags: ["Sistema Cardiovascular", "Coração"],
    thumbnail_url: "",
    created_at: "2026-05-13T02:39:27.997Z"
  },
  {
    id: "035701b7-a49f-4f3f-a0fc-b335675745be",
    institution_id: FIXTURE_INSTITUTION_ID,
    title: "Corte Sagital do Crânio Humano — Modelo Superficial 3D",
    slug: "corte-sagital-cranio-humano-superficial",
    sketchfab_url: "https://sketchfab.com/3d-models/corte-sagital-del-encefalo-humano-modelo-3d-0145e302fd94453c8f7fb2817e45060e",
    embed_url: "https://sketchfab.com/models/0145e302fd94453c8f7fb2817e45060e/embed",
    status: "active",
    anatomical_system: "Sistema nervoso",
    anatomical_region: "Cabeça",
    difficulty_level: "intermediario",
    tags: ["Sistema Nervoso", "Crânio"],
    thumbnail_url: "",
    created_at: "2026-05-13T13:06:32.664Z"
  }
];

async function runTest() {
  console.log("================================================================================");
  console.log("P0.21-REC.01-R1 — COMPREHENSIVE RECOVERY & BEHAVIORAL VERIFICATION SUITE");
  console.log(`MODO: ${IS_LIVE_MODE ? "LIVE NETWORK (SMOKE)" : "ISOLAMENTO DETERMINÍSTICO COM FIXTURES SINTÉTICAS"}`);
  console.log("================================================================================");

  const browserPath = findBrowserExecutable();
  console.log(`[Setup] Navegador: ${browserPath}`);
  console.log(`[Setup] Artefatos: ${ARTIFACT_DIR}`);

  const results = {
    timestamp: new Date().toISOString(),
    mode: IS_LIVE_MODE ? "live" : "synthetic_isolated",
    tests: {},
    allPassed: true
  };

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--window-size=1536,960"
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent(ANDROID_TABLET_UA);

  page.on("console", msg => {
    const text = msg.text();
    if (text.includes("Supabase") || text.includes("Login") || text.includes("Error") || text.includes("fail") || text.includes("Auth")) {
      console.log("   [Browser Console]", msg.type(), text);
    }
  });
  page.on("pageerror", err => console.log("   [Browser Error]", err.message));

  // Interceptar rede para isolamento determinístico estrito (sem reset de sessão em produção)
  if (!IS_LIVE_MODE) {
    await page.setRequestInterception(true);
    page.on("request", req => {
      const url = req.url();
      const method = req.method();

      const origin = req.headers()["origin"] || "http://localhost:5173";
      const reqHeaders = req.headers()["access-control-request-headers"] || "authorization, x-client-info, apikey, content-type, accept, range, prefer, x-supabase-api-version";
      const corsHeaders = {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
        "Access-Control-Allow-Headers": reqHeaders,
        "Access-Control-Allow-Credentials": "true"
      };

      if (url.includes("supabase") || url.includes("auth") || url.includes("rest") || url.includes("rpc")) {
        console.log(`   [REQ] ${method} ${url}`);
      }

      if (method === "OPTIONS") {
        req.respond({
          status: 200,
          headers: corsHeaders,
          body: ""
        });
        return;
      }

      if (url.includes("/auth/v1/token") || url.includes("/auth/v1/recover")) {
        req.respond({
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: "mock-jwt-token.eyJzdWIiOiI4MjViMjQ5Ni1lY2VjLTRiNjctODM0My1mOGFhMzU3OGMyMjQiLCJlbWFpbCI6ImF0bGFzLWUyZS1haS10dXRvckBhZXRlcm51bWF0bGFzLmNvbSIsInJvbGUiOiJhdXRoZW50aWNhdGVkIiwic2Vzc2lvbl9pZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMSJ9.signature",
            token_type: "bearer",
            expires_in: 3600,
            refresh_token: "mock-refresh-token",
            user: {
              id: FIXTURE_USER_ID,
              email: FIXTURE_USER.email,
              role: "authenticated",
              app_metadata: { role: "student" }
            }
          })
        });
        return;
      }

      if (url.includes("/auth/v1/user") || url.includes("/auth/v1/session")) {
        req.respond({
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({
            id: FIXTURE_USER_ID,
            email: FIXTURE_USER.email,
            role: "authenticated",
            app_metadata: { role: "student" }
          })
        });
        return;
      }

      if (url.includes("/rest/v1/users")) {
        const accept = req.headers()["accept"] || "";
        const isSingle = accept.includes("vnd.pgrst.object+json");
        req.respond({
          status: 200,
          headers: { ...corsHeaders, "Content-Type": isSingle ? "application/vnd.pgrst.object+json" : "application/json" },
          body: JSON.stringify(isSingle ? FIXTURE_USER : [FIXTURE_USER])
        });
        return;
      }

      if (url.includes("/rest/v1/models_3d")) {
        req.respond({
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify(FIXTURE_MODELS_3D)
        });
        return;
      }

      if (url.includes("/rest/v1/atlas_models")) {
        req.respond({
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify([])
        });
        return;
      }

      if (url.includes("/rest/v1/institutions")) {
        req.respond({
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify([{ id: FIXTURE_INSTITUTION_ID, name: "Faculdade de Medicina Modelo", active: true }])
        });
        return;
      }

      if (url.includes("/rpc/register_or_transfer_session") || url.includes("/rpc/")) {
        req.respond({
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ allowed: true, status: "active", session_id: "00000000-0000-0000-0000-000000000001" })
        });
        return;
      }

      if (url.includes("/rest/v1/")) {
        req.respond({
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          body: JSON.stringify([])
        });
        return;
      }

      req.continue();
    });
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Home Pública e Geometria do Cabeçalho (Tablet Android 1536x960)
    // -------------------------------------------------------------------------
    console.log("\n[1/5] Testando Home Pública `/` em Tablet Android (1536x960)...");
    await page.setViewport({ width: 1536, height: 960, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto(`${LOCAL_URL}/`, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise(r => setTimeout(r, 1000));

    const publicMetrics = await page.evaluate(() => {
      const header = document.querySelector("header.atlas-liquid-glass-toolbar, header");
      const logoBtn = document.querySelector("header button[aria-label*='home'], header [class*='logo']");
      const visibleButtons = Array.from(document.querySelectorAll("header nav button, header .public-actions button"))
        .filter(b => b.offsetWidth > 0 && b.offsetHeight > 0);
      const solarSystem = document.querySelector(".p4-atlas-interface, .solar-system, [class*='solar']");

      let hasCollision = false;
      if (logoBtn && visibleButtons.length > 0) {
        const logoRect = logoBtn.getBoundingClientRect();
        for (const btn of visibleButtons) {
          const btnRect = btn.getBoundingClientRect();
          if (logoRect.right > btnRect.left && btnRect.width > 0) {
            hasCollision = true;
            break;
          }
        }
      }

      return {
        headerFound: Boolean(header),
        logoFound: Boolean(logoBtn),
        solarSystemFound: Boolean(solarSystem),
        hasHeaderCollision: hasCollision,
        headerHeight: header ? header.getBoundingClientRect().height : 0
      };
    });

    console.log("   [Public Home Metrics]:", JSON.stringify(publicMetrics, null, 2));
    const publicScreenshot = path.join(ARTIFACT_DIR, "rec01_public_home_tablet.png");
    await page.screenshot({ path: publicScreenshot, fullPage: false });
    console.log(`   [Screenshot] Salvo: ${publicScreenshot}`);

    const publicPass = publicMetrics.headerFound && !publicMetrics.hasHeaderCollision && publicMetrics.headerHeight < 120;
    results.tests.publicHome = { passed: publicPass, metrics: publicMetrics };
    if (!publicPass) results.allPassed = false;

    // -------------------------------------------------------------------------
    // TEST 2: Login e Catálogo de Modelos 3D `/models`
    // -------------------------------------------------------------------------
    console.log("\n[2/5] Realizando login e testando Catálogo de Modelos 3D `/models`...");
    await page.goto(`${LOCAL_URL}/login?redirect=%2Fmodels`, { waitUntil: "networkidle2", timeout: 20000 });
    await page.waitForSelector("input[name='email'], input[type='email']", { timeout: 10000 });

    const emailField = await page.$("input[name='email'], input[type='email']");
    const passField = await page.$("input[name='password'], input[type='password']");
    if (emailField && passField) {
      await emailField.click({ clickCount: 3 });
      await emailField.type(FIXTURE_USER.email, { delay: 15 });
      await passField.click({ clickCount: 3 });
      await passField.type("MockSecurePass123!", { delay: 15 });
    }

    const submitBtn = await page.$("button[type='submit'], button.atlas-auth-submit");
    if (submitBtn) await submitBtn.click();

    await page.waitForFunction(() => window.location.pathname.includes("/models"), { timeout: 15000 });
    await page.waitForSelector(".models-page-aog, .models-hero-aog, .a26-shell", { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1200));

    const modelsMetrics = await page.evaluate(() => {
      const noticeBanner = document.querySelector(".models-source-notice, [role='status']");
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
        brandTruncated = brandCopyStrong.scrollWidth > brandCopyStrong.clientWidth;
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
    const modelsScreenshot = path.join(ARTIFACT_DIR, "rec01_models_catalog_tablet.png");
    await page.screenshot({ path: modelsScreenshot, fullPage: false });
    console.log(`   [Screenshot] Salvo: ${modelsScreenshot}`);

    const modelsPass = !modelsMetrics.hasFallbackWarning &&
                       modelsMetrics.cardCount >= 2 &&
                       !modelsMetrics.brandTruncated &&
                       modelsMetrics.brandText.includes("AETERNUM ATLAS");

    results.tests.modelsCatalog = { passed: modelsPass, metrics: modelsMetrics };
    if (!modelsPass) results.allPassed = false;

    // -------------------------------------------------------------------------
    // TEST 3: Dashboard Acadêmico `/student/home` & Exclusão Mútua
    // -------------------------------------------------------------------------
    console.log("\n[3/5] Testando Dashboard Acadêmico `/student/home`...");
    await page.goto(`${LOCAL_URL}/student/home`, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise(r => setTimeout(r, 1500));

    const studentMetrics = await page.evaluate(() => {
      const reviewPanel = document.querySelector(".a26-review-panel, [aria-label*='Painel de Revisões']");
      const reviewText = reviewPanel ? reviewPanel.textContent : "";

      const focusMatch = reviewText.match(/Foco sugerido:\s*([^\n\r]+)/);
      const consolidatedMatch = reviewText.match(/Desempenho consolidado:\s*([^\n\r]+)/);

      const focusSystem = focusMatch ? focusMatch[1].trim() : null;
      const consolidatedSystem = consolidatedMatch ? consolidatedMatch[1].trim() : null;
      const isContradictory = Boolean(focusSystem && consolidatedSystem && focusSystem === consolidatedSystem);

      const chronometerNote = document.querySelector(".a26-chronometer-chart__period-note");
      const noteText = chronometerNote ? chronometerNote.textContent.trim() : "";

      return {
        reviewPanelFound: Boolean(reviewPanel),
        focusSystem,
        consolidatedSystem,
        isContradictory,
        chronometerNoteText: noteText
      };
    });

    console.log("   [Student Dashboard Metrics]:", JSON.stringify(studentMetrics, null, 2));
    const studentScreenshot = path.join(ARTIFACT_DIR, "rec01_student_home_tablet.png");
    await page.screenshot({ path: studentScreenshot, fullPage: false });
    console.log(`   [Screenshot] Salvo: ${studentScreenshot}`);

    const studentPass = studentMetrics.reviewPanelFound && !studentMetrics.isContradictory;
    results.tests.studentDashboard = { passed: studentPass, metrics: studentMetrics };
    if (!studentPass) results.allPassed = false;

    // -------------------------------------------------------------------------
    // TEST 4: Atlas AI Tutor Panel & Compositor Interativo (1536x960)
    // -------------------------------------------------------------------------
    console.log("\n[4/5] Abrindo Atlas AI Tutor em Tablet Android (1536x960)...");
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent("aeternum:open-tutor", {
        detail: {}
      }));
    });
    await page.waitForSelector(".upe-ai-panel", { timeout: 10000 });
    await page.waitForSelector(".upe-ai-composer textarea", { timeout: 10000 });
    await new Promise(r => setTimeout(r, 600));

    // Digitação sintética real no compositor
    const composerTextarea = await page.$(".upe-ai-composer textarea");
    if (composerTextarea) {
      await composerTextarea.click();
      await composerTextarea.type("Quais são as relações do ventrículo esquerdo?", { delay: 10 });
    }
    await new Promise(r => setTimeout(r, 400));

    const tutorMetrics1536 = await page.evaluate(() => {
      const panel = document.querySelector(".upe-ai-panel");
      const trigger = document.querySelector(".upe-ai-trigger");
      const textarea = document.querySelector(".upe-ai-composer textarea");
      const sendBtn = document.querySelector(".upe-ai-composer button");

      if (!panel) return { panelFound: false };

      const panelRect = panel.getBoundingClientRect();
      const triggerRect = trigger ? trigger.getBoundingClientRect() : null;
      const textareaRect = textarea ? textarea.getBoundingClientRect() : null;

      const fitsViewport = panelRect.top >= 0 &&
                           panelRect.bottom <= window.innerHeight &&
                           panelRect.right <= window.innerWidth;

      let hasComposerCollision = false;
      if (triggerRect && textareaRect) {
        const overlapX = Math.max(0, Math.min(textareaRect.right, triggerRect.right) - Math.max(textareaRect.left, triggerRect.left));
        const overlapY = Math.max(0, Math.min(textareaRect.bottom, triggerRect.bottom) - Math.max(textareaRect.top, triggerRect.top));
        hasComposerCollision = (overlapX * overlapY) > 0;
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
        fitsViewport,
        hasComposerCollision,
        textareaFound: Boolean(textarea),
        textareaRect: textareaRect ? {
          top: textareaRect.top,
          bottom: textareaRect.bottom,
          left: textareaRect.left,
          right: textareaRect.right,
          width: textareaRect.width,
          height: textareaRect.height
        } : null,
        textareaVisible: Boolean(textarea && textareaRect && textareaRect.height >= 16),
        sendButtonEnabled: Boolean(sendBtn && !sendBtn.disabled)
      };
    });

    console.log("   [Tutor Metrics 1536x960]:", JSON.stringify(tutorMetrics1536, null, 2));
    const tutorScreenshot = path.join(ARTIFACT_DIR, "rec01_tutor_open_tablet.png");
    await page.screenshot({ path: tutorScreenshot, fullPage: false });
    console.log(`   [Screenshot] Salvo: ${tutorScreenshot}`);

    const tutorPass1536 = tutorMetrics1536.panelFound &&
                          tutorMetrics1536.fitsViewport &&
                          !tutorMetrics1536.hasComposerCollision &&
                          tutorMetrics1536.textareaVisible &&
                          tutorMetrics1536.sendButtonEnabled;

    results.tests.tutorTablet1536 = { passed: tutorPass1536, metrics: tutorMetrics1536 };
    if (!tutorPass1536) results.allPassed = false;

    // -------------------------------------------------------------------------
    // TEST 5: Tablet Compacto Landscape (1024x600)
    // -------------------------------------------------------------------------
    console.log("\n[5/5] Redimensionando viewport para Tablet Compacto Landscape (1024x600)...");
    await page.setViewport({ width: 1024, height: 600, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await new Promise(r => setTimeout(r, 1000));

    const tutorMetrics1024 = await page.evaluate(() => {
      const panel = document.querySelector(".upe-ai-panel");
      const trigger = document.querySelector(".upe-ai-trigger");
      const textarea = document.querySelector(".upe-ai-composer textarea");

      if (!panel) return { panelFound: false };

      const panelRect = panel.getBoundingClientRect();
      const triggerRect = trigger ? trigger.getBoundingClientRect() : null;
      const textareaRect = textarea ? textarea.getBoundingClientRect() : null;

      const fitsViewport = panelRect.top >= 0 && panelRect.bottom <= (window.innerHeight + 5);

      let hasCollision = false;
      if (triggerRect && textareaRect) {
        const overlapX = Math.max(0, Math.min(textareaRect.right, triggerRect.right) - Math.max(textareaRect.left, triggerRect.left));
        const overlapY = Math.max(0, Math.min(textareaRect.bottom, triggerRect.bottom) - Math.max(textareaRect.top, triggerRect.top));
        hasCollision = (overlapX * overlapY) > 0;
      }

      return {
        panelFound: true,
        panelRect: {
          top: panelRect.top,
          bottom: panelRect.bottom,
          height: panelRect.height
        },
        triggerRect: triggerRect ? { width: triggerRect.width, height: triggerRect.height } : null,
        fitsViewport,
        hasCollision
      };
    });

    console.log("   [Tutor Metrics 1024x600]:", JSON.stringify(tutorMetrics1024, null, 2));
    const tutorCompactScreenshot = path.join(ARTIFACT_DIR, "rec01_tutor_compact_tablet.png");
    await page.screenshot({ path: tutorCompactScreenshot, fullPage: false });
    console.log(`   [Screenshot] Salvo: ${tutorCompactScreenshot}`);

    const tutorPass1024 = tutorMetrics1024.panelFound && tutorMetrics1024.fitsViewport && !tutorMetrics1024.hasCollision;
    results.tests.tutorCompact1024 = { passed: tutorPass1024, metrics: tutorMetrics1024 };
    if (!tutorPass1024) results.allPassed = false;

  } finally {
    await browser.close();
  }

  console.log("\n================================================================================");
  console.log("RESUMO DA AUDITORIA P0.21-REC.01-R1:");
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
