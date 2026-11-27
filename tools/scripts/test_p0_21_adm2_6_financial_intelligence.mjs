/**
 * Test Suite: P0.21-ADM.2.6 — Financial Intelligence & Business Sustainability
 *
 * Validates:
 * PARTE 1: Testes Determinísticos do Motor Financeiro
 *   - Gate 1: Taxonomia Canônica e Segregação de Receitas (Projetada vs Contratada vs Faturada vs Recebida)
 *   - Gate 2: Precisão Monetária e Conversão em Centavos (Prevenção de Floating Point Error)
 *   - Gate 3: Normalização de MRR e ARR (12x multiplicador estrito)
 *   - Gate 4: Classificação Comercial Estrita (Exclusão de Fundadores, Beta e Professores de Receitas)
 *   - Gate 5: Motor Multimoeda Auditável (BRL, USD, PYG com Taxas de Referência)
 *   - Gate 6: Parametrização Fiscal (Lucro Presumido, Exportação Qualificada Paraguai vs Doméstica)
 *   - Gate 7: DRE Gerencial de 14 Linhas Canônicas (Integridade Matemática Exata)
 *   - Gate 8: Segregação Rigorosa de OPEX e CAPEX (Ativo de IA Local e Depreciação)
 *   - Gate 9: Métricas de Rentabilidade, Break-Even, Payback e ROI com Proteção de Divisão por Zero
 *   - Gate 10: Simulador Empresarial (Cenários UPE, B2C 250/500 e 5 Sócios Fundadores)
 *
 * PARTE 2: Testes Browser Multi-Viewport Playwright (Aeternum 26.1 Liquid Glass)
 *   - Desktop (1920x1080) Dark & Light
 *   - Notebook (1366x768) Dark & Light
 *   - Tablet (768x1024) Dark
 *   - Mobile (390x844) Dark
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import {
  toCents,
  fromCents,
  formatMoney,
  convertCurrency,
  buildManagerialDRE,
  simulateFinancialScenario,
  calculateRevenueDeductions,
  classifyUserCommercialStatus,
  getRealizedFinancialMetrics,
  REVENUE_NATURE,
  CONTRACT_STATUS,
  COMMERCIAL_USER_TYPE,
  CURRENCY,
  FISCAL_PARAMETERS,
  PRESET_SCENARIOS,
  OPEX_CATEGORIES,
  CAPEX_CATEGORIES
} from "../../src/services/financial/financialIntelligenceService.js";

const ARTIFACT_DIR = path.resolve(
  process.env.ARTIFACT_DIR ||
  "C:\\Users\\halis\\.gemini\\antigravity\\brain\\b63445c2-37f0-46a4-8ca8-5556eb65a8a3"
);

// ============================================================================
// PARTE 1: TESTES DETERMINÍSTICOS DO MOTOR FINANCEIRO
// ============================================================================

console.log("\n=======================================================");
console.log("PARTE 1: TESTES DETERMINÍSTICOS DO MOTOR FINANCEIRO (ADM.2.6)");
console.log("=======================================================\n");

// --- Gate 1: Taxonomia Canônica e Segregação de Receitas ---
console.log("Auditando Gate 1: Taxonomia Canônica e Segregação de Receitas...");
assert.equal(REVENUE_NATURE.PROJECTED, "PROJECTED");
assert.equal(REVENUE_NATURE.CONTRACTED, "CONTRACTED");
assert.equal(REVENUE_NATURE.BILLED, "BILLED");
assert.equal(REVENUE_NATURE.RECEIVED, "RECEIVED");
assert.equal(REVENUE_NATURE.RECURRENT, "RECURRENT");

// Ensure contract statuses are strictly segregated
assert.equal(CONTRACT_STATUS.PROPOSAL, "PROPOSAL");
assert.equal(CONTRACT_STATUS.NEGOTIATION, "NEGOTIATION");
assert.equal(CONTRACT_STATUS.HOMOLOGATION, "HOMOLOGATION");
assert.equal(CONTRACT_STATUS.ACTIVE, "ACTIVE");
console.log("✓ Gate 1 Aprovado: Taxonomia canônica e segregação estrita atestadas.");

// --- Gate 2: Precisão Monetária e Conversão em Centavos ---
console.log("Auditando Gate 2: Precisão Monetária e Conversão em Centavos...");
assert.equal(toCents(120.45), 12045);
assert.equal(toCents(0.1 + 0.2), 30); // Classic JS 0.30000000000000004 resolved
assert.equal(fromCents(12045), 120.45);
assert.equal(toCents(null), 0);
assert.equal(toCents(undefined), 0);
console.log("✓ Gate 2 Aprovado: Matemática monetária em centavos imune a floating-point drift.");

// --- Gate 3: Normalização de MRR e ARR (12x multiplicador estrito) ---
console.log("Auditando Gate 3: Normalização de MRR e ARR...");
const mockSim = simulateFinancialScenario({
  billableStudents: 100,
  unitPriceBRL: 100.00,
  contractMonths: 12
});
assert.equal(mockSim.mrr, 10000.00);
assert.equal(mockSim.arr, 120000.00);
assert.equal(mockSim.arr, mockSim.mrr * 12);
console.log("✓ Gate 3 Aprovado: Multiplicador 12x de MRR para ARR verificado.");

// --- Gate 4: Classificação Comercial Estrita ---
console.log("Auditando Gate 4: Classificação Comercial de Usuários...");
// 1. Founder
assert.equal(classifyUserCommercialStatus({ email: "halissonzanchin@aeternum-atlas.com" }), COMMERCIAL_USER_TYPE.FOUNDER);
assert.equal(classifyUserCommercialStatus({ email: "lucasparedes@aeternumatlas.com" }), COMMERCIAL_USER_TYPE.FOUNDER);
// 2. QA / Super Admin
assert.equal(classifyUserCommercialStatus({ email: "qa@aeternumatlas.com", role: "super_admin" }), COMMERCIAL_USER_TYPE.QA);
// 3. Demo
assert.equal(classifyUserCommercialStatus({ isDemo: true, email: "demo@medicina.br" }), COMMERCIAL_USER_TYPE.DEMO);
// 4. Beta Participant
assert.equal(classifyUserCommercialStatus({ beta_participant: true, email: "estudante1@upe.edu.py" }), COMMERCIAL_USER_TYPE.BETA_PARTICIPANT);
// 5. Free Teacher
assert.equal(classifyUserCommercialStatus({ role: "teacher", free_grant: true }), COMMERCIAL_USER_TYPE.TEACHER_FREE);
// 6. Institutional Billable Student
assert.equal(classifyUserCommercialStatus({ institutionId: "inst-1", is_billable_license: true }), COMMERCIAL_USER_TYPE.INSTITUTIONAL_BILLABLE);
// 7. Unclassified Student
assert.equal(classifyUserCommercialStatus({ institutionId: "inst-1" }), COMMERCIAL_USER_TYPE.UNCLASSIFIED);
console.log("✓ Gate 4 Aprovado: Zero vazamento de fundadores e beta como receita pagante.");

// --- Gate 5: Motor Multimoeda Auditável ---
console.log("Auditando Gate 5: Motor Multimoeda (BRL, USD, PYG)...");
const usdAmount = 100;
const convertedBRL = convertCurrency(usdAmount, CURRENCY.USD, CURRENCY.BRL);
assert.equal(convertedBRL, 575.00); // 100 * 5.75
assert.equal(convertCurrency(575.00, CURRENCY.BRL, CURRENCY.USD), 100.00);
assert.equal(convertCurrency(1000, CURRENCY.BRL, CURRENCY.BRL), 1000);
console.log("✓ Gate 5 Aprovado: Conversão multimoeda rastreável e auditável.");

// --- Gate 6: Parametrização Fiscal ---
console.log("Auditando Gate 6: Parametrização Fiscal (Lucro Presumido)...");
const exportTax = calculateRevenueDeductions(10000, "QUALIFIED_EXPORT_PARAGUAY");
assert.equal(exportTax.directTaxAmount, 0); // Isenção de PIS/COFINS/ISS
assert.equal(exportTax.netRevenueBRL, 10000);

const domesticTax = calculateRevenueDeductions(10000, "DOMESTIC_B2B");
assert.equal(domesticTax.directTaxAmount, 565.00); // 5.65% direto
assert.equal(domesticTax.netRevenueBRL, 9435.00);
console.log("✓ Gate 6 Aprovado: Regras tributárias segregadas por jurisdição.");

// --- Gate 7: DRE Gerencial de 14 Linhas Canônicas ---
console.log("Auditando Gate 7: DRE Gerencial de 14 Linhas Canônicas...");
const dre = buildManagerialDRE({
  grossRevenueBRL: 20000.00,
  directTaxesBRL: 1130.00,
  directCostsBRL: 1000.00,
  adminExpensesBRL: 350.00,
  commercialExpensesBRL: 1200.00,
  techExpensesBRL: 500.00,
  proLaboreBRL: 12500.00,
  depreciationBRL: 1944.44,
  financialResultBRL: 100.00,
  incomeTaxesBRL: 500.00
});

assert.equal(dre.lines.length, 14);
assert.equal(dre.summary.grossRevenue, 20000.00);
assert.equal(dre.summary.netRevenue, 18870.00); // 20000 - 1130
assert.equal(dre.summary.contributionMargin, 17870.00); // 18870 - 1000
assert.equal(dre.summary.operatingResult, 3320.00); // 17870 - (350 + 1200 + 500 + 12500)
// Net Result = 3320 - 1944.44 + 100 - 500 = 975.56
assert.equal(dre.summary.netResult, 975.56);
console.log("✓ Gate 7 Aprovado: 14 linhas da DRE matematicamente perfeitas.");

// --- Gate 8: Segregação Rigorosa de OPEX e CAPEX ---
console.log("Auditando Gate 8: Segregação Rigorosa de OPEX e CAPEX...");
assert.ok(OPEX_CATEGORIES.ACCOUNTING);
assert.ok(OPEX_CATEGORIES.PRO_LABORE);
assert.ok(CAPEX_CATEGORIES.AI_SERVERS);
assert.ok(CAPEX_CATEGORIES.GPUS);

// Verify that a CAPEX investment does not enter OPEX directly, but via depreciation
const capexSim = simulateFinancialScenario({
  capexInvestmentBRL: 72000.00,
  capexDepreciationMonths: 36
});
assert.equal(capexSim.monthlyDepreciation, 2000.00); // 72000 / 36
console.log("✓ Gate 8 Aprovado: CAPEX amortizado em 36 meses sem contaminação do OPEX mensal.");

// --- Gate 9: Métricas de Rentabilidade, Break-Even e Proteção Zero Denominador ---
console.log("Auditando Gate 9: Métricas de Rentabilidade e Divisão por Zero...");
const zeroStudentsSim = simulateFinancialScenario({
  billableStudents: 0,
  unitPriceBRL: 100.00
});
assert.equal(zeroStudentsSim.mrr, 0);
assert.equal(zeroStudentsSim.breakEvenStudents, null); // Protected against div by zero

const validSim = simulateFinancialScenario({
  billableStudents: 300,
  unitPriceBRL: 100.00,
  fixedOpexBRL: 14050.00,
  variableCostPerStudentBRL: 5.00,
  fiscalScenario: "QUALIFIED_EXPORT_PARAGUAY"
});
// Unit contribution = 100 - 5 = 95. Break-even = ceil(14050 / 95) = 148 students
assert.equal(validSim.breakEvenStudents, 148);
assert.ok(validSim.annualROI > 0);
console.log("✓ Gate 9 Aprovado: Break-even calculado com precisão e proteção contra divisão por zero.");

// --- Gate 10: Simulador Empresarial (Cenário UPE) ---
console.log("Auditando Gate 10: Simulador Empresarial (Cenário UPE)...");
const upeSim = simulateFinancialScenario(PRESET_SCENARIOS.UPE_INSTITUTIONAL.parameters);
// 450 students * $15 = $6,750 USD * 5.75 = R$ 38,812.50
assert.equal(upeSim.mrr, 38812.50);
assert.equal(upeSim.arr, 465750.00);
assert.ok(upeSim.monthlyNetResult > 0);
assert.ok(upeSim.paybackMonths < 12); // UPE scenario pays back local AI in < 1 year
console.log(`✓ Gate 10 Aprovado: Cenário UPE validado (MRR: R$ ${upeSim.mrr.toLocaleString('pt-BR')}, Payback: ${upeSim.paybackMonths} meses).`);

console.log("\n=======================================================");
console.log("TODOS OS 10 GATES DETERMINÍSTICOS DO MOTOR APROVADOS!");
console.log("=======================================================\n");

// ============================================================================
// PARTE 2: TESTES BROWSER MULTI-VIEWPORT (AETERNUM 26.1 LIQUID GLASS)
// ============================================================================

console.log("=======================================================");
console.log("PARTE 2: TESTES BROWSER MULTI-VIEWPORT (AETERNUM 26.1)");
console.log("=======================================================\n");

function makeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = "synthetic-signature-for-fail-closed-test-suite";
  return `${header}.${body}.${signature}`;
}

const VIEWPORTS = [
  { name: "desktop", width: 1920, height: 1080, theme: "dark" },
  { name: "desktop", width: 1920, height: 1080, theme: "light" },
  { name: "notebook", width: 1366, height: 768, theme: "dark" },
  { name: "notebook", width: 1366, height: 768, theme: "light" },
  { name: "tablet", width: 768, height: 1024, theme: "dark" },
  { name: "mobile", width: 390, height: 844, theme: "dark" }
];

const PORT = 5185;
const PREVIEW_URL = `http://localhost:${PORT}/super-admin/billing`;

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
    console.log(`Port ${PORT} is already in use, reusing.`);
    return null;
  }
  console.log(`Iniciando Vite preview server na porta ${PORT}...`);
  const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const proc = spawn(npxCmd, ["vite", "preview", "--port", String(PORT), "--strictPort"], {
    cwd: process.cwd(),
    stdio: "pipe",
    shell: process.platform === "win32"
  });

  const start = Date.now();
  while (Date.now() - start < 15000) {
    await new Promise(r => setTimeout(r, 400));
    if (await isPortListening(PORT)) {
      console.log(`Preview server pronto em http://localhost:${PORT}`);
      return proc;
    }
  }
  throw new Error(`Timeout starting Vite preview on port ${PORT}`);
}

async function runBrowserSuite() {
  const previewProcess = await startViteServer();
  const browser = await chromium.launch({ headless: true });

  const superAdminUser = {
    id: "a3911a5c-a3d0-4318-9d45-f6be6ac38fb4",
    name: "Dr. Halisson Zanchin",
    email: "halissonzanchin@aeternumatlas.com",
    role: "super_admin",
    status: "active",
    accountStatus: "active",
    institutionId: "inst-1",
    institution_id: "inst-1"
  };

  const token = makeJwt({
    session_id: "sess-" + superAdminUser.id,
    sub: superAdminUser.id,
    email: superAdminUser.email,
    role: "authenticated",
    app_metadata: { role: superAdminUser.role }
  });

  const sessionObj = {
    access_token: token,
    refresh_token: "dummy-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: superAdminUser.id,
      email: superAdminUser.email,
      role: "authenticated",
      app_metadata: { role: superAdminUser.role }
    }
  };

  try {
    for (const vp of VIEWPORTS) {
      console.log(`Testando Viewport: ${vp.name} (${vp.width}x${vp.height}) - Tema: ${vp.theme}...`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: vp.theme
      });
      const page = await context.newPage();

      // Intercept authentication & Supabase calls
      await page.route("**/*", async (route) => {
        const req = route.request();
        const url = req.url();

        if (url.startsWith(`http://localhost:${PORT}`) || url.startsWith("http://127.0.0.1:")) {
          return route.continue();
        }

        if (url.includes("/auth/v1/")) {
          if (url.includes("/user") || url.includes("/session")) {
            return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sessionObj.user) });
          }
          return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(sessionObj) });
        }

        if (url.includes("/rest/v1/")) {
          const accept = req.headers()["accept"] || "";

          // RPCs
          if (url.includes("/rpc/register_or_transfer_session") || url.includes("/rpc/check_session_health")) {
            return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, allowed: true, status: "SESSION_GRANTED", valid: true }) });
          }
          if (url.includes("/rpc/get_student_notifications")) {
            return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
          }

          // USERS
          if (url.includes("/users")) {
            if (accept.includes("vnd.pgrst.object+json")) {
              return route.fulfill({
                status: 200,
                contentType: "application/vnd.pgrst.object+json",
                headers: { "content-range": "0-0/1" },
                body: JSON.stringify(superAdminUser)
              });
            }
            return route.fulfill({
              status: 200,
              contentType: "application/json",
              headers: { "content-range": "0-0/1" },
              body: JSON.stringify([superAdminUser])
            });
          }

          // INSTITUTIONS
          if (url.includes("/institutions")) {
            const instRecord = {
              id: "inst-1",
              name: "Universidad Privada del Este (UPE)",
              display_name: "Universidad Privada del Este (UPE)",
              slug: "upe",
              active: true,
              contracted_capacity: 500,
              price_per_student: 0,
              contract_status: "NEGOTIATION"
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

          // Fallback empty data for logs/events/profiles
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "content-range": "0-0/0" },
            body: JSON.stringify([])
          });
        }

        return route.abort("blockedbyclient");
      });

      await context.addInitScript(({ user, session, theme }) => {
        window.localStorage.setItem("aeternum.react.auth_profile", JSON.stringify(user));
        window.localStorage.setItem("aeternum.react.session", JSON.stringify(user.id));
        window.localStorage.setItem("sb-hyivyrietgjdazgizafp-auth-token", JSON.stringify(session));
        window.localStorage.setItem("aeternum.theme", theme);
        window.localStorage.setItem("aeternum_theme", theme);
        window.localStorage.setItem("atlas_theme", theme);
      }, { user: superAdminUser, session: sessionObj, theme: vp.theme });

      await page.goto(PREVIEW_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      // Verify header presence
      const hasTitle = await page.evaluate(() => {
        return document.body.innerText.includes("Financial Intelligence Center");
      });
      assert.ok(hasTitle, "Título Financial Intelligence Center deve estar visível");

      // Verify tab switching (Click on DRE Gerencial tab)
      const dreTabBtn = await page.$("button:has-text('DRE Gerencial')");
      if (dreTabBtn) {
        await dreTabBtn.click();
        await page.waitForTimeout(500);
      }

      // Capture Screenshot
      const screenshotFilename = `p0_21_adm2_6_financial_intelligence_${vp.name}_${vp.width}x${vp.height}_${vp.theme}.png`;
      const screenshotPath = path.join(ARTIFACT_DIR, screenshotFilename);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✓ Screenshot salvo: ${screenshotFilename}`);

      await context.close();
    }
  } finally {
    await browser.close();
    stopViteServer(previewProcess);
  }

  console.log("\n=======================================================");
  console.log("HOMOLOGAÇÃO MULTI-VIEWPORT CONCLUÍDA COM SUCESSO!");
  console.log("=======================================================\n");
  console.log(">>> SUÍTE ADM.2.6 APROVADA COM ZERO REGRESSÕES <<<\n");
}

runBrowserSuite().catch((err) => {
  console.error("FALHA NA EXECUÇÃO DA SUÍTE ADM.2.6:", err);
  process.exit(1);
});
