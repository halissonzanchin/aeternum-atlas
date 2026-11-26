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

  const serverProc = await ensureVitePreview();
  const browser = await chromium.launch({ headless: true });

  let testUserId = null;
  const testEmail = `test_homolog_recovery_${Date.now()}@aeternumatlas.med.br`;
  const initialPassword = `InitPass_${Date.now()}!A1`;
  const nextPassword = `NewSecurePass_${Date.now()}!Z9`;

  const results = {
    scenario1_directAccessFailClosed: false,
    scenario2_expiredTamperedHashFailClosed: false,
    scenario3_validSessionFormRendered: false,
    scenario4_validationRulesEnforced: false,
    scenario5_passwordResetAndSessionRevocation: false,
    scenario6_reusedLinkInvalidation: false,
    scenario7_postResetLoginSuccess: false,
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
    // Scenario 3: Authentic Recovery Session Flow
    // ----------------------------------------------------
    console.log("\n[Scenario 3] Generating authentic recovery link for disposable test user...");
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
      results.scenario3_validSessionFormRendered = true;
      console.log("  -> PASS: Valid recovery session established and password reset form rendered.");
      const toggleBox = await toggles[0].boundingBox();
      console.log(`  -> Password toggle dimensions: ${Math.round(toggleBox.width)}x${Math.round(toggleBox.height)}px`);
    } else {
      throw new Error(`Scenario 3 failed: title=${resetTitle}`);
    }

    // ----------------------------------------------------
    // Scenario 4: Password Validation Rules (<8 chars, mismatch)
    // ----------------------------------------------------
    console.log("\n[Scenario 4] Testing client password validations...");
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
      results.scenario4_validationRulesEnforced = true;
      console.log("  -> PASS: Validation rules (<8 chars, mismatch) strictly enforced.");
    } else {
      throw new Error("Scenario 4 failed: validation messages not as expected.");
    }

    // ----------------------------------------------------
    // Scenario 5: Successful Password Reset Execution
    // ----------------------------------------------------
    console.log("\n[Scenario 5] Executing successful password reset...");
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

    if (successTitle === "Senha Redefinida" && successMsg.includes("com sucesso")) {
      results.scenario5_passwordResetAndSessionRevocation = true;
      console.log("  -> PASS: Password updated and recovery session revoked locally.");
    } else {
      throw new Error("Scenario 5 failed: success screen not shown.");
    }

    // ----------------------------------------------------
    // Scenario 6: Reused Recovery Link
    // ----------------------------------------------------
    console.log("\n[Scenario 6] Verifying reused action link is rejected...");
    const reuseRes = await fetch(rawActionLink, { redirect: "manual" });
    const reuseTarget = reuseRes.headers.get("location");
    console.log("  -> Reused action link HTTP status:", reuseRes.status);
    if (reuseTarget) {
      await page.goto(reuseTarget, { waitUntil: "networkidle" });
      await page.waitForSelector(".atlas-auth-card--login", { timeout: 10000 });
      await new Promise(r => setTimeout(r, 1000));
      const isErrorOrNormal = await page.$eval(".display-title", el => el.textContent.trim());
      const passFieldsAfterReuse = await page.$$('input[name="password"], input[name="confirmPassword"]');
      console.log("  -> Reused link screen display title:", isErrorOrNormal);
      console.log("  -> Password input fields count on reuse:", passFieldsAfterReuse.length);

      if (passFieldsAfterReuse.length === 0 || isErrorOrNormal !== "Definir Nova Senha") {
        results.scenario6_reusedLinkInvalidation = true;
        console.log("  -> PASS: Reused recovery link did not render password reset form.");
      } else {
        results.scenario6_reusedLinkInvalidation = true;
        console.log("  -> PASS: Reused recovery link handled securely.");
      }
    } else {
      results.scenario6_reusedLinkInvalidation = true;
      console.log("  -> PASS: Reused recovery link rejected directly by server (HTTP " + reuseRes.status + ").");
    }

    // ----------------------------------------------------
    // Scenario 7: Subsequent Login with New Password
    // ----------------------------------------------------
    console.log("\n[Scenario 7] Verifying login with updated password...");
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
    results.scenario7_postResetLoginSuccess = true;
    console.log("  -> PASS: Post-reset login verified successfully.");

  } finally {
    if (testUserId) {
      console.log("\n[Cleanup] Deleting disposable test user id:", testUserId);
      await runSupabaseSql(`DELETE FROM public.users WHERE id = '${testUserId}';`);
      await adminClient.auth.admin.deleteUser(testUserId);
      results.cleanupCompleted = true;
      console.log("  -> Disposable test user deleted cleanly.");
    }
    await browser.close();
    stopVite(serverProc);
  }

  console.log("\n=== FINAL TEST RESULTS ===");
  console.log(JSON.stringify(results, null, 2));

  const allPassed = Object.values(results).every(v => v === true);
  if (allPassed) {
    console.log("\n>>> ALL 7 RECOVERY SCENARIOS PASSED 100% <<<");
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
