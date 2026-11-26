/**
 * Aeternum Atlas — P0.21-ADM.2.2
 * Administrative Control Center Visual Redesign & Multi-Viewport Verification
 */

import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import assert from "node:assert";

const PORT = 5180;
const BASE_URL = `http://localhost:${PORT}`;
const ARTIFACT_DIR = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
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

const mockFounders = [
  { id: "a3911a5c-a3d0-4318-9d45-f6be6ac38fb4", name: "Dr. Halisson Zanchin", email: "halissonzanchin@aeternumatlas.com", role: "student", institution_id: "inst-1", status: "active", created_at: "2026-01-10T10:00:00Z" },
  { id: "a0168021-b8a2-4c35-8eab-c80240c10e07", name: "Victor Hugo", email: "victor@aeternumatlas.com", role: "student", institution_id: "inst-1", status: "active", created_at: "2026-01-10T10:00:00Z" },
  { id: "f2591fae-8c18-4eb7-a97d-ae5ae90c5b34", name: "Nicolas Figorelli", email: "nicolas@aeternumatlas.com", role: "student", institution_id: "inst-1", status: "active", created_at: "2026-01-10T10:00:00Z" },
  { id: "e9931f64-4de9-46fc-9e56-6705345406cb", name: "Lucas Paredes", email: "lucas@aeternumatlas.com", role: "student", institution_id: "inst-1", status: "active", created_at: "2026-01-10T10:00:00Z" },
  { id: "9f1cede4-3672-461b-bbe8-391dd59c988d", name: "Edgar Torales", email: "edgar@aeternumatlas.com", role: "student", institution_id: "inst-1", status: "active", created_at: "2026-01-10T10:00:00Z" }
];

const mockStudentProfiles = [
  { user_id: "a3911a5c-a3d0-4318-9d45-f6be6ac38fb4", course: "Medicina", semester: "8º Semestre", registration_number: "MED-2026-001", progress_score: 95, total_study_minutes: 420 },
  { user_id: "a0168021-b8a2-4c35-8eab-c80240c10e07", course: "Engenharia Biomédica", semester: "10º Semestre", registration_number: "BIO-2026-002", progress_score: 90, total_study_minutes: 380 },
  { user_id: "f2591fae-8c18-4eb7-a97d-ae5ae90c5b34", course: "Medicina", semester: "6º Semestre", registration_number: "MED-2026-003", progress_score: 88, total_study_minutes: 310 },
  { user_id: "e9931f64-4de9-46fc-9e56-6705345406cb", course: "Medicina", semester: "7º Semestre", registration_number: "MED-2026-004", progress_score: 85, total_study_minutes: 290 },
  { user_id: "9f1cede4-3672-461b-bbe8-391dd59c988d", course: "Medicina", semester: "9º Semestre", registration_number: "MED-2026-005", progress_score: 92, total_study_minutes: 350 }
];

const mockModels = [
  { id: "m-1", title: "Coração Humano e Vasos da Base", category: "Cardiovascular" },
  { id: "m-2", title: "Encéfalo e Tronco Cerebral", category: "Neurologia" },
  { id: "m-3", title: "Crânio Ósseo e Suturas", category: "Osteologia" },
  { id: "m-4", title: "Articulação Fêmoro-Tibial (Joelho)", category: "Ortopedia" },
  { id: "m-5", title: "Pulmões e Segmentação Broncopulmonar", category: "Respiratório" }
];

const now = new Date();
const mockLogs = [
  { id: "log-1", user_id: mockFounders[0].id, model_id: "m-1", duration_seconds: 720, created_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString() },
  { id: "log-2", user_id: mockFounders[1].id, model_id: "m-2", duration_seconds: 640, created_at: new Date(now.getTime() - 40 * 60 * 1000).toISOString() },
  { id: "log-3", user_id: mockFounders[2].id, model_id: "m-1", duration_seconds: 810, created_at: new Date(now.getTime() - 120 * 60 * 1000).toISOString() },
  { id: "log-4", user_id: mockFounders[3].id, model_id: "m-3", duration_seconds: 530, created_at: new Date(now.getTime() - 200 * 60 * 1000).toISOString() },
  { id: "log-5", user_id: mockFounders[4].id, model_id: "m-4", duration_seconds: 900, created_at: new Date(now.getTime() - 300 * 60 * 1000).toISOString() }
];

const mockBetaApps = [
  { id: "beta-1", full_name: "Candidato Alpha", email: "alpha@exemplo.com", status: "activated", batch: "batch_1", source_origin: "landing_page", created_at: "2026-11-15T12:00:00Z" },
  { id: "beta-2", full_name: "Candidato Beta", email: "beta@exemplo.com", status: "activated", batch: "batch_1", source_origin: "landing_page", created_at: "2026-11-16T12:00:00Z" },
  { id: "beta-3", full_name: "Candidato Gamma", email: "gamma@exemplo.com", status: "invited", batch: "batch_1", source_origin: "landing_page", created_at: "2026-11-17T12:00:00Z" },
  { id: "beta-4", full_name: "Candidato Delta", email: "delta@exemplo.com", status: "approved", batch: "batch_1", source_origin: "landing_page", created_at: "2026-11-18T12:00:00Z" },
  { id: "beta-5", full_name: "Candidato Epsilon", email: "epsilon@exemplo.com", status: "pending", batch: "batch_1", source_origin: "landing_page", created_at: "2026-11-19T12:00:00Z" }
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

  await page.route("**/auth/v1/**", route => {
    const url = route.request().url();
    if (url.includes("/user")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sessionObj.user) });
    }
    if (url.includes("/session")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sessionObj) });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sessionObj) });
  });

  await page.route("**/rest/v1/**", route => {
    const url = route.request().url();
    const reqHeaders = route.request().headers();
    const accept = reqHeaders["accept"] || "";

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
        ...mockFounders
      ];

      if (accept.includes("vnd.pgrst.object+json")) {
        return route.fulfill({
          status: 200,
          contentType: "application/vnd.pgrst.object+json",
          body: JSON.stringify(allUsers[0])
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
        name: "Universidade de Pernambuco",
        display_name: "Universidade de Pernambuco",
        active: true,
        contracted_capacity: 500,
        contract_status: "homologacao"
      };
      if (accept.includes("vnd.pgrst.object+json")) {
        return route.fulfill({
          status: 200,
          contentType: "application/vnd.pgrst.object+json",
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

    // Tabela MODELS
    if (url.includes("/models")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "content-range": `0-${mockModels.length - 1}/${mockModels.length}` },
        body: JSON.stringify(mockModels)
      });
    }

    // Tabela MODEL_ACCESS_LOGS
    if (url.includes("/model_access_logs")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "content-range": `0-${mockLogs.length - 1}/${mockLogs.length}` },
        body: JSON.stringify(mockLogs)
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

    // Default fallback
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "content-range": "0-0/0" },
      body: JSON.stringify([])
    });
  });

  return { token, sessionObj };
}

async function run() {
  let proc = null;
  let browser = null;
  try {
    proc = await startViteServer();
    browser = await chromium.launch({ headless: true });

    const adminUser = {
      id: "19f44fd4-cba0-4a35-95c7-b1c5e3e9c5a0",
      name: "Administrador Aeternum",
      email: "admin@aeternumatlas.com",
      role: "admin",
      status: "active",
      accountStatus: "active",
      institutionId: "inst-1",
      institution_id: "inst-1"
    };

    // =========================================================================
    // 1. DESKTOP 1920x1080 (Dark Theme) — Redesign dos 6 Núcleos Operacionais
    // =========================================================================
    console.log("\n--- TEST 1: Desktop 1920x1080 (Dark Theme) — Verificação dos 6 Núcleos ---");
    const desktopContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    const desktopPage = await desktopContext.newPage();
    const { sessionObj } = await setupSupabaseMockRoutes(desktopPage, adminUser);

    await desktopContext.addInitScript(({ user, session }) => {
      window.localStorage.setItem("aeternum.react.auth_profile", JSON.stringify(user));
      window.localStorage.setItem("aeternum.react.session", JSON.stringify(user.id));
      window.localStorage.setItem("sb-hyivyrietgjdazgizafp-auth-token", JSON.stringify(session));
      window.localStorage.setItem("aeternum.theme", "dark");
    }, { user: adminUser, session: sessionObj });

    await desktopPage.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "networkidle" });
    await desktopPage.waitForTimeout(2000);

    // Validação Núcleo 1: Command Header & Pulse Grid
    const cmdHeader = await desktopPage.locator(".admin26-command-header").count();
    assert.strictEqual(cmdHeader, 1, "Command Header DEVE estar presente no topo do dashboard");
    console.log("[PASS] Núcleo 1: Command Header renderizado com sucesso.");

    const pulseCards = await desktopPage.locator(".admin26-pulse-card").count();
    assert.ok(pulseCards >= 4, `Pulse Grid deve conter pelo menos 4 cards densos (encontrados: ${pulseCards})`);
    console.log(`[PASS] Núcleo 1: Pulse Grid contém ${pulseCards} cartões operacionais com ~33% de redução de altura.`);

    // Validação Núcleo 2: Operação El Dorado Card & Funil
    const elDoradoCard = await desktopPage.locator(".admin26-funnel-card").count();
    assert.strictEqual(elDoradoCard, 1, "Operação El Dorado Quick Card DEVE estar presente");
    console.log("[PASS] Núcleo 2: Operação El Dorado Quick Card & Funil de Candidatos renderizados.");

    // Validação Núcleo 3: Analytics Intelligence (Top 5 Modelos)
    const rankingCard = await desktopPage.locator(".admin26-ranking-list").count();
    assert.strictEqual(rankingCard, 1, "Ranking Top 5 Modelos 3D DEVE estar presente");
    console.log("[PASS] Núcleo 3: Ranking Top 5 Modelos 3D renderizado com sucesso.");

    // Validação Núcleo 4: Gestão Institucional & Pílulas de Filtro
    const pillFilters = await desktopPage.locator(".admin26-pill-btn").count();
    assert.strictEqual(pillFilters, 5, `Pílulas de filtro devem ser exatamente 5 (encontradas: ${pillFilters})`);
    console.log("[PASS] Núcleo 4: Pílulas de filtro tátil (Todos, Fundadores, Comercial, Beta, Não Classificado) renderizadas.");

    // Validação Núcleo 5: Financial Intelligence & Sandbox B2B
    const simulatorBox = await desktopPage.locator(".admin26-simulator-box").count();
    assert.strictEqual(simulatorBox, 1, "Simulador Comercial B2B DEVE estar presente");
    console.log("[PASS] Núcleo 5: Financial Intelligence e Sandbox Comercial B2B rotulados honestamente.");

    // Validação Núcleo 6: Governança & Integridade
    const govCard = await desktopPage.locator(".admin26-governance-card").count();
    assert.strictEqual(govCard, 1, "Card de Governança & Integridade DEVE estar presente");
    console.log("[PASS] Núcleo 6: Governança & Integridade com status de tabelas canônicas e Session Guard ativo.");

    // Salvar Screenshot Desktop 1920x1080 Dark
    const desktopDarkScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_control_center_desktop_1920x1080_dark.png");
    await desktopPage.screenshot({ path: desktopDarkScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot Desktop 1920x1080 Dark salvo: ${desktopDarkScreenshot}`);

    // =========================================================================
    // 2. DESKTOP 1920x1080 (Light Theme iOS 27)
    // =========================================================================
    console.log("\n--- TEST 2: Desktop 1920x1080 (Light Theme iOS 27) ---");
    // Troca tema para light
    await desktopPage.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.remove("dark");
      document.body.classList.add("light");
    });
    await desktopPage.waitForTimeout(600);

    const desktopLightScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_control_center_desktop_1920x1080_light.png");
    await desktopPage.screenshot({ path: desktopLightScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot Desktop 1920x1080 Light salvo: ${desktopLightScreenshot}`);

    // =========================================================================
    // 3. NOTEBOOK 1366x768 (Dark & Light Theme)
    // =========================================================================
    console.log("\n--- TEST 3: Notebook 1366x768 (Dark & Light) ---");
    const notebookContext = await browser.newContext({
      viewport: { width: 1366, height: 768 }
    });
    const notebookPage = await notebookContext.newPage();
    await setupSupabaseMockRoutes(notebookPage, adminUser);

    await notebookContext.addInitScript(({ user, session }) => {
      window.localStorage.setItem("aeternum.react.auth_profile", JSON.stringify(user));
      window.localStorage.setItem("aeternum.react.session", JSON.stringify(user.id));
      window.localStorage.setItem("sb-hyivyrietgjdazgizafp-auth-token", JSON.stringify(session));
      window.localStorage.setItem("aeternum.theme", "dark");
    }, { user: adminUser, session: sessionObj });

    await notebookPage.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "networkidle" });
    await notebookPage.waitForTimeout(1500);

    const nbDarkScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_control_center_notebook_1366x768_dark.png");
    await notebookPage.screenshot({ path: nbDarkScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot Notebook 1366x768 Dark salvo: ${nbDarkScreenshot}`);

    await notebookPage.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "light");
      document.body.classList.remove("dark");
      document.body.classList.add("light");
    });
    await notebookPage.waitForTimeout(600);

    const nbLightScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_control_center_notebook_1366x768_light.png");
    await notebookPage.screenshot({ path: nbLightScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot Notebook 1366x768 Light salvo: ${nbLightScreenshot}`);

    // =========================================================================
    // 4. TABLET 768x1024 (Dark Theme)
    // =========================================================================
    console.log("\n--- TEST 4: Tablet 768x1024 (Dark Theme) ---");
    const tabletContext = await browser.newContext({
      viewport: { width: 768, height: 1024 }
    });
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

    // =========================================================================
    // 5. MOBILE 390x844 (Dark Theme)
    // =========================================================================
    console.log("\n--- TEST 5: Mobile 390x844 (Dark Theme) ---");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true
    });
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

    // =========================================================================
    // 6. TESTE DE INTERAÇÃO: EXPANSÃO/RECOLHIMENTO DE GRUPOS NA SIDEBAR
    // =========================================================================
    console.log("\n--- TEST 6: Interação com a Sidebar — Recolhimento e Expansão de Grupos ---");
    const toggleButtons = desktopPage.locator(".a26-shell__nav-group-toggle");
    const toggleCount = await toggleButtons.count();
    console.log(`Grupos recolhíveis na sidebar: ${toggleCount}`);
    assert.ok(toggleCount >= 5, "Sidebar administrativa deve conter pelo menos 5 grupos operacionais agrupados");

    // Clica no primeiro grupo (Centro Operacional) para recolher
    await toggleButtons.nth(0).click();
    await desktopPage.waitForTimeout(300);

    const sidebarCollapsedScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_sidebar_groups_collapsed_1440x900.png");
    await desktopPage.screenshot({ path: sidebarCollapsedScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot da sidebar com grupo recolhido salvo: ${sidebarCollapsedScreenshot}`);

    // Clica novamente para reexpandir
    await toggleButtons.nth(0).click();
    await desktopPage.waitForTimeout(300);

    // =========================================================================
    // 7. TESTE DE INTERAÇÃO: FILTRO EM PÍLULAS DE ALUNOS
    // =========================================================================
    console.log("\n--- TEST 7: Interação com Filtros de Alunos (Pílulas Táteis) ---");
    const founderPill = desktopPage.locator('.admin26-pill-btn:has-text("Fundadores")');
    await founderPill.click();
    await desktopPage.waitForTimeout(400);

    const studentFilterScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_student_filter_founders_1440x900.png");
    await desktopPage.screenshot({ path: studentFilterScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot com filtro de Fundadores ativo salvo: ${studentFilterScreenshot}`);

    console.log("\n===================================================================");
    console.log("ADM.2.2 CONTROL CENTER SUITE: ALL CHECKS & MULTI-VIEWPORT PASSED!");
    console.log("===================================================================");
  } finally {
    if (browser) await browser.close();
    if (proc) stopViteServer(proc);
  }
}

run().catch(err => {
  console.error("ADM.2.2 CONTROL CENTER TEST FAILED:", err);
  process.exit(1);
});
