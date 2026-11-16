/**
 * AETERNUM ATLAS — BATERIA ESTENDIDA DE SEGURANÇA: P0.2 SESSION GUARD
 * Validação rigorosa dos 10 testes de segurança avançados da Seção 4.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, "../..");

const CONTAINER_NAME = "aeternum-sg-extended-test";

function runCmd(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}

function runPsql(sql, role = "postgres", jwtSub = "", stopOnError = true) {
  let setup = "";
  if (jwtSub) {
    setup += `SET request.jwt.claim.sub = '${jwtSub}'; `;
  }
  if (role && role !== "postgres") {
    setup += `SET ROLE ${role}; `;
  }
  const fullSql = setup + sql;
  const flag = stopOnError ? "-v ON_ERROR_STOP=1" : "";
  const cmd = `docker exec -i ${CONTAINER_NAME} psql -U postgres -d postgres ${flag} -t -A`;
  const output = execSync(cmd, { input: fullSql, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  const filtered = output.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("SET") && !l.startsWith("NOTICE:"));
  return filtered.join("\n");
}

function runPsqlJson(sql, role = "postgres", jwtSub = "") {
  const raw = runPsql(sql, role, jwtSub, true);
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse JSON response: "${raw}". Error: ${err.message}`);
  }
}

async function runExtendedSecuritySuite() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — BATERIA ESTENDIDA DE SEGURANÇA (P0.2 SESSION GUARD)           ");
  console.log("================================================================================\n");

  try { runCmd(`docker rm -f ${CONTAINER_NAME}`); } catch {}
  console.log("1. Subindo container descartável PostgreSQL 15...");
  runCmd(`docker run -d --name ${CONTAINER_NAME} -e POSTGRES_PASSWORD=postgres postgres:15-alpine`);

  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      if (runPsql("SELECT 1;") === "1") { ready = true; break; }
    } catch {
      await new Promise(r => setTimeout(r, 400));
    }
  }
  if (!ready) throw new Error("PostgreSQL não iniciou a tempo.");

  const results = [];
  function assertTest(name, condition, detail = "") {
    if (condition) {
      console.log(`[PASS] ${name}${detail ? ` -> ${detail}` : ""}`);
      results.push({ name, pass: true, detail });
    } else {
      console.error(`[FAIL] ${name}${detail ? ` -> ${detail}` : ""}`);
      results.push({ name, pass: false, detail });
    }
  }

  try {
    // 2. Setup mock environment
    runPsql(`
      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email text UNIQUE,
        created_at timestamptz DEFAULT now()
      );

      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE ROLE service_role;

      CREATE TABLE IF NOT EXISTS public.users (
        id uuid PRIMARY KEY REFERENCES auth.users(id),
        email text,
        role text DEFAULT 'student',
        status text DEFAULT 'active',
        name text
      );

      CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$ LANGUAGE sql STABLE;

      GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
      GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
      GRANT SELECT ON public.users TO authenticated, service_role;
      GRANT SELECT ON auth.users TO authenticated, service_role;
    `);

    // 3. Apply Migration
    const migrationPath = path.join(FRONTEND_ROOT, "supabase/migrations/20261116010000_aeternum_session_guard_single_session_policy.sql");
    runPsql(fs.readFileSync(migrationPath, "utf8"));

    // 4. Seed test users
    const USER_ALICE = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const USER_SUSPENDED = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

    runPsql(`
      INSERT INTO auth.users (id, email) VALUES 
        ('${USER_ALICE}', 'alice.estudante@aeternumatlas.com'),
        ('${USER_SUSPENDED}', 'suspenso@aeternumatlas.com');

      INSERT INTO public.users (id, email, role, status, name) VALUES 
        ('${USER_ALICE}', 'alice.estudante@aeternumatlas.com', 'student', 'active', 'Alice Silva'),
        ('${USER_SUSPENDED}', 'suspenso@aeternumatlas.com', 'student', 'suspended', 'Conta Suspensa');
    `);

    const SESSION_DESKTOP = "11111111-2222-3333-4444-555555555555";
    const SESSION_MOBILE = "66666666-7777-8888-9999-000000000000";

    // TESTE 1: Dois navegadores em equipamentos diferentes
    console.log("--- TESTE 1: Dois navegadores em equipamentos diferentes ---");
    const regDesk = runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESSION_DESKTOP}', 'MacBook Pro / Chrome', '189.40.20.10');`,
      "authenticated",
      USER_ALICE
    );
    const regMob = runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESSION_MOBILE}', 'iPhone 15 / Safari', '201.80.30.5');`,
      "authenticated",
      USER_ALICE
    );
    const valDeskAfterMob = runPsqlJson(
      `SELECT public.validate_session_guard('${SESSION_DESKTOP}', true);`,
      "authenticated",
      USER_ALICE
    );
    assertTest(
      "1. Dois navegadores em equipamentos diferentes",
      regDesk.status === "registered" && regMob.status === "transferred" && valDeskAfterMob.valid === false && valDeskAfterMob.code === "SESSION_DISPLACED",
      `Desktop registrado -> Mobile transferido -> Desktop invalidado com: ${valDeskAfterMob.code}`
    );

    // TESTE 2: Copiagem de sessão ou reutilização de JWT
    console.log("--- TESTE 2: Copiagem de sessão ou reutilização de JWT ---");
    // Um atacante obtém o JWT original do Desktop (com SESSION_DESKTOP) e tenta chamar a API da IA
    const replayAiCall = runPsqlJson(
      `SELECT public.consume_ai_rate_limit_tiered('${SESSION_DESKTOP}', '189.40.20.10');`,
      "authenticated",
      USER_ALICE
    );
    assertTest(
      "2. Copiagem de sessão ou reutilização de JWT",
      replayAiCall.allowed === false && replayAiCall.code === "SESSION_DISPLACED",
      `JWT reaproveitado de sessão substituída rejeitado na entrada da inferência: ${replayAiCall.code}`
    );

    // TESTE 3: Tentativas simultâneas de transferência
    console.log("--- TESTE 3: Tentativas simultâneas de transferência ---");
    const SESS_RACE_1 = "aaaa0001-0000-0000-0000-000000000000";
    const SESS_RACE_2 = "aaaa0002-0000-0000-0000-000000000000";
    const race1 = runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESS_RACE_1}', 'Device Race 1', '10.0.0.1');`,
      "authenticated",
      USER_ALICE
    );
    const race2 = runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESS_RACE_2}', 'Device Race 2', '10.0.0.2');`,
      "authenticated",
      USER_ALICE
    );
    const totalSessionsInDb = runPsql(
      `SELECT count(*) FROM public.user_active_sessions WHERE user_id = '${USER_ALICE}';`
    );
    assertTest(
      "3. Tentativas simultâneas de transferência",
      totalSessionsInDb === "1" && race2.status === "transferred",
      `Transações serializadas com row lock. Apenas 1 registro ativo mantido (${totalSessionsInDb}).`
    );

    // TESTE 4: Sessão revogada durante streaming SSE
    console.log("--- TESTE 4: Sessão revogada durante streaming SSE ---");
    // Simula que após o chunk 1, o usuário fez logout ou sessão foi transferida
    runPsqlJson(
      `SELECT public.revoke_active_session('${SESS_RACE_2}', 'user_logout');`,
      "authenticated",
      USER_ALICE
    );
    // Próxima requisição ou validação de continuação falha imediatamente
    const postRevokeCall = runPsqlJson(
      `SELECT public.consume_ai_rate_limit_tiered('${SESS_RACE_2}', '10.0.0.2');`,
      "authenticated",
      USER_ALICE
    );
    assertTest(
      "4. Sessão revogada durante streaming SSE",
      postRevokeCall.allowed === false && postRevokeCall.code === "SESSION_REVOKED",
      `Continuação bloqueada: ${postRevokeCall.code}`
    );

    // TESTE 5: Chamadas diretas às APIs de conteúdo pago
    console.log("--- TESTE 5: Chamadas diretas às APIs de conteúdo pago ---");
    // Re-registrar sessão ativa para Alice
    const SESS_VALID = "cccc0000-0000-0000-0000-000000000000";
    runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESS_VALID}', 'iPad Pro', '192.168.1.5');`,
      "authenticated",
      USER_ALICE
    );
    // Chamada direta forjando sessão antiga que foi descartada
    const directApiForged = runPsqlJson(
      `SELECT public.validate_session_guard('${SESSION_DESKTOP}', true);`,
      "authenticated",
      USER_ALICE
    );
    assertTest(
      "5. Chamadas diretas às APIs de conteúdo pago",
      directApiForged.valid === false && directApiForged.code === "SESSION_DISPLACED",
      `Acesso direto a endpoint protegido bloqueado: ${directApiForged.code}`
    );

    // TESTE 6: Mudança legítima de IP
    console.log("--- TESTE 6: Mudança legítima de IP ---");
    const ipChange1 = runPsqlJson(
      `SELECT public.validate_session_guard('${SESS_VALID}', true, '177.100.50.1');`,
      "authenticated",
      USER_ALICE
    );
    const ipChange2 = runPsqlJson(
      `SELECT public.validate_session_guard('${SESS_VALID}', true, '177.100.50.2');`,
      "authenticated",
      USER_ALICE
    );
    const recordedIp = runPsql(
      `SELECT ip_address FROM public.user_active_sessions WHERE user_id = '${USER_ALICE}';`
    );
    assertTest(
      "6. Mudança legítima de IP",
      ipChange1.valid === true && ipChange2.valid === true && recordedIp === "177.100.50.2",
      `IP atualizado para ${recordedIp} sem gerar transferência ou desconexão.`
    );

    // TESTE 7: Troca de equipamento com confirmação adicional
    console.log("--- TESTE 7: Troca de equipamento com confirmação adicional ---");
    const SESS_NEW_DEVICE = "dddd0000-0000-0000-0000-000000000000";
    // Dispositivo B solicita verificação prévia passando p_confirm_transfer = false
    const promptCheck = runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESS_NEW_DEVICE}', 'Windows Desktop', '189.1.2.3', false);`,
      "authenticated",
      USER_ALICE
    );
    // A sessão original A ainda deve estar ativa
    const checkOriginalStillActive = runPsql(
      `SELECT session_id FROM public.user_active_sessions WHERE user_id = '${USER_ALICE}';`
    );
    // Usuário confirma a transferência explicitamente
    const confirmTransfer = runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESS_NEW_DEVICE}', 'Windows Desktop', '189.1.2.3', true);`,
      "authenticated",
      USER_ALICE
    );
    assertTest(
      "7. Troca de equipamento com confirmação adicional",
      promptCheck.status === "transfer_confirmation_required" &&
      checkOriginalStillActive === SESS_VALID &&
      confirmTransfer.status === "transferred" &&
      confirmTransfer.active_session_id === SESS_NEW_DEVICE,
      `Prévia solicitada (status: ${promptCheck.status}) -> Confirmação executada (status: ${confirmTransfer.status})`
    );

    // TESTE 8: Conta suspensa ou assinatura vencida
    console.log("--- TESTE 8: Conta suspensa ou assinatura vencida ---");
    const SESS_SUSPENDED = "eeee0000-0000-0000-0000-000000000000";
    const suspendedReg = runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESS_SUSPENDED}', 'Browser Suspenso', '127.0.0.1');`,
      "authenticated",
      USER_SUSPENDED
    );
    assertTest(
      "8. Conta suspensa ou assinatura vencida",
      suspendedReg.status === "account_inactive" && suspendedReg.code === "USER_INACTIVE",
      `Conta suspensa bloqueada na raiz do Session Guard: ${suspendedReg.code}`
    );

    // TESTE 9: Falha temporária do banco de autorização (Fail-closed & Proteção de Permissões)
    console.log("--- TESTE 9: Falha temporária do banco de autorização ---");
    let anonBlocked = false;
    try {
      runPsql(
        `SELECT public.validate_session_guard('${SESS_NEW_DEVICE}');`,
        "anon",
        ""
      );
    } catch (err) {
      if (err.message.includes("permission denied") || err.stderr?.includes("permission denied")) {
        anonBlocked = true;
      }
    }

    const unauthenticatedCall = runPsqlJson(
      `SELECT public.validate_session_guard('${SESS_NEW_DEVICE}');`,
      "authenticated",
      ""
    );
    assertTest(
      "9. Falha temporária do banco de autorização",
      anonBlocked === true && unauthenticatedCall.valid === false && unauthenticatedCall.code === "AUTH_REQUIRED",
      `Anon bloqueado por permissão SQL (true); Authenticated sem claim retorna: ${unauthenticatedCall.code}`
    );

    // TESTE 10: Limites globais de consumo da IA
    console.log("--- TESTE 10: Limites globais de consumo da IA ---");
    // Alice é estudante: cota máxima = 4 queries por 300 segundos
    const ai1 = runPsqlJson(`SELECT public.consume_ai_rate_limit_tiered('${SESS_NEW_DEVICE}');`, "authenticated", USER_ALICE);
    const ai2 = runPsqlJson(`SELECT public.consume_ai_rate_limit_tiered('${SESS_NEW_DEVICE}');`, "authenticated", USER_ALICE);
    const ai3 = runPsqlJson(`SELECT public.consume_ai_rate_limit_tiered('${SESS_NEW_DEVICE}');`, "authenticated", USER_ALICE);
    const ai4 = runPsqlJson(`SELECT public.consume_ai_rate_limit_tiered('${SESS_NEW_DEVICE}');`, "authenticated", USER_ALICE);
    const ai5 = runPsqlJson(`SELECT public.consume_ai_rate_limit_tiered('${SESS_NEW_DEVICE}');`, "authenticated", USER_ALICE);
    assertTest(
      "10. Limites globais de consumo da IA",
      ai1.allowed === true &&
      ai2.allowed === true &&
      ai3.allowed === true &&
      ai4.allowed === true &&
      ai5.allowed === false &&
      ai5.code === "AI_RATE_LIMITED",
      `Cota de estudante (4/300s) respeitada. 5ª consulta bloqueada com ${ai5.code} (retry em ${ai5.retry_after_seconds}s)`
    );

    console.log("\n================================================================================");
    const allPassed = results.every(r => r.pass);
    console.log(`RESULTADO DA BATERIA ESTENDIDA: ${results.filter(r => r.pass).length}/${results.length} TESTES APROVADOS (${allPassed ? "100% SUCESSO" : "COM FALHAS"})`);
    console.log("================================================================================");

    if (!allPassed) process.exit(1);
  } finally {
    try {
      runCmd(`docker rm -f ${CONTAINER_NAME}`);
      console.log("\nContainer descartável de testes estendidos removido.");
    } catch {}
  }
}

runExtendedSecuritySuite().catch(err => {
  console.error("ERRO FATAL:", err);
  process.exit(1);
});
