import fs from "node:fs";
import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { getCredential } from "./get_cred_helper.mjs";
import { runSupabaseSql, getAnonKey } from "./supabase_admin_helper.mjs";

// STRICT TLS ENFORCEMENT
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é estritamente proibido.");
}

const GATEWAY_LOCAL_URL = "http://127.0.0.1:8081";
const SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";
const QA_USER_ID = "825b2496-ecec-4b67-8343-f8aa3578c224";
const QA_EMAIL = "atlas-e2e-ai-tutor@aeternumatlas.com";

function readGatewayToken() {
  try {
    const c = fs.readFileSync("C:\\Users\\halis\\.cloudflared\\.gateway.env", "utf8");
    const m = c.match(/AETERNUM_AI_GATEWAY_TOKEN=(.*)/);
    if (m) return m[1].trim().replace(/^['"]|['"]$/g, "");
  } catch {}
  return getCredential("AeternumAtlas:GatewaySecret") || "";
}

function getGpuStats() {
  try {
    const raw = execSync("nvidia-smi --query-gpu=memory.used,memory.total,temperature.gpu,utilization.gpu --format=csv,noheader,nounits", { encoding: "utf8" });
    const [memUsed, memTotal, temp, util] = raw.trim().split(",").map(s => parseFloat(s.trim()));
    return { memUsedMb: memUsed, memTotalMb: memTotal, tempC: temp, utilPct: util };
  } catch {
    return { memUsedMb: null, memTotalMb: null, tempC: null, utilPct: null };
  }
}

function extractSessionId(jwt) {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString("utf8"));
    return payload.session_id || null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: AUDITORIA DE INFRAESTRUTURA COMPARTILHADA (P0.20-G.5.2)  ===");
  console.log("=== Validação Real do Mutex FIFO do Gateway (8081) e Integridade de Sessões  ===");
  console.log("================================================================================\n");

  const results = {
    testDate: new Date().toISOString(),
    suite: "P0.20-G.5.2 Shared Infrastructure & Sessions Audit",
    environment: {
      gatewayUrl: GATEWAY_LOCAL_URL,
      model: "qwen3.5:4b",
      gpu: getGpuStats()
    },
    checks: {},
    honestBoundaryStatus: {
      student_live_concurrency: "NOT TESTED (Protected Student Account Boundary — Non-destructive Policy)",
      edgar_torales_account: "NOT TESTED (Account Creation Reserved for Mission P0.20-S.1)"
    }
  };

  const token = readGatewayToken();
  if (!token) {
    throw new Error("Token de autenticação do Gateway não encontrado.");
  }

  // -------------------------------------------------------------------------
  // GATEWAY TEST 1: Compatibilidade e Não-Regressão da Rota Unária (/v1/llm/generate)
  // -------------------------------------------------------------------------
  console.log("--- TESTE 1: Rota Unária de Produção (/v1/llm/generate) com Autenticação Real ---");
  const t0Gen = performance.now();
  let genRes = null;
  let genText = "";
  try {
    const res = await fetch(`${GATEWAY_LOCAL_URL}/v1/llm/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "Você é um assistente anatômico conciso." },
          { role: "user", content: "Cite a inervação do músculo deltoide em 1 frase curta." }
        ],
        temperature: 0.1,
        maxTokens: 60
      })
    });
    const d = await res.json();
    genText = d?.data?.text || "";
    genRes = {
      status: res.status,
      durationMs: Math.round(performance.now() - t0Gen),
      text: genText,
      modelId: d?.data?.modelId,
      providerId: d?.data?.providerId
    };
  } catch (e) {
    genRes = { status: 500, error: e.message };
  }

  const mentionsAxillary = /axilar/i.test(genText);
  const test1Passed = genRes.status === 200 && mentionsAxillary;
  console.log(`   Status HTTP: ${genRes.status} (${genRes.durationMs}ms)`);
  console.log(`   Resposta: "${genText.trim()}"`);
  console.log(`   Inervação correta (Nervo Axilar): ${mentionsAxillary ? "SIM (PASS)" : "NÃO (FAIL)"}`);
  console.log(`   Resultado Teste 1: ${test1Passed ? "PASS" : "FAIL"}`);
  results.checks.test1_unary_production_route = { passed: test1Passed, details: genRes };

  // -------------------------------------------------------------------------
  // GATEWAY TEST 2: Limite Efetivo de Concorrência & Fila FIFO com Isolamento de Conteúdo
  // Disparo simultâneo de Req A (Bíceps) e Req B (Tríceps) na porta 8081
  // -------------------------------------------------------------------------
  console.log("\n--- TESTE 2: Fila Mutex FIFO e Concorrência Serializada (/v1/llm/generate) ---");
  console.log("   Disparando Req A (Bíceps) e Req B (Tríceps) para testar serialização FIFO...");

  const tStartConcurrent = performance.now();
  let reqAStartTime = 0, reqAFinishTime = 0;
  let reqBStartTime = 0, reqBFinishTime = 0;

  const reqAPromise = (async () => {
    reqAStartTime = performance.now();
    const res = await fetch(`${GATEWAY_LOCAL_URL}/v1/llm/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "Você é um tutor de anatomia conciso. Responda em 1 frase." },
          { role: "user", content: "Qual é a inserção distal e inervação do músculo bíceps braquial?" }
        ],
        temperature: 0.1,
        maxTokens: 60
      })
    });
    const data = await res.json();
    reqAFinishTime = performance.now();
    return {
      name: "Req A (Bíceps)",
      status: res.status,
      durationMs: Math.round(reqAFinishTime - reqAStartTime),
      text: data?.data?.text || ""
    };
  })();

  // 50ms delay para garantir ordem determinística de chegada na fila
  await new Promise(r => setTimeout(r, 50));

  const reqBPromise = (async () => {
    reqBStartTime = performance.now();
    const res = await fetch(`${GATEWAY_LOCAL_URL}/v1/llm/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "Você é um tutor de anatomia conciso. Responda em 1 frase." },
          { role: "user", content: "Qual é a inserção distal e inervação do músculo tríceps braquial?" }
        ],
        temperature: 0.1,
        maxTokens: 60
      })
    });
    const data = await res.json();
    reqBFinishTime = performance.now();
    return {
      name: "Req B (Tríceps)",
      status: res.status,
      durationMs: Math.round(reqBFinishTime - reqBStartTime),
      text: data?.data?.text || ""
    };
  })();

  const [resA, resB] = await Promise.all([reqAPromise, reqBPromise]);
  const totalConcurrentMs = Math.round(performance.now() - tStartConcurrent);

  console.log(`   Tempo Total Concorrente: ${totalConcurrentMs}ms`);
  console.log(`   Req A finalizada em ${resA.durationMs}ms (chars: ${resA.text.length})`);
  console.log(`   Req B finalizada em ${resB.durationMs}ms (chars: ${resB.text.length})`);

  // FIFO check: Req A deve finalizar ANTES de Req B
  const isFifoOrdered = reqAFinishTime < reqBFinishTime;
  console.log(`   Ordenação FIFO comprovada (T_finishA < T_finishB): ${isFifoOrdered ? "SIM (PASS)" : "NÃO (FAIL)"}`);

  // Isolamento de Conteúdo e Ausência de Cross-Talk:
  const aHasBicepsFacts = /r[aá]dio|musculocut[aâ]neo/i.test(resA.text);
  const aNoTricepsLeak = !/ol[eé]crano/i.test(resA.text);
  const bHasTricepsFacts = /ol[eé]crano|radial/i.test(resB.text);
  const bNoBicepsLeak = !/tuberosidade\s+do\s+r[aá]dio|musculocut[aâ]neo/i.test(resB.text);

  console.log(`   Req A (Bíceps) fatos anatômicos corretos: ${aHasBicepsFacts ? "SIM" : "NÃO"}`);
  console.log(`   Req A sem contaminação de Tríceps: ${aNoTricepsLeak ? "SIM (PASS)" : "FALHA"}`);
  console.log(`   Req B (Tríceps) fatos anatômicos corretos: ${bHasTricepsFacts ? "SIM" : "NÃO"}`);
  console.log(`   Req B sem contaminação de Bíceps: ${bNoBicepsLeak ? "SIM (PASS)" : "FALHA"}`);

  const test2Passed = resA.status === 200 && resB.status === 200 &&
                      isFifoOrdered &&
                      aHasBicepsFacts && aNoTricepsLeak &&
                      bHasTricepsFacts && bNoBicepsLeak;

  console.log(`   Resultado Teste 2: ${test2Passed ? "PASS (Fila FIFO & Isolamento Zero Cross-Talk)" : "FAIL"}`);
  results.checks.test2_concurrency_and_fifo_queue = {
    passed: test2Passed,
    totalConcurrentMs,
    isFifoOrdered,
    reqA: { durationMs: resA.durationMs, finishTimestamp: reqAFinishTime, textLength: resA.text.length },
    reqB: { durationMs: resB.durationMs, finishTimestamp: reqBFinishTime, textLength: resB.text.length }
  };

  // -------------------------------------------------------------------------
  // GATEWAY TEST 3: Saturação da Fila & Rejeição Limpa (HTTP 503 QUEUE_FULL)
  // MaxConcurrent = 1, MaxQueueSize = 2 -> Capacidade total = 3 requisições
  // A 4ª requisição simultânea deve ser rejeitada imediatamente com HTTP 503
  // -------------------------------------------------------------------------
  console.log("\n--- TESTE 3: Saturação da Fila & Rejeição Limpa (HTTP 503 QUEUE_FULL) ---");
  console.log("   Saturando capacidade do Gateway (1 ativa + 2 na fila) e enviando 4ª requisição...");

  const makeShortReq = (id) => fetch(`${GATEWAY_LOCAL_URL}/v1/llm/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({
      messages: [{ role: "user", content: `Fila #${id}: inervação do deltoide em 3 palavras.` }],
      temperature: 0.1,
      maxTokens: 30
    })
  });

  // Disparar Req 1 (ativa), Req 2 (fila 1), Req 3 (fila 2)
  const p1 = makeShortReq(1);
  await new Promise(r => setTimeout(r, 30));
  const p2 = makeShortReq(2);
  await new Promise(r => setTimeout(r, 30));
  const p3 = makeShortReq(3);
  await new Promise(r => setTimeout(r, 30));

  // Req 4 chega quando a fila está saturada (tamanho 2)
  const t0Overflow = performance.now();
  let overflowRes = null;
  try {
    const res4 = await makeShortReq(4);
    const data4 = await res4.json();
    overflowRes = {
      status: res4.status,
      durationMs: Math.round(performance.now() - t0Overflow),
      code: data4?.error?.code,
      message: data4?.error?.message
    };
  } catch (e) {
    overflowRes = { status: 500, error: e.message };
  }

  console.log(`   Req 4 (Excedente) Status HTTP: ${overflowRes.status} (em ${overflowRes.durationMs}ms)`);
  console.log(`   Código de Erro Retornado: ${overflowRes.code}`);
  console.log(`   Mensagem Amigável: "${overflowRes.message}"`);

  // Aguardar finalização limpa de p1, p2, p3
  console.log("   Aguardando drenagem limpa das requisições autorizadas (Req 1, 2, 3)...");
  const drainResults = await Promise.all([p1, p2, p3]);
  const allDrainedOk = drainResults.every(r => r.status === 200);
  console.log(`   Requisições anteriores concluídas com sucesso (200 OK): ${allDrainedOk ? "SIM" : "NÃO"}`);

  const test3Passed = overflowRes.status === 503 && overflowRes.code === "queue_full" && allDrainedOk;
  console.log(`   Resultado Teste 3: ${test3Passed ? "PASS (Rejeição Limpa 503 sob Saturação)" : "FAIL"}`);
  results.checks.test3_queue_overflow_saturation = {
    passed: test3Passed,
    overflowDetails: overflowRes,
    allDrainedOk
  };

  // -------------------------------------------------------------------------
  // GATEWAY TEST 4: Barge-In / Cancelamento de Requisição & Liberação de Mutex
  // -------------------------------------------------------------------------
  console.log("\n--- TESTE 4: Cancelamento de Requisição (Barge-In) e Liberação do Mutex ---");
  const abortCtrl = new AbortController();
  let cancelDetected = false;

  const abortedPromise = fetch(`${GATEWAY_LOCAL_URL}/v1/llm/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Explicação anatômica longa que será cancelada." }],
      temperature: 0.1,
      maxTokens: 300
    }),
    signal: abortCtrl.signal
  }).then(async r => {
    return { status: r.status };
  }).catch(e => {
    cancelDetected = true;
    return { aborted: true, error: e.message };
  });

  // Cancela 50ms após envio
  await new Promise(r => setTimeout(r, 50));
  abortCtrl.abort();
  await abortedPromise;

  // Imediatamente dispara nova requisição para provar que o mutex foi liberado
  const t0Recovery = performance.now();
  const recRes = await fetch(`${GATEWAY_LOCAL_URL}/v1/llm/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Verificação imediata pós-cancelamento." }],
      temperature: 0.1,
      maxTokens: 30
    })
  });
  const recData = await recRes.json();
  const recoveryDurationMs = Math.round(performance.now() - t0Recovery);

  const test4Passed = recRes.status === 200 && recData?.success === true;
  console.log(`   Requisição abortada pelo cliente: ${cancelDetected ? "SIM (PASS)" : "NÃO"}`);
  console.log(`   Requisição subsequente atendida com sucesso: ${test4Passed ? "SIM (200 OK em " + recoveryDurationMs + "ms)" : "FALHA"}`);
  console.log(`   Resultado Teste 4: ${test4Passed ? "PASS (Mutex Liberado após Cancelamento)" : "FAIL"}`);
  results.checks.test4_cancellation_and_mutex_release = {
    passed: test4Passed,
    cancelDetected,
    recoveryDurationMs,
    recoveryStatus: recRes.status
  };

  // =========================================================================
  // PARTE 2: RETIFICAÇÃO DO TESTE DE SESSÕES (FIRST_SESSION_WINS & RLS)
  // =========================================================================
  console.log("\n================================================================================");
  console.log("=== PARTE 2: AUDITORIA VERIFICÁVEL DE SESSÕES (FIRST_SESSION_WINS & ISOLAMENTO) ==");
  console.log("================================================================================\n");

  // Snapshot Inicial (S_before)
  console.log("1. Coletando Snapshot Antes (S_before) de public.user_active_sessions...");
  const sBefore = await runSupabaseSql(`
    SELECT user_id, session_id, status, created_at, last_active_at, last_qualified_activity_at
    FROM public.user_active_sessions
    ORDER BY user_id;
  `);

  console.log(`   Registros encontrados antes: ${sBefore?.length || 0}`);
  for (const row of sBefore) {
    console.log(`   - Usuário: ${row.user_id.slice(0, 8)}... | Status: ${row.status} | Sessão: ${row.session_id.slice(0, 8)}...`);
  }

  // Validação de Integridade Estrutural
  const recordsAreValid = sBefore.every(r =>
    typeof r.user_id === "string" && r.user_id.length === 36 &&
    typeof r.session_id === "string" && r.session_id.length === 36 &&
    ["active", "revoked", "released", "expired"].includes(r.status)
  );
  console.log(`\n2. Integridade dos registros na tabela: ${recordsAreValid ? "CONFORME (UUIDs e Status Válidos)" : "FALHA"}`);

  // Teste com a Conta de Teste Autorizada (QA User)
  console.log("\n3. Validando Ciclo de Vida da Sessão QA e FIRST_SESSION_WINS...");
  const anonKey = await getAnonKey();
  const qaPassword = getCredential("AeternumAtlas:AutomationTestAccount");

  let qaPersistencePassed = false;
  let firstSessionWinsBlockedSecond = false;
  let primaryPreservedInDb = false;
  let qaSessionDetails = {};

  if (!qaPassword) {
    console.warn("   [AVISO] Credencial AeternumAtlas:AutomationTestAccount ausente.");
    results.checks.qa_session_lifecycle = { status: "BLOCKED", reason: "Credential missing" };
  } else {
    // Reset limpo EXCLUSIVO da conta de testes (zero impacto em estudantes)
    await runSupabaseSql(`DELETE FROM public.user_active_sessions WHERE user_id = '${QA_USER_ID}';`);

    // Cliente 1 (Sessão Titular)
    const client1 = createClient(SUPABASE_URL, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: auth1, error: authErr1 } = await client1.auth.signInWithPassword({ email: QA_EMAIL, password: qaPassword });
    if (authErr1) throw new Error("Erro login titular QA: " + authErr1.message);

    const session1Id = extractSessionId(auth1.session.access_token);
    console.log(`   Login 1 (Titular) autenticado. Session ID: ${session1Id}`);

    const { data: rpc1 } = await client1.rpc("register_or_transfer_session", {
      p_session_id: session1Id,
      p_device_fingerprint: "audit_fp_device_primary",
      p_confirm_transfer: false,
      p_metadata: { audit: "p0_20_g5_2_primary" }
    });

    qaPersistencePassed = rpc1?.allowed === true && rpc1?.status === "SESSION_GRANTED";
    console.log(`   Registro Sessão 1 (Titular): status=${rpc1?.status}, allowed=${rpc1?.allowed} -> ${qaPersistencePassed ? "PASS" : "FAIL"}`);

    // Cliente 2 (Tentativa de Segunda Sessão Concorrente da Mesma Conta)
    const client2 = createClient(SUPABASE_URL, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: auth2, error: authErr2 } = await client2.auth.signInWithPassword({ email: QA_EMAIL, password: qaPassword });
    if (authErr2) throw new Error("Erro login concorrente QA: " + authErr2.message);

    const session2Id = extractSessionId(auth2.session.access_token);
    console.log(`   Login 2 (Concorrente) autenticado. Session ID: ${session2Id}`);

    const { data: rpc2 } = await client2.rpc("register_or_transfer_session", {
      p_session_id: session2Id,
      p_device_fingerprint: "audit_fp_device_secondary",
      p_confirm_transfer: false,
      p_metadata: { audit: "p0_20_g5_2_secondary" }
    });

    firstSessionWinsBlockedSecond = rpc2?.allowed === false && rpc2?.status === "SESSION_ALREADY_ACTIVE" && rpc2?.other_device_active === true;
    console.log(`   Tentativa Sessão 2 sob FIRST_SESSION_WINS: status=${rpc2?.status}, allowed=${rpc2?.allowed}, other_device_active=${rpc2?.other_device_active} -> ${firstSessionWinsBlockedSecond ? "BLOQUEIO CONFIRMADO (PASS)" : "FALHA"}`);

    // Confirmar que o titular session1Id permanece inalterado como a sessão ativa no banco
    const qaRowInDb = await runSupabaseSql(`SELECT session_id, status FROM public.user_active_sessions WHERE user_id = '${QA_USER_ID}';`);
    primaryPreservedInDb = qaRowInDb[0]?.session_id === session1Id && qaRowInDb[0]?.status === "active";
    console.log(`   Titular (Sessão 1) preservado como sessão ativa no banco: ${primaryPreservedInDb ? "SIM (PASS)" : "FALHA"}`);

    // Titular continua ativo navegando
    const { data: rpc3 } = await client1.rpc("register_or_transfer_session", {
      p_session_id: session1Id,
      p_device_fingerprint: "audit_fp_device_primary",
      p_confirm_transfer: false,
      p_metadata: { audit: "p0_20_g5_2_heartbeat" }
    });
    const heartbeatPassed = rpc3?.allowed === true && rpc3?.status === "SESSION_VALID";
    console.log(`   Heartbeat Titular Preservado: status=${rpc3?.status}, allowed=${rpc3?.allowed} -> ${heartbeatPassed ? "PASS" : "FAIL"}`);

    qaSessionDetails = {
      session1Id,
      session2Id,
      rpc1Status: rpc1?.status,
      rpc2Status: rpc2?.status,
      primaryPreservedInDb,
      heartbeatPassed
    };
  }

  // Snapshot Posterior (S_after)
  console.log("\n4. Coletando Snapshot Pós-Operações (S_after) de public.user_active_sessions...");
  const sAfter = await runSupabaseSql(`
    SELECT user_id, session_id, status, created_at, last_active_at, last_qualified_activity_at
    FROM public.user_active_sessions
    ORDER BY user_id;
  `);

  console.log(`   Registros encontrados após: ${sAfter?.length || 0}`);

  // Comparação Estrita de Antes vs Depois para Todas as Contas de Estudantes
  console.log("\n5. Verificando Isolamento Absoluto de Contas de Estudantes Reais...");
  const studentUsersBefore = sBefore.filter(r => r.user_id !== QA_USER_ID);
  const studentUsersAfter = sAfter.filter(r => r.user_id !== QA_USER_ID);

  let studentAccountsUntouched = true;
  const studentAuditLog = [];

  for (const beforeRow of studentUsersBefore) {
    const afterRow = studentUsersAfter.find(r => r.user_id === beforeRow.user_id);
    if (!afterRow) {
      studentAccountsUntouched = false;
      studentAuditLog.push({ userId: beforeRow.user_id, status: "DELETED", detail: "Registro sumiu!" });
    } else {
      const matchSession = afterRow.session_id === beforeRow.session_id;
      const matchStatus = afterRow.status === beforeRow.status;
      const isClean = matchSession && matchStatus;
      if (!isClean) studentAccountsUntouched = false;
      studentAuditLog.push({
        userId: beforeRow.user_id,
        sessionMatch: matchSession,
        statusMatch: matchStatus,
        statusBefore: beforeRow.status,
        statusAfter: afterRow.status,
        intact: isClean
      });
      console.log(`   - Conta Estudante ${beforeRow.user_id.slice(0, 8)}...: Status [${beforeRow.status} -> ${afterRow.status}], Session ID intacta: ${matchSession ? "SIM" : "NÃO"}`);
    }
  }

  console.log(`   Isolamento de Contas de Estudantes: ${studentAccountsUntouched ? "100% INTACTO (Zero Regressões)" : "FALHA DE ISOLAMENTO"}`);

  results.checks.test5_session_management_and_isolation = {
    recordsIntegrity: recordsAreValid,
    qaPersistencePassed,
    firstSessionWinsBlockedSecond,
    primaryPreservedInDb,
    studentAccountsUntouched,
    studentAuditLog,
    qaSessionDetails
  };

  // Telemetria Final de GPU
  const gpuFinal = getGpuStats();
  const vramDelta = gpuFinal.memUsedMb - results.environment.gpu.memUsedMb;
  console.log(`\n[GPU Final] VRAM: ${gpuFinal.memUsedMb}/${gpuFinal.memTotalMb} MB, Temp: ${gpuFinal.tempC}°C (Delta: ${vramDelta} MB)`);
  results.gpuDeltaMb = vramDelta;

  const allChecksPass = test1Passed && test2Passed && test3Passed && test4Passed &&
                        recordsAreValid && qaPersistencePassed && firstSessionWinsBlockedSecond && primaryPreservedInDb && studentAccountsUntouched;

  results.overallVerdict = allChecksPass ? "PASS" : "FAIL";

  const reportOut = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3/P0.20_G5_2_SHARED_INFRASTRUCTURE_REPORT.json";
  fs.writeFileSync(reportOut, JSON.stringify(results, null, 2), "utf8");

  console.log(`\n================================================================================`);
  console.log(`VEREDITO FINAL DA AUDITORIA: ${allChecksPass ? "PASS (100% CONFORME)" : "FAIL"}`);
  console.log(`Relatório estruturado salvo em: ${reportOut}`);
  console.log(`================================================================================\n`);
}

main().catch(e => {
  console.error("Erro fatal na auditoria:", e);
  process.exit(1);
});
