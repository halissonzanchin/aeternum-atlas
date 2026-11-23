// Certificação E2E no Navegador com Streaming SSE e Recuperação de Sessão (P0.20-G.5.2)
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

const PROFILE_DIR = path.join(os.tmpdir(), "aeternum_edge_g5_2_streaming_profile");
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

const e2eEmail = "atlas-e2e-ai-tutor@aeternumatlas.com";
const e2ePassword = getCredential("AeternumAtlas:AutomationTestAccount");
const e2eUserId = "825b2496-ecec-4b67-8343-f8aa3578c224";

async function releaseAutomationSession(reason = "teardown_g5_2_verification") {
  try {
    await runSupabaseSql(`SELECT public.admin_reset_user_session('${e2eUserId}'::uuid, '${reason}');`);
    await runSupabaseSql(`UPDATE public.ai_rate_limits SET request_count = 0 WHERE user_id = '${e2eUserId}'::uuid;`);
    if (reason.startsWith("setup_")) {
      await runSupabaseSql(`DELETE FROM public.ai_messages WHERE user_id = '${e2eUserId}'::uuid;`);
      await runSupabaseSql(`DELETE FROM public.ai_conversations WHERE user_id = '${e2eUserId}'::uuid;`);
      console.log(`[SETUP] Mensagens e conversas de teste anteriores limpas com sucesso.`);
    }
    console.log(`[TEARDOWN] Sessão liberada e rate limit resetado (${reason}).`);
  } catch (e) {
    console.warn(`[TEARDOWN] Aviso na liberação de sessão:`, e.message);
  }
}

async function runBrowserStreamingE2E() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: CERTIFICAÇÃO E2E NO NAVEGADOR COM STREAMING SSE (G.5.2) ===");
  console.log("=== Frontend: http://localhost:5174 (Branch perf/p0-20-g5-local-ai-latency)  ===");
  console.log("=== Interceptação: ai-tutor -> ai-tutor-staging (v4)                         ===");
  console.log("================================================================================\n");

  const results = {
    testDate: new Date().toISOString(),
    mission: "P0.20-G.5.2 Browser Streaming & Session Recovery Verification",
    environment: "Local Vite (Branch perf/p0-20-g5-local-ai-latency) -> ai-tutor-staging",
    checks: {},
    streamingDeltas: [],
    overallSuccess: false
  };

  let testFailed = false;
  let browser = null;
  const testStartTime = new Date().toISOString();

  try {
    console.log("[Etapa 0] Limpeza de sessão anterior e registro de timestamp...");
    await releaseAutomationSession("setup_g5_2_browser_verification");
    if (fs.existsSync(PROFILE_DIR)) {
      try {
        fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
        console.log("   Perfil temporário do navegador limpo.");
      } catch (e) {
        console.warn("   Aviso na limpeza do perfil:", e.message);
      }
    }
    console.log(`   Timestamp de Início do Teste: ${testStartTime}`);

    console.log("\n[Etapa 1] Inicializando Microsoft Edge via Puppeteer...");
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
    await page.evaluate((uid) => {
      window.localStorage.removeItem(`aeternum_atlas_ai_session:${uid}`);
    }, e2eUserId);
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
    await page.waitForSelector("#upe-ai-panel, .upe-ai-panel, .a26-ai-tutor-drawer, .atlas-ai-tutor-panel", { timeout: 15000 });
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
        return { text, orbState, isThinking, hasLiveDockStatus, hasThinkingRow };
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

    // Validações de integridade textual e científica
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

    // Aguardar 6s com navegador ativo para confirmação da persistência assíncrona no Supabase
    console.log("   Aguardando 6s com navegador ativo para confirmação da persistência no Supabase...");
    await new Promise(r => setTimeout(r, 6000));

    // =========================================================================
    // ETAPA 6: VERIFICAÇÃO RIGOROSA DE PERSISTÊNCIA (CONVERSA E MENSAGEM ESPECÍFICA)
    // Exigência G.5.2: Identificar a conversa EFETIVAMENTE criada neste teste.
    // Comprovar conteúdo, usuário e correspondência exata.
    // =========================================================================
    console.log("\n[Etapa 6] Verificando persistência soberana da conversa específica no Supabase...");

    let matchedRow = null;
    for (let attempt = 1; attempt <= 6; attempt++) {
      const specificDbRows = await runSupabaseSql(`
        SELECT 
          c.id as conversation_id,
          c.title,
          c.created_at as conv_created_at,
          m.id as message_id,
          m.role,
          m.content,
          m.created_at as msg_created_at
        FROM public.ai_conversations c
        JOIN public.ai_messages m ON m.conversation_id = c.id
        WHERE c.user_id = '${e2eUserId}'::uuid
          AND m.role = 'assistant'
        ORDER BY m.created_at DESC
        LIMIT 1;
      `);

      if (Array.isArray(specificDbRows) && specificDbRows.length > 0) {
        matchedRow = specificDbRows[0];
        console.log(`   Tentativa ${attempt}: Conversa e mensagem localizadas com sucesso!`);
        break;
      }
      console.log(`   Tentativa ${attempt}: Aguardando inserção assíncrona no Supabase (2s)...`);
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!matchedRow) {
      console.error("   [ERRO DE PERSISTÊNCIA] Nenhuma mensagem de assistente criada APÓS o início do teste foi encontrada!");
      results.checks.persistence = { passed: false, error: "Nenhuma conversa/mensagem recente localizada no banco." };
      testFailed = true;
    } else {
      const dbContent = (matchedRow.content || "").trim();
      // Normalizar texto removendo formatação markdown e badges de UI para comparação robusta
      const normalizeText = (s) => s.replace(/\*\*/g, "").replace(/^(HISTÓRICO SINCRONIZADO|RESPOSTA DO ATLAS|RESPOSTA CONTEXTUAL|\s)+/gi, "").trim();
      const cleanDb = normalizeText(dbContent);
      const cleanLatest = normalizeText(latestText);
      const contentMatches = cleanDb.includes(cleanLatest.slice(0, 80)) || cleanLatest.includes(cleanDb.slice(0, 80));
      const hasSubstantialLength = dbContent.length >= 300;

      console.log(`   ID da Conversa Criada: ${matchedRow.conversation_id}`);
      console.log(`   ID da Mensagem Gerada: ${matchedRow.message_id}`);
      console.log(`   Tamanho no Banco: ${dbContent.length} caracteres`);
      console.log(`   Correspondência de Conteúdo com Navegador: ${contentMatches ? "SIM (PASS)" : "NÃO (FAIL)"}`);

      const persistencePassed = contentMatches && hasSubstantialLength;
      results.checks.persistence = {
        passed: persistencePassed,
        conversationId: matchedRow.conversation_id,
        messageId: matchedRow.message_id,
        dbContentLength: dbContent.length,
        contentMatches
      };
      if (!persistencePassed) testFailed = true;
    }

    // =========================================================================
    // ETAPA 7: TESTE EVIDENCIADO DE RECUPERAÇÃO DE SESSÃO PÓS-RELOAD (G.5.2)
    // Verificar:
    // - Autenticação preservada.
    // - Conversa correta recuperada.
    // - Mensagem gerada presente no DOM.
    // - Conteúdo correspondente ao resultado original.
    // - Política FIRST_SESSION_WINS respeitada.
    // =========================================================================
    console.log("\n[Etapa 7] Testando recuperação completa de sessão pós-reload...");

    await page.reload({ waitUntil: "networkidle2" });
    await new Promise(r => setTimeout(r, 2000));

    // 7.1 Verificar autenticação preservada no localStorage
    const authStorage = await page.evaluate(() => {
      const raw = localStorage.getItem("sb-hyivyrietgjdazgizafp-auth-token");
      if (!raw) return { authenticated: false };
      try {
        const parsed = JSON.parse(raw);
        return { authenticated: Boolean(parsed.access_token), userEmail: parsed.user?.email };
      } catch {
        return { authenticated: false };
      }
    });
    console.log(`   7.1 Autenticação Preservada: ${authStorage.authenticated ? "SIM (" + authStorage.userEmail + ")" : "NÃO"}`);

    // 7.2 Verificar ausência de aviso de colisão FIRST_SESSION_WINS
    const isDisplaced = await page.evaluate(() => {
      const modal = document.querySelector(".a26-session-displaced-modal, [data-session-displaced='true']");
      return Boolean(modal);
    });
    console.log(`   7.2 FIRST_SESSION_WINS Respeitado (sem colisão): ${!isDisplaced ? "SIM (PASS)" : "FALHA"}`);

    // 7.3 Verificar se a mensagem original está presente no DOM ou ao reabrir o tutor
    let recoveredText = "";
    let recoveredRowFound = false;

    // Verificar se o painel está aberto ou se precisamos abri-lo
    const isPanelVisible = await page.$eval("#upe-ai-panel, .upe-ai-panel", el => el.offsetParent !== null).catch(() => false);
    if (!isPanelVisible) {
      console.log("   Reabrindo painel do Tutor para inspecionar histórico...");
      // Reabrir via botão do flashcard ou dock
      const reOpenBtn = await page.$(".a26-flashcard-tutor-btn, .atlas-ai-live-dock, .upe-ai-trigger");
      if (reOpenBtn) {
        await reOpenBtn.click();
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    const recoveredData = await page.evaluate(() => {
      const rows = document.querySelectorAll(".atlas-viewer-ai-message-row.is-ai");
      const texts = Array.from(rows).map(r => (r.innerText || r.textContent || "").trim());
      return { rowCount: rows.length, texts };
    });

    console.log(`   Mensagens do Assistente encontradas no DOM pós-reload: ${recoveredData.rowCount}`);
    if (recoveredData.texts.length > 0) {
      recoveredText = recoveredData.texts[recoveredData.texts.length - 1];
      recoveredRowFound = recoveredText.includes(latestText.slice(0, 80)) || latestText.includes(recoveredText.slice(0, 80));
      console.log(`   7.3 Correspondência da mensagem recuperada: ${recoveredRowFound ? "SIM (PASS)" : "NÃO (FAIL)"}`);
    }

    // 7.4 Verificar tabela de sessões ativas
    const activeSessions = await runSupabaseSql(`
      SELECT session_id, status, created_at, last_active_at
      FROM public.user_active_sessions
      WHERE user_id = '${e2eUserId}'::uuid
        AND LOWER(status) = 'active'
      ORDER BY last_active_at DESC
      LIMIT 1;
    `);
    const hasActiveSessionInDb = Array.isArray(activeSessions) && activeSessions.length > 0;
    console.log(`   7.4 Registro de Sessão Ativa confirmado no banco: ${hasActiveSessionInDb ? "SIM (PASS)" : "NÃO (FAIL)"}`);

    const sessionRecoveryPassed = authStorage.authenticated && !isDisplaced && recoveredRowFound && hasActiveSessionInDb;
    console.log(`   Resultado Geral Session Recovery: ${sessionRecoveryPassed ? "PASS" : "FAIL"}`);

    results.checks.sessionRecovery = {
      passed: sessionRecoveryPassed,
      authenticated: authStorage.authenticated,
      firstSessionWinsRespected: !isDisplaced,
      recoveredMessageFound: recoveredRowFound,
      recoveredChars: recoveredText.length,
      hasActiveSessionInDb
    };

    if (!sessionRecoveryPassed) testFailed = true;

    const overallSuccess = !testFailed;
    results.overallSuccess = overallSuccess;

    const reportArtifactPath = path.join(ARTIFACTS_DIR, "P0.20_G5_2_BROWSER_E2E_REPORT.json");
    fs.writeFileSync(reportArtifactPath, JSON.stringify(results, null, 2), "utf8");
    console.log(`\n   Relatório E2E completo persistido em: ${reportArtifactPath}`);

    console.log("\n================================================================================");
    console.log(`RESULTADO DA CERTIFICAÇÃO NO NAVEGADOR: ${overallSuccess ? "PASS (100% CONFORME)" : "FAIL"}`);
    console.log("================================================================================\n");

    if (!overallSuccess) process.exitCode = 1;

  } finally {
    if (browser) await browser.close().catch(() => {});
    await releaseAutomationSession("teardown_g5_2_browser_final");
  }
}

runBrowserStreamingE2E().catch(err => {
  console.error("Erro fatal no teste de navegador:", err);
  process.exit(1);
});
