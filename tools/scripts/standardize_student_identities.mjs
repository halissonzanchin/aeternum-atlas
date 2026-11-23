// Script Oficial de Padronização Definitiva das Cinco Contas Estudantis (P0.20-S.1)
// Alvo: Supabase hyivyrietgjdazgizafp
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
  throw new Error("VIOLAÇÃO DE SEGURANÇA: NODE_TLS_REJECT_UNAUTHORIZED=0 é expressamente proibido no Aeternum Atlas.");
}

import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { runSupabaseSql, getServiceRoleKey } from "./supabase_admin_helper.mjs";

const SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";
const INSTITUTION_ID = "11111111-1111-1111-1111-111111111111";

const EXPECTED_STUDENTS = [
  {
    email: "halissonzanchin@aeternumatlas.com",
    name: "Halisson Ricardo Zanchin Caceres",
    expectedUuid: "a3911a5c-a3d0-4318-9d45-f6be6ac38fb4"
  },
  {
    email: "henriquebahia@aeternumatlas.com",
    name: "Victor Henrique Souza dos Santos",
    expectedUuid: "a0168021-b8a2-4c35-8eab-c80240c10e07"
  },
  {
    email: "lucasparedes@aeternumatlas.com",
    name: "Lucas Alcides Paredes Gonzalez",
    expectedUuid: "e9931f64-4de9-46fc-9e56-6705345406cb"
  },
  {
    email: "nicolasfigorelli@aeternumatlas.com",
    name: "Nicolas Figorelli Miranda Santos",
    expectedUuid: "f2591fae-8c18-4eb7-a97d-ae5ae90c5b34"
  },
  {
    email: "edgartorales@aeternumatlas.com",
    name: "Edgar Osvaldo Torales Acosta",
    expectedUuid: null // A ser provisionado
  }
];

async function main() {
  console.log("================================================================================");
  console.log("=== AETERNUM ATLAS: PADRONIZAÇÃO DEFINITIVA DAS CONTAS ESTUDANTIS (P0.20-S.1) ===");
  console.log("================================================================================\n");

  const serviceRoleKey = await getServiceRoleKey();
  if (!serviceRoleKey) {
    throw new Error("Não foi possível recuperar a chave service_role da Supabase Management API.");
  }

  const adminClient = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  console.log("[Etapa 1] Auditoria Inicial do Estado Atual...");
  const initialDbUsers = await runSupabaseSql(`
    SELECT u.id, u.email, u.name, u.role, u.status, u.institution_id, u.license_tier, u.session_guard_enabled,
           au.raw_user_meta_data, au.raw_app_meta_data
    FROM public.users u
    LEFT JOIN auth.users au ON au.id = u.id
    WHERE u.email IN (${EXPECTED_STUDENTS.map(s => `'${s.email}'`).join(", ")})
    ORDER BY u.email;
  `);

  console.log(`Contas encontradas em public.users: ${initialDbUsers.length} de 5.`);
  for (const u of initialDbUsers) {
    console.log(` - ${u.email}: ID=${u.id} | public.name="${u.name}" | auth.name="${u.raw_user_meta_data?.name}"`);
  }

  console.log("\n[Etapa 2] Normalização de Identidades dos 4 Estudantes Existentes...");
  for (const student of EXPECTED_STUDENTS.slice(0, 4)) {
    console.log(`\nProcessando: ${student.email}...`);
    const dbRow = initialDbUsers.find(u => u.email === student.email);
    if (!dbRow) {
      throw new Error(`Estudante esperado não encontrado em public.users: ${student.email}`);
    }

    if (student.expectedUuid && dbRow.id !== student.expectedUuid) {
      throw new Error(`VIOLAÇÃO CRÍTICA DE INTEGRIDADE: UUID divergente para ${student.email} (Esperado: ${student.expectedUuid}, Atual: ${dbRow.id})`);
    }

    // 2.1 Garantir public.users.name exatamente normalizado
    if (dbRow.name !== student.name || dbRow.institution_id !== INSTITUTION_ID || dbRow.role !== "student" || dbRow.status !== "active" || dbRow.license_tier !== "student" || dbRow.session_guard_enabled !== true) {
      console.log(`  -> Atualizando public.users para ${student.name}...`);
      await runSupabaseSql(`
        UPDATE public.users
        SET name = '${student.name.replace(/'/g, "''")}',
            institution_id = '${INSTITUTION_ID}'::uuid,
            role = 'student',
            status = 'active',
            license_tier = 'student',
            session_guard_enabled = true
        WHERE id = '${dbRow.id}'::uuid;
      `);
      console.log(`  -> public.users atualizado.`);
    } else {
      console.log(`  -> public.users já alinhado com o padrão oficial.`);
    }

    // 2.2 Atualizar auth.users via Supabase Auth Admin API (SEM SQL direto)
    const existingMetadata = dbRow.raw_user_meta_data || {};
    const updatedMetadata = {
      ...existingMetadata,
      name: student.name,
      full_name: student.name,
      institution_id: INSTITUTION_ID,
      role: "student",
      email: student.email,
      email_verified: true
    };

    console.log(`  -> Sincronizando auth.users.raw_user_meta_data via Admin API...`);
    const { data: updatedAuthUser, error: updateAuthErr } = await adminClient.auth.admin.updateUserById(dbRow.id, {
      user_metadata: updatedMetadata
    });

    if (updateAuthErr) {
      throw new Error(`Falha ao atualizar metadados de ${student.email} via Admin API: ${updateAuthErr.message}`);
    }
    console.log(`  -> auth.users sincronizado com sucesso (name: "${updatedAuthUser.user.user_metadata.name}").`);
  }

  console.log("\n[Etapa 3] Verificação e Provisionamento de Edgar Osvaldo Torales Acosta...");
  const edgarExistingAuth = await runSupabaseSql(`
    SELECT id, email, raw_user_meta_data, raw_app_meta_data
    FROM auth.users
    WHERE email = 'edgartorales@aeternumatlas.com';
  `);

  const edgarExistingPublic = await runSupabaseSql(`
    SELECT id, email, name, role, status
    FROM public.users
    WHERE email = 'edgartorales@aeternumatlas.com';
  `);

  let edgarUserId = null;

  if (edgarExistingAuth.length > 0) {
    edgarUserId = edgarExistingAuth[0].id;
    console.log(`  -> Conta de Edgar já presente em auth.users (ID: ${edgarUserId}).`);
    // Sincronizar metadados
    await adminClient.auth.admin.updateUserById(edgarUserId, {
      user_metadata: {
        name: "Edgar Osvaldo Torales Acosta",
        full_name: "Edgar Osvaldo Torales Acosta",
        role: "student",
        institution_id: INSTITUTION_ID,
        email: "edgartorales@aeternumatlas.com",
        email_verified: true
      }
    });
  } else {
    console.log(`  -> Conta de Edgar ausente. Criando via Supabase Auth Admin API...`);
    // Gerar credencial forte temporária estritamente em memória
    const tempInitialPassword = crypto.randomBytes(32).toString("base64url") + "!E8z";

    const { data: newAuthUser, error: createErr } = await adminClient.auth.admin.createUser({
      email: "edgartorales@aeternumatlas.com",
      password: tempInitialPassword,
      email_confirm: true,
      user_metadata: {
        name: "Edgar Osvaldo Torales Acosta",
        full_name: "Edgar Osvaldo Torales Acosta",
        role: "student",
        institution_id: INSTITUTION_ID,
        email: "edgartorales@aeternumatlas.com",
        email_verified: true
      },
      app_metadata: {
        provider: "email",
        providers: ["email"]
      }
    });

    if (createErr || !newAuthUser?.user?.id) {
      throw new Error(`Falha ao criar usuário Edgar Torales no Auth: ${createErr?.message}`);
    }

    edgarUserId = newAuthUser.user.id;
    console.log(`  -> Usuário criado com sucesso no Auth com ID: ${edgarUserId}.`);
  }

  // Garantir registro correspondente em public.users
  if (edgarExistingPublic.length > 0) {
    console.log(`  -> Atualizando registro em public.users para Edgar...`);
    await runSupabaseSql(`
      UPDATE public.users
      SET name = 'Edgar Osvaldo Torales Acosta',
          institution_id = '${INSTITUTION_ID}'::uuid,
          role = 'student',
          status = 'active',
          license_tier = 'student',
          session_guard_enabled = true
      WHERE id = '${edgarUserId}'::uuid;
    `);
  } else {
    console.log(`  -> Inserindo registro em public.users para Edgar...`);
    await runSupabaseSql(`
      INSERT INTO public.users (id, name, email, role, status, institution_id, license_tier, session_guard_enabled)
      VALUES (
        '${edgarUserId}'::uuid,
        'Edgar Osvaldo Torales Acosta',
        'edgartorales@aeternumatlas.com',
        'student',
        'active',
        '${INSTITUTION_ID}'::uuid,
        'student',
        true
      );
    `);
  }
  console.log(`  -> public.users sincronizado para Edgar Osvaldo Torales Acosta.`);

  console.log("\n[Etapa 4] Auditoria Final de Integridade das Cinco Contas...");
  const finalDbUsers = await runSupabaseSql(`
    SELECT u.id, u.email, u.name, u.role, u.status, u.institution_id, u.license_tier, u.session_guard_enabled,
           au.raw_user_meta_data, au.raw_app_meta_data
    FROM public.users u
    LEFT JOIN auth.users au ON au.id = u.id
    WHERE u.email IN (${EXPECTED_STUDENTS.map(s => `'${s.email}'`).join(", ")})
    ORDER BY u.email;
  `);

  console.log(`\nTotal de contas homologadas: ${finalDbUsers.length} de 5.`);
  let allAligned = true;

  for (const expected of EXPECTED_STUDENTS) {
    const user = finalDbUsers.find(u => u.email === expected.email);
    if (!user) {
      console.error(`[FALHA] Conta não encontrada: ${expected.email}`);
      allAligned = false;
      continue;
    }

    const nameMatches = user.name === expected.name && user.raw_user_meta_data?.name === expected.name;
    const instMatches = user.institution_id === INSTITUTION_ID && user.raw_user_meta_data?.institution_id === INSTITUTION_ID;
    const roleMatches = user.role === "student" && user.raw_user_meta_data?.role === "student";
    const tierMatches = user.license_tier === "student";
    const statusMatches = user.status === "active";
    const sessionGuardMatches = user.session_guard_enabled === true;
    const voiceBlocked = !user.raw_app_meta_data?.voice_enabled && !user.raw_app_meta_data?.is_voice_pilot;

    const userOk = nameMatches && instMatches && roleMatches && tierMatches && statusMatches && sessionGuardMatches && voiceBlocked;
    if (!userOk) allAligned = false;

    console.log(`\nEstudante: ${user.name} (${user.email})`);
    console.log(`  UUID: ${user.id} ${expected.expectedUuid ? (user.id === expected.expectedUuid ? "(PRESERVADO)" : "(ALTERADO - ERRO)") : "(NOVO PROVISIONADO)"}`);
    console.log(`  Nome Sincronizado: ${nameMatches ? "SIM (PASS)" : "FALHA"}`);
    console.log(`  Instituição Oficial: ${instMatches ? "SIM (PASS)" : "FALHA"}`);
    console.log(`  Papel (student): ${roleMatches ? "SIM (PASS)" : "FALHA"}`);
    console.log(`  Licença (student): ${tierMatches ? "SIM (PASS)" : "FALHA"}`);
    console.log(`  Status (active): ${statusMatches ? "SIM (PASS)" : "FALHA"}`);
    console.log(`  Session Guard Ativo: ${sessionGuardMatches ? "SIM (PASS)" : "FALHA"}`);
    console.log(`  VoiceStudio Bloqueado no app_metadata: ${voiceBlocked ? "SIM (PASS)" : "FALHA"}`);
  }

  console.log("\n================================================================================");
  console.log(`=== RESULTADO DA PADRONIZAÇÃO: ${allAligned ? "APROVADO (100% ALINHADO)" : "REPROVADO"} ===`);
  console.log("================================================================================\n");

  if (!allAligned) process.exit(1);
}

main().catch(err => {
  console.error("ERRO CRÍTICO NA PADRONIZAÇÃO:", err);
  process.exit(1);
});
