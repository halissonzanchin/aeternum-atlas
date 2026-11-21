process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import { getCredential } from "./get_cred_helper.mjs";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PROFILE_DIR = "C:\\Users\\halis\\.gemini\\antigravity\\scratch\\edge_p0_20_h_profile";
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

const e2eEmail = "atlas-e2e-ai-tutor@aeternumatlas.com";
const e2ePassword = getCredential("AeternumAtlas:AutomationTestAccount");
const e2eUserId = "825b2496-ecec-4b67-8343-f8aa3578c224";

async function inspectOrb() {
  console.log("=== INICIANDO INSPEÇÃO FORENSE DA ESFERA DE CRISTAL (P0.20-H) ===");

  try {
    await runSupabaseSql(`DELETE FROM public.user_active_sessions WHERE user_id = '${e2eUserId}';`);
    console.log("Sessão prévia limpa.");
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

  console.log("Navegando para http://localhost:5173/login...");
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
    await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 20000 });
  }

  console.log("Autenticado com sucesso na URL:", page.url());

  // Wait for student home
  await page.goto("http://localhost:5173/student/home", { waitUntil: "networkidle2", timeout: 20000 });
  await page.waitForSelector(".upe-ai-trigger, .aeternum-ai-orb-root", { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1200));

  // Inspect Mode A: Marina with text
  console.log("Inspecionando Modo A (Marina com texto)...");
  const metricsModeA = await page.evaluate(() => {
    const trigger = document.querySelector(".upe-ai-trigger");
    const orbRoot = document.querySelector(".aeternum-ai-orb-root");
    const canvas = document.querySelector(".atlas-ai-orb__canvas");
    const lens = document.querySelector(".atlas-ai-orb__lens");
    const rim = document.querySelector(".atlas-ai-orb__rim");

    const tRect = trigger ? trigger.getBoundingClientRect() : null;
    const oRect = orbRoot ? orbRoot.getBoundingClientRect() : null;
    const cRect = canvas ? canvas.getBoundingClientRect() : null;

    const tStyles = trigger ? window.getComputedStyle(trigger) : null;
    const oStyles = orbRoot ? window.getComputedStyle(orbRoot) : null;

    return {
      trigger: tRect ? { width: tRect.width, height: tRect.height, borderRadius: tStyles?.borderRadius } : null,
      orb: oRect ? { width: oRect.width, height: oRect.height, ratio: oRect.width / oRect.height } : null,
      canvas: cRect ? { width: cRect.width, height: cRect.height, internalW: canvas?.width, internalH: canvas?.height } : null,
      hasLens: Boolean(lens),
      hasRim: Boolean(rim)
    };
  });
  console.log("Métricas Modo A:", JSON.stringify(metricsModeA, null, 2));

  // Capture Mode A full and crop
  const triggerEl = await page.$(".upe-ai-trigger");
  if (triggerEl) {
    await triggerEl.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_baseline_mode_a_trigger.png") });
  }
  const orbEl = await page.$(".aeternum-ai-orb-root");
  if (orbEl) {
    await orbEl.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_baseline_mode_a_orb_crop.png") });
  }
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_baseline_student_home.png") });

  // Open Tutor to check Mode C (Tutor aberto e esfera no header)
  console.log("Abrindo painel do Tutor para Modo C...");
  if (triggerEl) {
    await triggerEl.click();
    await new Promise(r => setTimeout(r, 800));
    await page.waitForSelector(".upe-ai-panel", { timeout: 5000 });

    const headerOrb = await page.$(".upe-ai-panel__header .aeternum-ai-orb-root");
    if (headerOrb) {
      await headerOrb.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_baseline_mode_c_header_orb.png") });
    }
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_baseline_tutor_open.png") });

    // Close panel
    const closeBtn = await page.$(".upe-ai-panel__close");
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // Navigate to flashcards
  console.log("Navegando para /flashcards...");
  await page.goto("http://localhost:5173/flashcards", { waitUntil: "networkidle2", timeout: 20000 });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "p0_20_h_baseline_flashcards.png") });

  await browser.close();
  console.log("Inspeção forense concluída.");
}

inspectOrb().catch(err => {
  console.error("Erro na inspeção:", err);
  process.exit(1);
});
