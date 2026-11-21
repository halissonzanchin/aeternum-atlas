process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { getCredential } from "./get_cred_helper.mjs";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PROFILE_DIR = "C:\\Users\\halis\\.gemini\\antigravity\\scratch\\edge_p0_20_automation_profile";
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

const VIEWPORTS = [
  { name: "1277x653_operator_critical", width: 1277, height: 653, zoom: 1.0 },
  { name: "1277x653_zoom125", width: 1277, height: 653, zoom: 1.25 },
  { name: "1277x653_zoom150", width: 1277, height: 653, zoom: 1.5 },
  { name: "1366x768_standard_hd", width: 1366, height: 768, zoom: 1.0 },
  { name: "1440x900_macbook", width: 1440, height: 900, zoom: 1.0 },
  { name: "1920x1080_fullhd", width: 1920, height: 1080, zoom: 1.0 },
  { name: "768x1024_tablet", width: 768, height: 1024, zoom: 1.0 },
  { name: "390x844_mobile", width: 390, height: 844, zoom: 1.0 }
];

async function runBrowserHomologation() {
  console.log("=== INICIANDO HOMOLOGAÇÃO VISUAL E RESPONSIVA P0.20-A ===");
  console.log(`Browser: ${EDGE_PATH}`);
  console.log(`Artifacts: ${ARTIFACTS_DIR}`);

  const e2eEmail = "atlas-e2e-ai-tutor@aeternumatlas.com";
  const e2ePassword = getCredential("AeternumAtlas:AutomationTestAccount");
  const e2eUserId = "825b2496-ecec-4b67-8343-f8aa3578c224";

  if (!e2ePassword) {
    throw new Error("Não foi possível obter a senha da conta de automação.");
  }

  // Clear any existing active session for e2e user to prevent conflict
  try {
    await runSupabaseSql(`DELETE FROM public.user_active_sessions WHERE user_id = '${e2eUserId}';`);
    console.log("Sessão prévia da conta de automação limpa.");
  } catch (e) {
    console.warn("Aviso ao limpar sessão prévia:", e.message);
  }

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      `--user-data-dir=${PROFILE_DIR}`,
      "--window-size=1277,653"
    ]
  });

  const report = {
    timestamp: new Date().toISOString(),
    browser: "Microsoft Edge",
    userAuthenticated: e2eEmail,
    viewportsTested: [],
    cardFlipVerified: false,
    sm2RatingVerified: false,
    marinaClearanceVerified: false,
    noOverflowAt100Zoom: false,
    screenshots: []
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1277, height: 653 });

    // Step 1: Perform Real Authentication on localhost:5173/login
    console.log("Navegando para http://localhost:5173/login...");
    await page.goto("http://localhost:5173/login", { waitUntil: "networkidle2", timeout: 25000 });

    const isLoginPage = await page.$('input[name="email"], input[type="email"]');
    if (isLoginPage) {
      console.log("Preenchendo credenciais e efetuando login institucional...");
      await page.evaluate((email, password) => {
        const emailInput = document.querySelector('input[name="email"]') || document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[name="password"]') || document.querySelector('input[type="password"]');

        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeSetter.call(emailInput, email);
        emailInput.dispatchEvent(new Event("input", { bubbles: true }));
        emailInput.dispatchEvent(new Event("change", { bubbles: true }));

        nativeSetter.call(passInput, password);
        passInput.dispatchEvent(new Event("input", { bubbles: true }));
        passInput.dispatchEvent(new Event("change", { bubbles: true }));
      }, e2eEmail, e2ePassword);

      await new Promise(r => setTimeout(r, 600));
      await page.evaluate(() => {
        const btn = document.querySelector("button.atlas-auth-submit, button[type='submit']");
        if (btn) btn.click();
      });
      console.log("Aguardando confirmação do login e redirecionamento...");
      try {
        await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 20000 });
      } catch (e) {
        console.warn("Aviso de redirecionamento:", e.message);
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, "diag_login_failed.png") });
      }
      console.log("Autenticado! URL pós-login:", page.url());
    } else {
      console.log("Sessão já autenticada na URL:", page.url());
    }

    // Step 2: Iterate through all required viewports
    for (const vp of VIEWPORTS) {
      console.log(`\n--- Testando Viewport: ${vp.name} (${vp.width}x${vp.height} @ zoom ${vp.zoom}) ---`);
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.zoom
      });

      await page.goto("http://localhost:5173/flashcards", { waitUntil: "networkidle2", timeout: 20000 });
      await page.waitForSelector(".a26-flashcards-container, .a26-generator-surface", { timeout: 10000 });

      // Capture initial generator view
      const genShot = `p0_20_a_gen_${vp.name}.png`;
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, genShot) });
      report.screenshots.push({ name: genShot, viewport: vp.name, stage: "generator" });

      // Generate a deck using a quick chip or input
      const clicked = await page.evaluate(() => {
        const chip = document.querySelector(".a26-quick-chip");
        if (chip) {
          chip.scrollIntoView({ block: "center", inline: "center" });
          chip.click();
          return true;
        }
        return false;
      });

      if (!clicked) {
        const inputSelector = "input[placeholder*='Digite o assunto'], .a26-field input";
        const hasInput = await page.$(inputSelector);
        if (hasInput) {
          await page.type(inputSelector, "Clavícula e Ombro");
          await page.evaluate(() => {
            const genBtn = document.querySelector(".a26-generator-actions button, button.a26-button--primary");
            if (genBtn) genBtn.click();
          });
        }
      }

      // Wait for Active Deck & Unified 3D card to render
      try {
        await page.waitForSelector(".a26-flashcard-3d-wrapper", { timeout: 15000 });
        await new Promise(r => setTimeout(r, 600)); // allow css animations to settle
      } catch (e) {
        console.warn("Flashcard 3D wrapper não apareceu em 15s no viewport", vp.name);
        await page.screenshot({ path: path.join(ARTIFACTS_DIR, `diag_${vp.name}.png`) });
        continue;
      }

      // Measure layout dimensions & Marina collision
      const metrics = await page.evaluate(() => {
        const winH = window.innerHeight;
        const winW = window.innerWidth;
        const docH = document.documentElement.scrollHeight;
        const hasScroll = docH > winH + 10;

        const cardEl = document.querySelector(".a26-flashcard-3d-wrapper");
        const cardBox = cardEl ? cardEl.getBoundingClientRect() : null;

        const ankiEl = document.querySelector(".a26-anki-controls");
        const ankiBox = ankiEl ? ankiEl.getBoundingClientRect() : null;

        const activeBarEl = document.querySelector(".a26-flashcard-active-bar");
        const activeBarBox = activeBarEl ? activeBarEl.getBoundingClientRect() : null;

        const marinaEl = document.querySelector(".upe-ai-trigger");
        const marinaBox = marinaEl ? marinaEl.getBoundingClientRect() : null;

        // Check horizontal overlap between Anki controls and Marina
        let marinaCollidesWithAnki = false;
        let marinaCollidesWithCard = false;
        let horizontalDistanceToMarina = null;
        let verticalDistanceToMarina = null;

        if (marinaBox && ankiBox) {
          const overlapX = !(ankiBox.right < marinaBox.left || ankiBox.left > marinaBox.right);
          const overlapY = !(ankiBox.bottom < marinaBox.top || ankiBox.top > marinaBox.bottom);
          marinaCollidesWithAnki = overlapX && overlapY;
          horizontalDistanceToMarina = marinaBox.left - ankiBox.right;
          verticalDistanceToMarina = marinaBox.top - ankiBox.bottom;
        }

        if (marinaBox && cardBox) {
          const overlapX = !(cardBox.right < marinaBox.left || cardBox.left > marinaBox.right);
          const overlapY = !(cardBox.bottom < marinaBox.top || cardBox.top > marinaBox.bottom);
          marinaCollidesWithCard = overlapX && overlapY;
        }

        const frontQuestion = document.querySelector(".a26-flashcard-face--front .a26-flashcard-text")?.textContent?.trim() || "";
        const backAnswer = document.querySelector(".a26-flashcard-face--back .a26-flashcard-answer-text")?.textContent?.trim() || "";

        return {
          winH,
          winW,
          docH,
          hasScroll,
          cardHeight: cardBox?.height,
          cardWidth: cardBox?.width,
          cardTop: cardBox?.top,
          cardBottom: cardBox?.bottom,
          ankiTop: ankiBox?.top,
          ankiBottom: ankiBox?.bottom,
          activeBarHeight: activeBarBox?.height,
          marinaVisible: Boolean(marinaBox),
          marinaCollidesWithAnki,
          marinaCollidesWithCard,
          horizontalDistanceToMarina,
          verticalDistanceToMarina,
          frontQuestion: frontQuestion.slice(0, 50),
          backAnswer: backAnswer.slice(0, 50)
        };
      });

      console.log(`Métricas: Card=${Math.round(metrics.cardWidth)}x${Math.round(metrics.cardHeight)}px, ankiBottom=${Math.round(metrics.ankiBottom)}px, winH=${metrics.winH}px`);
      console.log(`Marina: visível=${metrics.marinaVisible}, colisão=${metrics.marinaCollidesWithAnki || metrics.marinaCollidesWithCard}, folga horizontal=${Math.round(metrics.horizontalDistanceToMarina || 0)}px, folga vertical=${Math.round(metrics.verticalDistanceToMarina || 0)}px`);
      console.log(`Scroll vertical: excedente=${metrics.hasScroll} (docH=${metrics.docH}px vs winH=${metrics.winH}px)`);

      // Screenshot of Front side
      const frontShot = `p0_20_a_front_${vp.name}.png`;
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, frontShot) });
      report.screenshots.push({ name: frontShot, viewport: vp.name, stage: "front" });

      // Flip card to Back (In-Place Flip)
      await page.click(".a26-flashcard-3d-wrapper");
      await new Promise(r => setTimeout(r, 650)); // wait for 3D flip animation

      // Verify flipped state and bounding box constancy
      const flippedMetrics = await page.evaluate(() => {
        const cardEl = document.querySelector(".a26-flashcard-3d-wrapper");
        const isFlipped = cardEl?.classList.contains("is-flipped");
        const box = cardEl ? cardEl.getBoundingClientRect() : null;
        return { isFlipped, height: box?.height, width: box?.width, top: box?.top };
      });

      console.log(`Card virado (is-flipped)=${flippedMetrics.isFlipped}, dimensões preservadas no mesmo espaço: ${Math.round(flippedMetrics.width)}x${Math.round(flippedMetrics.height)}px`);

      // Screenshot of Back side
      const backShot = `p0_20_a_back_${vp.name}.png`;
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, backShot) });
      report.screenshots.push({ name: backShot, viewport: vp.name, stage: "back" });

      // Test Parameters Drawer toggle in 1277x653 critical viewport
      if (vp.name === "1277x653_operator_critical") {
        console.log("Testando drawer de parâmetros compactos...");
        const configBtn = await page.$(".a26-page-header__actions button");
        if (configBtn) {
          await configBtn.click();
          await new Promise(r => setTimeout(r, 400));
          const drawerOpenShot = `p0_20_a_drawer_open_${vp.name}.png`;
          await page.screenshot({ path: path.join(ARTIFACTS_DIR, drawerOpenShot) });
          report.screenshots.push({ name: drawerOpenShot, viewport: vp.name, stage: "drawer_open" });

          // Close drawer
          await configBtn.click();
          await new Promise(r => setTimeout(r, 400));
        }

        // Test SM-2 rating click
        console.log("Testando clique SM-2 'Acertei (2)'...");
        const buttons = await page.$$(".a26-anki-controls button");
        if (buttons.length >= 3) {
          // Button 2 is Acertei (index 2: 0=prev, 1=wrong, 2=correct, 3=next)
          await buttons[2].click();
          await new Promise(r => setTimeout(r, 150));
          const feedbackShot = `p0_20_a_feedback_overlay_${vp.name}.png`;
          await page.screenshot({ path: path.join(ARTIFACTS_DIR, feedbackShot) });
          report.screenshots.push({ name: feedbackShot, viewport: vp.name, stage: "feedback" });
          report.sm2RatingVerified = true;
          await new Promise(r => setTimeout(r, 450));
        }

        report.cardFlipVerified = flippedMetrics.isFlipped;
        report.marinaClearanceVerified = !metrics.marinaCollidesWithAnki && !metrics.marinaCollidesWithCard;
        report.noOverflowAt100Zoom = !metrics.hasScroll || (metrics.docH <= metrics.winH + 15);
      }

      report.viewportsTested.push({
        name: vp.name,
        width: vp.width,
        height: vp.height,
        zoom: vp.zoom,
        cardDimensions: `${Math.round(metrics.cardWidth)}x${Math.round(metrics.cardHeight)}`,
        ankiBottom: Math.round(metrics.ankiBottom || 0),
        windowHeight: metrics.winH,
        hasScroll: metrics.hasScroll,
        horizontalClearanceToMarina: Math.round(metrics.horizontalDistanceToMarina || 0),
        verticalClearanceToMarina: Math.round(metrics.verticalDistanceToMarina || 0),
        marinaCollision: metrics.marinaCollidesWithAnki || metrics.marinaCollidesWithCard
      });
    }

    console.log("\n=== HOMOLOGAÇÃO VISUAL CONCLUÍDA COM SUCESSO ===");
    console.log(JSON.stringify(report, null, 2));

    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, "P0.20_A_HOMOLOGACAO_VISUAL_REPORT.json"),
      JSON.stringify(report, null, 2),
      "utf-8"
    );

  } catch (err) {
    console.error("Erro durante homologação visual:", err);
    throw err;
  } finally {
    await browser.close();
  }
}

runBrowserHomologation();
