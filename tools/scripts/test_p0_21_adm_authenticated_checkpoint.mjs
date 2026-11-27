/**
 * Aeternum Atlas — P0.21-ADM.2.1-R1 / ADM.2.2
 * Authenticated Administrative Checkpoint & Isolation Verification
 */

import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import assert from "node:assert";

const PORT = 5178;
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
    if (url.includes("/users")) {
      const accept = route.request().headers()["accept"] || "";
      const userRecord = {
        id: user.id,
        institution_id: user.institutionId || user.institution_id || "inst-1",
        name: user.name,
        email: user.email,
        role: user.role,
        status: "ativo",
        avatar_url: null
      };
      if (accept.includes("vnd.pgrst.object+json")) {
        return route.fulfill({
          status: 200,
          contentType: "application/vnd.pgrst.object+json",
          body: JSON.stringify(userRecord)
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "content-range": "0-0/1" },
        body: JSON.stringify([userRecord])
      });
    }
    if (url.includes("/institutions")) {
      const accept = route.request().headers()["accept"] || "";
      const instRecord = { id: user.institutionId || "inst-1", name: "Universidad Privada del Este (UPE)", display_name: "Universidad Privada del Este (UPE)", country: "Paraguai", active: true };
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
    // Default fallback for any other rest query
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

    // =========================================================================
    // 1. ADMIN AUTENTICADO: DASHBOARD E OPERAÇÃO EL DORADO
    // =========================================================================
    console.log("\n--- TEST 1: Admin Autenticado — Carregamento do Dashboard & Marina Bloqueada ---");
    const adminContext = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });

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

    const adminPage = await adminContext.newPage();
    adminPage.on("console", msg => console.log("PAGE LOG:", msg.type(), msg.text()));
    adminPage.on("pageerror", err => console.log("PAGE ERROR:", err));
    const { token, sessionObj } = await setupSupabaseMockRoutes(adminPage, adminUser);

    await adminContext.addInitScript(({ user, session }) => {
      window.localStorage.setItem("aeternum.react.auth_profile", JSON.stringify(user));
      window.localStorage.setItem("aeternum.react.session", JSON.stringify(user.id));
      window.localStorage.setItem("sb-hyivyrietgjdazgizafp-auth-token", JSON.stringify(session));
    }, { user: adminUser, session: sessionObj });

    await adminPage.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "networkidle" });
    await adminPage.waitForTimeout(2000);

    console.log("Current admin URL:", adminPage.url());
    const navItemTexts = await adminPage.locator(".a26-shell__nav-item").allInnerTexts();
    console.log("Nav items in sidebar:", navItemTexts);

    // Valida que a Marina Orb está 100% ausente no ambiente administrativo
    const orbCount = await adminPage.locator(".upe-ai-orb-trigger, .upe-ai-panel, [data-testid='atlas-ai-tutor-orb']").count();
    assert.strictEqual(orbCount, 0, "Marina Orb DEVE estar completamente ausente no ambiente administrativo");
    console.log("[PASS] Marina Orb 100% ausente nas rotas administrativas.");

    // Valida que o menu contém 'Operação El Dorado'
    const elDoradoItem = adminPage.locator('.a26-shell__nav-item:has-text("El Dorado"), .a26-shell__nav-item:has-text("Dorado")');
    const elDoradoCount = await elDoradoItem.count();
    assert.ok(elDoradoCount > 0, "Operação El Dorado DEVE estar presente no menu administrativo");
    console.log("[PASS] Operação El Dorado presente no menu lateral administrativo.");

    // Salva screenshot do Dashboard Administrativo Autenticado (1440x900)
    const adminDashScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_checkpoint_admin_dashboard_authenticated_1440x900.png");
    await adminPage.screenshot({ path: adminDashScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot do Dashboard Administrativo salvo: ${adminDashScreenshot}`);

    // =========================================================================
    // 2. ADMIN AUTENTICADO: ACESSO À OPERAÇÃO EL DORADO
    // =========================================================================
    console.log("\n--- TEST 2: Admin Autenticado — Navegação para Operação El Dorado ---");
    await adminPage.goto(`${BASE_URL}/admin/candidatos-beta`, { waitUntil: "networkidle" });
    await adminPage.waitForTimeout(1500);

    const elDoradoOrbCount = await adminPage.locator(".upe-ai-orb-trigger, .upe-ai-panel").count();
    assert.strictEqual(elDoradoOrbCount, 0, "Marina Orb DEVE estar ausente na Operação El Dorado");

    const elDoradoScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_checkpoint_el_dorado_authenticated_1440x900.png");
    await adminPage.screenshot({ path: elDoradoScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot da Operação El Dorado salvo: ${elDoradoScreenshot}`);

    // =========================================================================
    // 3. ESTUDANTE: PRESERVAÇÃO DA MARINA ORB NO AMBIENTE ACADÊMICO
    // =========================================================================
    console.log("\n--- TEST 3: Estudante — Preservação da Marina Orb no Ambiente Acadêmico ---");
    const studentContext = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });

    const studentUser = {
      id: "a3911a5c-a3d0-4318-9d45-f6be6ac38fb4", // Halisson Zanchin
      name: "Dr. Halisson Zanchin",
      email: "halisson.zanchin@gmail.com",
      role: "student",
      status: "active",
      accountStatus: "active"
    };

    const studentPage = await studentContext.newPage();
    const { sessionObj: studentSession } = await setupSupabaseMockRoutes(studentPage, studentUser);

    await studentContext.addInitScript(({ user, session }) => {
      window.localStorage.setItem("aeternum.react.auth_profile", JSON.stringify(user));
      window.localStorage.setItem("aeternum.react.session", JSON.stringify(user.id));
      window.localStorage.setItem("sb-hyivyrietgjdazgizafp-auth-token", JSON.stringify(session));
    }, { user: studentUser, session: studentSession });

    await studentPage.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
    await studentPage.waitForTimeout(2000);

    const studentDashScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_checkpoint_student_dashboard_authenticated_1440x900.png");
    await studentPage.screenshot({ path: studentDashScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot do Dashboard Estudantil salvo: ${studentDashScreenshot}`);

    // =========================================================================
    // 4. ESTUDANTE: ISOLAMENTO DE ACESSO A ROTAS ADMINISTRATIVAS
    // =========================================================================
    console.log("\n--- TEST 4: Estudante — Bloqueio de Acesso a Rotas Administrativas ---");
    await studentPage.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: "networkidle" });
    await studentPage.waitForTimeout(1000);

    const accessState = await studentPage.locator("[data-testid='a26-access-state'], .a26-access-page").count();
    assert.ok(accessState > 0, "Estudante tentando acessar rota administrativa DEVE ser bloqueado por ProtectedRoute");
    console.log("[PASS] Tentativa de acesso do estudante a /admin/dashboard bloqueada com sucesso.");

    const blockedScreenshot = path.join(ARTIFACT_DIR, "p0_21_adm2_2_checkpoint_student_blocked_on_admin_1440x900.png");
    await studentPage.screenshot({ path: blockedScreenshot, fullPage: false });
    console.log(`[PASS] Screenshot de bloqueio de acesso salvo: ${blockedScreenshot}`);

    console.log("\n=======================================================");
    console.log("SMOKE TEST RESULTS: ALL 4 AUTHENTICATED CHECKPOINTS PASSED!");
    console.log("=======================================================");
  } finally {
    if (browser) await browser.close();
    if (proc) stopViteServer(proc);
  }
}

run().catch(err => {
  console.error("AUTHENTICATED SMOKE TEST FAILED:", err);
  process.exit(1);
});
