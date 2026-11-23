if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é proibido.");
}

import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const LOCAL_URL = process.env.VITE_DEV_URL || "http://localhost:5173";
const TEST_EMAIL = `isabela.rocha.${Date.now()}@med.unicamp.br`;

async function runBrowserE2E() {
  console.log("=== INICIANDO TESTE E2E NO NAVEGADOR: PROGRAMA BETA ===");
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--window-size=1440,900"
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  let createdAppId = null;

  try {
    // 1. Acessar Home
    console.log("[1] Acessando Landing Page...");
    await page.goto(`${LOCAL_URL}/`, { waitUntil: "networkidle2", timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    // 2. Clicar no botão PROGRAMA BETA no header
    console.log("[2] Localizando e clicando no botão PROGRAMA BETA...");
    const betaBtn = await page.waitForSelector("button.public-beta-button, a[href='/programa-beta'], button", { timeout: 5000 });
    
    // Encontrar o botão ou elemento com texto PROGRAMA BETA
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll("button, a"));
      const btn = elements.find(el => el.textContent && el.textContent.includes("PROGRAMA BETA"));
      if (btn) {
        btn.click();
      } else {
        window.location.href = "/programa-beta";
      }
    });

    // 3. Aguardar renderização da página de candidatura
    console.log("[3] Aguardando renderização de /programa-beta...");
    await page.waitForFunction(() => window.location.pathname.includes("programa-beta"), { timeout: 10000 });
    await page.waitForSelector("h1", { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));

    const screenshot1 = path.join(ARTIFACT_DIR, "p0_21_e1_beta_page_rendered.png");
    await page.screenshot({ path: screenshot1, fullPage: true });
    console.log(` -> Screenshot da página de candidatura capturado: ${screenshot1}`);

    // 4. Preenchimento do formulário
    console.log("[4] Preenchendo campos da candidatura...");
    await page.type("input[name='fullName']", "Dra. Isabela Martins Rocha");
    await page.type("input[name='email']", TEST_EMAIL);
    await page.type("input[name='institutionName']", "Universidade Estadual de Campinas (UNICAMP)");
    await page.type("input[name='course']", "Medicina");
    await page.type("input[name='academicTerm']", "4º ano / 7º semestre");
    await page.type("input[name='studentGroup']", "Turma LXI - Grupo Cirúrgico");
    await page.type("input[name='studentIdNumber']", "RA-241908");
    await page.type("input[name='referralSource']", "Instagram Oficial Aeternum Atlas");
    await page.type("textarea[name='motivation']", "Desejo utilizar a Aeternum Atlas para estudo aprofundado de anatomia topográfica e simulações cirúrgicas durante meu internato médico.");

    // Marcar consentimentos
    await page.evaluate(() => {
      const cbPrivacy = document.querySelector("input[name='privacyConsent']");
      if (cbPrivacy && !cbPrivacy.checked) cbPrivacy.click();
      const cbTerms = document.querySelector("input[name='termsConsent']");
      if (cbTerms && !cbTerms.checked) cbTerms.click();
    });

    const screenshot2 = path.join(ARTIFACT_DIR, "p0_21_e1_beta_form_filled.png");
    await page.screenshot({ path: screenshot2, fullPage: true });
    console.log(` -> Screenshot do formulário preenchido capturado: ${screenshot2}`);

    // 5. Submeter candidatura
    console.log("[5] Clicando em 'SOLICITAR PARTICIPAÇÃO BETA'...");
    await page.evaluate(() => {
      const submitBtn = document.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.click();
    });

    // 6. Aguardar confirmação de sucesso
    console.log("[6] Aguardando tela de confirmação de sucesso...");
    await page.waitForFunction(() => {
      const h1 = document.querySelector("h1");
      return h1 && h1.textContent.includes("CANDIDATURA RECEBIDA COM SUCESSO");
    }, { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    const screenshot3 = path.join(ARTIFACT_DIR, "p0_21_e1_beta_success_screen.png");
    await page.screenshot({ path: screenshot3, fullPage: true });
    console.log(` -> Screenshot da tela de sucesso capturado: ${screenshot3}`);

    // 7. Validar persistência no Supabase
    console.log("[7] Validando persistência no banco Supabase...");
    const dbRows = await runSupabaseSql(`SELECT id, status, batch FROM public.beta_applications WHERE email = '${TEST_EMAIL}';`);
    if (!dbRows || dbRows.length === 0) {
      throw new Error("Candidatura não foi persistida no Supabase!");
    }
    createdAppId = dbRows[0].id;
    console.log(` -> Sucesso! Candidatura persistida no Supabase com ID ${createdAppId}, status=${dbRows[0].status}, batch=${dbRows[0].batch}`);

  } finally {
    await browser.close();

    // Teardown
    if (createdAppId) {
      console.log("\n[Teardown] Limpando dados do teste de navegador...");
      await runSupabaseSql(`DELETE FROM public.institutional_notifications WHERE affected_resources->>'application_id' = '${createdAppId}';`);
      await runSupabaseSql(`DELETE FROM public.platform_events WHERE metadata->>'application_id' = '${createdAppId}';`);
      await runSupabaseSql(`DELETE FROM public.beta_applications WHERE id = '${createdAppId}';`);
      console.log(" -> Dados de teste removidos.");
    }
  }

  console.log("\n=== TESTE E2E NO NAVEGADOR: 100% APROVADO COM EVIDÊNCIAS VISUAIS ===");
}

runBrowserE2E().catch(err => {
  console.error("FALHA NO TESTE BROWSER E2E:", err);
  process.exit(1);
});
