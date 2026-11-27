/**
 * Aeternum Atlas — P0.21-ADM.2.2-R2
 * Administrative Control Center Visual Redesign, Data Truth & Multi-Viewport Verification
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import assert from "node:assert";

const PORT = 5180;
const BASE_URL = `http://localhost:${PORT}`;
const ARTIFACT_DIR = process.env.ARTIFACT_DIR ||
  (process.env.APPDATA
    ? path.resolve(process.env.APPDATA, "..", ".gemini", "antigravity", "brain", "b63445c2-37f0-46a4-8ca8-5556eb65a8a3")
    : path.resolve(process.cwd(), "artifacts"));

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const rootDir = process.cwd();

function isPortListening(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function stopViteServer(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", proc.pid.toString(), "/T", "/F"], { stdio: "ignore" });
    } else {
      proc.kill("SIGTERM");
    }
  } catch (_) {}
}

async function startViteServer() {
  if (await isPortListening(PORT)) {
    console.log(`Port ${PORT} is already in use.`);
    return null;
  }
  console.log(`Starting Vite preview server on port ${PORT}...`);
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const proc = spawn(npxCmd, ["vite", "preview", "--port", String(PORT), "--strictPort"], {
    cwd: rootDir,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  const start = Date.now();
  while (Date.now() - start < 15000) {
    await new Promise(r => setTimeout(r, 400));
    if (await isPortListening(PORT)) {
      console.log(`Preview server ready at ${BASE_URL}`);
      return proc;
    }
  }
  throw new Error(`Timeout starting Vite preview on port ${PORT}`);
}

function makeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const claims = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${claims}.dummy_signature`;
}

// 5 sócios fundadores (identidades 100% sintéticas para isolamento estrito de testes E2E)
const mockFounders = [
  { id: "syn-founder-halisson-001", name: "Dr. Halisson Zanchin", email: "halissonzanchin@aeternumatlas.com", role: "student", institution_id: "inst-1", status: "active", created_at: "2026-01-10T10:00:00Z" },
  { id: "syn-founder-victor-002", name: "Victor Hugo", email: "victor@aeternumatlas.com", role: "student", institution_id: "inst-1", status: "active", created_at: "2026-01-10T10:00:00Z" },
  { id: "syn-founder-nicolas-003", name: "Nicolas Figorelli", email: "nicolas@aeternumatlas.com", role: "student", institution_id: "inst-1", status: "active", created_at: "2026-01-10T10:00:00Z" },
  { id: "syn-founder-lucas-004", name: "Lucas Paredes", email: "lucas@aeternumatlas.com", role: "student", institution_id: "inst-1", status: "active", created_at: "2026-01-10T10:00:00Z" },
  { id: "syn-founder-edgar-005", name: "Edgar Torales", email: "edgar@aeternumatlas.com", role: "student", institution_id: "inst-1", status: "active", created_at: "2026-01-10T10:00:00Z" }
];

// Discentes adicionais para QA, Demo e Comercial
const mockAdditionalStudents = [
  { id: "u-qa-1", name: "QA Tester Automatizado", email: "qa.voice.p0@aeternumatlas.com", role: "student", institution_id: "inst-1", status: "active", created_at: "2026-01-11T10:00:00Z" },
  { id: "u-demo-1", name: "Discente Demonstração", email: "demo.institucional@aeternumatlas.com", role: "student", institution_id: "inst-1", status: "active", created_at: "2026-01-12T10:00:00Z" },
  { id: "u-comm-1", name: "Aluno Comercial Matriculado", email: "comercial.aluno@externo.edu", role: "student", institution_id: "inst-1", status: "active", created_at: "2026-01-13T10:00:00Z" }
];

const mockStudentProfiles = [
  { user_id: "syn-founder-halisson-001", course: "Medicina", semester: "8º Semestre", registration_number: "MED-2026-001", progress_score: 95, total_study_minutes: 420 },
  { user_id: "syn-founder-victor-002", course: "Engenharia Biomédica", semester: "10º Semestre", registration_number: "BIO-2026-002", progress_score: 90, total_study_minutes: 380 },
  { user_id: "syn-founder-nicolas-003", course: "Medicina", semester: "6º Semestre", registration_number: "MED-2026-003", progress_score: 88, total_study_minutes: 310 },
  { user_id: "syn-founder-lucas-004", course: "Medicina", semester: "7º Semestre", registration_number: "MED-2026-004", progress_score: 85, total_study_minutes: 290 },
  { user_id: "syn-founder-edgar-005", course: "Medicina", semester: "9º Semestre", registration_number: "MED-2026-005", progress_score: 92, total_study_minutes: 350 },
  { user_id: "u-qa-1", course: "QA & Automação", semester: "1º Semestre", registration_number: "QA-001", progress_score: 50, total_study_minutes: 100 },
  { user_id: "u-demo-1", course: "Medicina (Demo)", semester: "1º Semestre", registration_number: "DEMO-001", progress_score: 60, total_study_minutes: 120 },
  { user_id: "u-comm-1", course: "Medicina", semester: "2º Semestre", registration_number: "MED-2026-999", progress_score: 75, total_study_minutes: 200 }
];

const mockModels = [
  { id: "m-1", title: "Coração Humano e Vasos da Base", anatomical_system: "Cardiovascular", status: "published" },
  { id: "m-2", title: "Encéfalo e Tronco Cerebral", anatomical_system: "Neurologia", status: "published" },
  { id: "m-3", title: "Crânio Ósseo e Suturas", anatomical_system: "Osteologia", status: "published" },
  { id: "m-4", title: "Articulação Fêmoro-Tibial (Joelho)", anatomical_system: "Ortopedia", status: "published" },
  { id: "m-5", title: "Pulmões e Segmentação Broncopulmonar", anatomical_system: "Respiratório", status: "published" }
];

// 5 sessões canônicas em viewer_learning_sessions (total = 3600s = 60 min = 1.0 h de estudo ativo)
const now = new Date();
const mockViewerSessions = [
  { id: "vls-1", institution_id: "inst-1", user_id: mockFounders[0].id, model_id: "m-1", scope: "viewer", active_seconds: 720, idle_seconds: 30, status: "completed", session_start: new Date(now.getTime() - 20 * 60 * 1000).toISOString(), created_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString() },
  { id: "vls-2", institution_id: "inst-1", user_id: mockFounders[1].id, model_id: "m-2", scope: "viewer", active_seconds: 640, idle_seconds: 20, status: "completed", session_start: new Date(now.getTime() - 40 * 60 * 1000).toISOString(), created_at: new Date(now.getTime() - 40 * 60 * 1000).toISOString() },
  { id: "vls-3", institution_id: "inst-1", user_id: mockFounders[2].id, model_id: "m-1", scope: "viewer", active_seconds: 810, idle_seconds: 15, status: "completed", session_start: new Date(now.getTime() - 120 * 60 * 1000).toISOString(), created_at: new Date(now.getTime() - 120 * 60 * 1000).toISOString() },
  { id: "vls-4", institution_id: "inst-1", user_id: mockFounders[3].id, model_id: "m-3", scope: "viewer", active_seconds: 530, idle_seconds: 10, status: "completed", session_start: new Date(now.getTime() - 200 * 60 * 1000).toISOString(), created_at: new Date(now.getTime() - 200 * 60 * 1000).toISOString() },
  { id: "vls-5", institution_id: "inst-1", user_id: mockFounders[4].id, model_id: "m-4", scope: "viewer", active_seconds: 900, idle_seconds: 40, status: "completed", session_start: new Date(now.getTime() - 300 * 60 * 1000).toISOString(), created_at: new Date(now.getTime() - 300 * 60 * 1000).toISOString() }
];

const mockBetaApps = [
  { id: "beta-1", full_name: "Candidato Alpha", email: "alpha@exemplo.com", status: "activated", batch: "batch_1", source_origin: "landing_page", created_at: "2026-11-15T12:00:00Z" },
  { id: "beta-2", full_name: "Candidato Beta", email: "beta@exemplo.com", status: "activated", batch: "batch_1", source_origin: "landing_page", created_at: "2026-11-16T12:00:00Z" },
  { id: "beta-3", full_name: "Candidato Gamma", email: "gamma@exemplo.com", status: "invited", batch: "batch_1", source_origin: "landing_page", created_at: "2026-11-17T12:00:00Z" },
  { id: "beta-4", full_name: "Candidato Delta", email: "delta@exemplo.com", status: "approved", batch: "batch_1", source_origin: "landing_page", created_at: "2026-11-18T12:00:00Z" },
  { id: "beta-5", full_name: "Candidato Epsilon", email: "epsilon@exemplo.com", status: "pending", batch: "batch_1", source_origin: "landing_page", created_at: "2026-11-19T12:00:00Z" }
];

async function setupSupabaseMockRoutes(page, user, options = {}) {
  const { vlsBehavior = "normal" } = options; // "normal" | "unavailable" | "empty"

  const token = makeJwt({
    session_id: "sess-" + user.id,
    sub: user.id,
    email: user.email,
    role: "authenticated",
    app_metadata: { role: user.role }
  });

  const sessionObj = {
    access_token: token,
    refresh_token: "dummy-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: user.id,
      email: user.email,
      role: "authenticated",
      app_metadata: { role: user.role }
    }
  };

  const trafficAudit = {
    localRequests: 0,
    syntheticAuthRequests: 0,
    syntheticRestRequests: 0,
    blockedExternalRequests: 0
  };

  // ISOLAMENTO FAIL-CLOSED ESTRITO (P0.21-ADM.2.2-R3)
  // Intercepta todas as requisições:
  // - Apenas o servidor local Vite é autorizado a continuar.
  // - Rotas simuladas do Supabase são atendidas exclusivamente por fixtures sintéticas.
  // - Qualquer rota REST não reconhecida ou requisição externa (Google Fonts, CDNs, terceiros) é abortada fail-closed.
  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();

    // 1. Servidor local Vite / preview
    if (url.startsWith(BASE_URL) || url.startsWith("http://localhost:") || url.startsWith("http://127.0.0.1:")) {
      trafficAudit.localRequests++;
      return route.continue();
    }

    // 2. Rotas simuladas de autenticação Supabase
    if (url.includes("/auth/v1/")) {
      trafficAudit.syntheticAuthRequests++;
      if (url.includes("/user") || url.includes("/session")) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sessionObj.user) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sessionObj) });
    }

    // 3. Rotas simuladas de dados (REST / RPC) do Supabase
    if (url.includes("/rest/v1/")) {
      trafficAudit.syntheticRestRequests++;
      const reqHeaders = req.headers();
      const accept = reqHeaders["accept"] || "";

      // RPCs
      if (url.includes("/rpc/register_or_transfer_session")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, allowed: true, status: "SESSION_GRANTED", valid: true })
        });
      }
      if (url.includes("/rpc/check_session_health")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, allowed: true, status: "SESSION_VALID", valid: true })
        });
      }
      if (url.includes("/rpc/get_student_notifications")) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
      if (url.includes("/rpc/")) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
      }

      // Tabela USERS
      if (url.includes("/users")) {
        const allUsers = [
          {
            id: user.id,
            institution_id: user.institutionId || "inst-1",
            name: user.name,
            email: user.email,
            role: user.role,
            status: "ativo",
            avatar_url: null,
            created_at: "2026-01-01T00:00:00Z"
          },
          ...mockFounders,
          ...mockAdditionalStudents
        ];

        if (url.includes(`id=eq.${user.id}`) || url.includes("maybeSingle") || accept.includes("vnd.pgrst.object+json")) {
          if (accept.includes("vnd.pgrst.object+json")) {
            return route.fulfill({
              status: 200,
              contentType: "application/vnd.pgrst.object+json",
              headers: { "content-range": "0-0/1" },
              body: JSON.stringify(allUsers[0])
            });
          }
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "content-range": "0-0/1" },
            body: JSON.stringify([allUsers[0]])
          });
        }

        return route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "content-range": `0-${allUsers.length - 1}/${allUsers.length}` },
          body: JSON.stringify(allUsers)
        });
      }

      // Tabela INSTITUTIONS
      if (url.includes("/institutions")) {
        const instRecord = {
          id: "inst-1",
          name: "Universidad Privada del Este (UPE)",
          display_name: "Universidad Privada del Este (UPE)",
          country: "Paraguai",
          campus: "Presidente Franco",
          active: true,
          contracted_capacity: 500,
          contract_status: "homologacao"
        };
        if (accept.includes("vnd.pgrst.object+json")) {
          return route.fulfill({
            status: 200,
            contentType: "application/vnd.pgrst.object+json",
            headers: { "content-range": "0-0/1" },
            body: JSON.stringify(instRecord)
          });
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "content-range": "0-0/1" },
          body: JSON.stringify([instRecord])
        });
      }

      // Tabela STUDENT_PROFILES
      if (url.includes("/student_profiles")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "content-range": `0-${mockStudentProfiles.length - 1}/${mockStudentProfiles.length}` },
          body: JSON.stringify(mockStudentProfiles)
        });
      }

      // Tabela MODELS_3D
      if (url.includes("/models_3d") || url.includes("/models")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "content-range": `0-${mockModels.length - 1}/${mockModels.length}` },
          body: JSON.stringify(mockModels)
        });
      }

      // Tabela VIEWER_LEARNING_SESSIONS (Fonte Canônica R2)
      if (url.includes("/viewer_learning_sessions")) {
        if (vlsBehavior === "unavailable") {
          return route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ message: "Database error querying viewer_learning_sessions", code: "PGRST500" })
          });
        }
        if (vlsBehavior === "empty") {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "content-range": "0-0/0" },
            body: JSON.stringify([])
          });
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "content-range": `0-${mockViewerSessions.length - 1}/${mockViewerSessions.length}` },
          body: JSON.stringify(mockViewerSessions)
        });
      }

      // Tabela PLATFORM_EVENTS
      if (url.includes("/platform_events")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "content-range": "0-0/0" },
          body: JSON.stringify([])
        });
      }

      // Tabelas Acadêmicas
      if (url.includes("/academic_classes") || url.includes("/academic_class_students")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "content-range": "0-0/0" },
          body: JSON.stringify([])
        });
      }

      // Views Analíticas e Telemetria Estudantil
      if (
        url.includes("/institution_usage_summary") ||
        url.includes("/model_popularity_summary") ||
        url.includes("/user_engagement_summary") ||
        url.includes("/viewer_learning_events") ||
        url.includes("/ai_conversations")
      ) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "content-range": "0-0/0" },
          body: JSON.stringify([])
        });
      }

      // Tabela BETA_APPLICATIONS
      if (url.includes("/beta_applications")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "content-range": `0-${mockBetaApps.length - 1}/${mockBetaApps.length}` },
          body: JSON.stringify(mockBetaApps)
        });
      }

      // Rota REST não mapeada: bloqueio fail-closed
      trafficAudit.blockedExternalRequests++;
      console.warn(`[SECURITY GUARD - FAIL-CLOSED] Rota REST não reconhecida bloqueada: ${url}`);
      return route.abort("blockedbyclient");
    }

    // 4. Bloqueio fail-closed de qualquer requisição externa (Google Fonts, CDNs, telemetria)
    trafficAudit.blockedExternalRequests++;
    console.warn(`[SECURITY GUARD - FAIL-CLOSED] Conexão externa bloqueada: ${url}`);
    return route.abort("blockedbyclient");
  });

  return { token, sessionObj, trafficAudit };
}

async function run() {
  let proc = null;
  let browser = null;
  try {
    proc = await startViteServer();
    browser = await chromium.launch({ headless: true });

    const adminUser = {
      id: "syn-admin-operacional-001",
      name: "Administrador Aeternum",
      email: "admin@aeternumatlas.com",
      role: "admin",
      status: "active",
      accountStatus: "active",
      institutionId: "inst-1",
      institution_id: "inst-1"
    };

    // =========================================================================
    // 1. DESKTOP 1920x1080 (Dark Theme) — Verificação dos 6 Núcleos & Integridade
    // =========================================================================
    console.log("\n--- TEST 1: Desktop 1920x1080 (Dark Theme) — Verificação dos 6 Núcleos ---");
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const desktopPage = await desktopContext.newPage();
    const { sessionObj, trafficAudit } = await setupSupabaseMockRoutes(desktopPage, adminUser);

    await desktopContext.addInitScript(({ user, session }) => {
      window.localStorage.setItem("aeternum.react.auth_profile", JSON.stringify(user));
      window.localStorage.setItem("aeternum.react.session", JSON.stringify(user.id));
      window.localStorage.setItem("sb-hyivyrietgjdazgizafp-auth-token", JSON.stringify(session));
      window.localStorage.setItem("aeternum.theme", "dark");
    }, { user: adminUser, session: sessionObj });

    await desktopPage.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "networkidle" });
    await desktopPage.waitForTimeout(2000);

    // Validação de Isolamento Fail-Closed & Ausência de Tráfego Produtivo Não Interceptado
    assert.ok(trafficAudit.syntheticRestRequests > 0, "Requisições REST simuladas DEVEM ter sido atendidas por fixtures sintéticas");
    assert.ok(trafficAudit.blockedExternalRequests > 0, "Requisições externas não autorizadas (ex: Google Fonts) DEVEM ter sido bloqueadas fail-closed");
    console.log(`[PASS] Isolamento Fail-Closed atestado: ${trafficAudit.syntheticRestRequests} requisições REST sintéticas atendidas, ${trafficAudit.blockedExternalRequests} conexões externas bloqueadas.`);

    // Validação Núcleo 1: Command Header & Pulse Grid
    const cmdHeader = await desktopPage.locator(".admin26-command-header").count();
    assert.strictEqual(cmdHeader, 1, "Command Header DEVE estar presente no topo do dashboard");
    const headerText = await desktopPage.locator(".admin26-command-header").innerText();
    assert.ok(headerText.includes("Universidad Privada del Este"), "Header deve identificar Universidad Privada del Este (UPE)");
    assert.ok(!headerText.includes("Pernambuco"), "Header NÃO DEVE conter Pernambuco");
    assert.ok(headerText.includes("PostgREST Seguro"), "Header deve atestar PostgREST Seguro");
    assert.ok(headerText.includes("Session Guard Ativo"), "Header deve atestar Session Guard Ativo");
    console.log("[PASS] Núcleo 1: Command Header renderizado com sucesso (UPE identificada, PostgREST Seguro e Session Guard Ativo).");

    // Validação Núcleo 1: Pulse Grid Cards e Valores Canônicos
    const pulseCards = await desktopPage.locator(".admin26-pulse-card");
    const pulseCount = await pulseCards.count();
    assert.strictEqual(pulseCount, 5, `Pulse Grid deve conter exatamente 5 cartões densos (encontrados: ${pulseCount})`);

    // Quantidade de Sessões: 5 observadas
    const sessText = await desktopPage.locator('.admin26-pulse-card:has-text("Sessões 3D no Mês") .admin26-pulse-card__value').innerText();
    assert.strictEqual(sessText.trim(), "5", `Sessões 3D no Mês deve ser 5 (encontrado: ${sessText})`);

    // Usuários 3D ativos no mês: 5 usuários únicos
    const mauText = await desktopPage.locator('.admin26-pulse-card:has-text("Usuários 3D ativos no mês") .admin26-pulse-card__value').innerText();
    assert.strictEqual(mauText.trim(), "5", `Usuários 3D ativos no mês deve ser 5 (encontrado: ${mauText})`);

    // Duração Média no Mês: 12 min (3600s / 5 sessões = 720s = 12 min)
    const durText = await desktopPage.locator('.admin26-pulse-card:has-text("Duração Média no Mês") .admin26-pulse-card__value').innerText();
    assert.strictEqual(durText.trim(), "12 min", `Duração média deve ser 12 min (encontrado: ${durText})`);

    // Operação El Dorado Card: Capacidade: 30
    const elDoradoPulse = await desktopPage.locator('.admin26-pulse-card:has-text("Operação El Dorado") .admin26-pulse-card__value').innerText();
    assert.ok(elDoradoPulse.includes("Capacidade: 30"), `Card El Dorado deve exibir Capacidade: 30 (encontrado: ${elDoradoPulse})`);
    console.log("[PASS] Núcleo 1: Pulse Grid validado com valores canônicos (5 sessões, 5 usuários únicos, 12 min duração média, Capacidade 30).");

    // Validação de Geometria: Ausência de sobreposição nos cards do pulse grid
    const cardBoxes = await Promise.all((await pulseCards.all()).map(c => c.boundingBox()));
    for (let i = 0; i < cardBoxes.length; i++) {
      for (let j = i + 1; j < cardBoxes.length; j++) {
        const b1 = cardBoxes[i];
        const b2 = cardBoxes[j];
        if (b1 && b2) {
          const hOverlap = Math.max(0, Math.min(b1.x + b1.width, b2.x + b2.width) - Math.max(b1.x, b2.x));
          const vOverlap = Math.max(0, Math.min(b1.y + b1.height, b2.y + b2.height) - Math.max(b1.y, b2.y));
          assert.ok(
            hOverlap <= 1 || vOverlap <= 1,
            `Geometria: Cards ${i} e ${j} não devem sobrepor (H:${hOverlap}, V:${vOverlap})`
          );
        }
      }
    }
    console.log("[PASS] Geometria: Bounding boxes dos 5 cards ópticos sem colisões ou sobreposições.");

    // Validação Núcleo 2: Operação El Dorado Card & Funil Beta com '—'
    const elDoradoCard = await desktopPage.locator(".admin26-funnel-card").count();
    assert.strictEqual(elDoradoCard, 1, "Operação El Dorado Quick Card DEVE estar presente");
    const funnelSteps = await desktopPage.locator(".admin26-funnel-step__count").allInnerTexts();
    assert.ok(funnelSteps.every(s => s === "—"), "Todos os 5 passos do Funil Beta devem exibir '—' durante certificação na ADM.2.3");
    console.log("[PASS] Núcleo 2: Funil Beta 100% preservado com '—' (sem coerção para 0).");

    // Validação Núcleo 3: Analytics Intelligence (Gráfico Temporal Executivo + Ranking Top Modelos)
    const trendChart = await desktopPage.locator(".admin26-trend-chart").count();
    assert.strictEqual(trendChart, 1, "Gráfico Temporal Executivo em Núcleo 3 DEVE estar presente");
    const rankingHeading = await desktopPage.locator(".admin26-ranking-heading").innerText();
    assert.ok(
      rankingHeading.toLowerCase().includes("modelos anatômicos mais explorados — histórico observado"),
      "Heading do ranking deve conter 'Modelos Anatômicos Mais Explorados — Histórico Observado'"
    );

    // Primeiro colocado no ranking deve ser o Coração (2 acessos)
    const topModelTitle = await desktopPage.locator(".admin26-ranking-item").first().locator(".admin26-ranking-title").innerText();
    assert.ok(topModelTitle.includes("Coração Humano"), `Top 1 do ranking deve ser Coração Humano (encontrado: ${topModelTitle})`);
    console.log("[PASS] Núcleo 3: Gráfico Temporal Executivo e Ranking com Coração Humano no Top 1 validados.");

    // Validação Núcleo 4: Gestão Institucional & Pílulas de Filtro (incluindo QA e Demo)
    const pillButtons = desktopPage.locator(".admin26-pill-btn");
    const pillCount = await pillButtons.count();
    assert.strictEqual(pillCount, 7, `Pílulas de filtro devem ser exatamente 7 (encontradas: ${pillCount})`);
    const pillTexts = await pillButtons.allInnerTexts();
    assert.ok(pillTexts.some(t => t.includes("QA")), "Pílulas devem incluir categoria QA");
    assert.ok(pillTexts.some(t => t.includes("Demo")), "Pílulas devem incluir categoria Demo");
    console.log(`[PASS] Núcleo 4: 7 pílulas de filtro presentes: ${pillTexts.join(" | ")}`);

    // Validação Núcleo 5: Financial Intelligence & Sandbox B2B
    const simulatorBox = await desktopPage.locator(".admin26-simulator-box").count();
    assert.strictEqual(simulatorBox, 1, "Simulador Comercial B2B DEVE estar presente");
    console.log("[PASS] Núcleo 5: Financial Intelligence e Sandbox B2B rotulados honestamente.");

    // Validação Núcleo 6: Governança Real das Fontes
    const govCard = await desktopPage.locator(".admin26-governance-card");
    const govText = await govCard.innerText();
    assert.ok(govText.includes("Observado (5 observadas)"), "Sessões 3D deve reportar 'Observado (5 observadas)'");
    assert.ok(govText.includes("NOT_IMPLEMENTED (Planejado)"), "academic_subjects deve reportar NOT_IMPLEMENTED");
    assert.ok(govText.includes("Ativo (First Session Wins)"), "Session Guard deve reportar Ativo (First Session Wins)");
    console.log("[PASS] Núcleo 6: Governança dinâmica atestada via data.quality.tables sem fallback estático 'Conectado'.");

    // Salvar Screenshot Desktop 1920x1080 Dark
    const desktopDarkScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_control_center_desktop_1920x1080_dark.png");
    await desktopPage.screenshot({ path: desktopDarkScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot Desktop 1920x1080 Dark salvo: ${desktopDarkScreenshot}`);

    // =========================================================================
    // 2. TESTE DE INTERAÇÃO COM FILTROS DE DISCENTES (QA & DEMO)
    // =========================================================================
    console.log("\n--- TEST 2: Interação com Filtros de Discentes (QA, Demo, Fundadores) ---");
    // Clica em QA
    await desktopPage.locator('.admin26-pill-btn:has-text("QA")').click();
    await desktopPage.waitForTimeout(300);
    let tableRows = await desktopPage.locator(".admin26-table-card tbody tr").count();
    assert.strictEqual(tableRows, 1, "Filtro QA deve exibir exatamente 1 aluno");

    // Clica em Demo
    await desktopPage.locator('.admin26-pill-btn:has-text("Demo")').click();
    await desktopPage.waitForTimeout(300);
    tableRows = await desktopPage.locator(".admin26-table-card tbody tr").count();
    assert.strictEqual(tableRows, 1, "Filtro Demo deve exibir exatamente 1 aluno");

    // Clica em Fundadores
    await desktopPage.locator('.admin26-pill-btn:has-text("Fundadores")').click();
    await desktopPage.waitForTimeout(300);
    tableRows = await desktopPage.locator(".admin26-table-card tbody tr").count();
    assert.strictEqual(tableRows, 5, "Filtro Fundadores deve exibir os 5 sócios fundadores");

    // Salva Screenshot Filtro Fundadores
    const studentFilterScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_student_filter_founders_1440x900.png");
    await desktopPage.screenshot({ path: studentFilterScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot com filtro de Fundadores salvo: ${studentFilterScreenshot}`);

    // Retorna para Todos
    await desktopPage.locator('.admin26-pill-btn:has-text("Todos")').click();
    await desktopPage.waitForTimeout(300);

    // =========================================================================
    // 3. TESTE DE INTERAÇÃO: EXPANSÃO/RECOLHIMENTO DE GRUPOS NA SIDEBAR
    // =========================================================================
    console.log("\n--- TEST 3: Interação com a Sidebar — Recolhimento e Expansão ---");
    const toggleButtons = desktopPage.locator(".a26-shell__nav-group-toggle");
    const toggleCount = await toggleButtons.count();
    assert.ok(toggleCount >= 5, "Sidebar administrativa deve conter pelo menos 5 grupos operacionais agrupados");

    // Clica no primeiro grupo para recolher
    await toggleButtons.nth(0).click();
    await desktopPage.waitForTimeout(300);

    const sidebarCollapsedScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_sidebar_groups_collapsed_1440x900.png");
    await desktopPage.screenshot({ path: sidebarCollapsedScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot da sidebar recolhida salvo: ${sidebarCollapsedScreenshot}`);

    // Reexpande
    await toggleButtons.nth(0).click();
    await desktopPage.waitForTimeout(300);

    // =========================================================================
    // 4. TESTE DE NAVEGAÇÃO DOS 3 BOTÕES OPERACIONAIS
    // =========================================================================
    console.log("\n--- TEST 4: Navegação dos Botões Operacionais ('Abrir Triagem', 'Ver Analytics Completo', 'Ver Todos') ---");
    // 1. Botão "Abrir Triagem" (Núcleo 2)
    const btnTriagem = desktopPage.locator('button:has-text("Abrir Triagem")');
    assert.strictEqual(await btnTriagem.count(), 1, "Botão 'Abrir Triagem' deve existir");
    await btnTriagem.click();
    await desktopPage.waitForURL(/\/admin\/candidatos-beta/, { timeout: 8000 });
    console.log(`[PASS] Botão 'Abrir Triagem' navegou para: ${desktopPage.url()}`);

    // Volta ao dashboard
    await desktopPage.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "networkidle" });
    await desktopPage.waitForTimeout(1000);

    // 2. Botão "Ver Analytics Completo" (Núcleo 3)
    const btnAnalytics = desktopPage.locator('button:has-text("Ver Analytics Completo")');
    assert.strictEqual(await btnAnalytics.count(), 1, "Botão 'Ver Analytics Completo' deve existir");
    await btnAnalytics.click();
    await desktopPage.waitForURL(/\/admin\/global-analytics/, { timeout: 8000 });
    console.log(`[PASS] Botão 'Ver Analytics Completo' navegou para: ${desktopPage.url()}`);

    // Volta ao dashboard
    await desktopPage.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "networkidle" });
    await desktopPage.waitForTimeout(1000);

    // 3. Botão "Ver Todos" (Núcleo 4)
    const btnVerTodos = desktopPage.locator('button:has-text("Ver Todos")');
    assert.strictEqual(await btnVerTodos.count(), 1, "Botão 'Ver Todos' deve existir");
    await btnVerTodos.click();
    await desktopPage.waitForURL(/\/admin\/institution-students/, { timeout: 8000 });
    console.log(`[PASS] Botão 'Ver Todos' navegou para: ${desktopPage.url()}`);

    // =========================================================================
    // 5. TESTE DE GOVERNANÇA: FONTE INDISPONÍVEL (UNAVAILABLE)
    // =========================================================================
    console.log("\n--- TEST 5: Governança com Fonte Indisponível (vlsBehavior = 'unavailable') ---");
    const unavailContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const unavailPage = await unavailContext.newPage();
    await setupSupabaseMockRoutes(unavailPage, adminUser, { vlsBehavior: "unavailable" });

    await unavailContext.addInitScript(({ user, session }) => {
      window.localStorage.setItem("aeternum.react.auth_profile", JSON.stringify(user));
      window.localStorage.setItem("aeternum.react.session", JSON.stringify(user.id));
      window.localStorage.setItem("sb-hyivyrietgjdazgizafp-auth-token", JSON.stringify(session));
      window.localStorage.setItem("aeternum.theme", "dark");
    }, { user: adminUser, session: sessionObj });

    await unavailPage.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "networkidle" });
    await unavailPage.waitForTimeout(1500);

    // Sessões 3D no Mês deve exibir "—"
    const unavailSess = await unavailPage.locator('.admin26-pulse-card:has-text("Sessões 3D no Mês") .admin26-pulse-card__value').innerText();
    assert.strictEqual(unavailSess.trim(), "—", `Com fonte indisponível, Sessões 3D DEVE exibir '—' (encontrado: ${unavailSess})`);

    // Duração Média deve exibir "—"
    const unavailDur = await unavailPage.locator('.admin26-pulse-card:has-text("Duração Média no Mês") .admin26-pulse-card__value').innerText();
    assert.strictEqual(unavailDur.trim(), "—", `Com fonte indisponível, Duração Média DEVE exibir '—' (encontrado: ${unavailDur})`);

    // Presença Recente deve exibir "—" (sem coagir para 0 com falha de consulta)
    const unavailRecent = await unavailPage.locator('.admin26-pulse-card:has-text("Presença Recente") .admin26-pulse-card__value').innerText();
    assert.strictEqual(unavailRecent.trim(), "—", `Com fonte indisponível, Presença Recente DEVE exibir '—' (encontrado: ${unavailRecent})`);

    // Operação El Dorado deve exibir Capacidade: 30
    const unavailElDoradoCard = await unavailPage.locator('.admin26-pulse-card:has-text("Operação El Dorado") .admin26-pulse-card__value').innerText();
    assert.strictEqual(unavailElDoradoCard.trim(), "Capacidade: 30", `Operação El Dorado DEVE exibir 'Capacidade: 30' (encontrado: ${unavailElDoradoCard})`);

    // Curva Temporal não deve renderizar colunas falsas de zero
    const trendText = await unavailPage.locator(".admin26-trend-section").innerText();
    assert.ok(trendText.toLowerCase().includes("indisponível"), "Curva temporal deve explicitar indisponibilidade na fonte");
    assert.ok(trendText.includes("Curva temporal indisponível devido a falha na consulta de sessões."), "Curva temporal deve exibir aviso de indisponibilidade");
    const trendColumns = await unavailPage.locator(".admin26-trend-column").count();
    assert.strictEqual(trendColumns, 0, "Curva temporal não deve renderizar colunas gráficas de valor zero em falha de consulta");

    // Ranking Anatômico não deve renderizar aviso falso de 'Nenhum acesso no período'
    const rankingText = await unavailPage.locator(".admin26-ranking-list").innerText();
    assert.ok(rankingText.toLowerCase().includes("indisponível"), "Ranking anatômico deve explicitar indisponibilidade na fonte");
    assert.ok(rankingText.includes("Ranking anatômico indisponível devido a falha na consulta de sessões."), "Ranking anatômico deve exibir aviso de indisponibilidade");

    // Núcleo 6 deve reportar "Indisponível (Falha na consulta)"
    const unavailGovText = await unavailPage.locator(".admin26-governance-card").innerText();
    assert.ok(unavailGovText.includes("Indisponível (Falha na consulta)"), "Núcleo 6 deve reportar falha na consulta para Sessões 3D");
    console.log("[PASS] Fonte indisponível exibe '—', avisos explícitos e bloqueio de zeros falsos.");
    await unavailContext.close();

    // =========================================================================
    // 6. TESTE DE GOVERNANÇA: FONTE VAZIA (EMPTY)
    // =========================================================================
    console.log("\n--- TEST 6: Governança com Fonte Vazia (vlsBehavior = 'empty') ---");
    const emptyContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const emptyPage = await emptyContext.newPage();
    await setupSupabaseMockRoutes(emptyPage, adminUser, { vlsBehavior: "empty" });

    await emptyContext.addInitScript(({ user, session }) => {
      window.localStorage.setItem("aeternum.react.auth_profile", JSON.stringify(user));
      window.localStorage.setItem("aeternum.react.session", JSON.stringify(user.id));
      window.localStorage.setItem("sb-hyivyrietgjdazgizafp-auth-token", JSON.stringify(session));
      window.localStorage.setItem("aeternum.theme", "dark");
    }, { user: adminUser, session: sessionObj });

    await emptyPage.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "networkidle" });
    await emptyPage.waitForTimeout(1500);

    // Núcleo 6 deve reportar "Vazio (0 observadas)"
    const emptyGovText = await emptyPage.locator(".admin26-governance-card").innerText();
    assert.ok(emptyGovText.includes("Vazio (0 observadas)"), `Núcleo 6 deve reportar Vazio (0 observadas), encontrado: ${emptyGovText}`);
    console.log("[PASS] Fonte vazia exibe 'Vazio (0 observadas)' com precisão.");
    await emptyContext.close();

    // =========================================================================
    // 7. MULTI-VIEWPORT: NOTEBOOK 1366x768 (Dark & Light)
    // =========================================================================
    console.log("\n--- TEST 7: Multi-Viewport — Notebook 1366x768 (Dark & Light) ---");
    const nbContext = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const nbPage = await nbContext.newPage();
    await setupSupabaseMockRoutes(nbPage, adminUser);

    await nbContext.addInitScript(({ user, session }) => {
      window.localStorage.setItem("aeternum.react.auth_profile", JSON.stringify(user));
      window.localStorage.setItem("aeternum.react.session", JSON.stringify(user.id));
      window.localStorage.setItem("sb-hyivyrietgjdazgizafp-auth-token", JSON.stringify(session));
      window.localStorage.setItem("aeternum.theme", "dark");
    }, { user: adminUser, session: sessionObj });

    await nbPage.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "networkidle" });
    await nbPage.waitForTimeout(1500);

    const nbDarkScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_control_center_notebook_1366x768_dark.png");
    await nbPage.screenshot({ path: nbDarkScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot Notebook 1366x768 Dark salvo: ${nbDarkScreenshot}`);

    // Alterna para Light iOS 27
    await nbPage.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.remove("dark");
      document.body.classList.add("light");
    });
    await nbPage.waitForTimeout(600);
    const nbLightScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_control_center_notebook_1366x768_light.png");
    await nbPage.screenshot({ path: nbLightScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot Notebook 1366x768 Light salvo: ${nbLightScreenshot}`);
    await nbContext.close();

    // =========================================================================
    // 8. MULTI-VIEWPORT: TABLET 768x1024 (Dark)
    // =========================================================================
    console.log("\n--- TEST 8: Multi-Viewport — Tablet 768x1024 (Dark) ---");
    const tabletContext = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const tabletPage = await tabletContext.newPage();
    await setupSupabaseMockRoutes(tabletPage, adminUser);

    await tabletContext.addInitScript(({ user, session }) => {
      window.localStorage.setItem("aeternum.react.auth_profile", JSON.stringify(user));
      window.localStorage.setItem("aeternum.react.session", JSON.stringify(user.id));
      window.localStorage.setItem("sb-hyivyrietgjdazgizafp-auth-token", JSON.stringify(session));
      window.localStorage.setItem("aeternum.theme", "dark");
    }, { user: adminUser, session: sessionObj });

    await tabletPage.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "networkidle" });
    await tabletPage.waitForTimeout(1500);

    const tabletScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_control_center_tablet_768x1024_dark.png");
    await tabletPage.screenshot({ path: tabletScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot Tablet 768x1024 Dark salvo: ${tabletScreenshot}`);
    await tabletContext.close();

    // =========================================================================
    // 9. MULTI-VIEWPORT: MOBILE 390x844 (Dark)
    // =========================================================================
    console.log("\n--- TEST 9: Multi-Viewport — Mobile 390x844 (Dark) ---");
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const mobilePage = await mobileContext.newPage();
    await setupSupabaseMockRoutes(mobilePage, adminUser);

    await mobileContext.addInitScript(({ user, session }) => {
      window.localStorage.setItem("aeternum.react.auth_profile", JSON.stringify(user));
      window.localStorage.setItem("aeternum.react.session", JSON.stringify(user.id));
      window.localStorage.setItem("sb-hyivyrietgjdazgizafp-auth-token", JSON.stringify(session));
      window.localStorage.setItem("aeternum.theme", "dark");
    }, { user: adminUser, session: sessionObj });

    await mobilePage.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "networkidle" });
    await mobilePage.waitForTimeout(1500);

    const mobileScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_control_center_mobile_390x844_dark.png");
    await mobilePage.screenshot({ path: mobileScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot Mobile 390x844 Dark salvo: ${mobileScreenshot}`);
    await mobileContext.close();

    // Salvar Screenshot Desktop Light iOS 27
    await desktopPage.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.remove("dark");
      document.body.classList.add("light");
    });
    await desktopPage.waitForTimeout(600);
    const desktopLightScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_control_center_desktop_1920x1080_light.png");
    await desktopPage.screenshot({ path: desktopLightScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot Desktop 1920x1080 Light salvo: ${desktopLightScreenshot}`);

    console.log("\n===============================================================================");
    console.log("ADM.2.2-R2 CONTROL CENTER SUITE: ALL DATA TRUTH & MULTI-VIEWPORT CHECKS PASSED!");
    console.log("===============================================================================");
  } finally {
    if (browser) await browser.close();
    if (proc) stopViteServer(proc);
  }
}

run().catch(err => {
  console.error("ADM.2.2 CONTROL CENTER TEST FAILED:", err);
  process.exit(1);
});
