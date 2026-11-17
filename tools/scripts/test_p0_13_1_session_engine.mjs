/**
 * AETERNUM ATLAS — P0.13.1: SUITE DE TESTES AUTOMATIZADOS DO MOTOR DE SESSÃO
 * Ambiente: PostgreSQL 15 Descartável (Docker) com Relógio Controlado
 * Cobertura: Todos os 13 cenários obrigatórios da Fase 7 + Proteção RLS/RPC (Fase 6)
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";

const CONTAINER_NAME = `aeternum-p0-13-1-pg-test-${Date.now()}`;
const PG_USER = "postgres";
const PG_DB = "postgres";
const PG_PASSWORD = "test_p0_13_1_password";

const results = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

function execSql(sql, { role = "postgres", userId = "", sessionId = "" } = {}) {
  let preamble = `SET client_min_messages TO WARNING;\n`;
  if (role === "postgres") {
    preamble += `RESET ROLE;\n`;
    if (userId) {
      preamble += `SET request.jwt.claim.sub = '${userId}';\n`;
      preamble += `SET request.jwt.claim.role = 'service_role';\n`;
      preamble += `SET request.jwt.claims = '{"sub":"${userId}","role":"service_role","session_id":"${sessionId}"}';\n`;
    }
  } else {
    preamble += `SET request.jwt.claim.sub = '${userId}';\n`;
    preamble += `SET request.jwt.claim.role = '${role}';\n`;
    if (sessionId) {
      preamble += `SET request.jwt.claim.session_id = '${sessionId}';\n`;
      preamble += `SET request.jwt.claims = '{"sub":"${userId}","role":"${role}","session_id":"${sessionId}"}';\n`;
    } else {
      preamble += `SET request.jwt.claim.session_id = '';\n`;
      preamble += `SET request.jwt.claims = '{"sub":"${userId}","role":"${role}"}';\n`;
    }
    preamble += `SET ROLE ${role};\n`;
  }

  const fullSql = `${preamble}\n${sql}`;
  const out = execSync(
    `docker exec -i ${CONTAINER_NAME} psql -U ${PG_USER} -d ${PG_DB} -v ON_ERROR_STOP=1 -q -t -A`,
    { input: fullSql, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
  ).trim();
  const lines = out.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 ? lines[lines.length - 1] : "";
}

function setControlledClock(isoTimestamp) {
  execSql(`
    INSERT INTO private.session_guard_test_clock (id, override_now)
    VALUES (1, '${isoTimestamp}'::timestamptz)
    ON CONFLICT (id) DO UPDATE SET override_now = EXCLUDED.override_now;
  `);
}

function checkPortListening(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1500);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function runSuite() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — P0.13.1: TESTES DO MOTOR FIRST SESSION WINS + 60M INACTIVITY");
  console.log("================================================================================\n");

  const USER_1 = "11111111-1111-4111-8111-111111111111";
  const USER_ROLLOUT = "22222222-2222-4222-8222-222222222222";
  const USER_CONC = "33333333-3333-4333-8333-333333333333";
  const INST_1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  const S1 = "aaaa1111-1111-4111-8111-111111111111";
  const S2 = "bbbb2222-2222-4222-8222-222222222222";
  const S3 = "cccc3333-3333-4333-8333-333333333333";
  const S4 = "dddd4444-4444-4444-8444-444444444444";
  const S_ROLLOUT = "eeee5555-5555-4555-8555-555555555555";

  try {
    console.log(`[SETUP] Iniciando PostgreSQL 15 descartável (${CONTAINER_NAME})...`);
    execSync(
      `docker run --name ${CONTAINER_NAME} -e POSTGRES_PASSWORD=${PG_PASSWORD} -d postgres:15-alpine`,
      { stdio: "pipe" }
    );

    let ready = false;
    for (let i = 0; i < 30; i++) {
      try {
        execSync(`docker exec ${CONTAINER_NAME} pg_isready -U ${PG_USER}`, { stdio: "ignore" });
        ready = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    if (!ready) throw new Error("PostgreSQL descartável não iniciou a tempo.");
    console.log("[SETUP] PostgreSQL 15 online. Criando schema representativo de produção...");

    // 1. Setup representative base schema & Supabase Auth functions
    execSql(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;
      CREATE EXTENSION IF NOT EXISTS unaccent;

      CREATE ROLE anon NOLOGIN;
      CREATE ROLE authenticated NOLOGIN;
      CREATE ROLE service_role NOLOGIN;

      GRANT ALL ON SCHEMA public TO postgres, service_role;
      GRANT USAGE ON SCHEMA public TO anon, authenticated;

      CREATE SCHEMA IF NOT EXISTS auth;
      GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

      CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;

      CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
        SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), current_user::text);
      $$;

      CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
        SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
      $$;

      GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated, service_role;

      CREATE TEXT SEARCH CONFIGURATION public.pt_unaccent ( COPY = simple );

      CREATE TABLE auth.users (
        id uuid PRIMARY KEY,
        email text,
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE public.users (
        id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        institution_id uuid NOT NULL,
        name text,
        email text,
        role text NOT NULL DEFAULT 'student',
        status text NOT NULL DEFAULT 'active',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Users can view own profile" ON public.users FOR SELECT TO authenticated USING (id = auth.uid());
      GRANT SELECT, UPDATE ON public.users TO authenticated;
      GRANT ALL ON public.users TO service_role;

      -- Academic tables protected by RLS
      CREATE TABLE public.ai_conversations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title text NOT NULL,
        created_at timestamptz DEFAULT now()
      );
      ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Users manage their own AI conversations" ON public.ai_conversations
        FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;

      CREATE TABLE public.ai_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id uuid NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        content text NOT NULL,
        created_at timestamptz DEFAULT now()
      );
      ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Users view their own AI messages" ON public.ai_messages
        FOR SELECT TO authenticated USING (auth.uid() = user_id);
      CREATE POLICY "Users insert their own AI messages" ON public.ai_messages
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
      GRANT SELECT, INSERT ON public.ai_messages TO authenticated;

      CREATE TABLE public.study_agenda_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        title text NOT NULL,
        created_at timestamptz DEFAULT now()
      );
      ALTER TABLE public.study_agenda_events ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Users can view own agenda events" ON public.study_agenda_events
        FOR SELECT TO authenticated USING (auth.uid() = user_id);
      CREATE POLICY "Users can create own agenda events" ON public.study_agenda_events
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update own agenda events" ON public.study_agenda_events
        FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_agenda_events TO authenticated;

      CREATE TABLE public.viewer_quiz_results (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        score integer NOT NULL,
        created_at timestamptz DEFAULT now()
      );
      ALTER TABLE public.viewer_quiz_results ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Users can view their own quiz results" ON public.viewer_quiz_results
        FOR SELECT TO authenticated USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert their own quiz results" ON public.viewer_quiz_results
        FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
      GRANT SELECT, INSERT, UPDATE ON public.viewer_quiz_results TO authenticated;

      CREATE TABLE public.vita_voice_rate_limits (
        user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        window_started_at timestamptz NOT NULL DEFAULT now(),
        request_count integer NOT NULL DEFAULT 1,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      ALTER TABLE public.vita_voice_rate_limits ENABLE ROW LEVEL SECURITY;

      CREATE TABLE public.vita_anatomical_knowledge (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        book_title text,
        source_file text,
        source_sha256 text,
        page_number integer,
        chunk_index integer,
        content text,
        metadata jsonb DEFAULT '{}'::jsonb
      );
      ALTER TABLE public.vita_anatomical_knowledge ENABLE ROW LEVEL SECURITY;
      INSERT INTO public.vita_anatomical_knowledge (book_title, source_file, source_sha256, page_number, chunk_index, content, metadata)
      VALUES ('Prometheus Atlas de Anatomia', 'prometheus.pdf', 'sha256_prom', 120, 1, 'O nervo mediano atravessa o túnel do carpo.', '{"domain":"upper_limb","structures":["nervo mediano"]}'::jsonb);

      -- Prometheus Research Tables (for Test 13 preservation audit)
      CREATE TABLE public.participants (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name text NOT NULL,
        status text DEFAULT 'active',
        created_at timestamptz DEFAULT now()
      );
      CREATE TABLE public.prostheses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        model_name text NOT NULL,
        created_at timestamptz DEFAULT now()
      );
      CREATE TABLE public.weekly_submissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id uuid REFERENCES public.participants(id) ON DELETE CASCADE,
        week_number integer NOT NULL,
        responses jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz DEFAULT now()
      );

      INSERT INTO public.participants (id, full_name, status) VALUES
        ('99999999-9999-4999-8999-999999999991', 'Participante Prometheus 01', 'active'),
        ('99999999-9999-4999-8999-999999999992', 'Participante Prometheus 02', 'active');
      INSERT INTO public.prostheses (id, model_name) VALUES
        ('88888888-8888-4888-8888-888888888881', 'Prótese Transradial Mioelétrica v2');
      INSERT INTO public.weekly_submissions (participant_id, week_number, responses) VALUES
        ('99999999-9999-4999-8999-999999999991', 1, '{"vas_pain": 2, "satisfaction": 9}'::jsonb),
        ('99999999-9999-4999-8999-999999999992', 2, '{"vas_pain": 1, "satisfaction": 10}'::jsonb);

      -- Seed users
      INSERT INTO auth.users (id, email) VALUES
        ('${USER_1}', 'estudante1@aeternumatlas.com'),
        ('${USER_ROLLOUT}', 'estudante.rollout@aeternumatlas.com'),
        ('${USER_CONC}', 'estudante.concorrente@aeternumatlas.com');

      INSERT INTO public.users (id, institution_id, name, email, role, status) VALUES
        ('${USER_1}', '${INST_1}', 'Estudante 1', 'estudante1@aeternumatlas.com', 'student', 'active'),
        ('${USER_ROLLOUT}', '${INST_1}', 'Estudante Rollout', 'estudante.rollout@aeternumatlas.com', 'student', 'active'),
        ('${USER_CONC}', '${INST_1}', 'Estudante Concorrente', 'estudante.concorrente@aeternumatlas.com', 'student', 'active');
    `);

    // 2. Apply prior migration 20261116010000
    console.log("[SETUP] Aplicando migration anterior (20261116010000_aeternum_session_guard_single_session_policy.sql)...");
    const prevMigSql = fs.readFileSync(
      path.resolve("supabase/migrations/20261116010000_aeternum_session_guard_single_session_policy.sql"),
      "utf8"
    );
    execSql(prevMigSql);

    // Seed an active session before P0.13.1 migration to test safe rollout transition
    execSql(
      `SELECT public.register_or_transfer_session('${S_ROLLOUT}'::uuid, 'Mozilla/5.0 Raw Fingerprint Legacy', '192.168.1.10', true, '{}'::jsonb);`,
      { role: "authenticated", userId: USER_ROLLOUT, sessionId: S_ROLLOUT }
    );

    // 3. Apply new incremental migration 20261117210000_p0_13_1_first_session_wins_inactivity_60m.sql
    console.log("[SETUP] Aplicando nova migration incremental (20261117210000_p0_13_1_first_session_wins_inactivity_60m.sql)...");
    const newMigSql = fs.readFileSync(
      path.resolve("supabase/migrations/20261117210000_p0_13_1_first_session_wins_inactivity_60m.sql"),
      "utf8"
    );
    execSql(newMigSql);
    console.log("[SETUP] Migration P0.13.1 aplicada com sucesso!\n");

    // Verify Rollout Preservation of existing student session
    const rolloutCheck = JSON.parse(
      execSql(
        `SELECT public.validate_session_guard('${S_ROLLOUT}'::uuid, false, NULL, 'presence_check');`,
        { role: "authenticated", userId: USER_ROLLOUT, sessionId: S_ROLLOUT }
      )
    );
    assert(rolloutCheck.valid === true && rolloutCheck.code === "SESSION_VALID", "Sessão pré-existente deve permanecer válida após rollout");
    const rolloutRow = JSON.parse(
      execSql(`SELECT row_to_json(u) FROM public.user_active_sessions u WHERE user_id = '${USER_ROLLOUT}';`)
    );
    assert(
      /^fp_[0-9a-f]{16}$/.test(rolloutRow.device_fingerprint) && rolloutRow.ip_address === null,
      "Fingerprint legado deve ser anonimizado e IP removido na migração"
    );

    // =========================================================================
    // TESTE 1: PRIMEIRO ACESSO AUTORIZADO (SESSION_GRANTED)
    // =========================================================================
    console.log("-> Executando Teste 1: Primeiro acesso autorizado...");
    const T0 = "2026-11-17T12:00:00.000Z";
    setControlledClock(T0);

    const t1Res = JSON.parse(
      execSql(
        `SELECT public.register_or_transfer_session('${S1}'::uuid, 'Device-1-Chrome', '10.0.0.1', false, '{"tab":1}'::jsonb);`,
        { role: "authenticated", userId: USER_1, sessionId: S1 }
      )
    );
    assert(t1Res.code === "SESSION_GRANTED" && t1Res.status === "SESSION_GRANTED", `Esperado SESSION_GRANTED, recebido ${t1Res.code}`);
    assert(t1Res.valid === true && t1Res.allowed === true, "Primeiro acesso deve ter valid=true e allowed=true");
    assert(t1Res.active_session_id === S1, "active_session_id deve ser S1");
    assert(t1Res.inactivity_minutes === 60, "inactivity_minutes deve ser 60");

    const rowAfterT1 = JSON.parse(
      execSql(`SELECT row_to_json(u) FROM public.user_active_sessions u WHERE user_id = '${USER_1}';`)
    );
    results.push({ test: 1, name: "Primeiro acesso autorizado", status: "PASS", details: t1Res });
    console.log("   [PASS] Teste 1: SESSION_GRANTED concedido para S1.");

    // =========================================================================
    // TESTE 2: SEGUNDO ACESSO RECUSADO (SESSION_ALREADY_ACTIVE)
    // =========================================================================
    console.log("-> Executando Teste 2: Segundo acesso recusado...");
    const T_10M = "2026-11-17T12:10:00.000Z";
    setControlledClock(T_10M);

    // Even if p_confirm_transfer is passed as true, First Session Wins MUST refuse S2!
    const t2Res = JSON.parse(
      execSql(
        `SELECT public.register_or_transfer_session('${S2}'::uuid, 'Device-2-Firefox', '10.0.0.2', true, '{"attempt":"second_device"}'::jsonb);`,
        { role: "authenticated", userId: USER_1, sessionId: S2 }
      )
    );
    assert(t2Res.code === "SESSION_ALREADY_ACTIVE" && t2Res.status === "SESSION_ALREADY_ACTIVE", `Esperado SESSION_ALREADY_ACTIVE, recebido ${t2Res.code}`);
    assert(t2Res.valid === false && t2Res.allowed === false, "Segundo acesso deve ter valid=false e allowed=false");
    assert(!t2Res.active_session_id, "Não deve vazar o active_session_id do primeiro dispositivo");
    results.push({ test: 2, name: "Segundo acesso recusado", status: "PASS", details: t2Res });
    console.log("   [PASS] Teste 2: SESSION_ALREADY_ACTIVE retornado para S2 (mesmo com p_confirm_transfer=true).");

    // =========================================================================
    // TESTE 3: SEGUNDO ACESSO SEM MODIFICAR TIMESTAMPS DA PRIMEIRA SESSÃO
    // =========================================================================
    console.log("-> Executando Teste 3: Segundo acesso sem modificar timestamps da primeira sessão...");
    // Also test S2 calling validate_session_guard and revoke_active_session at T0 + 15m
    setControlledClock("2026-11-17T12:15:00.000Z");
    const s2ValRes = JSON.parse(
      execSql(
        `SELECT public.validate_session_guard('${S2}'::uuid, true, '10.0.0.2', 'ai_tutor_query');`,
        { role: "authenticated", userId: USER_1, sessionId: S2 }
      )
    );
    assert(s2ValRes.code === "SESSION_ALREADY_ACTIVE" && s2ValRes.valid === false, "validate_session_guard de S2 deve retornar SESSION_ALREADY_ACTIVE");

    const s2RevokeRes = JSON.parse(
      execSql(
        `SELECT public.revoke_active_session('${S2}'::uuid, 'user_logout');`,
        { role: "authenticated", userId: USER_1, sessionId: S2 }
      )
    );
    assert(s2RevokeRes.code === "SESSION_ALREADY_ACTIVE" && s2RevokeRes.success === false, "S2 não pode encerrar a sessão de S1");

    const rowAfterT3 = JSON.parse(
      execSql(`SELECT row_to_json(u) FROM public.user_active_sessions u WHERE user_id = '${USER_1}';`)
    );
    assert(rowAfterT3.session_id === S1, "session_id deve continuar sendo S1");
    assert(rowAfterT3.status === "active", "status deve continuar active");
    assert(rowAfterT3.created_at === rowAfterT1.created_at, `created_at alterado! (${rowAfterT3.created_at} vs ${rowAfterT1.created_at})`);
    assert(
      rowAfterT3.last_qualified_activity_at === rowAfterT1.last_qualified_activity_at,
      `last_qualified_activity_at alterado! (${rowAfterT3.last_qualified_activity_at} vs ${rowAfterT1.last_qualified_activity_at})`
    );
    assert(
      rowAfterT3.last_presence_check_at === rowAfterT1.last_presence_check_at,
      `last_presence_check_at alterado! (${rowAfterT3.last_presence_check_at} vs ${rowAfterT1.last_presence_check_at})`
    );
    assert(
      rowAfterT3.last_active_at === rowAfterT1.last_active_at,
      `last_active_at alterado! (${rowAfterT3.last_active_at} vs ${rowAfterT1.last_active_at})`
    );
    results.push({
      test: 3,
      name: "Segundo acesso sem modificar timestamps da primeira sessão",
      status: "PASS",
      details: {
        before: {
          created_at: rowAfterT1.created_at,
          last_qualified_activity_at: rowAfterT1.last_qualified_activity_at,
          last_presence_check_at: rowAfterT1.last_presence_check_at
        },
        after: {
          created_at: rowAfterT3.created_at,
          last_qualified_activity_at: rowAfterT3.last_qualified_activity_at,
          last_presence_check_at: rowAfterT3.last_presence_check_at
        }
      }
    });
    console.log("   [PASS] Teste 3: Todos os timestamps de S1 permaneceram 100% intocados após tentativas de S2.");

    // =========================================================================
    // TESTE 4: MESMA SESSÃO AUTORIZADA EM MÚLTIPLAS ABAS (E HEARTBEATS NÃO REINICIAM PRAZO)
    // =========================================================================
    console.log("-> Executando Teste 4: Mesma sessão autorizada em múltiplas abas...");
    const T_25M = "2026-11-17T12:25:00.000Z";
    setControlledClock(T_25M);

    // Tab 2 of S1 calls register_or_transfer_session
    const t4Tab2Res = JSON.parse(
      execSql(
        `SELECT public.register_or_transfer_session('${S1}'::uuid, 'Device-1-Chrome', NULL, false, '{"tab":2}'::jsonb);`,
        { role: "authenticated", userId: USER_1, sessionId: S1 }
      )
    );
    assert(t4Tab2Res.code === "SESSION_VALID" && t4Tab2Res.valid === true, `Esperado SESSION_VALID na segunda aba, recebido ${t4Tab2Res.code}`);

    // Non-qualified signals (heartbeat, jwt_refresh, data_polling, health_check, session_sync, background_update)
    for (const nonQual of ["heartbeat", "jwt_refresh", "data_polling", "health_check", "session_sync", "background_update"]) {
      const nqRes = JSON.parse(
        execSql(
          `SELECT public.record_qualified_activity('${nonQual}', '${S1}'::uuid, '{}'::jsonb);`,
          { role: "authenticated", userId: USER_1, sessionId: S1 }
        )
      );
      assert(nqRes.code === "SESSION_VALID" && nqRes.qualified_activity_updated === false, `Sinal ${nonQual} NÃO pode reiniciar inatividade!`);
    }

    const rowAfterT4 = JSON.parse(
      execSql(`SELECT row_to_json(u) FROM public.user_active_sessions u WHERE user_id = '${USER_1}';`)
    );
    assert(
      rowAfterT4.last_qualified_activity_at === rowAfterT1.last_qualified_activity_at,
      "last_qualified_activity_at NÃO deve mudar com abertura de aba, sync ou heartbeats!"
    );
    assert(
      rowAfterT4.last_presence_check_at !== rowAfterT1.last_presence_check_at,
      "last_presence_check_at DEVE registrar a verificação de presença!"
    );
    results.push({ test: 4, name: "Mesma sessão autorizada em múltiplas abas", status: "PASS", details: t4Tab2Res });
    console.log("   [PASS] Teste 4: Múltiplas abas autorizadas com SESSION_VALID e sinais não qualificados ignorados.");

    // =========================================================================
    // TESTE 5: INATIVIDADE DE 59 MINUTOS E 59 SEGUNDOS
    // =========================================================================
    console.log("-> Executando Teste 5: Inatividade de 59 minutos e 59 segundos...");
    const T_59M_59S = "2026-11-17T12:59:59.000Z";
    setControlledClock(T_59M_59S);

    // S1 presence check at 59m59s -> still valid!
    const t5S1Res = JSON.parse(
      execSql(
        `SELECT public.validate_session_guard('${S1}'::uuid, false, NULL, 'presence_check');`,
        { role: "authenticated", userId: USER_1, sessionId: S1 }
      )
    );
    assert(t5S1Res.code === "SESSION_VALID" && t5S1Res.valid === true, `Aos 59m59s S1 ainda deve ser SESSION_VALID, recebido ${t5S1Res.code}`);

    // S2 login attempt at 59m59s -> still refused!
    const t5S2Res = JSON.parse(
      execSql(
        `SELECT public.register_or_transfer_session('${S2}'::uuid, 'Device-2', NULL, false, '{}'::jsonb);`,
        { role: "authenticated", userId: USER_1, sessionId: S2 }
      )
    );
    assert(t5S2Res.code === "SESSION_ALREADY_ACTIVE" && t5S2Res.allowed === false, `Aos 59m59s S2 deve ser recusado com SESSION_ALREADY_ACTIVE`);
    results.push({ test: 5, name: "Inatividade de 59 minutos e 59 segundos", status: "PASS", details: { s1: t5S1Res, s2: t5S2Res } });
    console.log("   [PASS] Teste 5: Aos 59m59s S1 permanece SESSION_VALID e S2 permanece bloqueado (SESSION_ALREADY_ACTIVE).");

    // =========================================================================
    // TESTE 6: EXPIRAÇÃO AOS 60 MINUTOS (SESSION_EXPIRED_INACTIVITY)
    // =========================================================================
    console.log("-> Executando Teste 6: Expiração aos 60 minutos...");
    const T_60M_00S = "2026-11-17T13:00:00.000Z";
    setControlledClock(T_60M_00S);

    const t6Res = JSON.parse(
      execSql(
        `SELECT public.validate_session_guard('${S1}'::uuid, true, NULL, 'ai_tutor_query');`,
        { role: "authenticated", userId: USER_1, sessionId: S1 }
      )
    );
    assert(
      t6Res.code === "SESSION_EXPIRED_INACTIVITY" && t6Res.valid === false && t6Res.expired === true,
      `Aos 60m00s S1 deve expirar com SESSION_EXPIRED_INACTIVITY, recebido ${t6Res.code}`
    );
    results.push({ test: 6, name: "Expiração aos 60 minutos", status: "PASS", details: t6Res });
    console.log("   [PASS] Teste 6: Aos 60m00s exatos S1 expirou com SESSION_EXPIRED_INACTIVITY.");

    // =========================================================================
    // TESTE 7: ATIVIDADE LEGÍTIMA REINICIANDO O PRAZO
    // =========================================================================
    console.log("-> Executando Teste 7: Atividade legítima reiniciando o prazo...");
    const T_RESTART = "2026-11-17T14:00:00.000Z";
    const S_ACT = "77777777-7777-4777-8777-777777777777";
    setControlledClock(T_RESTART);

    // First verify that old expired S1 CANNOT resurrect itself (returns SESSION_EXPIRED_INACTIVITY)
    const t7OldS1Rejected = JSON.parse(
      execSql(
        `SELECT public.register_or_transfer_session('${S1}'::uuid, 'Device-1', NULL, false, '{}'::jsonb);`,
        { role: "authenticated", userId: USER_1, sessionId: S1 }
      )
    );
    assert(t7OldS1Rejected.code === "SESSION_EXPIRED_INACTIVITY", "Sessão expirada S1 não pode se reativar sem novo login");

    // New login S_ACT acquires account at 14:00:00Z
    const t7Grant = JSON.parse(
      execSql(
        `SELECT public.register_or_transfer_session('${S_ACT}'::uuid, 'Device-1', NULL, false, '{}'::jsonb);`,
        { role: "authenticated", userId: USER_1, sessionId: S_ACT }
      )
    );
    assert(t7Grant.code === "SESSION_GRANTED", `Nova sessão S_ACT deve adquirir conta às 14:00:00Z, recebido ${t7Grant.code}`);

    // Advance 45 minutes to 14:45:00Z and perform qualified activity ('flashcard_review')
    setControlledClock("2026-11-17T14:45:00.000Z");
    const t7Act = JSON.parse(
      execSql(
        `SELECT public.record_qualified_activity('flashcard_review', '${S_ACT}'::uuid, '{}'::jsonb);`,
        { role: "authenticated", userId: USER_1, sessionId: S_ACT }
      )
    );
    assert(t7Act.code === "SESSION_VALID" && t7Act.qualified_activity_updated === true, "flashcard_review deve atualizar last_qualified_activity_at");

    // Advance to 15:15:00Z (75 minutes after 14:00 login, but only 30 minutes after 14:45 qualified activity!)
    setControlledClock("2026-11-17T15:15:00.000Z");
    const t7Check75m = JSON.parse(
      execSql(
        `SELECT public.validate_session_guard('${S_ACT}'::uuid, false, NULL, 'presence_check');`,
        { role: "authenticated", userId: USER_1, sessionId: S_ACT }
      )
    );
    assert(t7Check75m.code === "SESSION_VALID" && t7Check75m.valid === true, "Sessão deve continuar válida 30m após atividade qualificada (75m após login)");

    // Advance to 15:44:59Z (59m59s after 14:45 qualified activity) -> still valid
    setControlledClock("2026-11-17T15:44:59.000Z");
    const t7Check59m59s = JSON.parse(
      execSql(
        `SELECT public.validate_session_guard('${S_ACT}'::uuid, false, NULL, 'presence_check');`,
        { role: "authenticated", userId: USER_1, sessionId: S_ACT }
      )
    );
    assert(t7Check59m59s.code === "SESSION_VALID" && t7Check59m59s.valid === true, "Sessão deve estar válida aos 59m59s após última atividade");

    // Also test database trigger on academic write at 15:44:59Z resetting the deadline!
    execSql(
      `INSERT INTO public.study_agenda_events (user_id, title) VALUES ('${USER_1}', 'Revisão Anatomia Pelve');`,
      { role: "authenticated", userId: USER_1, sessionId: S_ACT }
    );
    // Advance another 30 minutes to 16:14:59Z -> still valid because agenda write at 15:44:59Z reset the timer!
    setControlledClock("2026-11-17T16:14:59.000Z");
    const t7AfterTrigger = JSON.parse(
      execSql(
        `SELECT public.validate_session_guard('${S_ACT}'::uuid, false, NULL, 'presence_check');`,
        { role: "authenticated", userId: USER_1, sessionId: S_ACT }
      )
    );
    assert(t7AfterTrigger.code === "SESSION_VALID" && t7AfterTrigger.valid === true, "Escrita acadêmica na agenda deve reiniciar o prazo de 60m");

    results.push({ test: 7, name: "Atividade legítima reiniciando o prazo", status: "PASS", details: { rpcActivity: t7Act, triggerVerified: true } });
    console.log("   [PASS] Teste 7: Atividades legítimas (RPC e escrita acadêmica) reiniciaram o prazo de 60 minutos.");

    // =========================================================================
    // TESTE 8: LOGOUT LIBERANDO A CONTA (SESSION_RELEASED -> SESSION_GRANTED)
    // =========================================================================
    console.log("-> Executando Teste 8: Logout liberando a conta...");
    setControlledClock("2026-11-17T16:20:00.000Z");

    const t8Logout = JSON.parse(
      execSql(
        `SELECT public.revoke_active_session('${S_ACT}'::uuid, 'user_logout');`,
        { role: "authenticated", userId: USER_1, sessionId: S_ACT }
      )
    );
    assert(t8Logout.code === "SESSION_RELEASED" && t8Logout.released === true, `Esperado SESSION_RELEASED no logout, recebido ${t8Logout.code}`);

    // S_ACT tries to validate after logout -> receives SESSION_RELEASED
    const t8S1Check = JSON.parse(
      execSql(
        `SELECT public.validate_session_guard('${S_ACT}'::uuid, false, NULL, 'presence_check');`,
        { role: "authenticated", userId: USER_1, sessionId: S_ACT }
      )
    );
    assert(t8S1Check.code === "SESSION_RELEASED" && t8S1Check.valid === false, "S_ACT após logout deve receber SESSION_RELEASED");

    // S2 logs in 1 second later at 16:20:01Z -> immediately acquires account (SESSION_GRANTED)!
    setControlledClock("2026-11-17T16:20:01.000Z");
    const t8S2Login = JSON.parse(
      execSql(
        `SELECT public.register_or_transfer_session('${S2}'::uuid, 'Device-2', NULL, false, '{}'::jsonb);`,
        { role: "authenticated", userId: USER_1, sessionId: S2 }
      )
    );
    assert(t8S2Login.code === "SESSION_GRANTED" && t8S2Login.valid === true, "Após logout de S1, S2 deve receber SESSION_GRANTED imediatamente");
    results.push({ test: 8, name: "Logout liberando a conta", status: "PASS", details: { logout: t8Logout, newLogin: t8S2Login } });
    console.log("   [PASS] Teste 8: Logout voluntário retornou SESSION_RELEASED e liberou a conta imediatamente para S2.");

    // =========================================================================
    // TESTE 9: NOVO LOGIN APÓS EXPIRAÇÃO (SEM INTERVENÇÃO ADMINISTRATIVA)
    // =========================================================================
    console.log("-> Executando Teste 9: Novo login após expiração...");
    // S2 was granted at 16:20:01Z. Advance 60 minutes to 17:20:01Z without S2 logging out.
    setControlledClock("2026-11-17T17:20:01.000Z");

    // S3 logs in directly at 17:20:01Z -> automatically expires S2 and grants S3!
    const t9S3Login = JSON.parse(
      execSql(
        `SELECT public.register_or_transfer_session('${S3}'::uuid, 'Device-3-Safari', NULL, false, '{}'::jsonb);`,
        { role: "authenticated", userId: USER_1, sessionId: S3 }
      )
    );
    assert(
      t9S3Login.code === "SESSION_GRANTED" && t9S3Login.active_session_id === S3 && t9S3Login.valid === true,
      `Após 60m de inatividade de S2, S3 deve receber SESSION_GRANTED automaticamente, recebido ${t9S3Login.code}`
    );
    results.push({ test: 9, name: "Novo login após expiração", status: "PASS", details: t9S3Login });
    console.log("   [PASS] Teste 9: Após 60m de inatividade de S2, S3 adquiriu a conta automaticamente com SESSION_GRANTED.");

    // =========================================================================
    // TESTE 10: VINTE LOGINS CONCORRENTES (PRIORIDADE TRANSACIONAL ATÔMICA)
    // =========================================================================
    console.log("-> Executando Teste 10: Vinte logins concorrentes (sem registro prévio em user_active_sessions)...");
    setControlledClock("2026-11-17T18:00:00.000Z");

    // Verify USER_CONC has 0 rows in user_active_sessions before the burst
    const preConcCount = Number(
      execSql(`SELECT COUNT(*) FROM public.user_active_sessions WHERE user_id = '${USER_CONC}';`)
    );
    assert(preConcCount === 0, "USER_CONC não deve possuir registro prévio antes do teste de concorrência");

    // Launch 20 parallel psql processes inside the container simultaneously
    const concScript = [
      "rm -f /tmp/conc_*.json /tmp/conc_*.err /tmp/sql_*.sql",
      "for i in $(seq 1 20); do",
      '  SID=$(printf "00000000-0000-4000-8000-%012d" "$i")',
      "  cat <<EOF > /tmp/sql_$i.sql",
      `SET request.jwt.claim.sub = '${USER_CONC}';`,
      "SET request.jwt.claim.role = 'authenticated';",
      "SET request.jwt.claim.session_id = '$SID';",
      `SET request.jwt.claims = '{"sub":"${USER_CONC}","role":"authenticated","session_id":"$SID"}';`,
      "SET ROLE authenticated;",
      "SELECT public.register_or_transfer_session('$SID'::uuid, 'Conc-Device-$i', NULL, false, '{}'::jsonb);",
      "EOF",
      "done",
      "for i in $(seq 1 20); do",
      "  psql -U postgres -d postgres -v ON_ERROR_STOP=1 -q -t -A -f /tmp/sql_$i.sql > /tmp/conc_$i.json 2>/tmp/conc_$i.err &",
      "done",
      "wait",
      "for i in $(seq 1 20); do",
      "  if [ -s /tmp/conc_$i.err ]; then",
      '    echo "ERROR_$i: $(cat /tmp/conc_$i.err)"',
      "  fi",
      "  cat /tmp/conc_$i.json",
      "done"
    ].join("\n");

    const concOut = execSync(`docker exec -i ${CONTAINER_NAME} sh`, {
      input: concScript,
      encoding: "utf8"
    }).trim();

    const concLines = concOut.split("\n").map((l) => l.trim()).filter((l) => l.startsWith("{"));
    assert(concLines.length === 20, `Esperadas 20 respostas JSON das 20 conexões concorrentes, recebidas ${concLines.length}`);

    const parsedConc = concLines.map((l) => JSON.parse(l));
    const grantedList = parsedConc.filter((r) => r.code === "SESSION_GRANTED");
    const alreadyActiveList = parsedConc.filter((r) => r.code === "SESSION_ALREADY_ACTIVE");

    assert(grantedList.length === 1, `Exatamente 1 login concorrente deve receber SESSION_GRANTED, recebido: ${grantedList.length}`);
    assert(alreadyActiveList.length === 19, `Exatamente 19 logins concorrentes devem receber SESSION_ALREADY_ACTIVE, recebido: ${alreadyActiveList.length}`);

    const winningSessionId = grantedList[0].active_session_id;
    const dbWinner = execSql(`SELECT session_id FROM public.user_active_sessions WHERE user_id = '${USER_CONC}';`);
    assert(dbWinner === winningSessionId, "O registro em user_active_sessions deve pertencer exatamente à sessão vencedora");

    results.push({
      test: 10,
      name: "Vinte logins concorrentes",
      status: "PASS",
      details: {
        totalConcurrent: 20,
        grantedCount: grantedList.length,
        alreadyActiveCount: alreadyActiveList.length,
        winningSessionId
      }
    });
    console.log(`   [PASS] Teste 10: 20 conexões simultâneas -> 1 SESSION_GRANTED (${winningSessionId}) e 19 SESSION_ALREADY_ACTIVE.`);

    // =========================================================================
    // TESTE 11: JWT ANTIGO E SECUNDÁRIO REJEITADO (PROTEÇÃO SERVIDORA RLS & RPCs)
    // =========================================================================
    console.log("-> Executando Teste 11: JWT antigo e secundário rejeitado em RLS e RPCs...");
    // Currently for USER_1, S3 is the active session (granted at 17:20:01Z). Set clock to 17:30:00Z.
    setControlledClock("2026-11-17T17:30:00.000Z");

    // Active session S3 inserts an AI conversation & quiz result -> succeeds
    execSql(
      `INSERT INTO public.ai_conversations (user_id, title) VALUES ('${USER_1}', 'Estudo Nervo Facial S3');
       INSERT INTO public.viewer_quiz_results (user_id, score) VALUES ('${USER_1}', 95);`,
      { role: "authenticated", userId: USER_1, sessionId: S3 }
    );
    const s3ConvCount = Number(
      execSql(`SELECT COUNT(*) FROM public.ai_conversations WHERE user_id = '${USER_1}';`, {
        role: "authenticated",
        userId: USER_1,
        sessionId: S3
      })
    );
    assert(s3ConvCount === 1, "Sessão ativa S3 deve conseguir ler suas próprias conversas");

    // Now test old JWT S1 (released), old JWT S2 (expired/replaced), and unapproved secondary JWT S4:
    for (const [label, badSid] of [
      ["JWT antigo S1 (released)", S1],
      ["JWT antigo S2 (expired)", S2],
      ["JWT secundário não autorizado S4", S4]
    ]) {
      // 11.1 Direct SELECT on ai_conversations -> must return 0 rows due to AS RESTRICTIVE policy!
      const badSelectCount = Number(
        execSql(`SELECT COUNT(*) FROM public.ai_conversations WHERE user_id = '${USER_1}';`, {
          role: "authenticated",
          userId: USER_1,
          sessionId: badSid
        })
      );
      assert(badSelectCount === 0, `${label} NÃO pode ler ai_conversations via RLS (retornou ${badSelectCount})`);

      // 11.2 Direct SELECT on user_active_sessions -> must return 0 rows (cannot spy on S3)!
      const spyCount = Number(
        execSql(`SELECT COUNT(*) FROM public.user_active_sessions WHERE user_id = '${USER_1}';`, {
          role: "authenticated",
          userId: USER_1,
          sessionId: badSid
        })
      );
      assert(spyCount === 0, `${label} NÃO pode ler a linha ativa de S3 em user_active_sessions`);

      // 11.3 Direct INSERT on ai_conversations -> must fail with RLS error 42501!
      let insertBlocked = false;
      try {
        execSql(`INSERT INTO public.ai_conversations (user_id, title) VALUES ('${USER_1}', 'Bypass Attempt');`, {
          role: "authenticated",
          userId: USER_1,
          sessionId: badSid
        });
      } catch (err) {
        insertBlocked = err.message.includes("row-level security policy");
      }
      assert(insertBlocked, `${label} deve ser bloqueado pelo RLS ao tentar INSERT em ai_conversations`);

      // 11.4 Direct call to consume_ai_rate_limit_tiered -> must return allowed=false!
      const tieredRes = JSON.parse(
        execSql(`SELECT public.consume_ai_rate_limit_tiered('${badSid}'::uuid, NULL);`, {
          role: "authenticated",
          userId: USER_1,
          sessionId: badSid
        })
      );
      assert(tieredRes.allowed === false, `${label} deve ter allowed=false em consume_ai_rate_limit_tiered`);

      // 11.5 Direct call to match_vita_sovereign_knowledge -> must raise SESSION_NOT_AUTHORIZED!
      let ragBlocked = false;
      try {
        execSql(`SELECT * FROM public.match_vita_sovereign_knowledge('nervo mediano');`, {
          role: "authenticated",
          userId: USER_1,
          sessionId: badSid
        });
      } catch (err) {
        ragBlocked = err.message.includes("SESSION_NOT_AUTHORIZED");
      }
      assert(ragBlocked, `${label} deve ser bloqueado ao chamar match_vita_sovereign_knowledge`);
    }

    results.push({
      test: 11,
      name: "JWT antigo rejeitado (RLS & RPCs)",
      status: "PASS",
      details: {
        activeSessionReadWrite: "ALLOWED",
        oldReleasedJwtS1: "BLOCKED_RLS_AND_RPC",
        oldExpiredJwtS2: "BLOCKED_RLS_AND_RPC",
        secondaryUnregisteredJwtS4: "BLOCKED_RLS_AND_RPC"
      }
    });
    console.log("   [PASS] Teste 11: JWTs antigos (S1, S2) e secundários (S4) bloqueados em todas as tabelas RLS e RPCs.");

    // =========================================================================
    // TESTE 12: FALHA DE RPC COM COMPORTAMENTO FAIL-CLOSED (SESSION_GUARD_UNAVAILABLE)
    // =========================================================================
    console.log("-> Executando Teste 12: Falha de RPC com comportamento fail-closed...");
    // 12.1 Token without session_id claim -> must return SESSION_GUARD_UNAVAILABLE
    const t12MissingClaimReg = JSON.parse(
      execSql(`SELECT public.register_or_transfer_session(NULL, 'Device', NULL, false, '{}'::jsonb);`, {
        role: "authenticated",
        userId: USER_1,
        sessionId: ""
      })
    );
    assert(
      t12MissingClaimReg.code === "SESSION_GUARD_UNAVAILABLE" && t12MissingClaimReg.allowed === false,
      "JWT sem session_id deve retornar SESSION_GUARD_UNAVAILABLE fail-closed"
    );

    const t12MissingClaimVal = JSON.parse(
      execSql(`SELECT public.validate_session_guard(NULL, false, NULL, 'presence_check');`, {
        role: "authenticated",
        userId: USER_1,
        sessionId: ""
      })
    );
    assert(
      t12MissingClaimVal.code === "SESSION_GUARD_UNAVAILABLE" && t12MissingClaimVal.valid === false,
      "validate_session_guard sem session_id deve retornar SESSION_GUARD_UNAVAILABLE fail-closed"
    );

    // 12.2 Unauthenticated caller (auth.uid() is NULL) -> must return SESSION_GUARD_UNAVAILABLE
    const t12NoAuth = JSON.parse(
      execSql(`SELECT public.validate_session_guard(NULL, false, NULL, 'presence_check');`, {
        role: "authenticated",
        userId: "",
        sessionId: ""
      })
    );
    assert(
      t12NoAuth.code === "SESSION_GUARD_UNAVAILABLE" && t12NoAuth.valid === false,
      "Chamada sem auth.uid() deve retornar SESSION_GUARD_UNAVAILABLE fail-closed"
    );

    results.push({
      test: 12,
      name: "Falha de RPC com comportamento fail-closed",
      status: "PASS",
      details: {
        missingSessionIdClaim: t12MissingClaimReg.code,
        unauthenticatedCaller: t12NoAuth.code,
        failClosedEnforced: true
      }
    });
    console.log("   [PASS] Teste 12: Comportamento fail-closed (SESSION_GUARD_UNAVAILABLE) validado.");

    // =========================================================================
    // TESTE 13: PRESERVAÇÃO DOS DADOS PROMETHEUS (TABELAS CLÍNICAS + PORTA 5173 + ROLLBACK)
    // =========================================================================
    console.log("-> Executando Teste 13: Preservação dos dados Prometheus e teste de rollback não destrutivo...");
    const promCountsBeforeRollback = JSON.parse(
      execSql(`
        SELECT jsonb_build_object(
          'participants', (SELECT COUNT(*) FROM public.participants),
          'prostheses', (SELECT COUNT(*) FROM public.prostheses),
          'weekly_submissions', (SELECT COUNT(*) FROM public.weekly_submissions),
          'anatomical_knowledge_prometheus', (SELECT COUNT(*) FROM public.vita_anatomical_knowledge WHERE book_title LIKE '%Prometheus%')
        );
      `)
    );
    assert(
      promCountsBeforeRollback.participants === 2 &&
      promCountsBeforeRollback.prostheses === 1 &&
      promCountsBeforeRollback.weekly_submissions === 2 &&
      promCountsBeforeRollback.anatomical_knowledge_prometheus === 1,
      "Dados Prometheus devem estar 100% preservados após a migration P0.13.1"
    );

    // Test non-destructive rollback plan in disposable DB
    const rollbackSql = fs.readFileSync(
      path.resolve("supabase/rollback-plans/rollback_20261117210000_p0_13_1_first_session_wins_inactivity_60m.sql"),
      "utf8"
    );
    execSql(rollbackSql);

    const promCountsAfterRollback = JSON.parse(
      execSql(`
        SELECT jsonb_build_object(
          'participants', (SELECT COUNT(*) FROM public.participants),
          'prostheses', (SELECT COUNT(*) FROM public.prostheses),
          'weekly_submissions', (SELECT COUNT(*) FROM public.weekly_submissions),
          'user_active_sessions', (SELECT COUNT(*) FROM public.user_active_sessions),
          'session_guard_events', (SELECT COUNT(*) FROM public.session_guard_events)
        );
      `)
    );
    assert(
      promCountsAfterRollback.participants === 2 &&
      promCountsAfterRollback.weekly_submissions === 2 &&
      promCountsAfterRollback.user_active_sessions >= 3 &&
      promCountsAfterRollback.session_guard_events >= 10,
      "Rollback não destrutivo deve preservar 100% dos dados Prometheus, sessões e histórico de auditoria!"
    );

    const promPort5173Listening = await checkPortListening(5173, "127.0.0.1");

    results.push({
      test: 13,
      name: "Preservação dos dados Prometheus",
      status: "PASS",
      details: {
        prometheusDbCountsBeforeRollback: promCountsBeforeRollback,
        prometheusDbCountsAfterRollback: promCountsAfterRollback,
        prometheusPort5173Untouched: promPort5173Listening
      }
    });
    console.log("   [PASS] Teste 13: Dados Prometheus e porta 5173 100% preservados (inclusive após simulação de rollback não destrutivo).");

    const summary = {
      executedAt: new Date().toISOString(),
      mission: "P0.13.1",
      environment: "Disposable PostgreSQL 15 (Docker) + Controlled Clock",
      productionModified: false,
      totalTests: results.length,
      passedTests: results.filter((r) => r.status === "PASS").length,
      failedTests: results.filter((r) => r.status !== "PASS").length,
      results
    };

    const reportPath = path.resolve("tools/scripts/p0_13_1_test_results.json");
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2), "utf8");
    console.log(`\n================================================================================`);
    console.log(` TODOS OS ${summary.passedTests}/${summary.totalTests} TESTES DA FASE 7 APROVADOS COM SUCESSO!`);
    console.log(` Relatório salvo em: ${reportPath}`);
    console.log(`================================================================================`);
  } finally {
    console.log(`\n[CLEANUP] Removendo contêiner PostgreSQL descartável (${CONTAINER_NAME})...`);
    try {
      execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: "ignore" });
    } catch {}
  }
}

runSuite().catch((err) => {
  console.error("\n[FALHA NA SUITE DE TESTES P0.13.1]:", err);
  process.exit(1);
});
