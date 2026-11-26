import { chromium } from "playwright";
import http from "node:http";
import { spawn } from "node:child_process";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getAnonKey, getServiceRoleKey, runSupabaseSql } from "./supabase_admin_helper.mjs";

const rootDir = process.cwd();
const artifactDir = "C:/Users/halis/.gemini/antigravity/brain/b63445c2-37f0-46a4-8ca8-5556eb65a8a3";
const SUPABASE_URL = "https://hyivyrietgjdazgizafp.supabase.co";

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

async function ensureVitePreview() {
  if (await isPortListening(5174)) return null;
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const proc = spawn(npxCmd, ["vite", "preview", "--port", "5174", "--strictPort"], {
    cwd: rootDir,
    shell: true,
    stdio: "ignore"
  });
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if (await isPortListening(5174)) return proc;
  }
  throw new Error("Failed to start preview server on port 5174");
}

function stopVite(proc) {
  if (!proc || !proc.pid) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", proc.pid.toString(), "/T", "/F"], { stdio: "ignore" });
    } else {
      proc.kill("SIGTERM");
    }
  } catch (_) {}
}

async function run() {
  console.log("=== P0.21-ADM.1.1: Multi-Scenario Recovery Certification ===");
  const serviceRoleKey = await getServiceRoleKey();
  const anonKey = await getAnonKey();

  const adminClient = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const publicClient = createClient(SUPABASE_URL, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const secondaryClient = createClient(SUPABASE_URL, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const serverProc = await ensureVitePreview();
  const browser = await chromium.launch({ headless: true });

  let testUserId = null;
  const testEmail = `test_homolog_recovery_${Date.now()}@aeternumatlas.med.br`;
  const initialPassword = `InitPass_${Date.now()}!A1`;
  const nextPassword = `NewSecurePass_${Date.now()}!Z9`;
  let session2RefreshToken = null;

  const results = {
    scenario1_directAccessFailClosed: false,
    scenario2_expiredTamperedHashFailClosed: false,
    scenario3_authenticatedSessionArtificialRecoveryRejected: false,
    scenario4_validSessionFormRendered: false,
    scenario5_validationRulesEnforced: false,
    scenario6_passwordResetAndSessionRevocation: false,
    scenario7_reusedLinkInvalidation: false,
    scenario8_postResetLoginSuccess: false,
    cleanupCompleted: false
  };

  try {
    // ----------------------------------------------------
    // Scenario 1: Direct Access without session / tokens
    // ----------------------------------------------------
    console.log("\n[Scenario 1] Testing direct access to /login?mode=reset-password without session...");
    const page1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page1.goto("http://localhost:5174/login?mode=reset-password", { waitUntil: "networkidle" });
    await page1.waitForSelector(".atlas-auth-card--login", { timeout: 10000 });

    const passwordInputsScenario1 = await page1.$$('input[name="password"], input[name="confirmPassword"]');
    const displayTitleScenario1 = await page1.$eval(".display-title", el => el.textContent.trim());
    const errorMessageScenario1 = await page1.$eval('[data-testid="recovery-session-error"]', el => el.textContent.trim());
    const newLinkBtnScenario1 = await page1.$('button:has-text("Solicitar Novo Link de Recuperação")');

    if (
      passwordInputsScenario1.length === 0 &&
      displayTitleScenario1 === "Link Inválido ou Expirado" &&
      errorMessageScenario1.includes("Sessão de recuperação ausente") &&
      Boolean(newLinkBtnScenario1)
    ) {
      results.scenario1_directAccessFailClosed = true;
      console.log("  -> PASS: Direct access correctly failed-closed (0 password fields rendered, security error card displayed).");
    } else {
      throw new Error(`Scenario 1 failed: password inputs count=${passwordInputsScenario1.length}, title=${displayTitleScenario1}`);
    }
    await page1.close();

    // ----------------------------------------------------
    // Scenario 2: Expired / Tampered Error Hash
    // ----------------------------------------------------
    console.log("\n[Scenario 2] Testing URL hash containing otp_expired error...");
    const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page2.goto("http://localhost:5174/login?mode=reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired", { waitUntil: "networkidle" });
    await page2.waitForSelector(".atlas-auth-card--login", { timeout: 10000 });

    const passwordInputsScenario2 = await page2.$$('input[name="password"], input[name="confirmPassword"]');
    const displayTitleScenario2 = await page2.$eval(".display-title", el => el.textContent.trim());
    const errorMessageScenario2 = await page2.$eval('[data-testid="recovery-session-error"]', el => el.textContent.trim());

    if (
      passwordInputsScenario2.length === 0 &&
      displayTitleScenario2 === "Link Inválido ou Expirado" &&
      errorMessageScenario2.includes("expirou ou já foi utilizado")
    ) {
      results.scenario2_expiredTamperedHashFailClosed = true;
      console.log("  -> PASS: Expired/tampered hash correctly failed-closed with specific otp_expired message.");
    } else {
      throw new Error(`Scenario 2 failed: title=${displayTitleScenario2}, error=${errorMessageScenario2}`);
    }
    await page2.close();

    // ----------------------------------------------------
    // Create Disposable Homologation Account
    // ----------------------------------------------------
    console.log("\n[Setup] Creating dedicated disposable test user for authentic recovery test...");
    const { data: createdUser, error: createErr } = await adminClient.auth.admin.createUser({
      email: testEmail,
      password: initialPassword,
      email_confirm: true,
      user_metadata: { name: "Test Homolog User" }
    });
    if (createErr || !createdUser?.user) {
      throw new Error(`Failed to create test user: ${createErr?.message}`);
    }
    testUserId = createdUser.user.id;
    console.log("  -> Created disposable test user id:", testUserId);

    await runSupabaseSql(`
      INSERT INTO public.users (id, email, name, role, status, institution_id)
      VALUES ('${testUserId}', '${testEmail}', 'Test Homolog User', 'admin', 'active', '11111111-1111-1111-1111-111111111111')
      ON CONFLICT (id) DO UPDATE SET status = 'active';
    `);

    // ----------------------------------------------------
    // Setup Independent Session 2 for Global Revocation Proof
    // ----------------------------------------------------
    console.log("\n[Setup: Session 2] Establishing independent second session for revocation proof...");
    const { data: s2Data, error: s2Err } = await secondaryClient.auth.signInWithPassword({
      email: testEmail,
      password: initialPassword
    });
    if (s2Err || !s2Data?.session?.refresh_token) {
      throw new Error(`Precondition Failed: Could not establish independent second session: ${s2Err?.message}`);
    }
    session2RefreshToken = s2Data.session.refresh_token;

    // Verify Session 2 is actively recognized prior to recovery
    const { data: preResetUser, error: preResetErr } = await secondaryClient.auth.getUser(s2Data.session.access_token);
    if (preResetErr || !preResetUser?.user || preResetUser.user.id !== testUserId) {
      throw new Error(`Precondition Failed: Second session not active before reset: ${preResetErr?.message}`);
    }
    console.log("  -> PASS: Independent Session 2 verified ACTIVE prior to recovery.");

    // ----------------------------------------------------
    // Scenario 3 (ADM-01): Authenticated session with artificial recovery parameter
    // ----------------------------------------------------
    console.log("\n[Scenario 3] Testing authenticated user attempting /login?mode=reset-password#type=recovery...");
    const { data: authSessionData, error: authSessionErr } = await publicClient.auth.signInWithPassword({
      email: testEmail,
      password: initialPassword
    });
    if (authSessionErr || !authSessionData?.session) {
      throw new Error(`Failed to establish session for test user: ${authSessionErr?.message}`);
    }

    const page3 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page3.goto("http://localhost:5174/login", { waitUntil: "networkidle" });
    await page3.evaluate((session) => {
      window.localStorage.setItem("sb-hyivyrietgjdazgizafp-auth-token", JSON.stringify(session));
    }, authSessionData.session);

    // Navigate with artificial hash #type=recovery (without valid OTP GoTrue exchange)
    await page3.goto("http://localhost:5174/login?mode=reset-password#type=recovery", { waitUntil: "networkidle" });
    await page3.waitForSelector(".atlas-auth-card--login", { timeout: 10000 });

    const passwordInputsScenario3 = await page3.$$('input[name="password"], input[name="confirmPassword"]');
    const displayTitleScenario3 = await page3.$eval(".display-title", el => el.textContent.trim());
    const errorMessageScenario3 = await page3.$eval('[data-testid="recovery-session-error"]', el => el.textContent.trim());

    if (
      passwordInputsScenario3.length === 0 &&
      displayTitleScenario3 === "Link Inválido ou Expirado" &&
      errorMessageScenario3.includes("Sessão de recuperação ausente")
    ) {
      results.scenario3_authenticatedSessionArtificialRecoveryRejected = true;
      console.log("  -> PASS: Authenticated user with artificial recovery hash rejected immediately (0 password fields rendered).");
    } else {
      throw new Error(`Scenario 3 failed: Authenticated session was incorrectly allowed to see reset form! (inputs=${passwordInputsScenario3.length}, title=${displayTitleScenario3})`);
    }
    await page3.close();
    await publicClient.auth.signOut();

    // ----------------------------------------------------
    // Scenario 4: Authentic Recovery Session Flow
    // ----------------------------------------------------
    console.log("\n[Scenario 4] Generating authentic recovery link for disposable test user...");
    const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email: testEmail,
      options: {
        redirectTo: "http://localhost:5174/login?mode=reset-password"
      }
    });
    if (linkErr || !linkData?.properties?.action_link) {
      throw new Error(`Failed to generate recovery link: ${linkErr?.message}`);
    }

    const rawActionLink = linkData.properties.action_link;
    console.log("  -> Resolving verify action link to client redirect URL via secure fetch...");
    const verifyRes = await fetch(rawActionLink, { redirect: "manual" });
    const targetUrl = verifyRes.headers.get("location");
    if (!targetUrl) {
      throw new Error(`Failed to resolve action link redirect: HTTP ${verifyRes.status}`);
    }
    console.log("  -> Resolved Supabase verify redirect to target URL.");

    console.log("  -> Navigating browser to authenticated recovery session endpoint...");
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(targetUrl, { waitUntil: "networkidle" });
    await page.waitForSelector(".atlas-auth-card--login", { timeout: 15000 });

    // Wait for session check to complete and form to render
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    const resetTitle = await page.$eval(".display-title", el => el.textContent.trim());
    const newPassField = await page.$('input[name="password"]');
    const confirmPassField = await page.$('input[name="confirmPassword"]');
    const toggles = await page.$$(".atlas-auth-password__toggle");

    if (resetTitle === "Definir Nova Senha" && newPassField && confirmPassField && toggles.length === 2) {
      results.scenario4_validSessionFormRendered = true;
      console.log("  -> PASS: Valid recovery session established and password reset form rendered.");
      const toggleBox = await toggles[0].boundingBox();
      console.log(`  -> Password toggle dimensions: ${Math.round(toggleBox.width)}x${Math.round(toggleBox.height)}px`);
    } else {
      throw new Error(`Scenario 4 failed: title=${resetTitle}`);
    }

    // ----------------------------------------------------
    // Scenario 5: Password Validation Rules (<8 chars, mismatch)
    // ----------------------------------------------------
    console.log("\n[Scenario 5] Testing client password validations...");
    // 1. Short password (< 8 chars)
    await newPassField.fill("Short1");
    await page.click('button.atlas-auth-submit');
    await new Promise(r => setTimeout(r, 400));
    const shortErr = await page.$eval('.a26-field__error', el => el.textContent.trim());
    console.log("  -> Short password validation error:", shortErr);

    // 2. Password mismatch
    await newPassField.fill("ValidPassword123!");
    await confirmPassField.fill("DifferentPassword456!");
    await page.click('button.atlas-auth-submit');
    await new Promise(r => setTimeout(r, 400));
    const mismatchErr = await page.$eval('.a26-field__error', el => el.textContent.trim());
    console.log("  -> Mismatch password validation error:", mismatchErr);

    if (shortErr.includes("8 caracteres") && mismatchErr.includes("não coincidem")) {
      results.scenario5_validationRulesEnforced = true;
      console.log("  -> PASS: Validation rules (<8 chars, mismatch) strictly enforced.");
    } else {
      throw new Error("Scenario 5 failed: validation messages not as expected.");
    }

    // ----------------------------------------------------
    // Scenario 6 (ADM-02): Successful Password Reset Execution & Explicit Session Revocation
    // ----------------------------------------------------
    console.log("\n[Scenario 6] Executing successful password reset and proving session revocation...");
    await newPassField.fill(nextPassword);
    await confirmPassField.fill(nextPassword);
    await page.click('button.atlas-auth-submit');

    await page.waitForSelector('.a26-auth-message.is-success', { timeout: 10000 });
    const successMsg = await page.$eval('.a26-auth-message.is-success', el => el.textContent.trim());
    const successTitle = await page.$eval('.display-title', el => el.textContent.trim());
    console.log("  -> Success title:", successTitle);
    console.log("  -> Success message:", successMsg);

    const shotPath = path.join(artifactDir, "p0_21_adm1_reset_success_desktop.png");
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log("  -> Saved screenshot to:", shotPath);

    // 1. Prove browser localStorage cleanup
    const isBrowserStorageCleaned = await page.evaluate(() => {
      const keys = Object.keys(window.localStorage);
      const authKeys = keys.filter(k => k.includes("auth-token") || k.includes("supabase.auth"));
      for (const k of authKeys) {
        const val = window.localStorage.getItem(k);
        if (val && val !== "null" && val !== "undefined" && val !== "{}") {
          try {
            const parsed = JSON.parse(val);
            if (parsed.access_token || parsed.currentSession) return false;
          } catch (_) {}
        }
      }
      return true;
    });

    if (!isBrowserStorageCleaned) {
      throw new Error("Scenario 6 failed: Browser storage still contains active auth tokens after global signOut!");
    }
    console.log("  -> Browser storage cleanup verified: all active session tokens cleared.");

    // 2. Prove global session revocation using the independent Session 2
    console.log("  -> Proving global session revocation via independent Session 2 refresh token...");
    const { data: refRes, error: refErr } = await secondaryClient.auth.refreshSession({
      refresh_token: session2RefreshToken
    });

    if (!refErr) {
      throw new Error("Security Violation: Independent Session 2 was able to refresh token after password reset and global signOut!");
    }
    const isExpectedRevocationError = refErr.message.includes("Refresh Token Not Found") ||
      refErr.message.includes("Invalid Refresh Token") ||
      refErr.status === 400;

    if (!isExpectedRevocationError) {
      throw new Error(`Unexpected revocation response on Session 2: ${refErr.message} (status ${refErr.status})`);
    }
    console.log(`  -> PROVEN: Independent Session 2 refresh blocked (${refErr.message}).`);

    if (successTitle === "Senha Redefinida" && successMsg.includes("com sucesso") && isBrowserStorageCleaned && Boolean(refErr)) {
      results.scenario6_passwordResetAndSessionRevocation = true;
      console.log("  -> PASS: Password updated, UI confirmed, browser storage cleared, and independent session proven revoked.");
    } else {
      throw new Error("Scenario 6 failed: revocation verification criteria not met.");
    }

    // ----------------------------------------------------
    // Scenario 7 (ADM-03): Reused Recovery Link
    // ----------------------------------------------------
    console.log("\n[Scenario 7] Verifying reused action link is rejected...");
    const reuseRes = await fetch(rawActionLink, { redirect: "manual" });
    const reuseTarget = reuseRes.headers.get("location");
    console.log("  -> Reused action link HTTP status:", reuseRes.status);
    if (reuseTarget) {
      await page.goto(reuseTarget, { waitUntil: "networkidle" });
      await page.waitForSelector(".atlas-auth-card--login", { timeout: 10000 });
      await new Promise(r => setTimeout(r, 1000));
      const isErrorOrNormal = await page.$eval(".display-title", el => el.textContent.trim()).catch(() => "unknown");
      const passFieldsAfterReuse = await page.$$('input[name="password"], input[name="confirmPassword"]');
      console.log("  -> Reused link screen display title:", isErrorOrNormal);
      console.log("  -> Password input fields count on reuse:", passFieldsAfterReuse.length);

      if (passFieldsAfterReuse.length === 0 && isErrorOrNormal !== "Definir Nova Senha") {
        results.scenario7_reusedLinkInvalidation = true;
        console.log("  -> PASS: Reused recovery link did not render password reset form (0 inputs mounted).");
      } else {
        throw new Error(`Scenario 7 FAILED: Reused recovery link allowed reset form display! (inputs=${passFieldsAfterReuse.length}, title="${isErrorOrNormal}")`);
      }
    } else {
      results.scenario7_reusedLinkInvalidation = true;
      console.log("  -> PASS: Reused recovery link rejected directly by server (HTTP " + reuseRes.status + ").");
    }

    // ----------------------------------------------------
    // Scenario 8: Subsequent Login with New Password
    // ----------------------------------------------------
    console.log("\n[Scenario 8] Verifying login with updated password...");
    // 1. Initial password should now fail
    const { data: failLogin, error: failErr } = await publicClient.auth.signInWithPassword({
      email: testEmail,
      password: initialPassword
    });
    if (!failErr) {
      throw new Error("Old password still worked after reset!");
    }
    console.log("  -> Old password correctly rejected:", failErr.message);

    // 2. New password must succeed
    const { data: successLogin, error: succErr } = await publicClient.auth.signInWithPassword({
      email: testEmail,
      password: nextPassword
    });
    if (succErr || !successLogin?.session) {
      throw new Error(`Login with new password failed: ${succErr?.message}`);
    }
    console.log("  -> New password login successfully established session for user:", successLogin.user.id);
    results.scenario8_postResetLoginSuccess = true;
    console.log("  -> PASS: Post-reset login verified successfully.");

    await page.close();
  } finally {
    if (testUserId) {
      console.log("\n[Cleanup] Deleting disposable test user id:", testUserId);
      await runSupabaseSql(`DELETE FROM public.users WHERE id = '${testUserId}';`);
      const { error: delAuthErr } = await adminClient.auth.admin.deleteUser(testUserId);
      if (delAuthErr) {
        console.warn("  -> Warning deleting from auth.users:", delAuthErr.message);
      }

      // Prove deletion from public.users: must specifically equal 0 rows
      const publicRows = await runSupabaseSql(`SELECT count(*)::int as count FROM public.users WHERE id = '${testUserId}';`);
      const publicCount = publicRows[0]?.count;
      if (publicCount !== 0) {
        throw new Error(`Cleanup failed: user ${testUserId} still exists in public.users (count=${publicCount})`);
      }

      // Prove deletion from auth.users: must specifically return HTTP 404 / User not found (not arbitrary error)
      const { data: authUserCheck, error: authCheckErr } = await adminClient.auth.admin.getUserById(testUserId);
      const isSpecificallyNotFound = (authCheckErr?.status === 404 || authCheckErr?.message?.includes("User not found")) && !authUserCheck?.user;

      if (isSpecificallyNotFound) {
        results.cleanupCompleted = true;
        console.log("  -> PROVEN: Test user completely eliminated from both public.users and auth.users (verified HTTP 404 / User not found).");
      } else {
        throw new Error(`Cleanup failed: user still exists or unverified error (status=${authCheckErr?.status}, message=${authCheckErr?.message})`);
      }
    }
    await browser.close();
    stopVite(serverProc);
  }

  console.log("\n=== FINAL TEST RESULTS ===");
  console.log(JSON.stringify(results, null, 2));

  const allPassed = Object.values(results).every(v => v === true);
  if (allPassed) {
    console.log("\n>>> ALL 8 RECOVERY SCENARIOS PASSED 100% <<<");
    process.exit(0);
  } else {
    console.error("\n>>> SOME SCENARIOS FAILED <<<");
    process.exit(1);
  }
}

run().catch(err => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
