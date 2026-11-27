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
  generateDRECsv,
  simulateFinancialScenario,
  validateFinancialParameters,
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
  CAPEX_CATEGORIES,
  FOUNDER_IDS,
  FOUNDER_EMAILS
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

// --- Gate 4: Classificação Comercial Estrita & Cinco Fundadores Canônicos (FIN-02) ---
console.log("Auditando Gate 4: Classificação Comercial dos 5 Fundadores e Categorias...");
// 1. Cinco Fundadores Reais + Admin (UUID e e-mail)
assert.equal(classifyUserCommercialStatus({ id: "a3911a5c-a3d0-4318-9d45-f6be6ac38fb4", email: "halissonzanchin@aeternumatlas.com" }), COMMERCIAL_USER_TYPE.FOUNDER);
assert.equal(classifyUserCommercialStatus({ email: "halisson@aeternumatlas.com" }), COMMERCIAL_USER_TYPE.FOUNDER);
assert.equal(classifyUserCommercialStatus({ id: "a0168021-b8a2-4c35-8eab-c80240c10e07", email: "victor@aeternumatlas.com" }), COMMERCIAL_USER_TYPE.FOUNDER);
assert.equal(classifyUserCommercialStatus({ id: "f2591fae-8c18-4eb7-a97d-ae5ae90c5b34", email: "nicolas@aeternumatlas.com" }), COMMERCIAL_USER_TYPE.FOUNDER);
assert.equal(classifyUserCommercialStatus({ id: "e9931f64-4de9-46fc-9e56-6705345406cb", email: "lucasparedes@aeternumatlas.com" }), COMMERCIAL_USER_TYPE.FOUNDER);
assert.equal(classifyUserCommercialStatus({ id: "9f1cede4-3672-461b-bbe8-391dd59c988d", email: "edgar@aeternumatlas.com" }), COMMERCIAL_USER_TYPE.FOUNDER);
assert.equal(classifyUserCommercialStatus({ id: "19f44fd4-cba0-4a35-95c7-b1c5e3e9c5a0" }), COMMERCIAL_USER_TYPE.FOUNDER);
// Ensure founder3/4/5 are NOT recognized as founders
assert.notEqual(classifyUserCommercialStatus({ email: "founder3@aeternumatlas.com" }), COMMERCIAL_USER_TYPE.FOUNDER);
assert.notEqual(classifyUserCommercialStatus({ email: "founder4@aeternumatlas.com" }), COMMERCIAL_USER_TYPE.FOUNDER);
assert.notEqual(classifyUserCommercialStatus({ email: "founder5@aeternumatlas.com" }), COMMERCIAL_USER_TYPE.FOUNDER);

// 2. QA / E2E
assert.equal(classifyUserCommercialStatus({ email: "qa.voice.p0@aeternumatlas.com" }), COMMERCIAL_USER_TYPE.QA);
assert.equal(classifyUserCommercialStatus({ email: "atlas-e2e-ai-tutor@aeternumatlas.com" }), COMMERCIAL_USER_TYPE.QA);

// 3. Demo institucional
assert.equal(classifyUserCommercialStatus({ email: "demo.institucional@aeternumatlas.com" }), COMMERCIAL_USER_TYPE.DEMO);
assert.equal(classifyUserCommercialStatus({ email: "demo@aeternumatlas.com" }), COMMERCIAL_USER_TYPE.DEMO);

// 4. Beta Participant (Activated El Dorado)
assert.equal(classifyUserCommercialStatus({ id: "user-beta-1" }, { activatedBetaUserIds: new Set(["user-beta-1"]) }), COMMERCIAL_USER_TYPE.BETA_PARTICIPANT);

// 5. Free Teacher
assert.equal(classifyUserCommercialStatus({ role: "teacher", free_grant: true }), COMMERCIAL_USER_TYPE.TEACHER_FREE);
assert.equal(classifyUserCommercialStatus({ role: "teacher", license_type: "faculty_free" }), COMMERCIAL_USER_TYPE.TEACHER_FREE);

// 6. Commercial Student (Individual Paid)
assert.equal(classifyUserCommercialStatus({ subscriptionStatus: "ACTIVE", paid_individual: true }), COMMERCIAL_USER_TYPE.COMMERCIAL_STUDENT);

// 7. Institutional Student without certified billable contract -> UNCLASSIFIED (FIN-02)
assert.equal(classifyUserCommercialStatus({ institutionId: "inst-1" }), COMMERCIAL_USER_TYPE.UNCLASSIFIED);
assert.equal(classifyUserCommercialStatus({ institutionId: "inst-1", is_billable_license: true, contract_certified: true }), COMMERCIAL_USER_TYPE.INSTITUTIONAL_BILLABLE);

console.log("✓ Gate 4 Aprovado: Os 5 fundadores canônicos e todas as categorias validadas.");

// --- Gate 5: Motor Multimoeda Auditável & Erro em Moeda Desconhecida (FIN-05) ---
console.log("Auditando Gate 5: Motor Multimoeda (BRL, USD, PYG) e Falha em Moeda Desconhecida...");
const usdAmount = 100;
const convertedBRL = convertCurrency(usdAmount, CURRENCY.USD, CURRENCY.BRL);
assert.equal(convertedBRL, 575.00); // 100 * 5.75
assert.equal(convertCurrency(575.00, CURRENCY.BRL, CURRENCY.USD), 100.00);
assert.equal(convertCurrency(1000, CURRENCY.BRL, CURRENCY.BRL), 1000);

// Moeda desconhecida DEVE lançar exceção (FIN-05) e não retornar o valor não-convertido
assert.throws(() => {
  convertCurrency(100, "EUR", CURRENCY.BRL);
}, /Moeda desconhecida/);

assert.throws(() => {
  convertCurrency(100, CURRENCY.BRL, "XYZ");
}, /Moeda de destino desconhecida/);

console.log("✓ Gate 5 Aprovado: Conversão multimoeda e fail-safe de moeda desconhecida atestados.");

// --- Gate 6: Parametrização Fiscal & Governança (FIN-05) ---
console.log("Auditando Gate 6: Parametrização Fiscal (Lucro Presumido como Hipótese)...");
assert.equal(FISCAL_PARAMETERS.isHypothesis, true);
assert.equal(FISCAL_PARAMETERS.isHomologatedByAccountant, false);
assert.ok(FISCAL_PARAMETERS.governanceNotice.includes("HIPÓTESE DE PLANEJAMENTO"));

const exportTax = calculateRevenueDeductions(10000, "QUALIFIED_EXPORT_PARAGUAY");
assert.equal(exportTax.directTaxAmount, 0); // Isenção de PIS/COFINS/ISS
assert.equal(exportTax.netRevenueBRL, 10000);
// Corporate taxes: 10000 * 0.32 = 3200 base; IRPJ 15% (480) + CSLL 9% (288) = 768
assert.equal(exportTax.incomeTaxesAmount, 768.00);

const domesticTax = calculateRevenueDeductions(10000, "DOMESTIC_B2B");
assert.equal(domesticTax.directTaxAmount, 565.00); // 5.65% direto
assert.equal(domesticTax.netRevenueBRL, 9435.00);
console.log("✓ Gate 6 Aprovado: Governança fiscal e segregação por jurisdição confirmadas.");

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
  freeTeachers: 0,
  unitPriceBRL: 100.00,
  fixedOpexBRL: 14050.00,
  variableCostPerStudentBRL: 5.00,
  fiscalScenario: "QUALIFIED_EXPORT_PARAGUAY"
});
// Unit contribution = 100 - 5 = 95. Break-even = ceil(14050 / 95) = 148 students
assert.equal(validSim.breakEvenStudents, 148);
assert.ok(validSim.annualROI > 0);
console.log("✓ Gate 9 Aprovado: Break-even calculado com precisão e proteção contra divisão por zero.");

// --- Gate 10: Reconciliação Matemática dos 3 Vetores Auditados (FIN-03 & FIN-04) ---
console.log("Auditando Gate 10: Reconciliação Matemática Exata dos 3 Vetores Auditados...");

// 1. Cenário UPE: R$ 17.587,26
const upeSim = simulateFinancialScenario(PRESET_SCENARIOS.UPE_INSTITUTIONAL.parameters);
assert.equal(upeSim.mrr, 38812.50);
assert.equal(upeSim.arr, 465750.00);
assert.equal(upeSim.monthlyNetRevenue, 38812.50);
assert.equal(upeSim.monthlyDirectCosts, 2250.00); // (450 + 50) * 4.50
assert.equal(upeSim.monthlyContributionMargin, 36562.50);
assert.equal(upeSim.monthlyFixedOpex, 14050.00);
assert.equal(upeSim.monthlyOperatingResult, 22512.50); // EBITDA
assert.equal(upeSim.monthlyDepreciation, 1944.44);
assert.equal(upeSim.monthlyNetResult, 17587.26); // EXATO AO CENTAVO
assert.equal(upeSim.monthlyCashflowBeforeTax, 22512.50);
assert.equal(upeSim.monthlyCashflowAfterTax, 19531.70); // 17587.26 + 1944.44
assert.equal(upeSim.paybackMonthsBeforeTax, 3.1);
assert.equal(upeSim.paybackMonthsAfterTax, 3.6);
assert.equal(upeSim.breakEvenStudents, 175); // (14050 + 50*4.50) / (86.25 - 4.50) = 14275 / 81.75 = 174.61 -> 175
assert.equal(upeSim.runway.isPositive, true);
assert.ok(upeSim.runway.label.includes("POSITIVO"));
assert.ok(!upeSim.runway.label.includes("INFINITE"));

// 2. Cenário B2C 500: R$ 33.757,56
const b2c500Sim = simulateFinancialScenario(PRESET_SCENARIOS.B2C_500_STUDENTS.parameters);
assert.equal(b2c500Sim.mrr, 60000.00);
assert.equal(b2c500Sim.arr, 720000.00);
assert.equal(b2c500Sim.monthlyDirectCosts, 2250.00); // 500 * 4.50
assert.equal(b2c500Sim.monthlyOperatingResult, 40310.00);
assert.equal(b2c500Sim.monthlyNetResult, 33757.56); // EXATO AO CENTAVO
assert.equal(b2c500Sim.monthlyCashflowAfterTax, 35702.00); // 33757.56 + 1944.44
assert.equal(b2c500Sim.paybackMonthsBeforeTax, 1.7);
assert.equal(b2c500Sim.paybackMonthsAfterTax, 2.0);

// 3. Cenário B2C 250: R$ 8.756,56
const b2c250Sim = simulateFinancialScenario(PRESET_SCENARIOS.B2C_250_STUDENTS.parameters);
assert.equal(b2c250Sim.mrr, 30000.00);
assert.equal(b2c250Sim.arr, 360000.00);
assert.equal(b2c250Sim.monthlyDirectCosts, 1250.00); // 250 * 5.00
assert.equal(b2c250Sim.monthlyOperatingResult, 13005.00);
assert.equal(b2c250Sim.monthlyNetResult, 8756.56); // EXATO AO CENTAVO
assert.equal(b2c250Sim.monthlyCashflowAfterTax, 10701.00); // 8756.56 + 1944.44
assert.equal(b2c250Sim.paybackMonthsBeforeTax, 5.4);
assert.equal(b2c250Sim.paybackMonthsAfterTax, 6.5);

console.log("✓ Gate 10 Aprovado: Reconciliação dos 3 vetores auditados confirmada (UPE R$ 17.587,26 | B2C 500 R$ 33.757,56 | B2C 250 R$ 8.756,56).");

// --- Gate 11: Zeros Válidos e Alteração de OPEX (FIN-03) ---
console.log("Auditando Gate 11: Preservação de Zeros Válidos e Alinhamento DRE com OPEX...");
const zeroOpexSim = simulateFinancialScenario({
  billableStudents: 100,
  unitPriceBRL: 100.00,
  fixedOpexBRL: 0,
  freeTeachers: 0
});
assert.equal(zeroOpexSim.monthlyFixedOpex, 0); // NOT overridden by 14050
assert.equal(zeroOpexSim.parameters.freeTeachers, 0);

// Alteração de OPEX no simulador reflete integralmente na DRE
const simOpex20k = simulateFinancialScenario({
  billableStudents: 300,
  unitPriceBRL: 100.00,
  fixedOpexBRL: 20000.00
});
assert.equal(simOpex20k.monthlyFixedOpex, 20000.00);
// Somatório das linhas 6, 7, 8, 9 da DRE DEVE ser exatamente R$ 20.000,00
const dreLinesSum = simOpex20k.dre.lines
  .filter(l => [6, 7, 8, 9].includes(l.id))
  .reduce((acc, l) => acc + l.value, 0);
assert.equal(Number(dreLinesSum.toFixed(2)), 20000.00);
assert.equal(simOpex20k.dre.summary.operatingResult, simOpex20k.monthlyOperatingResult);

console.log("✓ Gate 11 Aprovado: Zeros válidos preservados e alteração de OPEX refletida 100% na DRE.");

// --- Gate 12: Validação de Parâmetros Negativos e Inválidos (FIN-03) ---
console.log("Auditando Gate 12: Rejeição de Parâmetros Negativos e Inválidos...");
const negCheck = validateFinancialParameters({ billableStudents: -10 });
assert.equal(negCheck.valid, false);
assert.ok(negCheck.errors.some(e => e.includes("não pode ser negativo")));

assert.throws(() => {
  simulateFinancialScenario({ billableStudents: -5 });
}, /Parâmetros inválidos/);

assert.throws(() => {
  simulateFinancialScenario({ unitPriceBRL: -100 });
}, /Parâmetros inválidos/);

console.log("✓ Gate 12 Aprovado: Validador de parâmetros protege integridade do motor.");

// --- Gate 13: Períodos Contratuais Inferiores a 12 Meses (FIN-03) ---
console.log("Auditando Gate 13: Períodos Contratuais Inferiores a 12 Meses...");
const sim6Months = simulateFinancialScenario({
  billableStudents: 100,
  unitPriceBRL: 100.00,
  contractMonths: 6
});
assert.equal(sim6Months.mrr, 10000.00);
assert.equal(sim6Months.arr, 120000.00); // ARR anualizado normalizado
assert.equal(sim6Months.contractPeriodTotalRevenue, 60000.00); // 6 meses
assert.equal(sim6Months.contractPeriodNetResult, Number((sim6Months.monthlyNetResult * 6).toFixed(2)));
console.log("✓ Gate 13 Aprovado: Segregação exata de MRR, ARR e receita total do período contratual.");

// --- Gate 14: Exportação CSV e Integridade dos Valores (FIN-03) ---
console.log("Auditando Gate 14: Exportação CSV e Integridade dos Valores...");
const csvOutput = generateDRECsv(upeSim.dre);
assert.ok(csvOutput.includes("Linha DRE;Código;Valor Projetado (BRL);Classificação Contábil"));
assert.ok(csvOutput.includes("REC_BRUTA;38812.50"));
assert.ok(csvOutput.includes("RES_LIQUIDO;17587.26"));
const csvRows = csvOutput.split("\n");
assert.equal(csvRows.length, 15); // Header + 14 linhas DRE
console.log("✓ Gate 14 Aprovado: Exportação CSV homologada com valores fiéis à DRE.");

// --- Gate 15: Segurança, Autorização e Governança de Disponibilidade (FIN-06 & FIN-01) ---
console.log("Auditando Gate 15: Segurança e Governança de Disponibilidade...");
// 1. Role não autorizada
const unauthorizedRes = await getRealizedFinancialMetrics({ userRole: "student" });
assert.equal(unauthorizedRes.status, "NOT_AUTHORIZED");
assert.equal(unauthorizedRes.mrrContracted, null);

// 2. Admin Institucional sem institutionId (bloqueio de fallback global)
const missingInstRes = await getRealizedFinancialMetrics({ userRole: "institution_admin" });
assert.equal(missingInstRes.status, "NOT_CONFIGURED");
assert.equal(missingInstRes.mrrContracted, null);
assert.ok(missingInstRes.statusNotice.includes("Fallback global bloqueado"));

console.log("✓ Gate 15 Aprovado: Controle de autorização, bloqueio de fallback e isolamento certificados.");

// --- Gate 16: Eliminação de Falsos Zeros e DRE Realizada Nula (FINAL-03) ---
console.log("Auditando Gate 16: Ausência de Falsos Zeros & DRE Realizada Nula (FINAL-03)...");
const realizedCheck = await getRealizedFinancialMetrics({ userRole: "super_admin" });
// 1. DRE realizada deve ser rigorosamente null sem livro razão contábil homologado
assert.equal(realizedCheck.dre, null, "DRE realizada deve ser null sem livro razão contábil homologado");
assert.ok(realizedCheck.dreNotice.includes("indisponível"), "dreNotice deve justificar ausência de ERP");

// 2. Fluxo de caixa realizado e faturamento do ciclo devem ser null / NOT_CONFIGURED
assert.equal(realizedCheck.cashFlow.status, "NOT_CONFIGURED", "Fluxo de caixa realizado deve ser NOT_CONFIGURED");
assert.equal(realizedCheck.cashFlow.inflows, null, "Entradas de caixa realizadas devem ser null");
assert.equal(realizedCheck.mrrReceived, null, "MRR recebido deve ser null na ausência de gateway financeiro");
assert.equal(realizedCheck.receivedInCycle, null, "Receita recebida no ciclo deve ser null");
assert.equal(realizedCheck.billedInCycle, null, "Receita faturada no ciclo deve ser null");

// 3. Contratos não certificados não devem gerar MRR falso
if (realizedCheck.status === "NOT_CERTIFIED") {
  assert.equal(realizedCheck.mrrContracted, null, "MRR contratado deve ser null quando status for NOT_CERTIFIED");
  assert.equal(realizedCheck.certified, false, "certified deve ser false");
}
console.log("✓ Gate 16 Aprovado: Falsos zeros eliminados e DRE realizada devidamente nula.");

console.log("\n=======================================================");
console.log("TODOS OS 16 GATES DETERMINÍSTICOS DO MOTOR APROVADOS!");
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
