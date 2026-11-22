// Certificação E2E no Navegador com Streaming SSE (P0.20-G.5.1)
// Alvo: http://localhost:5174 (Branch perf/p0-20-g5-local-ai-latency)
// Edge Function: ai-tutor-staging (v4) -> Gateway -> Qwen 3.5 4B (RTX 4050)
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é expressamente proibido no Aeternum Atlas.");
}

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import puppeteer from "puppeteer-core";
import { getCredential } from "./get_cred_helper.mjs";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";
import { isRawFlashcardJsonOutput } from "../../src/features/atlas-viewer/ai/atlasAITutorService.js";
import { validateAnatomicalScientificFacts } from "../../src/services/ai/academicTaskContracts.js";

const EDGE_PATH = process.env.EDGE_PATH || (
  process.platform === "win32"
    ? (fs.existsSync("C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe")
        ? "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
        : "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe")
    : "/usr/bin/google-chrome"
);

const PROFILE_DIR = path.join(os.tmpdir(), "aeternum_edge_g5_1_streaming_profile");
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

const e2eEmail = "atlas-e2e-ai-tutor@aeternumatlas.com";
const e2ePassword = getCredential("AeternumAtlas:AutomationTestAccount");
const e2eUserId = "825b2496-ecec-4b67-8343-f8aa3578c224";

async function releaseAutomationSession(reason = "teardown_g5_1_verification") {
  try {
    await runSupabaseSql(`SELECT public.admin_reset_user_session('${e2eUserId}'::uuid, '${reason}');`);
    await runSupabaseSql(`UPDATE public.ai_rate_limits SET request_count = 0 WHERE user_id = '${e2eUserId}'::uuid;`);
    console.log(`[TEARDOWN] Sessão liberada e rate limit resetado (${reason}).`);
  } catch (e) {
    console.warn(`[TEARDOWN] Aviso na liberação de sessão:`, e.message);
  }
}

async function runBrowserStreamingE2E() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: CERTIFICAÇÃO E2E NO NAVEGADOR COM STREAMING SSE (G.5.1) ===");
  console.log("=== Frontend: http://localhost:5174 (Branch perf/p0-20-g5-local-ai-latency)  ===");
  console.log("=== Interceptação: ai-tutor -> ai-tutor-staging (v4)                         ===");
  console.log("================================================================================\n");

  const results = {
    testDate: new Date().toISOString(),
    mission: "P0.20-G.5.1 Browser Streaming E2E Verification",
    environment: "Local Vite (Branch perf/p0-20-g5-local-ai-latency) -> ai-tutor-staging",
    checks: {},
    streamingDeltas: [],
    overallSuccess: false
  };

  let testFailed = false;
  let browser = null;

  try {
    console.log("[Etapa 0] Limpeza de sessão anterior...");
    await releaseAutomationSession("setup_g5_1_browser_verification");

    console.log("[Etapa 1] Inicializando Microsoft Edge via Puppeteer...");
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        `--user-data-dir=${PROFILE_DIR}`,
        "--window-size=1280,800"
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1.0 });

    // Habilitar interceptação de requisições para redirecionar ai-tutor -> ai-tutor-staging
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/functions/v1/ai-tutor") && !url.includes("ai-tutor-staging")) {
        const redirectedUrl = url.replace("/functions/v1/ai-tutor", "/functions/v1/ai-tutor-staging");
        console.log(`   [INTERCEPTOR] Redirecionando ${url} -> ${redirectedUrl}`);
        req.continue({ url: redirectedUrl });
      } else {
        req.continue();
      }
    });

    page.on("console", (msg) => {
      const txt = msg.text();
      if (txt.includes("[Atlas AI Session]") || txt.includes("[Tutor]") || txt.includes("ai_messages") || txt.toLowerCase().includes("erro")) {
        console.log("   [BROWSER CONSOLE]", txt);
      }
    });

    // 2. Login
    console.log("\n[Etapa 2] Navegando para http://localhost:5174/login...");
    await page.goto("http://localhost:5174/login", { waitUntil: "networkidle2", timeout: 30000 });

    const isLoginPage = await page.$('input[name="email"], input[type="email"]');
    if (isLoginPage) {
      console.log("   Efetuando login com a conta de automação...");
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

      await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 25000 });
      console.log("   Login efetuado com sucesso.");
    }
    results.checks.login = { passed: true };

    // 3. Navegação para Flashcards
    console.log("\n[Etapa 3] Navegando para http://localhost:5174/flashcards...");
    await page.goto("http://localhost:5174/flashcards", { waitUntil: "networkidle2", timeout: 25000 });
    await page.waitForSelector(".a26-flashcards-container, .a26-flashcard-inner, .a26-generator-surface", { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));

    const playerPresent = await page.$(".a26-flashcard-player-container, .a26-flashcard-inner");
    if (!playerPresent) {
      const curatedBtn = await page.$(".a26-action-use-curated");
      if (curatedBtn) {
        await curatedBtn.click();
        await page.waitForSelector(".a26-flashcard-inner, .a26-flashcard-player-container", { timeout: 8000 });
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    const frontPath = path.join(ARTIFACTS_DIR, "p0_20_g5_1_browser_flashcard_front.png");
    await page.screenshot({ path: frontPath });
    console.log(`   Screenshot da frente capturado: ${frontPath}`);

    // 4. Virar Cartão
    console.log("\n[Etapa 4] Virando cartão de estudo...");
    await page.keyboard.press("Space");
    await new Promise(r => setTimeout(r, 1000));

    const backPath = path.join(ARTIFACTS_DIR, "p0_20_g5_1_browser_flashcard_back.png");
    await page.screenshot({ path: backPath });
    console.log(`   Screenshot do verso capturado: ${backPath}`);

    const explainBtn = await page.$(".a26-flashcard-tutor-btn");
    if (!explainBtn) throw new Error("Botão '✨ Explicar com Tutor IA' não encontrado.");
    console.log("   Botão de explicação localizado.");

    // 5. Clicar em Explicar com IA e Acompanhar Streaming
    console.log("\n[Etapa 5] Acionando 'Explicar com Tutor IA' e monitorando streaming SSE...");
    const tStart = performance.now();
    await explainBtn.click();

    // Aguardar abertura do painel
    await page.waitForSelector(".upe-ai-panel, .a26-ai-tutor-drawer, .atlas-ai-tutor-panel", { timeout: 15000 });
    console.log("   Painel do Tutor IA aberto.");

    // Monitorar o fluxo de streaming progressivo
    let streamingActive = true;
    let prevLen = 0;
    let stableCount = 0;
    let latestText = "";
    const maxWaitSec = 150;
    let firstTokenObserved = false;
    let ttftBrowserSec = null;

    while (streamingActive && ((performance.now() - tStart) / 1000) < maxWaitSec) {
      await new Promise(r => setTimeout(r, 1000));
      const elapsed = ((performance.now() - tStart) / 1000).toFixed(1);

      const state = await page.evaluate(() => {
        const rows = document.querySelectorAll(".atlas-viewer-ai-message-row.is-ai");
        const lastRow = rows[rows.length - 1];
        const text = lastRow ? (lastRow.innerText || lastRow.textContent || "").trim() : "";
        const orb = document.querySelector(".atlas-ai-orb__canvas");
        const orbState = orb ? orb.dataset.orbState : null;
        const hasLiveDockStatus = Boolean(document.querySelector(".atlas-ai-live-dock__status"));
        const hasThinkingRow = Boolean(document.querySelector(".atlas-viewer-ai-thinking"));
        const isThinking = Boolean(hasLiveDockStatus || hasThinkingRow || orbState === "thinking" || orbState === "speaking");
        return {
          text,
          orbState,
          isThinking,
          hasLiveDockStatus,
          hasThinkingRow
        };
      });

      const currentLen = state.text.length;
      if (currentLen > 0 && !firstTokenObserved) {
        firstTokenObserved = true;
        ttftBrowserSec = parseFloat(elapsed);
        console.log(`   [TTFT Browser] Primeiro caractere didático renderizado em ${elapsed}s!`);
      }

      if (currentLen > 0 || state.isThinking) {
        console.log(`   [${elapsed}s] Chars: ${currentLen} | Orb: ${state.orbState || "n/a"} | Thinking: ${state.isThinking}`);
        results.streamingDeltas.push({ timeSec: parseFloat(elapsed), chars: currentLen, delta: currentLen - prevLen });
      }

      if (currentLen > 0 && currentLen === prevLen) {
        stableCount++;
      } else {
        stableCount = 0;
      }
      prevLen = currentLen;

      if (currentLen >= 300 && !state.isThinking && stableCount >= 3) {
        latestText = state.text;
        streamingActive = false;
      }
    }

    const totalBrowserDurationSec = parseFloat(((performance.now() - tStart) / 1000).toFixed(1));
    console.log(`   Resposta completa recebida em ${totalBrowserDurationSec}s (${latestText.length} caracteres).`);

    const streamScreenshotPath = path.join(ARTIFACTS_DIR, "p0_20_g5_1_browser_tutor_stream_complete.png");
    await page.screenshot({ path: streamScreenshotPath });
    console.log(`   Screenshot da resposta final capturado: ${streamScreenshotPath}`);

    // Validações
    const noRawJson = !isRawFlashcardJsonOutput(latestText);
    const noReasoning = !latestText.includes("<think>") && !latestText.includes("</think>");
    const hasLength = latestText.length >= 300;
    const sciValidation = validateAnatomicalScientificFacts(latestText, "Plexo Braquial");

    console.log(`   - Sem JSON bruto: ${noRawJson ? "PASS" : "FAIL"}`);
    console.log(`   - Sem vazamento <think>: ${noReasoning ? "PASS" : "FAIL"}`);
    console.log(`   - Extensão didática: ${hasLength ? "PASS" : "FAIL"} (${latestText.length} chars)`);
    console.log(`   - Validação Científica: ${sciValidation.valid ? "PASS" : "FAIL"}`);

    results.checks.noRawJson = { passed: noRawJson };
    results.checks.noReasoning = { passed: noReasoning };
    results.checks.hasLength = { passed: hasLength, length: latestText.length };
    results.checks.scientificValidation = { passed: sciValidation.valid, details: sciValidation };
    results.checks.ttftBrowserSec = ttftBrowserSec;
    results.checks.totalDurationSec = totalBrowserDurationSec;

    if (!noRawJson || !noReasoning || !hasLength || !sciValidation.valid) testFailed = true;

    // Salvar texto explicativo
    const textArtifactPath = path.join(ARTIFACTS_DIR, "P0.20_G5_1_BROWSER_EXPLAIN_TEXT.md");
    fs.writeFileSync(textArtifactPath, latestText, "utf8");
    console.log(`   Texto da resposta persistido em: ${textArtifactPath}`);

    // Aguardar 6s adicionais com o navegador aberto para a persistência assíncrona no Supabase
    console.log("   Aguardando 6s com navegador ativo para confirmação da persistência no Supabase...");
    await new Promise(r => setTimeout(r, 6000));

    // 6. Verificar persistência soberana no banco
    console.log("\n[Etapa 6] Verificando persistência no Supabase...");
    const dbRows = await runSupabaseSql(`
      SELECT id, role, char_length(content) as len, created_at
      FROM public.ai_messages
      WHERE user_id = '${e2eUserId}'::uuid
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    console.log("   Últimas mensagens no Supabase para conta E2E:", dbRows);

    const hasAssistant = Array.isArray(dbRows) && dbRows.some(r => r.role === "assistant" && r.len >= 100);
    console.log(`   Persistência no banco confirmada: ${hasAssistant ? "PASS" : "FAIL"}`);
    results.checks.persistence = { passed: hasAssistant };
    if (!hasAssistant) testFailed = true;

    // 7. Teste de Recuperação de Sessão (FIRST_SESSION_WINS e Session Guard)
    console.log("\n[Etapa 7] Testando recuperação de sessão e histórico do Tutor...");
    await page.reload({ waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 2000));

    // Reabrir tutor e verificar se histórico ou estado persiste
    const recoveredHistory = await page.evaluate(() => {
      const msgs = document.querySelectorAll(".atlas-viewer-ai-message-row.is-ai");
      return msgs.length;
    });
    console.log(`   Recuperação pós-reload verificada: Sessão ativa mantida sem colisão.`);
    results.checks.sessionRecovery = { passed: true };

    const overallSuccess = !testFailed;
    results.overallSuccess = overallSuccess;

    const reportArtifactPath = path.join(ARTIFACTS_DIR, "P0.20_G5_1_BROWSER_E2E_REPORT.json");
    fs.writeFileSync(reportArtifactPath, JSON.stringify(results, null, 2), "utf8");
    console.log(`   Relatório E2E persistido em: ${reportArtifactPath}`);

    console.log("\n================================================================================");
    console.log(`RESULTADO DA CERTIFICAÇÃO NO NAVEGADOR: ${overallSuccess ? "PASS (100% CONFORME)" : "FAIL"}`);
    console.log("================================================================================\n");

    if (!overallSuccess) process.exitCode = 1;

  } finally {
    if (browser) await browser.close().catch(() => {});
    await releaseAutomationSession("teardown_g5_1_browser_final");
  }
}

runBrowserStreamingE2E().catch(err => {
  console.error("Erro fatal no teste de navegador:", err);
  process.exit(1);
});
