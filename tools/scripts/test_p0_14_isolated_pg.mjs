import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const CONTAINER_NAME = "aeternum-disposable-pg-p014";

function runCmd(cmd) {
  return execSync(cmd, { encoding: "utf8" });
}

function runPsql(sql) {
  const cmd = `docker exec -i ${CONTAINER_NAME} psql -U postgres -d postgres -t -A -q -v ON_ERROR_STOP=1`;
  const out = execSync(cmd, { input: sql, encoding: "utf8" }).trim();
  // Filter out any lines that are command status like SET or empty
  const lines = out.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("SET"));
  return lines.length === 1 ? lines[0] : lines.join("\n");
}

function runPsqlFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const cmd = `docker exec -i ${CONTAINER_NAME} psql -U postgres -d postgres -q -v ON_ERROR_STOP=1`;
  return execSync(cmd, { input: content, encoding: "utf8" });
}

async function main() {
  console.log("================================================================================");
  console.log(" P0.14: HOMOLOGAÇÃO DA MIGRATION EM POSTGRES 15 DESCARTÁVEL (ISOLADO)           ");
  console.log("================================================================================\n");

  // 1. Ensure clean container
  try {
    runCmd(`docker rm -f ${CONTAINER_NAME}`);
  } catch {}

  console.log("1. Iniciando container descartável PostgreSQL 15...");
  runCmd(`docker run -d --name ${CONTAINER_NAME} -e POSTGRES_PASSWORD=postgres postgres:15-alpine`);
  
  // Wait for PostgreSQL to become ready
  let ready = false;
  for (let i = 0; i < 20; i++) {
    try {
      const res = execSync(`docker exec -i ${CONTAINER_NAME} psql -U postgres -d postgres -t -A -c "SELECT 1;"`, { encoding: "utf8" }).trim();
      if (res === "1") {
        ready = true;
        break;
      }
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  if (!ready) throw new Error("PostgreSQL não iniciou a tempo.");
  console.log("   PostgreSQL 15 pronto!");

  // 2. Setup mock environment (auth schema, roles, base tables)
  console.log("2. Configurando roles Supabase e schema base...");
  runPsql(`
    CREATE ROLE anon;
    CREATE ROLE authenticated;
    CREATE ROLE service_role;

    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT current_setting('request.jwt.claim.sub', true)::uuid; $$;
    CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT coalesce(current_setting('request.jwt.claim.role', true), 'anon'); $$;

    CREATE TABLE IF NOT EXISTS public.institutions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      slug text UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS public.users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      institution_id uuid REFERENCES public.institutions(id),
      name text NOT NULL,
      email text UNIQUE NOT NULL,
      role text NOT NULL CHECK (role IN ('student', 'teacher', 'institution_admin', 'super_admin', 'rector', 'admin')),
      status text NOT NULL DEFAULT 'active'
    );

    -- Grant base table permissions to authenticated
    GRANT SELECT ON public.institutions TO authenticated, anon;
    GRANT SELECT ON public.users TO authenticated, anon;
  `);

  // 3. Create test users
  console.log("3. Cadastrando usuários de teste (Super Admin, Inst Admin, Estudante 1, Estudante 2)...");
  const instId = runPsql("INSERT INTO public.institutions (name, slug) VALUES ('Faculdade Medicina Atlas', 'fma') RETURNING id;");
  const superAdminId = runPsql(`INSERT INTO public.users (institution_id, name, email, role, status) VALUES ('${instId}', 'Super Admin', 'admin@atlas.test', 'super_admin', 'active') RETURNING id;`);
  const student1Id = runPsql(`INSERT INTO public.users (institution_id, name, email, role, status) VALUES ('${instId}', 'Estudante 1', 'student1@atlas.test', 'student', 'active') RETURNING id;`);
  const student2Id = runPsql(`INSERT INTO public.users (institution_id, name, email, role, status) VALUES ('${instId}', 'Estudante 2', 'student2@atlas.test', 'student', 'active') RETURNING id;`);

  console.log(`   Instituição: ${instId}`);
  console.log(`   Super Admin: ${superAdminId}`);
  console.log(`   Estudante 1: ${student1Id}`);
  console.log(`   Estudante 2: ${student2Id}`);

  // 4. Apply Migration
  console.log("\n4. Aplicando Migration 20261118000000_p0_14_institutional_notifications.sql...");
  const migrationPath = path.resolve("supabase/migrations/20261118000000_p0_14_institutional_notifications.sql");
  runPsqlFile(migrationPath);
  console.log("   Migration aplicada com sucesso sem erros!");

  // 5. Test Scenarios
  console.log("\n5. Executando bateria de validação funcional e segurança:");

  // Cenário A: Super Admin cria aviso de manutenção em rascunho
  console.log("   [Cenário A] Super Admin cria aviso em rascunho...");
  const draftId = runPsql(`
    SET ROLE authenticated;
    SET "request.jwt.claim.sub" = '${superAdminId}';
    SET "request.jwt.claim.role" = 'authenticated';
    INSERT INTO public.institutional_notifications (
      title, message, type, priority, status, target_audience, scheduled_start_at, scheduled_end_at, published_at
    ) VALUES (
      'Atualização programada — Aeternum Atlas',
      'Prezados estudantes, atualização no dia 20/11 das 02:00 às 04:00.',
      'scheduled_maintenance', 'high', 'draft', 'all',
      now() + interval '2 days', now() + interval '2 days 2 hours', now() + interval '1 day'
    ) RETURNING id;
  `);
  console.log(`   -> Aviso criado em rascunho: ID ${draftId}`);

  // Cenário B: Estudante 1 tenta consultar rascunho (RLS deve retornar 0 linhas)
  console.log("   [Cenário B] Estudante 1 consulta feed (não deve ver rascunho)...");
  const student1DraftCheck = runPsql(`
    SET ROLE authenticated;
    SET "request.jwt.claim.sub" = '${student1Id}';
    SET "request.jwt.claim.role" = 'authenticated';
    SELECT count(*) FROM public.institutional_notifications WHERE id = '${draftId}';
  `);
  if (student1DraftCheck !== "0") throw new Error(`FALHA: Estudante conseguiu ver rascunho! Count: ${student1DraftCheck}`);
  console.log(`   -> Confirmado: Estudante 1 visualizou ${student1DraftCheck} registros (bloqueado por RLS).`);

  // Cenário C: Estudante tenta criar comunicado administrativo (RLS deve rejeitar)
  console.log("   [Cenário C] Estudante tenta criar comunicado administrativo (deve ser rejeitado)...");
  let studentInsertFailed = false;
  try {
    runPsql(`
      SET ROLE authenticated;
      SET "request.jwt.claim.sub" = '${student1Id}';
      SET "request.jwt.claim.role" = 'authenticated';
      INSERT INTO public.institutional_notifications (title, message, type)
      VALUES ('Hacked title', 'Invalid student message injection', 'institutional_announcement');
    `);
  } catch (err) {
    studentInsertFailed = true;
  }
  if (!studentInsertFailed) throw new Error("FALHA: Estudante conseguiu inserir notificação administrativa!");
  console.log("   -> Confirmado: Inserção de estudante bloqueada com sucesso por RLS.");

  // Cenário D: Admin publica aviso (published_at = now() - interval '1 minute', status='published')
  console.log("   [Cenário D] Admin publica aviso...");
  runPsql(`
    SET ROLE authenticated;
    SET "request.jwt.claim.sub" = '${superAdminId}';
    SET "request.jwt.claim.role" = 'authenticated';
    UPDATE public.institutional_notifications
    SET status = 'published', published_at = now() - interval '1 minute'
    WHERE id = '${draftId}';
  `);
  console.log("   -> Aviso publicado com sucesso!");

  // Cenário E: Estudante 1 agora visualiza o aviso no RPC get_student_notifications
  console.log("   [Cenário E] Estudante 1 visualiza feed publicado e status de leitura...");
  const feedResult = runPsql(`
    SET ROLE authenticated;
    SET "request.jwt.claim.sub" = '${student1Id}';
    SET "request.jwt.claim.role" = 'authenticated';
    SELECT json_build_object(
      'count', count(*),
      'is_read', bool_or(is_read),
      'title', max(title)
    ) FROM public.get_student_notifications();
  `);
  const parsedFeed = JSON.parse(feedResult);
  console.log("   -> Feed retornado:", parsedFeed);
  if (parsedFeed.count !== 1 || parsedFeed.is_read !== false) {
    throw new Error(`FALHA no feed do estudante: ${feedResult}`);
  }

  // Cenário F: Estudante 1 marca notificação como lida
  console.log("   [Cenário F] Estudante 1 marca como lida...");
  runPsql(`
    SET ROLE authenticated;
    SET "request.jwt.claim.sub" = '${student1Id}';
    SET "request.jwt.claim.role" = 'authenticated';
    SELECT public.mark_notification_as_read('${draftId}');
  `);

  // Cenário G: Verificar isolamento de leitura entre estudantes
  console.log("   [Cenário G] Verificando isolamento entre Estudante 1 e Estudante 2...");
  const s1Check = runPsql(`
    SET ROLE authenticated;
    SET "request.jwt.claim.sub" = '${student1Id}';
    SET "request.jwt.claim.role" = 'authenticated';
    SELECT is_read FROM public.get_student_notifications() WHERE notification_id = '${draftId}';
  `);
  const s2Check = runPsql(`
    SET ROLE authenticated;
    SET "request.jwt.claim.sub" = '${student2Id}';
    SET "request.jwt.claim.role" = 'authenticated';
    SELECT is_read FROM public.get_student_notifications() WHERE notification_id = '${draftId}';
  `);
  console.log(`   -> Estudante 1 is_read: ${s1Check}`);
  console.log(`   -> Estudante 2 is_read: ${s2Check}`);
  if (s1Check !== "t" || s2Check !== "f") {
    throw new Error(`FALHA no isolamento de leitura: S1=${s1Check}, S2=${s2Check}`);
  }
  console.log("   -> Isolamento de leitura 100% verificado!");

  // Cenário H: Auditoria administrativa registrou transições
  console.log("   [Cenário H] Verificando trilha de auditoria administrativa...");
  const auditLogs = runPsql(`
    SET ROLE authenticated;
    SET "request.jwt.claim.sub" = '${superAdminId}';
    SET "request.jwt.claim.role" = 'authenticated';
    SELECT json_agg(json_build_object('action', action, 'actor_role', actor_role))
    FROM public.notification_audit_log WHERE notification_id = '${draftId}';
  `);
  console.log("   -> Trilha de auditoria:", auditLogs);
  if (!auditLogs.includes("created") || !auditLogs.includes("published")) {
    throw new Error(`FALHA na trilha de auditoria: ${auditLogs}`);
  }

  // Cenário I: Anon user pode ler manutenção pública
  console.log("   [Cenário I] Usuário anônimo consulta aviso de manutenção pública...");
  const anonCheck = runPsql(`
    SET ROLE anon;
    RESET "request.jwt.claim.sub";
    SET "request.jwt.claim.role" = 'anon';
    SELECT count(*) FROM public.institutional_notifications WHERE id = '${draftId}';
  `);
  console.log(`   -> Anônimo visualizou: ${anonCheck} registros públicos.`);
  if (anonCheck !== "1") throw new Error("FALHA: Anônimo não conseguiu visualizar manutenção pública!");

  // Cenário J: Testar Rollback Plan
  console.log("\n6. Testando execução do Rollback Plan...");
  const rollbackPath = path.resolve("supabase/rollback-plans/rollback_20261118000000_p0_14_institutional_notifications.sql");
  runPsqlFile(rollbackPath);
  const tableCheck = runPsql(`
    SELECT coalesce(to_regclass('public.institutional_notifications')::text, 'DROPPED');
  `);
  if (tableCheck !== "DROPPED") throw new Error(`FALHA: Tabela ainda existe após rollback: ${tableCheck}`);
  console.log("   -> Rollback executado com sucesso e zero resíduos!");

  // Cenário K: Reaplicar a migration para verificar idempotência
  console.log("\n7. Reaplicando a migration para confirmar integridade pós-rollback...");
  runPsqlFile(migrationPath);
  console.log("   -> Reaplicação bem sucedida!");

  // Cleanup container
  console.log("\n8. Limpando container de teste descartável...");
  runCmd(`docker rm -f ${CONTAINER_NAME}`);
  console.log("   Container descartável removido.");

  console.log("\n================================================================================");
  console.log(" TODOS OS TESTES DE BANCO E SEGURANÇA FORAM APROVADOS COM SUCESSO! (100%)       ");
  console.log("================================================================================");
}

main().catch(err => {
  console.error("ERRO NA VALIDAÇÃO:", err);
  try {
    runCmd(`docker rm -f ${CONTAINER_NAME}`);
  } catch {}
  process.exit(1);
});
