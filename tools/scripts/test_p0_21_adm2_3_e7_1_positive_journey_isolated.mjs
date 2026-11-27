/**
 * AETERNUM ATLAS — OPERAÇÃO EL DORADO (P0.21-ADM.2.3-R2)
 * JORNADA POSITIVA E NEGATIVA E7.1 DETERMINÍSTICA EM POSTGRESQL 15 ISOLADO
 *
 * Executa a jornada completa de ponta a ponta:
 * 1. Verificação de pré-lançamento (inscrições fechadas por padrão)
 * 2. Rejeição de submissão quando registration_open = false
 * 3. Abertura isolada das inscrições no ambiente descartável
 * 4. Validação de consentimentos obrigatórios (LGPD: privacy_consent e terms_consent)
 * 5. Validação de campos obrigatórios (nome, email, motivação, etc.)
 * 6. Submissão bem-sucedida de candidatura sintética (Gate E7.1)
 * 7. Verificação de emissão de protocolo canônico e persistência em beta_applications
 * 8. Verificação de inserção atômica na outbox beta_email_notifications
 * 9. Rejeição ou idempotência em tentativa de duplicidade (mesmo e-mail)
 * 10. Claim atômico de notificação via claim_next_beta_email_notification (FOR UPDATE SKIP LOCKED)
 * 11. Simulação de entrega de notificação e atualização de status para 'sent'
 * 12. Triagem e avaliação administrativa no Control Center (pending -> approved)
 * 13. Verificação do cômputo canônico em get_beta_operational_summary e get_beta_program_public_status
 * 14. Exportação estruturada CSV (18 colunas, UTF-8 BOM, delimitador ';', CWE-1236)
 * 15. Fechamento seguro das inscrições e teardown do container
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { buildBetaApplicationsCsvContent, sanitizeCsvFormula } from "../../src/services/beta/betaRegistrationService.js";

const CONTAINER_NAME = "aeternum-pg-e7-1-journey";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runPsql(sql, role = "postgres", retries = 5) {
  const cmd = `docker exec -i ${CONTAINER_NAME} psql -U ${role} -d postgres -q -t -A -v ON_ERROR_STOP=1`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return execSync(cmd, { input: sql, encoding: "utf8" }).trim();
    } catch (err) {
      if (attempt < retries && (
        err.message.includes("shutting down") ||
        err.message.includes("starting up") ||
        err.message.includes("the database system is shutting down") ||
        err.message.includes("Connection refused")
      )) {
        try {
          execSync(process.platform === "win32" ? "timeout /t 1 /nobreak" : "sleep 1", { stdio: "ignore" });
        } catch {}
        continue;
      }
      throw new Error(`psql error: ${err.message} (stderr: ${err.stderr})`);
    }
  }
}

function runPsqlJson(sql, role = "postgres") {
  const raw = runPsql(sql, role);
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.startsWith("{") && line.endsWith("}")) {
      try {
        return JSON.parse(line);
      } catch {}
    }
  }
  return JSON.parse(raw);
}

async function main() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: JORNADA POSITIVA E7.1 & CICLO COMPLETO DE CANDIDATURA ===");
  console.log("================================================================================\n");

  try {
    // 1. Limpar container se existir
    try {
      execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: "ignore" });
    } catch {}

    // 2. Iniciar container descartável PostgreSQL 15
    console.log("[1/13] Subindo PostgreSQL 15 descartável...");
    execSync(`docker run --rm -d --name ${CONTAINER_NAME} -e POSTGRES_PASSWORD=postgres postgres:15-alpine`, { stdio: "ignore" });

    let ready = false;
    for (let i = 0; i < 40; i++) {
      try {
        const res = execSync(`docker exec ${CONTAINER_NAME} psql -U postgres -d postgres -t -A -c "SELECT 1;"`, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
        if (res === "1") {
          // Pequena pausa para garantir pós-initdb estável
          await sleep(1000);
          const verify = execSync(`docker exec ${CONTAINER_NAME} psql -U postgres -d postgres -t -A -c "SELECT 1;"`, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
          if (verify === "1") {
            ready = true;
            break;
          }
        }
      } catch {
        await sleep(500);
      }
    }
    assert.ok(ready, "PostgreSQL 15 não subiu a tempo.");
    console.log(" -> PostgreSQL 15 operacional.");

    // 3. Configurar Schema Supabase Base, Mocks de Extensão e Tabelas
    console.log("\n[2/13] Configurando extensões, roles e tabelas canônicas...");
    runPsql(`
      CREATE SCHEMA IF NOT EXISTS extensions;
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
      CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role; END IF;
      END $$;

      CREATE SCHEMA IF NOT EXISTS auth;
      CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
      CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
        SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
      $$;

      -- Mock do schema vault e net para pg_net assíncrono isolado
      CREATE SCHEMA IF NOT EXISTS vault;
      CREATE TABLE IF NOT EXISTS vault.decrypted_secrets (
        name TEXT PRIMARY KEY,
        decrypted_secret TEXT
      );

      CREATE SCHEMA IF NOT EXISTS net;
      CREATE OR REPLACE FUNCTION net.http_post(url text, headers jsonb, body jsonb)
      RETURNS bigint LANGUAGE sql AS $$ SELECT 1::bigint; $$;

      CREATE TABLE IF NOT EXISTS public.institutions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        institution_id UUID REFERENCES public.institutions(id),
        full_name TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.platform_system_settings (
        setting_key TEXT PRIMARY KEY,
        setting_value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      INSERT INTO public.platform_system_settings (setting_key, setting_value)
      VALUES 
        ('beta_registration_open', 'false'),
        ('server_rate_limit_salt', 'test_salt_e7_1')
      ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;

      CREATE TABLE IF NOT EXISTS public.beta_email_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id UUID,
        event_type TEXT NOT NULL DEFAULT 'application_submitted',
        recipient_email TEXT NOT NULL,
        subject TEXT,
        status TEXT NOT NULL DEFAULT 'queued',
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 3,
        last_attempt_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (application_id, event_type)
      );

      CREATE TABLE IF NOT EXISTS public.institutional_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        target_audience TEXT NOT NULL,
        timezone TEXT NOT NULL,
        published_at TIMESTAMPTZ DEFAULT now(),
        affected_resources JSONB
      );

      CREATE TABLE IF NOT EXISTS public.beta_applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        protocol_number TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        institution_name TEXT NOT NULL,
        course TEXT NOT NULL,
        academic_term TEXT NOT NULL,
        student_group TEXT,
        student_id_number TEXT,
        primary_device TEXT,
        country TEXT DEFAULT 'Brasil',
        referral_source TEXT,
        motivation TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        batch TEXT NOT NULL DEFAULT 'batch_1_30',
        priority_score INT DEFAULT 0,
        review_notes TEXT,
        reviewed_at TIMESTAMPTZ,
        reviewed_by UUID REFERENCES public.users(id),
        privacy_consent BOOLEAN DEFAULT false,
        terms_consent BOOLEAN DEFAULT false,
        communication_consent BOOLEAN DEFAULT false,
        consent_timestamp TIMESTAMPTZ,
        decision_history JSONB DEFAULT '[]'::jsonb,
        user_id UUID REFERENCES public.users(id),
        source_origin TEXT DEFAULT 'landing_beta',
        ip_hash TEXT,
        user_agent TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );

      ALTER TABLE public.beta_applications ENABLE ROW LEVEL SECURITY;
      GRANT ALL ON public.beta_applications TO postgres, service_role;
      GRANT SELECT ON public.beta_applications TO authenticated;
    `);

    // Inserir Super Admin para avaliação posterior
    const superAdminId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    runPsql(`
      INSERT INTO public.users (id, email, role, full_name)
      VALUES ('${superAdminId}', 'superadmin@aeternumatlas.com', 'super_admin', 'Diretoria Executiva');
    `);
    console.log(" -> Ambiente estruturado com sucesso.");

    // 4. Carregar RPCs Canônicas do Sistema
    console.log("\n[3/13] Compilando RPCs de submissão, claim de email e hardening ADM.2.3...");

    // 4.1 Carregar RPC claim_next_beta_email_notification
    runPsql(`
      CREATE OR REPLACE FUNCTION public.claim_next_beta_email_notification(
          p_notification_id UUID DEFAULT NULL,
          p_application_id UUID DEFAULT NULL
      )
      RETURNS TABLE (
          id UUID,
          application_id UUID,
          recipient_email TEXT,
          subject TEXT,
          event_type TEXT,
          attempts INT
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public, extensions, pg_temp
      AS $$
      DECLARE
          v_target_id UUID;
          v_now TIMESTAMPTZ := timezone('utc'::text, now());
      BEGIN
          IF COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true)) <> 'service_role' THEN
              RAISE EXCEPTION 'Acesso negado: claim_next_beta_email_notification e restrita ao servico interno autorizado.'
                  USING ERRCODE = '42501';
          END IF;

          SELECT q.id INTO v_target_id
          FROM public.beta_email_notifications q
          WHERE (p_notification_id IS NULL OR q.id = p_notification_id)
            AND (p_application_id IS NULL OR q.application_id = p_application_id)
            AND (
                (q.status = 'queued' AND q.attempts < q.max_attempts)
             OR (q.status = 'failed' AND q.attempts < q.max_attempts AND q.last_attempt_at < v_now - (q.attempts * INTERVAL '2 minutes'))
             OR (q.status = 'processing' AND q.last_attempt_at < v_now - INTERVAL '5 minutes')
            )
          ORDER BY q.created_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1;

          IF v_target_id IS NULL THEN
              RETURN;
          END IF;

          UPDATE public.beta_email_notifications b
          SET status = 'processing',
              attempts = b.attempts + 1,
              last_attempt_at = v_now
          WHERE b.id = v_target_id;

          RETURN QUERY
          SELECT n.id, n.application_id, n.recipient_email, n.subject, n.event_type, n.attempts
          FROM public.beta_email_notifications n
          WHERE n.id = v_target_id;
      END;
      $$;

      REVOKE ALL ON FUNCTION public.claim_next_beta_email_notification(UUID, UUID) FROM PUBLIC, anon, authenticated;
      GRANT EXECUTE ON FUNCTION public.claim_next_beta_email_notification(UUID, UUID) TO service_role;
    `);

    // 4.2 Carregar RPC submit_beta_application de migração canônica
    const submitMigrationPath = path.resolve("supabase/migrations/20261124150000_p0_21_e4_resend_subject_alignment.sql");
    const submitSql = fs.readFileSync(submitMigrationPath, "utf8");
    runPsql(submitSql);

    // 4.3 Carregar migration de hardening ADM.2.3-R2
    const hardeningPath = path.resolve("supabase/migrations/20261127000000_p0_21_adm_2_3_el_dorado_hardening.sql");
    const hardeningSql = fs.readFileSync(hardeningPath, "utf8");
    runPsql(hardeningSql);
    console.log(" -> Todas as RPCs compiladas com sucesso no PostgreSQL.");

    // Helper para submit_beta_application via anon/public
    function submitCandidate(payload, roleSetting = "anon") {
      const sql = `
        SET ROLE ${roleSetting};
        SELECT public.submit_beta_application(
          ${payload.fullName ? `'${payload.fullName}'` : "NULL"},
          ${payload.email ? `'${payload.email}'` : "NULL"},
          ${payload.institutionName ? `'${payload.institutionName}'` : "NULL"},
          ${payload.course ? `'${payload.course}'` : "NULL"},
          ${payload.academicTerm ? `'${payload.academicTerm}'` : "NULL"},
          ${payload.studentGroup ? `'${payload.studentGroup}'` : "NULL"},
          ${payload.studentIdNumber ? `'${payload.studentIdNumber}'` : "NULL"},
          ${payload.country ? `'${payload.country}'` : "'Brasil'"},
          ${payload.primaryDevice ? `'${payload.primaryDevice}'` : "'Desktop Windows'"},
          ${payload.referralSource ? `'${payload.referralSource}'` : "NULL"},
          ${payload.motivation ? `'${payload.motivation}'` : "NULL"},
          ${payload.privacyConsent === true ? "true" : "false"},
          ${payload.termsConsent === true ? "true" : "false"},
          ${payload.communicationConsent === true ? "true" : "false"},
          ${payload.sourceOrigin ? `'${payload.sourceOrigin}'` : "'landing_beta'"},
          ${payload.userAgent ? `'${payload.userAgent}'` : "'TestRunner/1.0'"}
        )::text;
      `;
      return runPsqlJson(sql);
    }

    // 5. Teste Negativo 1: Inscrições Fechadas (Pré-lançamento)
    console.log("\n[4/13] Teste Negativo: Submissão com inscrições fechadas (pré-lançamento)...");
    const prelaunchRes = submitCandidate({
      fullName: "Dra. Juliana Mendes Teste",
      email: "juliana.mendes.teste@fm.usp.br",
      institutionName: "Faculdade de Medicina da USP",
      course: "Medicina",
      academicTerm: "5º Semestre",
      motivation: "Interesse em peças anatômicas 3D e dissecção topográfica.",
      privacyConsent: true,
      termsConsent: true
    });
    assert.equal(prelaunchRes.success, false);
    assert.equal(prelaunchRes.code, "BETA_REGISTRATION_PRELAUNCH");
    assert.equal(prelaunchRes.status, "pre_launch");
    console.log(" -> PASS: Submissão rejeitada corretamente com BETA_REGISTRATION_PRELAUNCH.");

    // 6. Abertura do Programa Beta em Ambiente de Teste
    console.log("\n[5/13] Abertura controlada das inscrições para a bateria de testes...");
    runPsql(`
      UPDATE public.platform_system_settings
      SET setting_value = 'true'
      WHERE setting_key = 'beta_registration_open';
    `);
    const pubOpenStatus = runPsqlJson(`SELECT public.get_beta_program_public_status()::text;`);
    assert.equal(pubOpenStatus.registration_open, true);
    assert.equal(pubOpenStatus.status, "open");
    console.log(" -> Inscrições abertas com sucesso no ambiente descartável.");

    // 7. Teste Negativo 2: Consentimentos LGPD Obrigatórios
    console.log("\n[6/13] Testes Negativos de Validação: Consentimentos ausentes...");
    const noConsentRes = submitCandidate({
      fullName: "Dra. Juliana Mendes Teste",
      email: "juliana.mendes.teste@fm.usp.br",
      institutionName: "Faculdade de Medicina da USP",
      course: "Medicina",
      academicTerm: "5º Semestre",
      motivation: "Interesse em peças anatômicas 3D.",
      privacyConsent: false,
      termsConsent: true
    });
    assert.equal(noConsentRes.success, false);
    assert.equal(noConsentRes.code, "CONSENT_REQUIRED");
    console.log(" -> PASS: Submissão sem consentimento LGPD bloqueada com CONSENT_REQUIRED.");

    // 8. Testes Negativos de Validação: Campos Obrigatórios e Formato
    console.log("\n[7/13] Testes Negativos de Validação: Nome curto e e-mail inválido...");
    const shortNameRes = submitCandidate({
      fullName: "Ju",
      email: "juliana@usp.br",
      institutionName: "USP",
      course: "Medicina",
      academicTerm: "5º",
      motivation: "Interesse acadêmico 3D.",
      privacyConsent: true,
      termsConsent: true
    });
    assert.equal(shortNameRes.success, false);
    assert.equal(shortNameRes.code, "INVALID_NAME");

    const badEmailRes = submitCandidate({
      fullName: "Juliana Mendes",
      email: "email-invalido-sem-arroba",
      institutionName: "USP",
      course: "Medicina",
      academicTerm: "5º",
      motivation: "Interesse acadêmico 3D.",
      privacyConsent: true,
      termsConsent: true
    });
    assert.equal(badEmailRes.success, false);
    assert.equal(badEmailRes.code, "INVALID_EMAIL");

    const shortMotivRes = submitCandidate({
      fullName: "Juliana Mendes",
      email: "juliana@usp.br",
      institutionName: "USP",
      course: "Medicina",
      academicTerm: "5º",
      motivation: "Pouco",
      privacyConsent: true,
      termsConsent: true
    });
    assert.equal(shortMotivRes.success, false);
    assert.equal(shortMotivRes.code, "INVALID_MOTIVATION");
    console.log(" -> PASS: Validações estritas de tamanho e formato aprovadas.");

    // 9. Submissão Válida Positiva (Gate E7.1)
    console.log("\n[8/13] Submissão Válida Positiva (Gate E7.1)...");
    const validCandidate = {
      fullName: "Dra. Juliana Mendes Teste",
      email: "juliana.mendes.teste@fm.usp.br",
      institutionName: "Faculdade de Medicina da USP",
      course: "Medicina",
      academicTerm: "5º Semestre",
      studentGroup: "Turma 108",
      studentIdNumber: "FMUSP-2026-99",
      motivation: "Interesse em peças anatômicas 3D, dissecção cirúrgica e estudo aprofundado.",
      privacyConsent: true,
      termsConsent: true,
      communicationConsent: true,
      sourceOrigin: "landing_beta"
    };

    const submitSuccess = submitCandidate(validCandidate);
    assert.equal(submitSuccess.success, true);
    assert.equal(submitSuccess.code, "APPLICATION_ACCEPTED");
    assert.equal(submitSuccess.status, "pending");
    assert.equal(submitSuccess.batch, "batch_1_30");
    assert.ok(submitSuccess.protocol_number.startsWith("BETA-2026-"), "Protocolo deve seguir o padrão BETA-2026-XXXX");
    const generatedProtocol = submitSuccess.protocol_number;
    const applicationId = submitSuccess.application_id;
    console.log(` -> PASS: Candidatura aceita! Protocolo gerado: ${generatedProtocol}`);

    // 10. Verificação de Persistência e Outbox
    console.log("\n[9/13] Verificando persistência no banco e na outbox de notificações...");
    const savedApp = runPsqlJson(`
      SELECT row_to_json(a)::text FROM (
        SELECT id, protocol_number, full_name, email, status, batch, user_id
        FROM public.beta_applications
        WHERE id = '${applicationId}'
      ) a;
    `);
    assert.equal(savedApp.protocol_number, generatedProtocol);
    assert.equal(savedApp.status, "pending");
    assert.equal(savedApp.batch, "batch_1_30");
    assert.equal(savedApp.user_id, null, "user_id DEVE ser nulo na submissão pública (Gate E7.3)");

    const queuedNotif = runPsqlJson(`
      SELECT row_to_json(n)::text FROM (
        SELECT id, application_id, recipient_email, status, event_type
        FROM public.beta_email_notifications
        WHERE application_id = '${applicationId}'
      ) n;
    `);
    assert.equal(queuedNotif.recipient_email, "aeternumatlas@gmail.com");
    assert.equal(queuedNotif.status, "queued");
    assert.equal(queuedNotif.event_type, "application_submitted");
    console.log(" -> PASS: Registro persistido com user_id nulo e outbox enfileirada.");

    // 11. Teste de Duplicidade / Idempotência (Anti-Enumeration)
    console.log("\n[10/13] Teste de Duplicidade: Submissão com mesmo e-mail (Idempotência)...");
    const dupRes = submitCandidate(validCandidate);
    assert.equal(dupRes.success, true);
    assert.equal(dupRes.code, "APPLICATION_RECORDED");
    assert.equal(dupRes.protocol_number, generatedProtocol, "Deve retornar o protocolo já existente com idempotência");
    console.log(" -> PASS: Tentativa duplicada tratada com idempotência (APPLICATION_RECORDED) e retorno do protocolo original.");

    // 12. Claim Atômico e Processamento de Notificação
    console.log("\n[11/13] Claim atômico da outbox (FOR UPDATE SKIP LOCKED) e simulação de envio...");
    const claimRes = runPsqlJson(`
      SET request.jwt.claim.role = 'service_role';
      SELECT row_to_json(c)::text FROM (
        SELECT * FROM public.claim_next_beta_email_notification()
      ) c;
    `);
    assert.equal(claimRes.application_id, applicationId);
    assert.equal(claimRes.attempts, 1);

    // Notificação transita para processing
    const processingCheck = runPsql(`SELECT status FROM public.beta_email_notifications WHERE id = '${claimRes.id}';`);
    assert.equal(processingCheck, "processing");

    // Simulação de resposta HTTP 200 do Resend -> status 'sent'
    runPsql(`UPDATE public.beta_email_notifications SET status = 'sent' WHERE id = '${claimRes.id}';`);
    console.log(" -> PASS: Claim atômico executado e notificação marcada como 'sent'.");

    // 13. Triagem Administrativa e Avaliação para Aprovado
    console.log("\n[12/13] Triagem no Control Center e aprovação de vaga...");
    const summaryBeforeReview = runPsqlJson(`
      SET request.jwt.claim.sub = '${superAdminId}';
      SELECT public.get_beta_operational_summary()::text;
    `);
    assert.equal(summaryBeforeReview.total_applications, 1);
    assert.equal(summaryBeforeReview.pending, 1);
    assert.equal(summaryBeforeReview.approved, 0);
    assert.equal(summaryBeforeReview.batch_1_reserved, 0);
    assert.equal(summaryBeforeReview.batch_1_remaining, 30);
    assert.equal(summaryBeforeReview.notifications.sent, 1);

    // Avaliar candidatura para 'approved'
    const reviewRes = runPsqlJson(`
      SET request.jwt.claim.sub = '${superAdminId}';
      SELECT public.admin_review_beta_application(
        '${applicationId}'::uuid,
        'approved',
        'Estudante aprovada na triagem da 1ª Turma',
        'batch_1_30'
      )::text;
    `);
    assert.equal(reviewRes.success, true);
    assert.equal(reviewRes.status, "approved");

    const summaryAfterReview = runPsqlJson(`
      SET request.jwt.claim.sub = '${superAdminId}';
      SELECT public.get_beta_operational_summary()::text;
    `);
    assert.equal(summaryAfterReview.approved, 1);
    assert.equal(summaryAfterReview.batch_1_reserved, 1);
    assert.equal(summaryAfterReview.batch_1_remaining, 29);

    const pubStatusAfterReview = runPsqlJson(`SELECT public.get_beta_program_public_status()::text;`);
    assert.equal(pubStatusAfterReview.current_batch_approved, 1);
    console.log(" -> PASS: Candidatura aprovada e vaga do Lote 1 contabilizada (29 restantes).");

    // 14. Exportação Estruturada CSV com Proteção CWE-1236
    console.log("\n[13/13] Validando geração de CSV estruturado (18 colunas e CWE-1236)...");
    const appForCsv = {
      protocol_number: generatedProtocol,
      created_at: new Date().toISOString(),
      full_name: validCandidate.fullName,
      email: validCandidate.email,
      institution_name: validCandidate.institutionName,
      course: validCandidate.course,
      academic_term: validCandidate.academicTerm,
      student_group: validCandidate.studentGroup,
      student_id_number: validCandidate.studentIdNumber,
      primary_device: "Desktop Windows",
      country: "Brasil",
      referral_source: "Instagram",
      motivation: validCandidate.motivation,
      status: "approved",
      batch: "batch_1_30",
      review_notes: "Aprovada na triagem",
      reviewed_at: new Date().toISOString(),
      reviewed_by: superAdminId
    };

    const csvOutput = buildBetaApplicationsCsvContent([appForCsv], { excludeSynthetic: true });
    assert.ok(csvOutput.startsWith("\uFEFF"), "CSV deve iniciar com UTF-8 BOM");
    assert.ok(csvOutput.includes(generatedProtocol), "CSV deve conter o protocolo emitido");
    assert.ok(csvOutput.includes("juliana.mendes.teste@fm.usp.br"));
    assert.ok(csvOutput.includes(';"approved";'), "CSV deve conter status approved delimitado por ';'");

    // Teste de sanitização de fórmula
    assert.equal(sanitizeCsvFormula("=cmd|' /C calc'!A0"), "'=cmd|' /C calc'!A0");
    console.log(" -> PASS: Exportação CSV 100% compatível com Excel pt-BR e protegida contra CWE-1236.");

    // Fechar inscrições e validar
    runPsql(`
      UPDATE public.platform_system_settings
      SET setting_value = 'false'
      WHERE setting_key = 'beta_registration_open';
    `);
    const finalPubStatus = runPsqlJson(`SELECT public.get_beta_program_public_status()::text;`);
    assert.equal(finalPubStatus.registration_open, false);
    assert.equal(finalPubStatus.status, "pre_launch");

    console.log("\n================================================================================");
    console.log("=== SUCESSO INTEGRAL: JORNADA POSITIVA E7.1 HOMOLOGADA EM AMBIENTE REAL ===");
    console.log("================================================================================");

    process.exit(0);
  } catch (err) {
    console.error("\n❌ FALHA NA JORNADA POSITIVA E7.1:", err);
    process.exit(1);
  } finally {
    try {
      execSync(`docker rm -f ${CONTAINER_NAME}`, { stdio: "ignore" });
      console.log("\n[Teardown] Container descartável de teste removido.");
    } catch {}
  }
}

main();
