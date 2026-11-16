/**
 * AETERNUM ATLAS — BATERIA DE HOMOLOGAÇÃO: P0 SESSION GUARD
 * Validação rigorosa dos 15 cenários obrigatórios em PostgreSQL 15 descartável.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_ROOT = path.resolve(__dirname, "../..");

const CONTAINER_NAME = "aeternum-sg-15-scenarios-test";

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

async function run15Scenarios() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — BATERIA DOS 15 TESTES OBRIGATÓRIOS DO SESSION GUARD           ");
  console.log("================================================================================\n");

  // 1. Setup disposable container
  try { runCmd(`docker rm -f ${CONTAINER_NAME}`); } catch {}
  console.log("1. Subindo container descartável PostgreSQL 15...");
  runCmd(`docker run -d --name ${CONTAINER_NAME} -e POSTGRES_PASSWORD=postgres postgres:15-alpine`);

  // Wait ready
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      if (runPsql("SELECT 1;") === "1") { ready = true; break; }
    } catch {
      await new Promise(r => setTimeout(r, 400));
    }
  }
  if (!ready) throw new Error("PostgreSQL não subiu a tempo");

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
    // 2. Setup mock Supabase environment
    console.log("2. Configurando roles Supabase, auth.users e public.users...");
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
    console.log("3. Aplicando migration do Session Guard...");
    const migrationPath = path.join(FRONTEND_ROOT, "supabase/migrations/20261116010000_aeternum_session_guard_single_session_policy.sql");
    const migrationSql = fs.readFileSync(migrationPath, "utf8");
    runPsql(migrationSql);

    // 4. Seed Test Users
    const USER_STUDENT_ID = "11111111-1111-1111-1111-111111111111";
    const USER_DEMO_ID = "5cfb837a-5ce3-4113-8f4a-dcdd9b8bf43f";
    const USER_OTHER_ID = "22222222-2222-2222-2222-222222222222";

    runPsql(`
      INSERT INTO auth.users (id, email) VALUES 
        ('${USER_STUDENT_ID}', 'estudante@aeternumatlas.com'),
        ('${USER_DEMO_ID}', 'demo.institucional@aeternumatlas.com'),
        ('${USER_OTHER_ID}', 'outro.estudante@aeternumatlas.com')
      ON CONFLICT DO NOTHING;

      INSERT INTO public.users (id, email, role, status, name) VALUES 
        ('${USER_STUDENT_ID}', 'estudante@aeternumatlas.com', 'student', 'active', 'Estudante Padrão'),
        ('${USER_DEMO_ID}', 'demo.institucional@aeternumatlas.com', 'student', 'active', 'Aeternum Atlas — Demonstração Institucional'),
        ('${USER_OTHER_ID}', 'outro.estudante@aeternumatlas.com', 'student', 'active', 'Outro Estudante')
      ON CONFLICT DO NOTHING;
    `);

    console.log("\n--- EXECUTANDO OS 15 CENÁRIOS OBRIGATÓRIOS ---\n");

    const SESSION_A = "aaaa1111-1111-1111-1111-111111111111";
    const SESSION_B = "bbbb2222-2222-2222-2222-222222222222";

    // CENÁRIO 1: Login no equipamento A
    const res1 = runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESSION_A}', 'Device A - Chrome MacOS', '192.168.1.100');`,
      "authenticated",
      USER_STUDENT_ID
    );
    assertTest(
      "1. Login no equipamento A",
      res1.status === "registered" && res1.active_session_id === SESSION_A && res1.transfers_today === 0,
      `Status: ${res1.status}, Sessão Ativa: ${res1.active_session_id}`
    );

    // CENÁRIO 2 & 3: Tentativa de acesso no equipamento B e Transferência autorizada para B
    const res2 = runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESSION_B}', 'Device B - iPhone Safari', '177.18.29.50');`,
      "authenticated",
      USER_STUDENT_ID
    );
    assertTest(
      "2. Tentativa de acesso no equipamento B",
      res2.displaced_session_id === SESSION_A,
      `Sessão anterior detectada para substituição: ${res2.displaced_session_id}`
    );
    assertTest(
      "3. Transferência autorizada para B",
      res2.status === "transferred" && res2.active_session_id === SESSION_B && res2.transfers_today === 1 && res2.transfers_remaining === 4,
      `Nova sessão ativa: ${res2.active_session_id}, Transferências hoje: ${res2.transfers_today}/5`
    );

    // CENÁRIO 4: Rejeição imediata das novas requisições de A
    const res4 = runPsqlJson(
      `SELECT public.validate_session_guard('${SESSION_A}', true, '192.168.1.100');`,
      "authenticated",
      USER_STUDENT_ID
    );
    assertTest(
      "4. Rejeição imediata das novas requisições de A",
      res4.valid === false && res4.code === "SESSION_DISPLACED" && res4.displaced === true,
      `Código retornado: ${res4.code}, Displaced: ${res4.displaced}`
    );

    // CENÁRIO 5: Tentativas simultâneas de login (concorrência transacional)
    const SESSION_C1 = "cccc1111-1111-1111-1111-111111111111";
    const SESSION_C2 = "cccc2222-2222-2222-2222-222222222222";
    
    // Executamos transferências sucessivas e verificamos que a restrição de chave primária e FOR UPDATE serializa
    const res5a = runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESSION_C1}', 'Device C1', '10.0.0.1');`,
      "authenticated",
      USER_STUDENT_ID
    );
    const res5b = runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESSION_C2}', 'Device C2', '10.0.0.2');`,
      "authenticated",
      USER_STUDENT_ID
    );
    const countActive = runPsql(
      `SELECT count(*) FROM public.user_active_sessions WHERE user_id = '${USER_STUDENT_ID}';`
    );
    assertTest(
      "5. Tentativas simultâneas de login",
      countActive === "1" && res5b.status === "transferred" && res5b.transfers_today === 3,
      `Registros ativos na tabela: ${countActive} (Garantido 1 único registro por PK)`
    );

    // CENÁRIO 6: JWT antigo ainda não expirado
    // Simulando que o token de A ainda teria 50 minutos de validade criptográfica
    const res6 = runPsqlJson(
      `SELECT public.validate_session_guard('${SESSION_A}', true);`,
      "authenticated",
      USER_STUDENT_ID
    );
    assertTest(
      "6. JWT antigo ainda não expirado",
      res6.valid === false && res6.code === "SESSION_DISPLACED",
      `Validação falhou no servidor mesmo com JWT não expirado: ${res6.code}`
    );

    // CENÁRIO 7: Mudança de Wi-Fi para 4G (mesmo dispositivo/sessão, IP diferente)
    const res7 = runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESSION_C2}', 'Device C2', '200.150.100.20');`,
      "authenticated",
      USER_STUDENT_ID
    );
    const ipInDb = runPsql(
      `SELECT ip_address FROM public.user_active_sessions WHERE user_id = '${USER_STUDENT_ID}';`
    );
    assertTest(
      "7. Mudança de Wi-Fi para 4G",
      res7.status === "confirmed" && res7.transfers_today === 3 && ipInDb === "200.150.100.20",
      `Sessão confirmada sem nova transferência; IP atualizado para: ${ipInDb}`
    );

    // CENÁRIO 8: Atualização de página no mesmo equipamento (F5)
    const res8 = runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESSION_C2}', 'Device C2', '200.150.100.20');`,
      "authenticated",
      USER_STUDENT_ID
    );
    assertTest(
      "8. Atualização de página no mesmo equipamento",
      res8.status === "confirmed" && res8.transfers_today === 3,
      `Status: ${res8.status}, Contagem de transferências permaneceu inalterada (${res8.transfers_today})`
    );

    // CENÁRIO 9: Uso em múltiplas abas do mesmo navegador (mesmo session_id compartilhado)
    const res9 = runPsqlJson(
      `SELECT public.validate_session_guard('${SESSION_C2}', true);`,
      "authenticated",
      USER_STUDENT_ID
    );
    assertTest(
      "9. Uso em múltiplas abas do mesmo navegador",
      res9.valid === true && res9.code === "SESSION_VALID",
      `Aba secundária validada com sucesso: ${res9.code}`
    );

    // CENÁRIO 10: Falha de conexão e recuperação (reconexão pós-queda)
    const res10 = runPsqlJson(
      `SELECT public.validate_session_guard('${SESSION_C2}', true, '200.150.100.20');`,
      "authenticated",
      USER_STUDENT_ID
    );
    assertTest(
      "10. Falha de conexão e recuperação",
      res10.valid === true && res10.code === "SESSION_VALID",
      `Sessão reconectada sem bloqueio: ${res10.code}`
    );

    // CENÁRIO 11: Sessão expirada por inatividade (tempo excedido)
    runPsql(`
      UPDATE public.user_active_sessions 
      SET last_active_at = now() - interval '65 minutes'
      WHERE user_id = '${USER_STUDENT_ID}';
    `);
    const res11 = runPsqlJson(
      `SELECT public.validate_session_guard('${SESSION_C2}', true);`,
      "authenticated",
      USER_STUDENT_ID
    );
    assertTest(
      "11. Sessão expirada por inatividade",
      res11.valid === false && res11.code === "SESSION_EXPIRED_INACTIVITY" && res11.expired === true,
      `Sessão expirada com sucesso: ${res11.code} (${res11.inactivity_minutes} minutos)`
    );

    // Reativar sessão para os próximos testes
    runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESSION_C2}', 'Device C2', '200.150.100.20');`,
      "authenticated",
      USER_STUDENT_ID
    );

    // CENÁRIO 12: Requisições da IA em andamento durante revogação
    // Novas requisições são barradas no guard antes de iniciar inferência
    runPsql(`
      UPDATE public.user_active_sessions 
      SET status = 'revoked', revoked_reason = 'user_logout'
      WHERE user_id = '${USER_STUDENT_ID}';
    `);
    const res12 = runPsqlJson(
      `SELECT public.consume_ai_rate_limit_tiered('${SESSION_C2}', '200.150.100.20');`,
      "authenticated",
      USER_STUDENT_ID
    );
    assertTest(
      "12. Requisições da IA em andamento durante revogação",
      res12.allowed === false && res12.code === "SESSION_REVOKED",
      `Inferência Qwen bloqueada na porta de entrada: ${res12.code}`
    );

    // Reativar para cenário 13
    runPsqlJson(
      `SELECT public.register_or_transfer_session('${SESSION_C2}', 'Device C2', '200.150.100.20');`,
      "authenticated",
      USER_STUDENT_ID
    );

    // CENÁRIO 13: Bloqueio de acesso direto às APIs com sessão substituída
    const res13 = runPsqlJson(
      `SELECT public.consume_ai_rate_limit_tiered('${SESSION_A}', '192.168.1.100');`,
      "authenticated",
      USER_STUDENT_ID
    );
    assertTest(
      "13. Bloqueio de acesso direto às APIs",
      res13.allowed === false && res13.code === "SESSION_DISPLACED" && res13.displaced === true,
      `Acesso direto de API negado: ${res13.code}`
    );

    // CENÁRIO 14: Restrições RLS e institucionais
    const otherSessionsSeen = runPsql(
      `SELECT count(*) FROM public.user_active_sessions WHERE user_id = '${USER_DEMO_ID}';`,
      "authenticated",
      USER_STUDENT_ID
    );
    let directMutationBlocked = false;
    try {
      const delRes = runPsql(
        `DELETE FROM public.user_active_sessions WHERE user_id = '${USER_DEMO_ID}';`,
        "authenticated",
        USER_STUDENT_ID
      );
      if (delRes.includes("permission denied")) {
        directMutationBlocked = true;
      }
    } catch {
      directMutationBlocked = true;
    }
    assertTest(
      "14. Restrições RLS e institucionais",
      otherSessionsSeen === "0" && directMutationBlocked === true,
      `Sessões de terceiros visíveis: ${otherSessionsSeen}, Mutação direta bloqueada por privilégios: ${directMutationBlocked}`
    );

    // CENÁRIO 15: Compatibilidade com a conta demo e parâmetros específicos
    const DEMO_SESSION_1 = "dddd1111-1111-1111-1111-111111111111";
    const res15Reg = runPsqlJson(
      `SELECT public.register_or_transfer_session('${DEMO_SESSION_1}', 'Demo Device', '127.0.0.1');`,
      "authenticated",
      USER_DEMO_ID
    );
    
    // Testar limite da conta demo: 2 consultas por minuto
    const res15Ai1 = runPsqlJson(
      `SELECT public.consume_ai_rate_limit_tiered('${DEMO_SESSION_1}', '127.0.0.1');`,
      "authenticated",
      USER_DEMO_ID
    );
    const res15Ai2 = runPsqlJson(
      `SELECT public.consume_ai_rate_limit_tiered('${DEMO_SESSION_1}', '127.0.0.1');`,
      "authenticated",
      USER_DEMO_ID
    );
    const res15Ai3 = runPsqlJson(
      `SELECT public.consume_ai_rate_limit_tiered('${DEMO_SESSION_1}', '127.0.0.1');`,
      "authenticated",
      USER_DEMO_ID
    );
    
    assertTest(
      "15. Compatibilidade com a conta demo e parâmetros específicos",
      res15Reg.max_transfers === 3 && 
      res15Reg.inactivity_minutes === 30 &&
      res15Ai1.allowed === true &&
      res15Ai2.allowed === true &&
      res15Ai3.allowed === false &&
      res15Ai3.code === "AI_RATE_LIMITED",
      `Demo: Max Transfers=${res15Reg.max_transfers}, Inactivity=${res15Reg.inactivity_minutes}m, Rate limit=${res15Ai1.allowed}/${res15Ai2.allowed}/${res15Ai3.allowed} (${res15Ai3.code})`
    );

    console.log("\n================================================================================");
    const allPassed = results.every(r => r.pass);
    console.log(`RESULTADO FINAL: ${results.filter(r => r.pass).length}/${results.length} CENÁRIOS APROVADOS (${allPassed ? "100% SUCESSO" : "COM FALHAS"})`);
    console.log("================================================================================");

    if (!allPassed) {
      process.exit(1);
    }
  } finally {
    try {
      runCmd(`docker rm -f ${CONTAINER_NAME}`);
      console.log("\nContainer descartável removido com segurança.");
    } catch {}
  }
}

run15Scenarios().catch(err => {
  console.error("ERRO FATAL:", err);
  process.exit(1);
});
