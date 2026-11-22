// Certificação E2E Real com Navegador (Puppeteer + Edge) - P0.20-G.4.1
// Fluxo: Flashcards UI -> "Explicar com IA" -> SSE Streaming -> Tutor IA -> Persistência Real
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é expressamente proibido no Aeternum Atlas.");
}

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import os from "os";
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

const PROFILE_DIR = path.join(os.tmpdir(), "aeternum_edge_p0_20_g4_browser_profile");
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

const e2eEmail = "atlas-e2e-ai-tutor@aeternumatlas.com";
const e2ePassword = getCredential("AeternumAtlas:AutomationTestAccount");
const e2eUserId = "825b2496-ecec-4b67-8343-f8aa3578c224";

async function releaseAutomationSession(reason = "teardown_p0_20_g4_browser") {
  try {
    await runSupabaseSql(`
      SELECT public.admin_reset_user_session(
        '${e2eUserId}'::uuid,
        '${reason}'
      ) as result;
    `);
    await runSupabaseSql(`UPDATE public.ai_rate_limits SET request_count = 0 WHERE user_id = '${e2eUserId}'::uuid;`);
    console.log(`[TEARDOWN] Sessão liberada e rate limit resetado via admin_reset_user_session (${reason}).`);
  } catch (e) {
    console.warn(`[TEARDOWN] Aviso na liberação de sessão:`, e.message);
  }
}

async function runBrowserE2E() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: CERTIFICAÇÃO E2E COM NAVEGADOR REAL (P0.20-G.4.1)        ===");
  console.log("=== Navegador: Microsoft Edge + Puppeteer-core                               ===");
  console.log("=== Fluxo: Flashcards -> 'Explicar com IA' -> SSE Streaming -> DB Real       ===");
  console.log("================================================================================\n");

  const results = {
    testDate: new Date().toISOString(),
    mission: "P0.20-G.4.1",
    environment: "Local Frontend (http://localhost:5173) + Supabase Edge",
    browser: "Microsoft Edge",
    checks: {},
    streamingDeltas: [],
    finalExplanationText: "",
    persistedRecord: null,
    overallSuccess: false
  };

  let testFailed = false;
  let browser = null;

  try {
    // 0. Teardown prévio limpo
    console.log("[Etapa 0] Limpeza de sessão anterior da conta de automação...");
    await releaseAutomationSession("setup_p0_20_g4_browser");

    // 1. Lançar Navegador
    console.log("[Etapa 1] Inicializando Microsoft Edge...");
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

    // Roteamento seguro: direciona chamadas da Edge Function para ai-tutor-staging (Edge Candidata)
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const u = req.url();
      if (u.includes("/functions/v1/ai-tutor") && !u.includes("ai-tutor-staging")) {
        const redirected = u.replace("/functions/v1/ai-tutor", "/functions/v1/ai-tutor-staging");
        console.log(`   [Intercepção E2E] Roteando requisição para Edge Candidata: ai-tutor-staging`);
        req.continue({ url: redirected });
      } else {
        req.continue();
      }
    });

    // 2. Login na Aplicação
    console.log("\n[Etapa 2] Navegando para /login e autenticando...");
    await page.goto("http://localhost:5173/login", { waitUntil: "networkidle2", timeout: 25000 });

    const isLoginPage = await page.$('input[name="email"], input[type="email"]');
    if (isLoginPage) {
      console.log("   Preenchendo credenciais e efetuando login...");
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
      console.log("   Login efetuado com sucesso (navegação fora de /login confirmada).");
    }

    results.checks.login = { passed: true };

    // 3. Navegação para Flashcards
    console.log("\n[Etapa 3] Navegando para /flashcards...");
    await page.goto("http://localhost:5173/flashcards", { waitUntil: "networkidle2", timeout: 20000 });
    await page.waitForSelector(".a26-flashcards-container, .a26-flashcard-inner, .a26-generator-surface", { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1500));

    const playerPresent = await page.$(".a26-flashcard-player-container, .a26-flashcard-inner");
    if (!playerPresent) {
      console.log("   Painel de configuração de baralho detectado. Acionando baralho curado...");
      const curatedBtn = await page.$(".a26-action-use-curated");
      if (curatedBtn) {
        await curatedBtn.click();
        await page.waitForSelector(".a26-flashcard-inner, .a26-flashcard-player-container", { timeout: 8000 });
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Capturar screenshot dos flashcards antes de virar
    const flashcardScreenshotPath = path.join(ARTIFACTS_DIR, "p0_20_g4_browser_flashcard_front.png");
    await page.screenshot({ path: flashcardScreenshotPath });
    console.log(`   Screenshot da frente do Flashcard salvo em: ${flashcardScreenshotPath}`);

    // 4. Virar o cartão para acessar a resposta e o botão "Explicar com Tutor IA"
    console.log("\n[Etapa 4] Virando o cartão para expor a face posterior...");
    // Pressiona Espaço para virar o cartão
    await page.keyboard.press("Space");
    await new Promise(r => setTimeout(r, 800));

    // Verificar se o botão de explicação está visível
    const explainBtnSelector = ".a26-flashcard-tutor-btn";
    await page.waitForSelector(explainBtnSelector, { visible: true, timeout: 5000 });
    console.log("   Botão '✨ Explicar com Tutor IA' localizado no verso do cartão.");

    const flashcardBackScreenshot = path.join(ARTIFACTS_DIR, "p0_20_g4_browser_flashcard_back.png");
    await page.screenshot({ path: flashcardBackScreenshot });
    console.log(`   Screenshot do verso do Flashcard salvo em: ${flashcardBackScreenshot}`);

    // 5. Acionar "Explicar com Tutor IA"
    console.log("\n[Etapa 5] Acionando 'Explicar com Tutor IA'...");
    const tClick = performance.now();
    await page.click(explainBtnSelector);

    // 6. Verificar abertura do painel do Tutor
    console.log("   Aguardando abertura do painel Atlas AI Tutor (#upe-ai-panel)...");
    await page.waitForSelector("#upe-ai-panel, .upe-ai-panel", { visible: true, timeout: 8000 });
    console.log("   Painel do Tutor IA aberto com sucesso.");
    results.checks.panelOpened = { passed: true };

    // 7. Monitorar Streaming SSE progressivo no DOM
    console.log("\n[Etapa 6] Monitorando streaming SSE em tempo real no DOM...");
    let previousTextLength = 0;
    let streamDeltasObserved = 0;
    let latestAiText = "";
    let streamingActive = true;
    let streamingElapsed = 0;

    const tStreamStart = performance.now();
    const MAX_WAIT_MS = 180000; // 3 minutos

    while (streamingActive && (performance.now() - tStreamStart) < MAX_WAIT_MS) {
      await new Promise(r => setTimeout(r, 1200));

      const streamState = await page.evaluate(() => {
        const msgRows = document.querySelectorAll(".atlas-viewer-ai-message-row.is-ai");
        if (msgRows.length === 0) return { text: "", isThinking: true, hasFinished: false };

        const lastRow = msgRows[msgRows.length - 1];
        const textEl = lastRow.querySelector(".atlas-viewer-ai-message");
        const fullText = textEl ? textEl.innerText.trim() : "";

        const isThinking = Boolean(document.querySelector(".atlas-ai-orb__canvas[data-orb-state='thinking']") ||
                                   document.querySelector(".atlas-viewer-ai-message-row.is-thinking"));
        const isSpeaking = Boolean(document.querySelector(".atlas-ai-orb__canvas[data-orb-state='speaking']"));

        return {
          text: fullText,
          isThinking,
          isSpeaking,
          rowsCount: msgRows.length
        };
      });

      const currentLength = streamState.text.length;
      if (currentLength > previousTextLength) {
        streamDeltasObserved++;
        const delta = currentLength - previousTextLength;
        results.streamingDeltas.push({
          timestamp: parseFloat(((performance.now() - tStreamStart) / 1000).toFixed(2)),
          length: currentLength,
          delta
        });
        process.stdout.write(`.`);
        previousTextLength = currentLength;
        latestAiText = streamState.text;
      }

      // Se o texto tiver pelo menos 300 caracteres, verifica se o streaming foi concluído
      if (currentLength >= 300 && streamDeltasObserved >= 1) {
        // Verificar se ainda há indicador ativo
        const isStillStreaming = await page.evaluate(() => {
          const streamFlag = window.__AETERNUM_IS_STREAMING__;
          const orb = document.querySelector(".atlas-ai-orb__canvas");
          const orbState = orb ? orb.dataset.orbState : null;
          const isThinking = Boolean(document.querySelector(".atlas-viewer-ai-message-row.is-thinking"));
          return Boolean(streamFlag || orbState === "speaking" || orbState === "thinking" || isThinking);
        });

        if (!isStillStreaming) {
          // Mais um segundo de confirmação
          await new Promise(r => setTimeout(r, 1500));
          latestAiText = await page.evaluate(() => {
            const msgRows = document.querySelectorAll(".atlas-viewer-ai-message-row.is-ai");
            const lastRow = msgRows[msgRows.length - 1];
            return lastRow ? lastRow.innerText.trim() : "";
          });
          streamingActive = false;
        }
      }
    }

    streamingElapsed = parseFloat(((performance.now() - tStreamStart) / 1000).toFixed(2));
    console.log(`\n   Streaming finalizado em ${streamingElapsed}s (${latestAiText.length} caracteres recebidos, ${streamDeltasObserved} deltas progressivos).`);

    results.finalExplanationText = latestAiText;
    const tutorScreenshotPath = path.join(ARTIFACTS_DIR, "p0_20_g4_browser_tutor_stream_complete.png");
    await page.screenshot({ path: tutorScreenshotPath });
    console.log(`   Screenshot da resposta no Tutor salvo em: ${tutorScreenshotPath}`);

    // Validações da Resposta Recebida no DOM
    const noRawJson = !isRawFlashcardJsonOutput(latestAiText);
    const noReasoningLeak = !latestAiText.includes("<think>") && !latestAiText.includes("</think>");
    const hasSubstantialText = latestAiText.length >= 300;
    const progressiveStreamingPassed = streamDeltasObserved >= 1 && latestAiText.length >= 300;

    console.log("\n--- Validação da Resposta Renderizada no DOM ---");
    console.log(`   - Streaming progressivo verificado: ${progressiveStreamingPassed ? "PASS" : "FAIL"} (${streamDeltasObserved} eventos)`);
    console.log(`   - Ausência de JSON bruto: ${noRawJson ? "PASS" : "FAIL"}`);
    console.log(`   - Zero vazamento de metacognição: ${noReasoningLeak ? "PASS" : "FAIL"}`);
    console.log(`   - Extensão didática substancial: ${hasSubstantialText ? "PASS" : "FAIL"}`);

    results.checks.progressiveStreaming = { passed: progressiveStreamingPassed, deltas: streamDeltasObserved };
    results.checks.noRawJson = { passed: noRawJson };
    results.checks.noReasoningLeak = { passed: noReasoningLeak };
    results.checks.hasSubstantialText = { passed: hasSubstantialText, length: latestAiText.length };

    if (!progressiveStreamingPassed || !noRawJson || !noReasoningLeak || !hasSubstantialText) {
      testFailed = true;
    }

    // 8. Teste de Ação de Fechamento / Minimização do Painel
    console.log("\n[Etapa 7] Testando fechamento/minimização do painel do Tutor...");
    const closeBtnSelector = ".upe-ai-panel__close";
    await page.waitForSelector(closeBtnSelector, { visible: true, timeout: 5000 });
    await page.click(closeBtnSelector);
    await new Promise(r => setTimeout(r, 600));

    const isPanelClosedOrMinimized = await page.evaluate(() => {
      const p = document.querySelector("#upe-ai-panel, .upe-ai-panel");
      return !p || window.getComputedStyle(p).display === "none" || !p.classList.contains("is-open");
    });
    console.log(`   Painel fechado/minimizado com sucesso: ${isPanelClosedOrMinimized ? "PASS" : "FAIL"}`);
    results.checks.panelClose = { passed: isPanelClosedOrMinimized };
    if (!isPanelClosedOrMinimized) testFailed = true;

    // 9. Verificação Estrita de Persistência no Banco de Dados Real (ZERO Aprovação Artificial)
    console.log("\n[Etapa 8] Verificação estrita de persistência real em public.ai_messages...");
    await new Promise(r => setTimeout(r, 2000));

    const dbRows = await runSupabaseSql(`
      SELECT m.id, m.role, m.content, m.created_at, c.id as conv_id, c.title
      FROM public.ai_messages m
      JOIN public.ai_conversations c ON c.id = m.conversation_id
      WHERE m.user_id = '${e2eUserId}'::uuid
        AND m.created_at >= NOW() - INTERVAL '10 minutes'
      ORDER BY m.created_at DESC
      LIMIT 10;
    `);

    console.log(`   Linhas de mensagens encontradas nos últimos 10 minutos: ${dbRows.length}`);

    const hasUserMsg = dbRows.some(r => r.role === "user");
    const hasAiMsg = dbRows.some(r => r.role === "assistant");
    const aiDbMsg = dbRows.find(r => r.role === "assistant");
    const aiContentLength = aiDbMsg ? aiDbMsg.content.length : 0;

    const persistenceVerified = hasUserMsg && hasAiMsg && aiContentLength >= 100;
    console.log(`   - Mensagem de usuário encontrada: ${hasUserMsg ? "PASS" : "FAIL"}`);
    console.log(`   - Mensagem do assistente encontrada: ${hasAiMsg ? "PASS" : "FAIL"} (${aiContentLength} chars)`);
    console.log(`   - Persistência real confirmada sem artifícios: ${persistenceVerified ? "PASS" : "FAIL"}`);

    results.checks.realDatabasePersistence = {
      passed: persistenceVerified,
      userFound: hasUserMsg,
      aiFound: hasAiMsg,
      aiContentLength,
      conversationId: aiDbMsg?.conv_id || null
    };

    if (!persistenceVerified) {
      testFailed = true;
    }

    const overallSuccess = !testFailed;
    results.overallSuccess = overallSuccess;

    const BROWSER_REPORT = path.join(ARTIFACTS_DIR, "P0.20_G4_REAL_BROWSER_E2E_REPORT.json");
    fs.writeFileSync(BROWSER_REPORT, JSON.stringify(results, null, 2));

    try {
      const DOCS_BROWSER_REPORT = path.join(process.cwd(), "docs", "reports", "P0.20_G4_REAL_BROWSER_E2E_REPORT.json");
      fs.mkdirSync(path.dirname(DOCS_BROWSER_REPORT), { recursive: true });
      fs.writeFileSync(DOCS_BROWSER_REPORT, JSON.stringify(results, null, 2));
      console.log(`Relatório de navegador também versionado em: ${DOCS_BROWSER_REPORT}`);
    } catch {}

    console.log("\n================================================================================");
    console.log(`RESULTADO DA CERTIFICAÇÃO COM NAVEGADOR: ${overallSuccess ? "PASS (100% CONFORME)" : "FAIL"}`);
    console.log(`Relatório salvo em: ${BROWSER_REPORT}`);
    console.log("================================================================================\n");

    if (!overallSuccess) {
      process.exitCode = 1;
    }

  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
    console.log("[Teardown] Liberando sessão de automação...");
    await releaseAutomationSession("teardown_p0_20_g4_browser_final");
  }
}

runBrowserE2E().catch(err => {
  console.error("ERRO CRÍTICO NO TESTE COM NAVEGADOR:", err);
  process.exit(1);
});
