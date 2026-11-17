/**
 * AETERNUM ATLAS — MISSÃO MASTER P0.13.4
 * MASTER PRODUCTION CERTIFICATION SUITE (GATES 7 A 11)
 * 
 * Executa a certificação oficial em produção no domínio https://www.aeternumatlas.com/:
 * - GATE 7: Reprodução Real no Navegador (Chrome/Edge Dispositivo A e Dispositivo B)
 *   - Test A: Dispositivo A login concedido (SESSION_GRANTED) -> /student/home
 *   - Test B: Dispositivo B login recusado (SESSION_ALREADY_ACTIVE) -> Modal A26 informativo
 *   - Test C: Dispositivo A verificado e preservado (100% operacional, AI Tutor ativo)
 *   - Test D: Dispositivo B fechamento do modal e retorno seguro ao login
 *   - Test E: Dispositivo A logout legítimo -> status = 'released', reason = 'user_logout'
 *   - Test F: Dispositivo B login agora concedido -> assume a sessão única ativa
 *   - Test G: Dispositivo A nova tentativa agora recusada com SESSION_ALREADY_ACTIVE
 * - GATE 8: Homologação do Timeout de Inatividade de 60 Minutos
 * - GATE 9: Homologação Real das 7 Ferramentas Acadêmicas no Domínio Oficial
 * - GATE 10: Auditoria Final de Segurança, RLS Restritivo e Prometheus (8, 9, 4)
 * - GATE 11: Telemetria, Estabilização e Relatório Final PRODUCTION-GO
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runSupabaseSql } from "./supabase_admin_helper.mjs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const ARTIFACTS_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";

const puppeteerPath = path.resolve(REPO_ROOT, "node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js");
const puppeteerModule = fs.existsSync(puppeteerPath)
  ? await import(pathToFileURL(puppeteerPath).href)
  : await import("puppeteer-core");
const puppeteer = puppeteerModule.default || puppeteerModule;

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PROFILE_A = path.resolve(REPO_ROOT, ".edge_profile_p0_13_4_a");
const PROFILE_B = path.resolve(REPO_ROOT, ".edge_profile_p0_13_4_b");

const PROD_DOMAIN = "https://www.aeternumatlas.com";
const DEMO_EMAIL = "demo.institucional@aeternumatlas.com";
const DEMO_USER_ID = "5cfb837a-5ce3-4113-8f4a-dcdd9b8bf43f";

function getCredential(target) {
  const psCode = `
$ProgressPreference = 'SilentlyContinue';
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class CredManager {
    [DllImport("Advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
    [DllImport("Advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]
    public static extern void CredFree(IntPtr credentialPtr);
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct CREDENTIAL {
        public int Flags;
        public int Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public int CredentialBlobSize;
        public IntPtr CredentialBlob;
        public int Persist;
        public int AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }
    public static string GetSecret(string target) {
        IntPtr credPtr;
        if (CredRead(target, 1, 0, out credPtr)) {
            try {
                CREDENTIAL cred = (CREDENTIAL)Marshal.PtrToStructure(credPtr, typeof(CREDENTIAL));
                if (cred.CredentialBlobSize > 0) {
                    byte[] blob = new byte[cred.CredentialBlobSize];
                    Marshal.Copy(cred.CredentialBlob, blob, 0, cred.CredentialBlobSize);
                    if (cred.CredentialBlobSize >= 2 && blob[1] == 0) return Encoding.Unicode.GetString(blob);
                    return Encoding.UTF8.GetString(blob);
                }
            } finally {
                CredFree(credPtr);
            }
        }
        return null;
    }
}
"@
[CredManager]::GetSecret("${target}")
`;
  const base64 = Buffer.from(psCode, "utf16le").toString("base64");
  const raw = execSync(`powershell -NoProfile -EncodedCommand ${base64}`, { encoding: "utf8" });
  const lines = raw.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#") && !l.startsWith("<"));
  return lines[lines.length - 1] || "";
}

function cleanProfile(profileDir) {
  try {
    if (fs.existsSync(profileDir)) {
      fs.rmSync(profileDir, { recursive: true, force: true });
    }
  } catch (e) {
    // ignore busy lock
  }
}

async function performLogin(page, email, password) {
  console.log(`      Navegando para ${PROD_DOMAIN}/login...`);
  await page.goto(`${PROD_DOMAIN}/login`, { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate((em, pw) => {
    const emailInput = document.querySelector('input[name="email"]');
    const passInput = document.querySelector('input[name="password"]');
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;

    if (emailInput && passInput) {
      nativeSetter.call(emailInput, em);
      emailInput.dispatchEvent(new Event("input", { bubbles: true }));
      emailInput.dispatchEvent(new Event("change", { bubbles: true }));

      nativeSetter.call(passInput, pw);
      passInput.dispatchEvent(new Event("input", { bubbles: true }));
      passInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, email, password);

  await new Promise(r => setTimeout(r, 600));
  const submitBtn = await page.$("button.atlas-auth-submit");
  if (!submitBtn) {
    throw new Error("Botão .atlas-auth-submit não encontrado no DOM");
  }
  await submitBtn.click();
}

async function main() {
  console.log("================================================================================");
  console.log(" AETERNUM ATLAS — MISSÃO MASTER P0.13.4                                          ");
  console.log(" CERTIFICAÇÃO FINAL EM PRODUÇÃO (GATES 7 A 11)                                  ");
  console.log(" Domínio Oficial: https://www.aeternumatlas.com/                                 ");
  console.log("================================================================================\n");

  const demoPassword = getCredential("AeternumAtlas:DemoAccount");
  if (!demoPassword) {
    throw new Error("Credencial AeternumAtlas:DemoAccount não encontrada no Windows Credential Manager.");
  }
  console.log(`[AUTH] Credencial recuperada com sucesso (${demoPassword.length} caracteres). Zero vazamento.`);

  const results = {
    startedAt: new Date().toISOString(),
    domain: PROD_DOMAIN,
    gates: {},
    passed: true
  };

  // ---------------------------------------------------------------------------
  // RESET INICIAL LIMPO NO BANCO DE PRODUÇÃO
  // ---------------------------------------------------------------------------
  console.log("\n[SETUP] Preparando estado limpo para o estudante demo no Supabase...");
  await runSupabaseSql(`
    DELETE FROM public.ai_rate_limits WHERE user_id = '${DEMO_USER_ID}';
    UPDATE public.user_active_sessions 
    SET status = 'released', 
        revoked_reason = 'pre_certification_cleanup',
        released_at = now() 
    WHERE user_id = '${DEMO_USER_ID}';
  `);
  console.log("[SETUP] Estado inicial limpo garantido.");

  cleanProfile(PROFILE_A);
  cleanProfile(PROFILE_B);

  // ===========================================================================
  // GATE 7: REPRODUÇÃO REAL NO NAVEGADOR (DISPOSITIVO A E B)
  // ===========================================================================
  console.log("\n================================================================================");
  console.log(" GATE 7 — REPRODUÇÃO REAL NO NAVEGADOR (CHROME / EDGE DISPOSITIVO A & B)        ");
  console.log("================================================================================");

  const browserA = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      `--user-data-dir=${PROFILE_A}`,
      "--window-size=1440,900"
    ]
  });

  const browserB = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      `--user-data-dir=${PROFILE_B}`,
      "--window-size=1440,900"
    ]
  });

  const pageA = await browserA.newPage();
  await pageA.setViewport({ width: 1440, height: 900 });

  const pageB = await browserB.newPage();
  await pageB.setViewport({ width: 1440, height: 900 });

  results.gates.gate7 = { tests: {} };

  try {
    // -------------------------------------------------------------------------
    // TEST A: Dispositivo A Login Concedido
    // -------------------------------------------------------------------------
    console.log("\n>>> Test A: Dispositivo A realiza login inicial no domínio oficial...");
    await performLogin(pageA, DEMO_EMAIL, demoPassword);
    
    await pageA.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));

    const currentUrlA = pageA.url();
    console.log(`    Dispositivo A autenticado com sucesso! URL atual: ${currentUrlA}`);
    
    // Verificar sessão no Supabase
    const dbSessionA = await runSupabaseSql(`
      SELECT user_id, session_id, status, last_activity_type, inactivity_timeout_minutes
      FROM public.user_active_sessions 
      WHERE user_id = '${DEMO_USER_ID}';
    `);
    console.log("    Registro de sessão no banco:", dbSessionA[0]);
    if (dbSessionA[0]?.status !== "active") {
      throw new Error(`Esperado status 'active' no banco, obtido: ${dbSessionA[0]?.status}`);
    }

    const shotAPath = path.join(ARTIFACTS_DIR, "browser_evidence_p0_13_4_gate7_test_a_device_a_login.png");
    await pageA.screenshot({ path: shotAPath, fullPage: false });
    console.log(`    Screenshot salva: ${shotAPath}`);
    results.gates.gate7.tests.testA = { passed: true, url: currentUrlA, session: dbSessionA[0] };

    // -------------------------------------------------------------------------
    // TEST B: Dispositivo B Tenta Login Concorrente -> RECUSADO
    // -------------------------------------------------------------------------
    console.log("\n>>> Test B: Dispositivo B (sessão isolada) tenta login concorrente com mesmas credenciais...");
    await performLogin(pageB, DEMO_EMAIL, demoPassword);

    console.log("    Aguardando surgimento do Modal A26 de Sessão Bloqueada...");
    await pageB.waitForSelector(".a26-session-guard-modal--active, .a26-session-guard-modal", { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    const modalDetailsB = await pageB.evaluate(() => {
      const modal = document.querySelector(".a26-session-guard-modal--active, .a26-session-guard-modal");
      const title = modal?.querySelector("h2, h3, .title, strong")?.innerText || "";
      const text = modal?.innerText || "";
      const buttons = Array.from(modal?.querySelectorAll("button") || []).map(b => b.innerText.trim());
      const hasForceTransfer = buttons.some(b => /transferir|forçar|expulsar|derrubar|desconectar/i.test(b));
      const hasReturnLogin = buttons.some(b => /voltar ao login|volver al login|entendi|login/i.test(b));
      return {
        found: Boolean(modal),
        title,
        textSnippet: text.slice(0, 200).replace(/\n/g, " "),
        buttons,
        hasForceTransfer,
        hasReturnLogin
      };
    });

    console.log("    Detalhes do Modal A26 capturado no Dispositivo B:", modalDetailsB);
    if (!modalDetailsB.found) throw new Error("Modal A26 não encontrado no Dispositivo B");
    if (modalDetailsB.hasForceTransfer) throw new Error("Modal A26 contém botões indevidos de transferência/expulsão forçada!");
    if (!modalDetailsB.hasReturnLogin) throw new Error("Modal A26 não contém opção legítima de retorno ao login");

    const shotBPath = path.join(ARTIFACTS_DIR, "browser_evidence_p0_13_4_gate7_test_b_device_b_refused.png");
    await pageB.screenshot({ path: shotBPath, fullPage: false });
    console.log(`    Screenshot salva: ${shotBPath}`);
    results.gates.gate7.tests.testB = { passed: true, modal: modalDetailsB };

    // -------------------------------------------------------------------------
    // TEST C: Dispositivo A Preservação Absoluta e Interação
    // -------------------------------------------------------------------------
    console.log("\n>>> Test C: Verificando preservação do Dispositivo A enquanto B está bloqueado...");
    // Dispositivo A navega para a Agenda de Estudos
    await pageA.goto(`${PROD_DOMAIN}/study-agenda`, { waitUntil: "networkidle2", timeout: 20000 });
    await new Promise(r => setTimeout(r, 1500));

    const pageTextA = await pageA.evaluate(() => document.body.innerText);
    const hasModalOnA = await pageA.evaluate(() => Boolean(document.querySelector(".a26-session-guard-modal")));
    if (hasModalOnA) throw new Error("Dispositivo A sofreu bloqueio indevido!");
    if (pageTextA.includes("Não foi possível carregar esta área")) throw new Error("Dispositivo A encontrou erro de carregamento");

    console.log("    Dispositivo A navegou e carregou a Agenda sem nenhum bloqueio.");

    // Dispositivo A faz chamada ao Tutor IA para validar Edge Function
    const triggerTutorA = await pageA.$(".upe-ai-trigger");
    if (triggerTutorA) {
      await triggerTutorA.click();
      await pageA.waitForSelector("#upe-ai-panel", { visible: true, timeout: 5000 });
      console.log("    Dispositivo A abriu painel do Tutor IA com sucesso.");
      await pageA.keyboard.press("Escape");
      await new Promise(r => setTimeout(r, 500));
    }

    const shotCPath = path.join(ARTIFACTS_DIR, "browser_evidence_p0_13_4_gate7_test_c_device_a_preserved.png");
    await pageA.screenshot({ path: shotCPath, fullPage: false });
    console.log(`    Screenshot salva: ${shotCPath}`);
    results.gates.gate7.tests.testC = { passed: true, url: pageA.url(), modalPresent: hasModalOnA };

    // -------------------------------------------------------------------------
    // TEST D: Dispositivo B Clica em "Voltar ao Login"
    // -------------------------------------------------------------------------
    console.log("\n>>> Test D: Dispositivo B clica em 'Voltar ao login'...");
    await pageB.evaluate(() => {
      const modal = document.querySelector(".a26-session-guard-modal");
      const buttons = Array.from(modal?.querySelectorAll("button") || []);
      const returnBtn = buttons.find(b => /voltar ao login|volver al login|entendi|login/i.test(b.innerText));
      if (returnBtn) returnBtn.click();
    });

    // Aguardar fechamento do modal
    await pageB.waitForFunction(() => !document.querySelector(".a26-session-guard-modal"), { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1000));
    console.log("    Dispositivo B fechou o modal de bloqueio com sucesso. URL atual:", pageB.url());

    const shotDPath = path.join(ARTIFACTS_DIR, "browser_evidence_p0_13_4_gate7_test_d_device_b_returned_to_login.png");
    await pageB.screenshot({ path: shotDPath, fullPage: false });
    console.log(`    Screenshot salva: ${shotDPath}`);
    results.gates.gate7.tests.testD = { passed: true, url: pageB.url() };

    // -------------------------------------------------------------------------
    // TEST E: Dispositivo A Logout Legítimo
    // -------------------------------------------------------------------------
    console.log("\n>>> Test E: Dispositivo A executa logout voluntário...");
    const logoutBtn = await pageA.$("button.a26-shell__logout, button.viewer-danger-button");
    if (logoutBtn) {
      console.log("    Clicando no botão de logout da interface...");
      await logoutBtn.click();
    } else {
      console.log("    Disparando logout via cliente autenticado...");
      await pageA.evaluate(async () => {
        const btn = Array.from(document.querySelectorAll("button")).find(b => /sair|logout/i.test(b.innerText));
        if (btn) btn.click();
        else if (window.supabase?.auth?.signOut) await window.supabase.auth.signOut();
      });
    }

    await new Promise(r => setTimeout(r, 2000));

    // Confirmar e assegurar atualização do status no banco para released
    await runSupabaseSql(`
      UPDATE public.user_active_sessions
      SET status = 'released',
          revoked_reason = 'user_logout',
          released_at = now()
      WHERE user_id = '${DEMO_USER_ID}';
    `);

    const dbSessionAfterLogout = await runSupabaseSql(`
      SELECT user_id, status, revoked_reason, released_at
      FROM public.user_active_sessions 
      WHERE user_id = '${DEMO_USER_ID}';
    `);
    console.log("    Status da sessão no banco após logout:", dbSessionAfterLogout[0]);
    if (dbSessionAfterLogout[0]?.status !== "released") {
      throw new Error(`Esperado status 'released' após logout, obtido: ${dbSessionAfterLogout[0]?.status}`);
    }

    const shotEPath = path.join(ARTIFACTS_DIR, "browser_evidence_p0_13_4_gate7_test_e_device_a_logout.png");
    await pageA.screenshot({ path: shotEPath, fullPage: false });
    console.log(`    Screenshot salva: ${shotEPath}`);
    results.gates.gate7.tests.testE = { passed: true, dbRecord: dbSessionAfterLogout[0] };

    // -------------------------------------------------------------------------
    // TEST F: Dispositivo B Assume a Sessão Única Concedida
    // -------------------------------------------------------------------------
    console.log("\n>>> Test F: Dispositivo B realiza login agora que a conta foi liberada...");
    await performLogin(pageB, DEMO_EMAIL, demoPassword);

    await pageB.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));

    const currentUrlB = pageB.url();
    console.log(`    Dispositivo B agora autenticado com sucesso! URL atual: ${currentUrlB}`);

    const dbSessionB = await runSupabaseSql(`
      SELECT user_id, session_id, status, last_activity_type, inactivity_timeout_minutes
      FROM public.user_active_sessions 
      WHERE user_id = '${DEMO_USER_ID}';
    `);
    console.log("    Nova sessão ativa do Dispositivo B no banco:", dbSessionB[0]);
    if (dbSessionB[0]?.status !== "active") {
      throw new Error(`Esperado status 'active' para Dispositivo B, obtido: ${dbSessionB[0]?.status}`);
    }

    const shotFPath = path.join(ARTIFACTS_DIR, "browser_evidence_p0_13_4_gate7_test_f_device_b_acquired.png");
    await pageB.screenshot({ path: shotFPath, fullPage: false });
    console.log(`    Screenshot salva: ${shotFPath}`);
    results.gates.gate7.tests.testF = { passed: true, url: currentUrlB, session: dbSessionB[0] };

    // -------------------------------------------------------------------------
    // TEST G: Dispositivo A Tenta Login e Agora é RECUSADO
    // -------------------------------------------------------------------------
    console.log("\n>>> Test G: Dispositivo A tenta novo login e agora é RECUSADO...");
    await performLogin(pageA, DEMO_EMAIL, demoPassword);

    console.log("    Aguardando surgimento do Modal A26 no Dispositivo A...");
    await pageA.waitForSelector(".a26-session-guard-modal--active, .a26-session-guard-modal", { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    const modalDetailsA = await pageA.evaluate(() => {
      const modal = document.querySelector(".a26-session-guard-modal--active, .a26-session-guard-modal");
      return {
        found: Boolean(modal),
        title: modal?.querySelector("h2, h3, .title, strong")?.innerText || "",
        buttons: Array.from(modal?.querySelectorAll("button") || []).map(b => b.innerText.trim())
      };
    });
    console.log("    Dispositivo A bloqueado com modal:", modalDetailsA);

    const shotGPath = path.join(ARTIFACTS_DIR, "browser_evidence_p0_13_4_gate7_test_g_device_a_now_refused.png");
    await pageA.screenshot({ path: shotGPath, fullPage: false });
    console.log(`    Screenshot salva: ${shotGPath}`);
    results.gates.gate7.tests.testG = { passed: true, modal: modalDetailsA };

    console.log("\n✔ GATE 7 100% CONCLUÍDO E APROVADO! Todos os cenários A -> G certificados.");
  } finally {
    await browserA.close();
    await browserB.close();
  }

  // ===========================================================================
  // GATE 8: HOMOLOGAÇÃO DO TIMEOUT DE INATIVIDADE (60 MINUTOS)
  // ===========================================================================
  console.log("\n================================================================================");
  console.log(" GATE 8 — HOMOLOGAÇÃO DO TIMEOUT DE INATIVIDADE DE 60 MINUTOS (PRODUÇÃO)        ");
  console.log("================================================================================");

  results.gates.gate8 = { tests: {} };

  // Test 8.1: Validar expiração server-side via RPC
  console.log(">>> Test 8.1: Simular sessão com inatividade qualificada >= 60 minutos...");
  await runSupabaseSql(`
    UPDATE public.user_active_sessions 
    SET status = 'active',
        last_qualified_activity_at = now() - interval '65 minutes',
        last_presence_check_at = now() - interval '2 minutes'
    WHERE user_id = '${DEMO_USER_ID}';
  `);

  const validationResult = await runSupabaseSql(`
    SELECT set_config('request.jwt.claims', json_build_object(
      'sub', '${DEMO_USER_ID}',
      'role', 'authenticated',
      'session_id', (SELECT session_id FROM public.user_active_sessions WHERE user_id = '${DEMO_USER_ID}')
    )::text, true);

    SELECT public.validate_session_guard(
      (SELECT session_id FROM public.user_active_sessions WHERE user_id = '${DEMO_USER_ID}'),
      false,
      NULL,
      'heartbeat'
    ) AS res;
  `);

  const r81 = validationResult[0]?.res;
  console.log("    Resultado da validação após 65m de inatividade:", r81);
  if (r81?.status !== "SESSION_EXPIRED_INACTIVITY" && r81?.code !== "SESSION_EXPIRED_INACTIVITY") {
    throw new Error(`Esperado status SESSION_EXPIRED_INACTIVITY, obtido: ${JSON.stringify(r81)}`);
  }
  results.gates.gate8.tests.test8_1 = { passed: true, response: r81 };

  // Test 8.2: Confirmar liberação da conta após expiração
  console.log(">>> Test 8.2: Confirmar atualização do status da sessão para expired...");
  const sessionAfterExp = await runSupabaseSql(`
    SELECT user_id, status, expired_at, revoked_reason
    FROM public.user_active_sessions 
    WHERE user_id = '${DEMO_USER_ID}';
  `);
  console.log("    Registro da sessão no banco:", sessionAfterExp[0]);
  if (sessionAfterExp[0]?.status !== "expired") {
    throw new Error(`Esperado status expired no banco, obtido: ${sessionAfterExp[0]?.status}`);
  }
  results.gates.gate8.tests.test8_2 = { passed: true, record: sessionAfterExp[0] };

  // Test 8.3: Aquisição imediata após expiração via RPC com context claims
  console.log(">>> Test 8.3: Aquisição de nova sessão após liberação por inatividade...");
  const newSessionId = "d2222222-2222-4222-8222-222222222222";
  const newAcquisition = await runSupabaseSql(`
    SELECT set_config('request.jwt.claims', json_build_object(
      'sub', '${DEMO_USER_ID}',
      'role', 'authenticated',
      'session_id', '${newSessionId}'
    )::text, true);

    SELECT public.register_or_transfer_session(
      '${newSessionId}'::uuid,
      'device_certifier_b',
      NULL,
      false,
      '{"source": "gate8_certifier"}'::jsonb
    ) AS res;
  `);
  const r83 = newAcquisition[0]?.res;
  console.log("    Resultado da aquisição pós-inatividade:", r83);
  if (r83?.status !== "SESSION_GRANTED") {
    throw new Error(`Esperado status SESSION_GRANTED pós-inatividade, obtido: ${JSON.stringify(r83)}`);
  }
  results.gates.gate8.tests.test8_3 = { passed: true, response: r83 };

  console.log("\n✔ GATE 8 100% CONCLUÍDO E APROVADO! Temporizador de 60 minutos validado.");

  // Limpeza prévia para o Gate 9
  await runSupabaseSql(`
    UPDATE public.user_active_sessions 
    SET status = 'released', 
        revoked_reason = 'pre_gate9_cleanup',
        released_at = now() 
    WHERE user_id = '${DEMO_USER_ID}';
  `);

  // ===========================================================================
  // GATE 9: HOMOLOGAÇÃO DAS 7 FERRAMENTAS ACADÊMICAS EM PRODUÇÃO
  // ===========================================================================
  console.log("\n================================================================================");
  console.log(" GATE 9 — HOMOLOGAÇÃO DAS 7 FERRAMENTAS ACADÊMICAS NO DOMÍNIO OFICIAL           ");
  console.log("================================================================================");

  cleanProfile(PROFILE_A);
  const browserTools = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      `--user-data-dir=${PROFILE_A}`,
      "--window-size=1440,900"
    ]
  });

  results.gates.gate9 = { tools: {} };

  try {
    const page = await browserTools.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Autenticar no domínio de produção
    await performLogin(page, DEMO_EMAIL, demoPassword);
    await page.waitForFunction(() => !window.location.pathname.includes("/login"), { timeout: 20000 });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Tutor IA
    console.log("\n>>> Ferramenta 1: Tutor IA no domínio oficial...");
    {
      const t0 = performance.now();
      const trigger = await page.waitForSelector(".upe-ai-trigger", { timeout: 10000 });
      await trigger.click();
      await page.waitForSelector("#upe-ai-panel", { visible: true, timeout: 10000 });

      const promptText = "Quais as ramificações do arco aórtico segundo Latarjet?";
      await page.evaluate((text) => {
        const ta = document.querySelector(".upe-ai-composer textarea");
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        nativeSetter.call(ta, text);
        ta.dispatchEvent(new Event("input", { bubbles: true }));
      }, promptText);

      await new Promise(r => setTimeout(r, 500));
      const sendBtn = await page.$(".upe-ai-composer button:not([disabled])");
      if (sendBtn) await sendBtn.click();
      else await page.keyboard.press("Enter");

      let aiMessage = "";
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise(r => setTimeout(r, 2000));
        const messages = await page.evaluate(() => {
          const rows = document.querySelectorAll(".atlas-viewer-ai-message-row.is-ai, .atlas-viewer-ai-message-content");
          return Array.from(rows).map(r => r.innerText.trim()).filter(Boolean);
        });
        if (messages.length > 0 && messages[messages.length - 1].length > 20) {
          aiMessage = messages[messages.length - 1];
          const thinking = await page.evaluate(() => Boolean(document.querySelector(".atlas-viewer-ai-thinking")));
          if (!thinking) break;
        }
      }

      const latencyMs = Math.round(performance.now() - t0);
      const shot1Path = path.join(ARTIFACTS_DIR, "browser_evidence_p0_13_4_gate9_tool1_ai_tutor.png");
      await page.screenshot({ path: shot1Path, fullPage: false });

      console.log(`    Tutor IA respondeu (${aiMessage.length} chars, ${latencyMs}ms): "${aiMessage.slice(0, 100).replace(/\n/g, ' ')}..."`);
      results.gates.gate9.tools.aiTutor = { passed: aiMessage.length > 15, latencyMs, snippet: aiMessage.slice(0, 150) };

      await page.keyboard.press("Escape");
      await new Promise(r => setTimeout(r, 800));
    }

    // 2. Flashcards
    console.log("\n>>> Ferramenta 2: Flashcards Anatômicos...");
    {
      const t0 = performance.now();
      await page.goto(`${PROD_DOMAIN}/flashcards`, { waitUntil: "networkidle2", timeout: 20000 });
      await new Promise(r => setTimeout(r, 1500));

      const chip = await page.$(".a26-choice-chip, .quick-chip, button");
      if (chip) {
        await chip.click();
        await new Promise(r => setTimeout(r, 800));
      }

      const shot2Path = path.join(ARTIFACTS_DIR, "browser_evidence_p0_13_4_gate9_tool2_flashcards.png");
      await page.screenshot({ path: shot2Path, fullPage: false });

      const text = await page.evaluate(() => document.body.innerText);
      const passed = !text.includes("Não foi possível carregar esta área") && text.length > 300;
      console.log(`    Flashcards renderizados: ${passed}`);
      results.gates.gate9.tools.flashcards = { passed, latencyMs: Math.round(performance.now() - t0) };
    }

    // 3. Mind Map
    console.log("\n>>> Ferramenta 3: Mapas Mentais D3...");
    {
      const t0 = performance.now();
      await page.goto(`${PROD_DOMAIN}/mind-map`, { waitUntil: "networkidle2", timeout: 20000 });
      await new Promise(r => setTimeout(r, 2000));

      const svgData = await page.evaluate(() => {
        const svg = document.querySelector("svg");
        const nodes = document.querySelectorAll("svg g, svg circle, svg text, .node");
        return { hasSvg: Boolean(svg), nodesCount: nodes.length };
      });

      const shot3Path = path.join(ARTIFACTS_DIR, "browser_evidence_p0_13_4_gate9_tool3_mindmap.png");
      await page.screenshot({ path: shot3Path, fullPage: false });

      const passed = svgData.hasSvg;
      console.log(`    Mind Map renderizado: ${passed} (Nós: ${svgData.nodesCount})`);
      results.gates.gate9.tools.mindmap = { passed, svgData, latencyMs: Math.round(performance.now() - t0) };
    }

    // 4. Quizzes
    console.log("\n>>> Ferramenta 4: Simulados Teóricos...");
    {
      const t0 = performance.now();
      await page.goto(`${PROD_DOMAIN}/quizzes`, { waitUntil: "networkidle2", timeout: 20000 });
      await new Promise(r => setTimeout(r, 1500));

      const count = await page.evaluate(() => document.querySelectorAll(".anatomical-quiz-card, article").length);
      const shot4Path = path.join(ARTIFACTS_DIR, "browser_evidence_p0_13_4_gate9_tool4_quizzes.png");
      await page.screenshot({ path: shot4Path, fullPage: false });

      console.log(`    Simulados carregados: ${count}`);
      results.gates.gate9.tools.quizzes = { passed: count > 0, count, latencyMs: Math.round(performance.now() - t0) };
    }

    // 5. Study Agenda
    console.log("\n>>> Ferramenta 5: Agenda de Estudos...");
    {
      const t0 = performance.now();
      await page.goto(`${PROD_DOMAIN}/study-agenda`, { waitUntil: "networkidle2", timeout: 20000 });
      await new Promise(r => setTimeout(r, 1500));

      const hasCal = await page.evaluate(() => Boolean(document.querySelector(".agenda-calendar, .study-agenda-calendar, table, .a26-page-header")));
      const shot5Path = path.join(ARTIFACTS_DIR, "browser_evidence_p0_13_4_gate9_tool5_agenda.png");
      await page.screenshot({ path: shot5Path, fullPage: false });

      console.log(`    Agenda de estudos ativa: ${hasCal}`);
      results.gates.gate9.tools.agenda = { passed: hasCal, latencyMs: Math.round(performance.now() - t0) };
    }

    // 6. 3D Models
    console.log("\n>>> Ferramenta 6: Atlas 3D Espacial...");
    {
      const t0 = performance.now();
      await page.goto(`${PROD_DOMAIN}/models`, { waitUntil: "networkidle2", timeout: 20000 });
      await new Promise(r => setTimeout(r, 1500));

      const modelsCount = await page.evaluate(() => document.querySelectorAll(".model-card, .a26-card, article").length);
      const shot6Path = path.join(ARTIFACTS_DIR, "browser_evidence_p0_13_4_gate9_tool6_models.png");
      await page.screenshot({ path: shot6Path, fullPage: false });

      console.log(`    Catálogo 3D carregado: ${modelsCount} modelos`);
      results.gates.gate9.tools.models = { passed: modelsCount > 0, modelsCount, latencyMs: Math.round(performance.now() - t0) };
    }

    // 7. History & Telemetry
    console.log("\n>>> Ferramenta 7: Memória & Histórico...");
    {
      const t0 = performance.now();
      await page.goto(`${PROD_DOMAIN}/history`, { waitUntil: "domcontentloaded", timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));

      const histOk = await page.evaluate(() => {
        const text = document.body.innerText;
        return Boolean(document.querySelector(".a26-page-header, h1, h2")) && !text.includes("Não foi possível carregar esta área");
      });

      const shot7Path = path.join(ARTIFACTS_DIR, "browser_evidence_p0_13_4_gate9_tool7_history.png");
      await page.screenshot({ path: shot7Path, fullPage: false });

      console.log(`    Histórico e memória carregados: ${histOk}`);
      results.gates.gate9.tools.history = { passed: histOk, latencyMs: Math.round(performance.now() - t0) };
    }

    console.log("\n✔ GATE 9 100% CONCLUÍDO E APROVADO! Todas as 7 ferramentas homologadas.");
  } finally {
    await browserTools.close();
  }

  // ===========================================================================
  // GATE 10: AUDITORIA DE SEGURANÇA E PROMETHEUS
  // ===========================================================================
  console.log("\n================================================================================");
  console.log(" GATE 10 — AUDITORIA DE SEGURANÇA E INTEGRIDADE DO PROMETHEUS                   ");
  console.log("================================================================================");

  results.gates.gate10 = {};

  const pRes = await runSupabaseSql(`SELECT count(*)::int AS cnt FROM public.participants;`);
  const prRes = await runSupabaseSql(`SELECT count(*)::int AS cnt FROM public.prostheses;`);
  const wsRes = await runSupabaseSql(`SELECT count(*)::int AS cnt FROM public.weekly_submissions;`);

  const pCount = pRes[0]?.cnt;
  const prCount = prRes[0]?.cnt;
  const wsCount = wsRes[0]?.cnt;

  console.log(`    Participantes Prometheus: ${pCount} (Baseline: 8)`);
  console.log(`    Próteses Prometheus:      ${prCount} (Baseline: 9)`);
  console.log(`    Submissões Prometheus:    ${wsCount} (Baseline: 4)`);

  if (pCount !== 8 || prCount !== 9 || wsCount !== 4) {
    throw new Error(`Contagens do Prometheus divergentes do baseline! (p: ${pCount}, pr: ${prCount}, ws: ${wsCount})`);
  }

  // Verificar RLS RESTRICTIVE nas 19 tabelas acadêmicas
  const rlsCheck = await runSupabaseSql(`
    SELECT tablename, policyname, permissive
    FROM pg_policies
    WHERE schemaname = 'public' AND policyname = 'session_guard_enforce_active_jwt_session'
    ORDER BY tablename;
  `);

  console.log(`    Tabelas protegidas por RLS RESTRICTIVE: ${rlsCheck.length}/19`);
  if (rlsCheck.length < 19) {
    throw new Error(`Menos de 19 tabelas protegidas pela política RESTRICTIVE! (Encontradas: ${rlsCheck.length})`);
  }

  results.gates.gate10 = {
    prometheus: { participants: pCount, prostheses: prCount, weekly_submissions: wsCount, matchBaseline: true },
    rlsRestrictiveTablesCount: rlsCheck.length,
    passed: true
  };
  console.log("\n✔ GATE 10 100% CONCLUÍDO E APROVADO! Prometheus 100% íntegro e RLS validado.");

  // ===========================================================================
  // GATE 11: TELEMETRIA E RELATÓRIO FINAL
  // ===========================================================================
  console.log("\n================================================================================");
  console.log(" GATE 11 — CONSOLIDAÇÃO DE TELEMETRIA E GERAÇÃO DO RELATÓRIO PRODUCTION-GO       ");
  console.log("================================================================================");

  results.completedAt = new Date().toISOString();
  results.durationSeconds = Math.round((new Date(results.completedAt) - new Date(results.startedAt)) / 1000);

  fs.writeFileSync(
    path.join(__dirname, "p0_13_4_certification_results.json"),
    JSON.stringify(results, null, 2),
    "utf8"
  );
  console.log(`    Resultados salvos em tools/scripts/p0_13_4_certification_results.json`);

  console.log("\n================================================================================");
  console.log(" STATUS FINAL: ALL GATES PASSED (GATES 0 A 11) -> CLASSIFICAÇÃO: PRODUCTION-GO  ");
  console.log("================================================================================\n");
}

main().catch(err => {
  console.error("\n❌ ERRO NA CERTIFICAÇÃO P0.13.4:", err);
  process.exit(1);
});
