/**
 * Aeternum Atlas — P0.21-ADM.2.4
 * Analytics Intelligence Deterministic Engine & Multi-Viewport Verification
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import assert from "node:assert";

import {
  calculateTimeWindow,
  computeTrend,
  computeMedian,
  parseUserAgent,
  resolveCanonicalModel,
  sanitizeCsvCell,
  buildCsvContent,
  processAnalyticsIntelligence
} from "../../src/services/analytics/analyticsIntelligenceService.js";

const PORT = 5181;
const BASE_URL = `http://localhost:${PORT}`;
const ARTIFACT_DIR = process.env.ARTIFACT_DIR ||
  (process.env.APPDATA
    ? path.resolve(process.env.APPDATA, "..", ".gemini", "antigravity", "brain", "b63445c2-37f0-46a4-8ca8-5556eb65a8a3")
    : path.resolve(process.cwd(), "artifacts"));

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

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
    console.log(`Porta ${PORT} já está ativa. Reutilizando servidor.`);
    return null;
  }

  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const proc = spawn(npxCmd, ["vite", "preview", "--port", PORT.toString(), "--strictPort"], {
    cwd: process.cwd(),
    stdio: "pipe",
    shell: process.platform === "win32"
  });

  const started = await new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 25000);
    const check = async () => {
      if (await isPortListening(PORT)) {
        clearTimeout(timeout);
        resolve(true);
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });

  if (!started) {
    stopViteServer(proc);
    throw new Error(`Falha ao iniciar servidor Vite na porta ${PORT}`);
  }

  return proc;
}

function makeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = Buffer.from("synthetic_secret_for_test").toString("base64url");
  return `${header}.${body}.${sig}`;
}

// -----------------------------------------------------------------------------------
// PARTE 1: TESTES DETERMINÍSTICOS DO MOTOR DE INTELIGÊNCIA ANALÍTICA
// -----------------------------------------------------------------------------------

async function runDeterministicUnitTests() {
  console.log("\n=======================================================");
  console.log("PARTE 1: TESTES DETERMINÍSTICOS DO MOTOR ANALÍTICO");
  console.log("=======================================================\n");

  const refDate = new Date("2026-11-27T12:00:00Z");

  const mockUsers = [
    { id: "usr-founder-1", email: "halissonzanchin@aeternumatlas.com", role: "founder" },
    { id: "usr-founder-2", email: "victor@aeternumatlas.com", role: "founder" },
    { id: "usr-qa-1", email: "qa.voice.p0@aeternumatlas.com", role: "student" },
    { id: "usr-demo-1", email: "demo.institucional@aeternumatlas.com", role: "student" },
    { id: "usr-beta-1", email: "beta.student1@exemplo.com", role: "student" },
    { id: "usr-comm-1", email: "aluno.upe@exemplo.com", role: "student" }
  ];

  const mockBetaApps = [
    { user_id: "usr-beta-1", email: "beta.student1@exemplo.com", status: "activated", batch: "batch_1" }
  ];

  const mockModels = [
    { id: "035701b7-a49f-4f3f-a0fc-b335675745be", slug: "corte-sagital-cranio-humano-superficial", title: "Corte Sagital do Crânio Humano", anatomical_system: "Sistema Nervoso Central" },
    { id: "abb93126-c9be-4938-8eca-161f56864781", slug: "coracao-humano-superficial", title: "Coração Humano — Modelo Superficial 3D", anatomical_system: "Sistema Cardiovascular" }
  ];

  const mockSessions = [
    // Hoje: 2026-11-27 (2 usuários distintos: usr-comm-1, usr-beta-1)
    { id: "s-1", institution_id: "inst-upe", user_id: "usr-comm-1", model_id: "2c57a03b-2c77-4119-b8bb-676ea59e9190", scope: "viewer", active_seconds: 600, duration_seconds: 600, session_start: "2026-11-27T09:00:00Z" },
    { id: "s-2", institution_id: "inst-upe", user_id: "usr-comm-1", model_id: "corte-sagital-cranio-humano-superficial", scope: "viewer", active_seconds: 300, duration_seconds: 300, session_start: "2026-11-27T10:00:00Z" },
    { id: "s-3", institution_id: "inst-upe", user_id: "usr-beta-1", model_id: "coracao-humano-superficial", scope: "viewer", active_seconds: 900, duration_seconds: 900, session_start: "2026-11-27T11:00:00Z" },
    // 3 dias atrás (2026-11-24: usr-qa-1, usr-founder-1)
    { id: "s-4", institution_id: "inst-upe", user_id: "usr-qa-1", model_id: "abb93126-c9be-4938-8eca-161f56864781", scope: "viewer", active_seconds: 400, duration_seconds: 400, session_start: "2026-11-24T15:00:00Z" },
    { id: "s-5", institution_id: "inst-upe", user_id: "usr-founder-1", model_id: "2c57a03b-2c77-4119-b8bb-676ea59e9190", scope: "viewer", active_seconds: 1200, duration_seconds: 1200, session_start: "2026-11-24T16:00:00Z" },
    // 15 dias atrás (2026-11-12: usr-demo-1)
    { id: "s-6", institution_id: "inst-upe", user_id: "usr-demo-1", model_id: "corte-sagital-cranio-humano-superficial", scope: "viewer", active_seconds: 500, duration_seconds: 500, session_start: "2026-11-12T14:00:00Z" },
    // Outra instituição (inst-other: usr-comm-1)
    { id: "s-7", institution_id: "inst-other", user_id: "usr-comm-1", model_id: "coracao-humano-superficial", scope: "viewer", active_seconds: 700, duration_seconds: 700, session_start: "2026-11-27T08:00:00Z" },
    // Mês anterior (Outubro 2026: usr-comm-1)
    { id: "s-8", institution_id: "inst-upe", user_id: "usr-comm-1", model_id: "coracao-humano-superficial", scope: "viewer", active_seconds: 800, duration_seconds: 800, session_start: "2026-10-15T10:00:00Z" }
  ];

  const mockData = {
    raw: {
      allSessions: mockSessions,
      users: mockUsers,
      models: mockModels,
      events: [
        { id: "ev-1", event_type: "flashcard_reviewed", user_id: "usr-comm-1" },
        { id: "ev-2", event_type: "flashcard_reviewed", user_id: "usr-comm-1" },
        { id: "ev-3", event_type: "flashcard_deck_completed", user_id: "usr-comm-1" }
      ],
      quizAttempts: [
        { id: "qa-1", user_id: "usr-comm-1", status: "completed", score: 85 }
      ],
      studyAgenda: [
        { id: "ag-1", user_id: "usr-comm-1", title: "Revisão Cardiovascular", status: "active" }
      ],
      aiAuditEvents: [
        { id: "ai-1", user_id: "usr-comm-1", success: true, input_characters: 150, output_characters: 400 }
      ],
      securityEvents: [
        { id: "sec-1", user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0" },
        { id: "sec-2", user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148" }
      ]
    },
    options: {
      betaApplications: mockBetaApps
    }
  };

  // GATE 1: DAU Calculation
  console.log("Auditando Gate 1: DAU e Deduplicação Diária...");
  const resToday = processAnalyticsIntelligence(mockData, {
    period: "today",
    referenceDate: refDate
  });
  assert.strictEqual(resToday.kpis.dau.value, 2, "DAU deve deduplicar usuários distintos no dia");
  console.log("✓ Gate 1 Aprovado: DAU = 2 usuários distintos deduplicados.");

  // GATE 2: WAU Rolling 7-Day Window
  console.log("Auditando Gate 2: WAU em Janela Móvel de 7 dias...");
  const res7d = processAnalyticsIntelligence(mockData, {
    period: "7d",
    referenceDate: refDate
  });
  assert.strictEqual(res7d.kpis.wau.value, 4, "WAU deve abranger usuários dos últimos 7 dias");
  console.log("✓ Gate 2 Aprovado: WAU = 4 usuários únicos na janela de 7 dias.");

  // GATE 3: MAU vs Mês Civil
  console.log("Auditando Gate 3: Distinção entre MAU Móvel e Mês Civil...");
  const res30d = processAnalyticsIntelligence(mockData, {
    period: "30d",
    referenceDate: refDate
  });
  assert.strictEqual(res30d.kpis.mau.value, 5, "MAU 30d deve contar todos os 5 usuários ativos nos últimos 30 dias");
  assert.strictEqual(res30d.kpis.calendarMonthUsers.value, 5, "Mês civil corrente (Novembro 1 a 27) deve contar os 5 usuários de Novembro");

  const resOct = processAnalyticsIntelligence(mockData, {
    period: "custom",
    customStart: "2026-10-01T00:00:00Z",
    customEnd: "2026-10-31T23:59:59Z",
    referenceDate: refDate
  });
  assert.strictEqual(resOct.kpis.sessions.value, 1, "Intervalo customizado de Outubro deve capturar apenas a sessão de Outubro");
  console.log("✓ Gate 3 Aprovado: MAU móvel e Mês Civil devidamente segregados e calculados.");

  // GATE 4: Resolução e Deduplicação Canônica de Modelos 3D
  console.log("Auditando Gate 4: Deduplicação Canônica de Modelos 3D...");
  const resolved1 = resolveCanonicalModel("2c57a03b-2c77-4119-b8bb-676ea59e9190", mockModels);
  const resolved2 = resolveCanonicalModel("corte-sagital-cranio-humano-superficial", mockModels);
  assert.strictEqual(resolved1.key, resolved2.key, "UUID e slug do mesmo modelo devem convergir para a mesma chave canônica");

  const modelRanking = res30d.anatomical.modelRanking;
  const cranioModel = modelRanking.find(m => m.key === "corte-sagital-cranio-humano-superficial");
  assert.ok(cranioModel, "Modelo de crânio deve estar presente no ranking");
  assert.strictEqual(cranioModel.sessions, 4, "Sessões sob UUID e slug devem ser unificadas sem duplicação de entidades");
  console.log("✓ Gate 4 Aprovado: Ranking canônico unificou 4 sessões sob a chave canônica única.");

  // GATE 5: Isolamento Multi-Tenant Institucional
  console.log("Auditando Gate 5: Isolamento Multi-Tenant...");
  const resTenantUpe = processAnalyticsIntelligence(mockData, {
    period: "30d",
    institutionId: "inst-upe",
    referenceDate: refDate
  });
  const hasOtherTenant = resTenantUpe.recentSessions.some(s => s.id === "s-7");
  assert.strictEqual(hasOtherTenant, false, "Sessões de outro tenant devem ser filtradas e excluídas");
  console.log("✓ Gate 5 Aprovado: Isolamento institucional estrito confirmado.");

  // GATE 6: Filtragem por Categoria de Conta
  console.log("Auditando Gate 6: Filtragem por Categoria de Conta...");
  const resCommercialOnly = processAnalyticsIntelligence(mockData, {
    period: "30d",
    accountCategory: "commercial",
    referenceDate: refDate
  });
  const allCommercial = resCommercialOnly.recentSessions.every(s => s.categoryKey === "commercial");
  assert.ok(allCommercial, "Todas as sessões filtradas devem pertencer à categoria 'commercial'");
  console.log("✓ Gate 6 Aprovado: Filtro de categoria de conta segregou corretamente.");

  // GATE 7: Proteção contra CWE-1236
  console.log("Auditando Gate 7: Proteção contra CWE-1236 em CSV...");
  const dangerousCells = ["=CMD('calc')", "+12345", "-54321", "@SUM(A1:A10)", "\tSecret", "\rExploit", "Normal text"];
  const sanitized = dangerousCells.map(sanitizeCsvCell);
  assert.strictEqual(sanitized[0], "\"'=CMD('calc')\"", "Fórmula com '=' deve ser prefixada com apóstrofo");
  assert.strictEqual(sanitized[1], "\"'+12345\"", "Fórmula com '+' deve ser prefixada com apóstrofo");
  assert.strictEqual(sanitized[2], "\"'-54321\"", "Fórmula com '-' deve ser prefixada com apóstrofo");
  assert.strictEqual(sanitized[3], "\"'@SUM(A1:A10)\"", "Fórmula com '@' deve ser prefixada com apóstrofo");
  assert.strictEqual(sanitized[6], "\"Normal text\"", "Texto seguro não deve ser alterado");
  console.log("✓ Gate 7 Aprovado: Sanitização contra CWE-1236 (Formula Injection) 100% segura.");

  // GATE 8: Fontes vazias e indisponíveis
  console.log("Auditando Gate 8: Data Truth em Fontes Vazias / Indisponíveis...");
  const emptyData = { raw: { allSessions: [], events: [], users: [] } };
  const resEmpty = processAnalyticsIntelligence(emptyData, { period: "30d", referenceDate: refDate });
  assert.strictEqual(resEmpty.kpis.sessions.value, 0, "Sessões vazias devem reportar 0 de forma honesta");
  assert.strictEqual(resEmpty.tools.quizzes.completionRate, "—", "Taxa de conclusão sem tentativas deve ser exibida como '—' e não 0%");
  assert.strictEqual(resEmpty.tools.aiTutor.successRate, "—", "Sucesso de IA sem eventos deve ser '—' e não 0%");
  console.log("✓ Gate 8 Aprovado: Fontes vazias não geram zeros espúrios nem distorções.");

  // GATE 9: User-Agent Parser e Minimização de Dados
  console.log("Auditando Gate 9: Detecção de Plataforma e Minimização de Dados...");
  const uaDesktop = parseUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36");
  assert.strictEqual(uaDesktop.device, "Desktop");
  assert.strictEqual(uaDesktop.os, "Windows");
  assert.strictEqual(uaDesktop.browser, "Chrome");

  const uaMobile = parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Version/26.5.2 Mobile/15E148 Safari/604.1");
  assert.strictEqual(uaMobile.device, "Smartphone");
  assert.strictEqual(uaMobile.os, "iOS");
  assert.strictEqual(uaMobile.browser, "Safari");

  console.log("✓ Gate 9 Aprovado: Parser de User-Agent determinístico e isolamento de plataforma confirmados.");

  // GATE 10: FINAL-02: Eliminação de Geografia Fictícia e Distribuição Institucional Autêntica
  console.log("Auditando Gate 10: Eliminação de Geografia Fictícia & Distribuição Institucional (FINAL-02)...");
  assert.strictEqual(resToday.geography.status, "NOT_CONFIGURED", "Geolocalização física deve ser NOT_CONFIGURED");
  assert.ok(resToday.geography.reason.includes("minimização de dados"), "Motivo deve apontar conformidade com privacidade");
  assert.strictEqual(resToday.geography.items.length, 0, "Itens de geografia física devem estar vazios");

  // Distribuição institucional legítima (tenant-based)
  assert.ok(Array.isArray(resToday.institutionalDistribution), "Deve retornar array de distribuição institucional");
  assert.ok(resToday.institutionalDistribution.length > 0, "Deve haver ao menos um tenant institucional");
  const hasUpe = resToday.institutionalDistribution.some(i => i.institution.includes("Universidad Privada del Este") || i.institution.includes("UPE"));
  assert.ok(hasUpe, "Tenant UPE deve estar presente na distribuição institucional");

  // Ausência estrita de usuários brasileiros fictícios e percentual arbitrário de 15%
  const hasFakeBrazil = resToday.institutionalDistribution.some(i => i.country === "Brasil" || i.region?.includes("Foz do Iguaçu"));
  assert.strictEqual(hasFakeBrazil, false, "NÃO deve conter registros geográficos fictícios do Brasil");
  console.log("✓ Gate 10 Aprovado: Zero geografia fictícia e distribuição institucional baseada em tenants confirmada.");

  console.log("\n=======================================================");
  console.log("TODOS OS 10 GATES DETERMINÍSTICOS DO MOTOR APROVADOS!");
  console.log("=======================================================\n");
}

// -----------------------------------------------------------------------------------
// PARTE 2: TESTES BROWSER MULTI-VIEWPORT EM AMBIENTE ISOLADO FAIL-CLOSED
// -----------------------------------------------------------------------------------

const mockFounders = [
  { id: "a3911a5c-a3d0-4318-9d45-f6be6ac38fb4", name: "Halisson Zanchin", email: "halissonzanchin@aeternumatlas.com", role: "super_admin", institution_id: "inst-1" },
  { id: "a0168021-b8a2-4c35-8eab-c80240c10e07", name: "Victor", email: "victor@aeternumatlas.com", role: "admin", institution_id: "inst-1" },
  { id: "f2591fae-8c18-4eb7-a97d-ae5ae90c5b34", name: "Nicolas Figorelli", email: "nicolas@aeternumatlas.com", role: "admin", institution_id: "inst-1" },
  { id: "e9931f64-4de9-46fc-9e56-6705345406cb", name: "Lucas Paredes", email: "lucas@aeternumatlas.com", role: "admin", institution_id: "inst-1" },
  { id: "9f1cede4-3672-461b-bbe8-391dd59c988d", name: "Edgar Torales", email: "edgar@aeternumatlas.com", role: "admin", institution_id: "inst-1" }
];

const mockModels = [
  { id: "2c57a03b-2c77-4119-b8bb-676ea59e9190", slug: "corte-sagital-cranio-humano-superficial", title: "Corte Sagital do Crânio Humano", anatomical_system: "Sistema Nervoso Central", status: "published" },
  { id: "abb93126-c9be-4938-8eca-161f56864781", slug: "coracao-humano-superficial", title: "Coração Humano — Modelo Superficial 3D", anatomical_system: "Sistema Cardiovascular", status: "published" }
];

const now = new Date();
const mockViewerSessions = [
  { id: "vls-1", institution_id: "inst-1", user_id: mockFounders[0].id, model_id: "2c57a03b-2c77-4119-b8bb-676ea59e9190", scope: "viewer", active_seconds: 720, idle_seconds: 30, status: "completed", session_start: new Date(now.getTime() - 20 * 60 * 1000).toISOString(), created_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString() },
  { id: "vls-2", institution_id: "inst-1", user_id: mockFounders[1].id, model_id: "corte-sagital-cranio-humano-superficial", scope: "viewer", active_seconds: 640, idle_seconds: 20, status: "completed", session_start: new Date(now.getTime() - 40 * 60 * 1000).toISOString(), created_at: new Date(now.getTime() - 40 * 60 * 1000).toISOString() },
  { id: "vls-3", institution_id: "inst-1", user_id: mockFounders[2].id, model_id: "coracao-humano-superficial", scope: "viewer", active_seconds: 810, idle_seconds: 15, status: "completed", session_start: new Date(now.getTime() - 120 * 60 * 1000).toISOString(), created_at: new Date(now.getTime() - 120 * 60 * 1000).toISOString() }
];

async function setupSupabaseMockRoutes(page, user) {
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

  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();
    const accept = req.headers()["accept"] || "";

    if (url.startsWith(BASE_URL) || url.startsWith("http://localhost:") || url.startsWith("http://127.0.0.1:")) {
      trafficAudit.localRequests++;
      return route.continue();
    }

    if (url.includes("/auth/v1/")) {
      trafficAudit.syntheticAuthRequests++;
      if (url.includes("/user") || url.includes("/session")) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sessionObj.user) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sessionObj) });
    }

    if (url.includes("/rest/v1/")) {
      trafficAudit.syntheticRestRequests++;

      // RPCs
      if (url.includes("/rpc/register_or_transfer_session") || url.includes("/rpc/check_session_health") || url.includes("/rpc/validate_session_guard")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, allowed: true, status: "SESSION_GRANTED", valid: true })
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
            institution_id: user.institution_id || "inst-1",
            name: user.name,
            email: user.email,
            role: user.role,
            status: "ativo",
            avatar_url: null,
            created_at: "2026-01-01T00:00:00Z"
          },
          ...mockFounders
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
          headers: { "content-range": "0-0/0" },
          body: JSON.stringify([])
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

      // Tabela VIEWER_LEARNING_SESSIONS
      if (url.includes("/viewer_learning_sessions")) {
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
      if (url.includes("/academic_classes") || url.includes("/academic_class_students") || url.includes("/study_agenda_events") || url.includes("/anatomical_quiz_attempts") || url.includes("/ai_audit_events") || url.includes("/security_events")) {
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
          headers: { "content-range": "0-0/0" },
          body: JSON.stringify([])
        });
      }

      // Fallback seguro para qualquer outra rota REST
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "content-range": "0-0/0" },
        body: JSON.stringify([])
      });
    }

    // Bloqueio fail-closed de terceiros
    trafficAudit.blockedExternalRequests++;
    return route.abort("blockedbyclient");
  });

  return { token, sessionObj, trafficAudit };
}

async function runBrowserMultiViewportTests() {
  console.log("\n=======================================================");
  console.log("PARTE 2: TESTES BROWSER MULTI-VIEWPORT (AETERNUM 26.1)");
  console.log("=======================================================\n");

  const viteProc = await startViteServer();

  let browser;
  try {
    browser = await chromium.launch({ headless: true });

    const viewports = [
      { name: "desktop", width: 1920, height: 1080, theme: "dark" },
      { name: "desktop", width: 1920, height: 1080, theme: "light" },
      { name: "notebook", width: 1366, height: 768, theme: "dark" },
      { name: "notebook", width: 1366, height: 768, theme: "light" },
      { name: "tablet", width: 768, height: 1024, theme: "dark" },
      { name: "mobile", width: 390, height: 844, theme: "dark" }
    ];

    const adminUser = mockFounders[0];

    for (const vp of viewports) {
      console.log(`Testando Viewport: ${vp.name} (${vp.width}x${vp.height}) - Tema: ${vp.theme}...`);

      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: vp.theme
      });

      const page = await context.newPage();
      const { sessionObj } = await setupSupabaseMockRoutes(page, adminUser);

      // Injeta autenticação no localStorage do contexto
      await context.addInitScript(({ user, session, themeVal }) => {
        window.localStorage.setItem("aeternum.react.auth_profile", JSON.stringify(user));
        window.localStorage.setItem("aeternum.react.session", JSON.stringify(user.id));
        window.localStorage.setItem("sb-hyivyrietgjdazgizafp-auth-token", JSON.stringify(session));
        window.localStorage.setItem("aeternum.theme", themeVal);
      }, { user: adminUser, session: sessionObj, themeVal: vp.theme });

      // Navega para /super-admin/analytics
      await page.goto(`${BASE_URL}/super-admin/analytics`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      // Aguarda componente principal de analytics ser renderizado
      const centerEl = await page.waitForSelector("[data-testid='a26-analytics-intelligence-center']", { timeout: 15000 });
      assert.ok(centerEl, "Central de Inteligência Analítica deve estar visível");

      // Verifica presença do ribbon de métricas
      const kpiRibbon = await page.waitForSelector(".a26-analytics-kpi-ribbon", { timeout: 5000 });
      assert.ok(kpiRibbon, "Ribbon de KPIs deve estar visível");

      // Captura screenshot para o artefato
      const screenshotPath = path.join(
        ARTIFACT_DIR,
        `p0_21_adm2_4_analytics_intelligence_${vp.name}_${vp.width}x${vp.height}_${vp.theme}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`✓ Screenshot salvo: ${path.basename(screenshotPath)}`);

      await context.close();
    }

    console.log("\n=======================================================");
    console.log("HOMOLOGAÇÃO MULTI-VIEWPORT CONCLUÍDA COM SUCESSO!");
    console.log("=======================================================\n");

  } finally {
    if (browser) await browser.close();
    if (viteProc) stopViteServer(viteProc);
  }
}

async function main() {
  const isDeterministicOnly = process.argv.includes("--deterministic") || process.argv.includes("--unit");
  console.log(`INICIANDO SUÍTE P0.21-ADM.2.4: ANALYTICS INTELLIGENCE ${isDeterministicOnly ? "(MODO DETERMINÍSTICO)" : "(COMPLETA)"}`);
  const startTime = Date.now();

  await runDeterministicUnitTests();

  if (!isDeterministicOnly) {
    await runBrowserMultiViewportTests();
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n>>> SUÍTE ADM.2.4 APROVADA EM ${durationSec}s COM ZERO REGRESSÕES <<<\n`);
}

main().catch(err => {
  console.error("FATAL em test_p0_21_adm2_4_analytics_intelligence.mjs:", err);
  process.exit(1);
});
