process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { getCredential } from "./get_cred_helper.mjs";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PROFILE_DIR = "C:\\Users\\halis\\.gemini\antigravity\\scratch\\edge_p0_20_h_profile";
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

const e2eEmail = "atlas-e2e-ai-tutor@aeternumatlas.com";
const e2ePassword = getCredential("AeternumAtlas:AutomationTestAccount");
const e2eUserId = "825b2496-ecec-4b67-8343-f8aa3578c224";

const VIEWPORTS = [
  { name: "1277x653_100pct", width: 1277, height: 653, zoom: 1.0 },
  { name: "1277x653_zoom125", width: 1277, height: 653, zoom: 1.25 },
  { name: "1366x768", width: 1366, height: 768, zoom: 1.0 },
  { name: "1920x1080", width: 1920, height: 1080, zoom: 1.0 },
  { name: "390x844_mobile", width: 390, height: 844, zoom: 1.0 }
];

async function runHomologation() {
  console.log("=== INICIANDO HOMOLOGAÇÃO VISUAL DA ESFERA DE CRISTAL (P0.20-H) ===");

  try {
    await runSupabaseSql(`
      SELECT public.admin_reset_user_session(
        '${e2eUserId}'::uuid,
        'homologacao_p0_20_h'
      ) as result;
    `);
    await runSupabaseSql(`DELETE FROM public.user_active_sessions WHERE user_id = '${e2eUserId}';`);
    console.log("Sessão prévia limpa via admin_reset_user_session.");
  } catch (e) {
    console.warn("Aviso ao limpar sessão:", e.message);
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

  const page = await browser.newPage();
  await page.setViewport({ width: 1277, height: 653, deviceScaleFactor: 2.0 });

  console.log("Navegando para login...");
  await page.goto("http://localhost:5173/login", { waitUntil: "networkidle2", timeout: 25000 });

  const isLoginPage = await page.$('input[name="email"], input[type="email"]');
  if (isLoginPage) {
    console.log("Preenchendo credenciais...");
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
    try {
      await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 20000 });
    } catch (err) {
      const loginHtml = await page.evaluate(() => document.body.innerHTML);
      console.log("Falha no login. HTML na página:", loginHtml.slice(0, 500));
      await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_login_fail.png") });
      throw err;
    }
  }

  console.log("Autenticado! Navegando para /student/home...");
  await page.goto("http://localhost:5173/student/home", { waitUntil: "networkidle2", timeout: 20000 });
  await page.waitForSelector(".upe-ai-trigger, .aeternum-ai-orb-root", { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));

  // 1. CAPTURAS DO MODO A (Marina com texto)
  console.log("Capturando Modo A (Marina com texto)...");
  const triggerEl = await page.$(".upe-ai-trigger");
  if (triggerEl) {
    await triggerEl.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_mode_a_trigger.png") });
  }
  const orbEl = await page.$(".aeternum-ai-orb-root");
  if (orbEl) {
    await orbEl.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_mode_a_orb_crop.png") });
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_student_home.png") });

  // 2. CAPTURA DO MODO C (Tutor aberto e esfera no cabeçalho)
  console.log("Capturando Modo C (Tutor aberto)...");
  if (triggerEl) {
    await triggerEl.click();
    await new Promise(r => setTimeout(r, 900));
    await page.waitForSelector(".upe-ai-panel", { timeout: 5000 });

    const headerOrb = await page.$(".upe-ai-panel__header .aeternum-ai-orb-root");
    if (headerOrb) {
      await headerOrb.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_mode_c_header_orb.png") });
    }
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_tutor_open.png") });

    // Close panel
    const closeBtn = await page.$(".upe-ai-panel__close");
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 600));
  }

  // 3. CAPTURA DO MODO B (Esfera compacta em /flashcards em 1277x653)
  console.log("Navegando para /flashcards (Modo B — Esfera compacta)...");
  await page.goto("http://localhost:5173/flashcards", { waitUntil: "networkidle2", timeout: 20000 });
  await page.waitForSelector(".a26-flashcards-container, .a26-generator-surface", { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1200));

  const compactTrigger = await page.$(".upe-ai-trigger");
  if (compactTrigger) {
    await compactTrigger.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_mode_b_compact_trigger.png") });
  }
  const compactOrb = await page.$(".aeternum-ai-orb-root");
  if (compactOrb) {
    await compactOrb.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_mode_b_compact_orb_crop.png") });
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_after_flashcards_1277x653.png") });

  // 4. TESTES DE CIRCULARIDADE E MÉTRICAS GEOMÉTRICAS
  console.log("Medindo circularidade e alinhamento geométrico...");
  const geometryMetrics = await page.evaluate(() => {
    const trigger = document.querySelector(".upe-ai-trigger");
    const orb = document.querySelector(".aeternum-ai-orb-root");
    const canvas = document.querySelector(".atlas-ai-orb__canvas");
    const rim = document.querySelector(".atlas-ai-orb__rim");
    const lens = document.querySelector(".atlas-ai-orb__lens");

    const tRect = trigger.getBoundingClientRect();
    const oRect = orb.getBoundingClientRect();
    const cRect = canvas.getBoundingClientRect();
    const rRect = rim.getBoundingClientRect();

    const tStyles = window.getComputedStyle(trigger);
    const oStyles = window.getComputedStyle(orb);
    const rStyles = window.getComputedStyle(rim);

    return {
      trigger: {
        width: tRect.width,
        height: tRect.height,
        ratio: tRect.width / tRect.height,
        borderRadius: tStyles.borderRadius,
        background: tStyles.backgroundColor,
        border: tStyles.borderWidth + " " + tStyles.borderStyle,
        boxShadow: tStyles.boxShadow
      },
      orb: {
        width: oRect.width,
        height: oRect.height,
        ratio: oRect.width / oRect.height,
        perfectCircle: Math.abs(oRect.width - oRect.height) < 0.05
      },
      canvas: {
        width: cRect.width,
        height: cRect.height,
        ratio: cRect.width / cRect.height,
        internalW: canvas.width,
        internalH: canvas.height,
        alignedWithOrb: Math.abs(cRect.width - oRect.width) < 0.05
      },
      rim: {
        width: rRect.width,
        height: rRect.height,
        alignedWithOrb: Math.abs(rRect.width - oRect.width) < 0.05,
        border: rStyles.borderWidth + " " + rStyles.borderStyle
      }
    };
  });

  console.log("Métricas de Geometria:", JSON.stringify(geometryMetrics, null, 2));

  // 5. TESTES DOS ESTADOS ANIMADOS (idle, listening, thinking, speaking)
  console.log("Capturando estados animados da esfera...");
  const states = ["idle", "focus", "listening", "thinking", "speaking"];
  for (const st of states) {
    await page.evaluate((targetState) => {
      const orb = document.querySelector(".aeternum-ai-orb-root");
      if (orb) {
        orb.className = `aeternum-ai-orb-root is-liquid-glass state-${targetState} size-md`;
      }
    }, st);
    await new Promise(r => setTimeout(r, 600));

    const stateOrb = await page.$(".aeternum-ai-orb-root");
    if (stateOrb) {
      await stateOrb.screenshot({ path: path.join(ARTIFACTS_DIR, `p0_20_h_after_state_${st}.png`) });
    }
  }

  // 6. VALIDAÇÃO NAS DEMAIS RESOLUÇÕES OBRIGATÓRIAS
  for (const vp of VIEWPORTS) {
    console.log(`Testando resolução: ${vp.name} (${vp.width}x${vp.height} @ zoom ${vp.zoom})...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: vp.zoom });
    await page.goto("http://localhost:5173/student/home", { waitUntil: "networkidle2", timeout: 15000 });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, `p0_20_h_after_home_${vp.name}.png`) });
  }

  await browser.close();
  console.log("Homologação visual P0.20-H concluída com sucesso!");
}

runHomologation().catch(err => {
  console.error("Erro na homologação:", err);
  process.exit(1);
});
