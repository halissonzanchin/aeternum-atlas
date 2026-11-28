/**
 * Aeternum Atlas — Financial Intelligence & Business Sustainability Service
 * Module: P0.21-ADM.2.6 / P0.21-ADM.2.6-R1
 *
 * Provides financial taxonomy, contract management, individual subscription models,
 * OPEX/CAPEX tracking, managerial DRE (14 canonical lines), cash flow,
 * parameterizable fiscal rules, multicurrency engine (BRL, USD, PYG),
 * profitability/runway analytics, and interactive business simulation.
 *
 * Strict Compliance (P0.21-ADM.2.6-R1):
 * - FIN-01: Contractual certification with documentary validation; distinction of capacity,
 *           billable vs free licenses, term dates, and uncertified states.
 * - FIN-02: Canonical classification reusing ADM.2.1 (classifyStudentAccount); zero duplicate
 *           founder lists; exclusion of 5 real founders, QA, Demo, Beta, and Free Teachers.
 * - FIN-03: Single calculation source for simulator, DRE, profitability & export; elimination of
 *           || fallbacks on valid zeros (using ??); parameter validation; exact reconciled results:
 *           UPE: R$ 17.587,26 | B2C 500: R$ 33.757,56 | B2C 250: R$ 8.756,56.
 * - FIN-04: Payback before & after tax; realistic runway (no 'INFINITE'); break-even accounting
 *           for free teachers and direct taxes; clear segregation of CAPEX, constitution & reserve.
 * - FIN-05: Lucro Presumido as historical planning hypothesis (not accountant-homologated);
 *           planning exchange rates (not BACEN-certified); error on unknown currencies.
 * - FIN-06: Server-side authorization; mandatory institutionId for institutional admins (no global
 *           fallback); explicit EMPTY, NOT_CONFIGURED, UNAVAILABLE, and NOT_AUTHORIZED states.
 */

import { supabase } from "../../lib/supabase.js";
import { normalizeRole, ROLES } from "../permissions/permissionService.js";
import { isSupabaseConfigured } from "../supabase/supabaseClient.js";
import {
  classifyStudentAccount,
  STUDENT_ACCOUNT_CATEGORIES,
  FOUNDER_IDS,
  FOUNDER_EMAILS
} from "../admin/institutionDashboardService.js";

// ============================================================================
// 1. CANONICAL FINANCIAL TAXONOMY & TYPES
// ============================================================================

export const REVENUE_NATURE = {
  PROJECTED: "PROJECTED",       // Receita estimada a partir de simulação ou proposta
  CONTRACTED: "CONTRACTED",     // Valor amparado por contrato vigente documentalmente certificado
  BILLED: "BILLED",             // Fatura/obrigação de cobrança emitida (NFS-e / Gateway)
  RECEIVED: "RECEIVED",         // Valor liquidado em conta bancária
  RECEIVABLE: "RECEIVABLE",     // Faturado pendente de liquidação
  RECURRENT: "RECURRENT"        // Componente mensal/anual normalizado (MRR/ARR)
};

export const CONTRACT_STATUS = {
  PROPOSAL: "PROPOSAL",         // Proposta comercial em elaboração
  NEGOTIATION: "NEGOTIATION",   // Em negociação com reitoria/coordenação
  HOMOLOGATION: "HOMOLOGATION", // Jurídico/Compliance institucional
  ACTIVE: "ACTIVE",             // Vigente formalmente
  SUSPENDED: "SUSPENDED",       // Pausado temporariamente
  TERMINATED: "TERMINATED",     // Encerrado / Expirado
  NOT_CERTIFIED: "NOT_CERTIFIED", // Ativo no sistema mas sem comprovação documental
  NOT_CONFIGURED: "NOT_CONFIGURED" // Sem contrato formal cadastrado
};

export const SUBSCRIPTION_STATUS = {
  TRIAL: "TRIAL",
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELLED: "CANCELLED"
};

export const EXPENSE_STATUS = {
  PLANNED: "PLANNED",
  CONTRACTED: "CONTRACTED",
  INCURRED: "INCURRED",
  PAID: "PAID",
  OVERDUE: "OVERDUE"
};

export const ASSET_STATUS = {
  PLANNED: "PLANNED",
  ACQUIRED: "ACQUIRED",
  OPERATIONAL: "OPERATIONAL",
  DEPRECIATED: "DEPRECIATED"
};

export const CURRENCY = {
  BRL: "BRL",
  USD: "USD",
  PYG: "PYG"
};

export const COMMERCIAL_USER_TYPE = {
  FOUNDER: "FOUNDER",                     // 5 Fundadores reais - Isento de cobrança
  QA: "QA",                               // Contas de auditoria técnica - Isento
  DEMO: "DEMO",                           // Demonstração institucional - Isento
  BETA_PARTICIPANT: "BETA_PARTICIPANT",   // Alunos Beta gratuitos (El Dorado) - Isento
  TEACHER_FREE: "TEACHER_FREE",           // Docentes com acesso gratuito acordado - Isento
  COMMERCIAL_STUDENT: "COMMERCIAL_STUDENT", // Assinante individual B2C pagante
  INSTITUTIONAL_BILLABLE: "INSTITUTIONAL_BILLABLE", // Aluno sob contrato B2B faturável certificado
  UNCLASSIFIED: "UNCLASSIFIED"            // Sem classificação documental comprovada
};

// ============================================================================
// 2. MONETARY UTILITIES & SAFE HIGH-PRECISION MATH
// ============================================================================

/**
 * Normalizes any number to integer cents to avoid floating point drift.
 */
export function toCents(amount) {
  if (amount == null || isNaN(amount)) return 0;
  return Math.round(Number(amount) * 100);
}

/**
 * Converts integer cents back to decimal currency unit.
 */
export function fromCents(cents) {
  if (cents == null || isNaN(cents)) return 0;
  return Number((cents / 100).toFixed(2));
}

/**
 * Formats monetary value with explicit currency symbol and locale.
 */
export function formatMoney(amount, currency = CURRENCY.BRL) {
  if (amount == null || isNaN(amount)) return "—";
  const num = Number(amount);

  if (currency === CURRENCY.USD) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  }
  if (currency === CURRENCY.PYG) {
    return new Intl.NumberFormat("es-PY", { style: "currency", currency: "PYG", maximumFractionDigits: 0 }).format(num);
  }
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

// ============================================================================
// 3. MULTICURRENCY CONVERSION ENGINE (GOVERNANÇA CAMBIAL FIN-05)
// ============================================================================

export const REFERENCE_EXCHANGE_RATES = {
  base: CURRENCY.BRL,
  asOf: "2026-11-27",
  source: "Câmbio de Planejamento (Hipótese de Simulação: 1 USD = 5,75 BRL; 1 PYG = 0,00075 BRL - Não homologado pelo BACEN)",
  isObserved: false,
  rates: {
    BRL: 1.0,
    USD: 5.75,       // 1 USD = 5.75 BRL (Hipótese de planejamento de simulação)
    PYG: 0.00075     // 1 PYG = 0.00075 BRL (Hipótese de planejamento de simulação)
  }
};

/**
 * Safely converts an amount from source currency to target currency using traceable exchange rates.
 * If currency is unknown, throws an Error to prevent unconverted values being treated as converted (FIN-05).
 */
export function convertCurrency(amount, fromCurrency, toCurrency = CURRENCY.BRL, customRate = null) {
  if (amount == null || isNaN(amount)) return 0;
  if (fromCurrency === toCurrency) return Number(Number(amount).toFixed(2));

  const num = Number(amount);
  let rateToBRL = customRate;

  if (rateToBRL == null) {
    rateToBRL = REFERENCE_EXCHANGE_RATES.rates[fromCurrency];
    if (rateToBRL == null) {
      throw new Error(`[financial] Moeda desconhecida '${fromCurrency}'. Conversão cambial indisponível.`);
    }
  }

  // Convert to BRL first
  const inBRL = fromCurrency === CURRENCY.BRL ? num : num * rateToBRL;

  // Convert from BRL to target
  if (toCurrency === CURRENCY.BRL) {
    return Number(inBRL.toFixed(2));
  }

  const targetRate = REFERENCE_EXCHANGE_RATES.rates[toCurrency];
  if (targetRate == null) {
    throw new Error(`[financial] Moeda de destino desconhecida '${toCurrency}'. Conversão cambial indisponível.`);
  }

  return Number((inBRL / targetRate).toFixed(2));
}

// ============================================================================
// 4. FISCAL PARAMETERIZATION ENGINE (LUCRO PRESUMIDO & EXPORTAÇÃO FIN-05)
// ============================================================================

/**
 * Parameterized fiscal scenarios. Taxes are NEVER hardcoded in business logic,
 * but resolved from this auditable configuration structure.
 * Explicitly tagged as planning hypothesis (FIN-05).
 */
export const FISCAL_PARAMETERS = {
  regime: "Lucro Presumido",
  isHypothesis: true,
  isHomologatedByAccountant: false,
  governanceNotice: "HIPÓTESE DE PLANEJAMENTO (NÃO HOMOLOGADA): Regras tributárias sob regime de Lucro Presumido constituem premissa técnica de simulação e requerem homologação formal por profissional contábil habilitado.",
  companyType: "Sociedade Limitada",
  cnaePrincipal: "85.50-3-02 (Atividades de apoio à educação) / 62.01-5-01 (Desenvolvimento de software)",
  reformaTributaria: {
    status: "HIPÓTESE_TRANSIÇÃO",
    notice: "Transição IBS/CBS prevista na EC 132/2023 não aplicada nas simulações base 2026/2027; mantido regime cumulativo atual."
  },
  rules: {
    DOMESTIC_B2B: {
      jurisdiction: "Brasil",
      description: "Serviços prestados a instituições ou assinantes sediados no território brasileiro",
      isHypothesis: true,
      rates: {
        PIS: 0.0065,          // 0.65% (cumulativo)
        COFINS: 0.03,         // 3.00% (cumulativo)
        ISS: 0.02,            // 2.00% (média municipal estimada)
        IRPJ_PRESUNCAO: 0.32, // Base de presunção de serviços 32%
        IRPJ_ALIQUOTA: 0.15,  // 15% sobre a base presumida
        IRPJ_ADICIONAL: 0.10, // 10% sobre excedente de R$ 20k/mês
        CSLL_PRESUNCAO: 0.32, // Base de presunção 32%
        CSLL_ALIQUOTA: 0.09   // 9% sobre a base presumida
      },
      effectiveDirectTaxRate: 0.0565 // PIS + COFINS + ISS = 5.65% sobre receita bruta
    },
    QUALIFIED_EXPORT_PARAGUAY: {
      jurisdiction: "Paraguai / Internacional",
      description: "Exportação de serviços de software médico/educacional com ingresso de divisas comprovado",
      isHypothesis: true,
      qualificationNotice: "A não-incidência de PIS/COFINS/ISS sobre exportação de serviços depende de comprovação cambial e ausência de fruição no território brasileiro.",
      rates: {
        PIS: 0.00,            // Imunidade/Isenção de PIS na exportação qualificada
        COFINS: 0.00,         // Imunidade/Isenção de COFINS na exportação qualificada
        ISS: 0.00,            // Não-incidência de ISS quando o resultado se verifica no exterior
        IRPJ_PRESUNCAO: 0.32,
        IRPJ_ALIQUOTA: 0.15,
        CSLL_PRESUNCAO: 0.32,
        CSLL_ALIQUOTA: 0.09
      },
      effectiveDirectTaxRate: 0.00 // Zero impostos diretos sobre receita bruta
    },
    NON_QUALIFIED_EXPORT: {
      jurisdiction: "Internacional (Resultado no Brasil)",
      description: "Serviço com contraparte externa mas usufruído ou liquidado em moeda doméstica sem comprovação cambial",
      isHypothesis: true,
      rates: {
        PIS: 0.0065,
        COFINS: 0.03,
        ISS: 0.02,
        IRPJ_PRESUNCAO: 0.32,
        IRPJ_ALIQUOTA: 0.15,
        CSLL_PRESUNCAO: 0.32,
        CSLL_ALIQUOTA: 0.09
      },
      effectiveDirectTaxRate: 0.0565
    }
  }
};

/**
 * Calculates tax deductions on gross revenue based on fiscal scenario.
 */
export function calculateRevenueDeductions(grossRevenueBRL, scenario = "QUALIFIED_EXPORT_PARAGUAY") {
  const rule = FISCAL_PARAMETERS.rules[scenario] || FISCAL_PARAMETERS.rules.DOMESTIC_B2B;
  const directTax = grossRevenueBRL * rule.effectiveDirectTaxRate;
  const netRevenue = Math.max(0, grossRevenueBRL - directTax);

  // Corporate taxes (IRPJ + CSLL on Presumed Profit Base 32%)
  const basePresumed = grossRevenueBRL * (rule.rates.IRPJ_PRESUNCAO ?? 0.32);
  const irpj = basePresumed * (rule.rates.IRPJ_ALIQUOTA ?? 0.15);
  const csll = basePresumed * (rule.rates.CSLL_ALIQUOTA ?? 0.09);
  const totalIncomeTaxes = irpj + csll;

  return {
    scenario,
    grossRevenueBRL: Number(grossRevenueBRL.toFixed(2)),
    directTaxRate: rule.effectiveDirectTaxRate,
    directTaxAmount: Number(directTax.toFixed(2)),
    netRevenueBRL: Number(netRevenue.toFixed(2)),
    incomeTaxesAmount: Number(totalIncomeTaxes.toFixed(2)),
    description: rule.description
  };
}

// ============================================================================
// 5. COMMERCIAL USER CLASSIFICATION (FIN-02)
// ============================================================================

/**
 * Classifies a user account into its commercial eligibility category,
 * canonically delegating to ADM.2.1 classification (FIN-02).
 * Excludes 5 real founders, QA, Demo, Beta, and Free Teachers from paying revenue.
 */
export function classifyUserCommercialStatus(user, options = {}) {
  if (!user) return COMMERCIAL_USER_TYPE.UNCLASSIFIED;

  // 1. Reutilizar classificação canônica do institutionDashboardService (ADM.2.1)
  const canonicalCategory = classifyStudentAccount(user, options);

  if (canonicalCategory === STUDENT_ACCOUNT_CATEGORIES.FOUNDER) {
    return COMMERCIAL_USER_TYPE.FOUNDER;
  }
  if (canonicalCategory === STUDENT_ACCOUNT_CATEGORIES.QA) {
    return COMMERCIAL_USER_TYPE.QA;
  }
  if (canonicalCategory === STUDENT_ACCOUNT_CATEGORIES.DEMO) {
    return COMMERCIAL_USER_TYPE.DEMO;
  }
  if (canonicalCategory === STUDENT_ACCOUNT_CATEGORIES.EXTERNAL_BETA) {
    return COMMERCIAL_USER_TYPE.BETA_PARTICIPANT;
  }

  const role = normalizeRole(user.role);

  // 2. Professores com isenção pedagógica concedida
  if (role === ROLES.TEACHER && (user.free_grant || user.license_type === "faculty_free")) {
    return COMMERCIAL_USER_TYPE.TEACHER_FREE;
  }

  // 3. Assinante individual B2C pagante ativo
  if (user.subscriptionStatus === "ACTIVE" && user.paid_individual === true) {
    return COMMERCIAL_USER_TYPE.COMMERCIAL_STUDENT;
  }

  // 4. Aluno sob contrato institucional comprovado
  if (canonicalCategory === STUDENT_ACCOUNT_CATEGORIES.COMMERCIAL) {
    return COMMERCIAL_USER_TYPE.INSTITUTIONAL_BILLABLE;
  }

  // Matrícula acadêmica pura ou vínculo institucional sem contrato faturável certificado
  if (user.institutionId || user.institution_id) {
    if (user.is_billable_license === true && user.contract_certified === true) {
      return COMMERCIAL_USER_TYPE.INSTITUTIONAL_BILLABLE;
    }
  }

  return COMMERCIAL_USER_TYPE.UNCLASSIFIED;
}

// Re-export canonical founder sets for reference and test suites
export { FOUNDER_IDS, FOUNDER_EMAILS };

// ============================================================================
// 6. CONTRACTS REPOSITORY (B2B - FIN-01)
// ============================================================================

/**
 * Fundação não persistente de contratos em memória / planejamento (FIN-01).
 * Não substitui homologação contratual produtiva. Em produção, contratos
 * não certificados documentalmente são marcados como NOT_CERTIFIED.
 */
export const CERTIFIED_CONTRACTS_STORE = [
  // Fundação não persistente vazia por padrão no baseline de produção
];

// ============================================================================
// 7. OPEX & CAPEX TAXONOMY & REPOSITORIES
// ============================================================================

export const OPEX_CATEGORIES = {
  ACCOUNTING: "Contabilidade",
  PRO_LABORE: "Pró-labore dos Sócios",
  MARKETING: "Marketing & Comunicação Institucional",
  CLOUD_VERCEL: "Vercel Frontend & Edge",
  CLOUD_SUPABASE: "Supabase Database & Auth",
  CLOUD_CLOUDFLARE: "Cloudflare Tunnel & DNS",
  SKETCHFAB: "Sketchfab API / Licenças 3D",
  RESEND: "Resend Email Transacional",
  ENERGY: "Energia Elétrica (Host IA Local)",
  CONNECTIVITY: "Conectividade de Rede / Fibra Óptica",
  MAINTENANCE: "Manutenção Preventiva de Hardware",
  SOFTWARE_LICENSES: "Licenças de Software / Dev Tools",
  SUPPORT: "Suporte Técnico Especializado",
  OUTSOURCED: "Serviços Terceirizados",
  TAXES: "Tributos e Encargos Municipais/Federais",
  OTHER: "Outras Despesas Operacionais"
};

export const CAPEX_CATEGORIES = {
  AI_SERVERS: "Servidores de IA Dedicados",
  GPUS: "Placas de Vídeo (NVIDIA RTX / Workstation)",
  WORKSTATIONS: "Estações de Engenharia e Modelagem",
  STORAGE_NAS: "Armazenamento em Rede / NVMe NAS",
  RACK_MOUNT: "Rack e Acomodações de Servidor",
  UPS_BATTERY: "No-break / UPS Senoidal de Proteção",
  COOLING: "Refrigeração Dedicada e Climatização",
  CAPTURE_3D: "Equipamentos de Fotogrametria e Escaneamento 3D",
  NETWORK_SWITCHES: "Switches Gerenciáveis 10GbE",
  TECH_ASSETS: "Outros Ativos de Infraestrutura"
};

// ============================================================================
// 8. MANAGERIAL DRE (14 CANONICAL LINES - FIN-03)
// ============================================================================

/**
 * Builds the 14-line Managerial DRE (Demonstração do Resultado do Exercício).
 * Strict mathematical consistency with simulation results.
 */
export function buildManagerialDRE({
  grossRevenueBRL = 0,
  directTaxesBRL = 0,
  directCostsBRL = 0,
  adminExpensesBRL = 0,
  commercialExpensesBRL = 0,
  techExpensesBRL = 0,
  proLaboreBRL = 0,
  depreciationBRL = 0,
  financialResultBRL = 0,
  incomeTaxesBRL = 0,
  isProjected = false
}) {
  // 1. Receita Bruta
  const line1 = Number(grossRevenueBRL.toFixed(2));
  // 2. Deduções e tributos sobre receita
  const line2 = Number(directTaxesBRL.toFixed(2));
  // 3. Receita Líquida (1 - 2)
  const line3 = Number((line1 - line2).toFixed(2));
  // 4. Custos diretos (Hosting, APIs, infra direta)
  const line4 = Number(directCostsBRL.toFixed(2));
  // 5. Margem de Contribuição (3 - 4)
  const line5 = Number((line3 - line4).toFixed(2));
  // 6. Despesas administrativas
  const line6 = Number(adminExpensesBRL.toFixed(2));
  // 7. Despesas comerciais e marketing
  const line7 = Number(commercialExpensesBRL.toFixed(2));
  // 8. Despesas tecnológicas e P&D
  const line8 = Number(techExpensesBRL.toFixed(2));
  // 9. Pró-labore dos Sócios
  const line9 = Number(proLaboreBRL.toFixed(2));
  // 10. Resultado Operacional / EBITDA (5 - 6 - 7 - 8 - 9)
  const line10 = Number((line5 - line6 - line7 - line8 - line9).toFixed(2));
  // 11. Depreciação e Amortização de CAPEX
  const line11 = Number(depreciationBRL.toFixed(2));
  // 12. Resultado Financeiro Líquido
  const line12 = Number(financialResultBRL.toFixed(2));
  // 13. Tributos sobre o resultado (IRPJ/CSLL se aplicável)
  const line13 = Number(incomeTaxesBRL.toFixed(2));
  // 14. Resultado Líquido do Exercício (10 - 11 + 12 - 13)
  const line14 = Number((line10 - line11 + line12 - line13).toFixed(2));

  const contributionMarginPercent = line3 > 0 ? Number(((line5 / line3) * 100).toFixed(2)) : 0;
  const netMarginPercent = line1 > 0 ? Number(((line14 / line1) * 100).toFixed(2)) : 0;

  return {
    isProjected,
    lines: [
      { id: 1, code: "REC_BRUTA", name: "1. Receita Bruta", value: line1, isTotal: false },
      { id: 2, code: "DED_REC", name: "2. Deduções e Tributos sobre Receita", value: line2, isTotal: false, isNegative: true },
      { id: 3, code: "REC_LIQ", name: "3. Receita Líquida", value: line3, isTotal: true },
      { id: 4, code: "CUSTOS_DIR", name: "4. Custos Diretos Operacionais (APIs / Infra)", value: line4, isTotal: false, isNegative: true },
      { id: 5, code: "MARGEM_CONTRIB", name: "5. Margem de Contribuição", value: line5, isTotal: true, percent: contributionMarginPercent },
      { id: 6, code: "DESP_ADM", name: "6. Despesas Administrativas (Contabilidade / Jurídico)", value: line6, isTotal: false, isNegative: true },
      { id: 7, code: "DESP_COM", name: "7. Despesas Comerciais e Marketing", value: line7, isTotal: false, isNegative: true },
      { id: 8, code: "DESP_TECH", name: "8. Despesas Tecnológicas e P&D", value: line8, isTotal: false, isNegative: true },
      { id: 9, code: "PRO_LABORE", name: "9. Pró-labore dos Sócios", value: line9, isTotal: false, isNegative: true },
      { id: 10, code: "RES_OPERACIONAL", name: "10. Resultado Operacional (EBITDA)", value: line10, isTotal: true },
      { id: 11, code: "DEP_AMORT", name: "11. Depreciação e Amortização de Ativos", value: line11, isTotal: false, isNegative: true },
      { id: 12, code: "RES_FINANCEIRO", name: "12. Resultado Financeiro Líquido", value: line12, isTotal: false },
      { id: 13, code: "TRIB_LUCRO", name: "13. Tributos sobre o Resultado (IRPJ/CSLL)", value: line13, isTotal: false, isNegative: true },
      { id: 14, code: "RES_LIQUIDO", name: "14. Resultado Líquido do Exercício", value: line14, isTotal: true, percent: netMarginPercent }
    ],
    summary: {
      grossRevenue: line1,
      netRevenue: line3,
      contributionMargin: line5,
      contributionMarginPercent,
      operatingResult: line10,
      netResult: line14,
      netMarginPercent
    }
  };
}

/**
 * Single source of truth for DRE CSV generation (FIN-03 / Quality Gates).
 */
export function generateDRECsv(dre) {
  if (!dre || !Array.isArray(dre.lines)) {
    throw new Error("[financial] DRE inválida para exportação CSV.");
  }

  const rows = [
    ["Linha DRE", "Código", "Valor Projetado (BRL)", "Classificação Contábil"]
  ];

  for (const l of dre.lines) {
    const classification = l.isNegative
      ? "Dedução/Despesa"
      : l.isTotal
      ? "Subtotal/Total"
      : "Receita/Resultado";
    rows.push([
      `"${l.name}"`,
      l.code,
      Number(l.value).toFixed(2),
      `"${classification}"`
    ]);
  }

  return rows.map(r => r.join(";")).join("\n");
}

// ============================================================================
// 9. BUSINESS SIMULATOR & HISTORICAL SCENARIOS (FIN-03 & FIN-04)
// ============================================================================

export const PRESET_SCENARIOS = {
  UPE_INSTITUTIONAL: {
    id: "upe_institutional",
    name: "Cenário Institucional UPE (Proposta B2B)",
    description: "450 estudantes pagantes, 50 professores gratuitos, US$ 15/mês por estudante, contrato 12 meses.",
    parameters: {
      type: "B2B",
      institutionName: "Universidad Privada del Este (UPE)",
      billableStudents: 450,
      freeTeachers: 50,
      unitPriceUSD: 15.00,
      contractMonths: 12,
      exchangeRateUSD: 5.75,
      fiscalScenario: "QUALIFIED_EXPORT_PARAGUAY",
      variableCostPerStudentBRL: 4.50, // Servidor, largura de banda, banco
      fixedOpexBRL: 14050.00, // 5 sócios (R$ 12.5k) + contabilidade (R$ 350) + marketing (R$ 1.2k)
      capexInvestmentBRL: 70000.00, // Equipamento IA Local histórico
      capexDepreciationMonths: 36 // 3 anos (Hipótese de planejamento)
    }
  },
  B2C_250_STUDENTS: {
    id: "b2c_250_students",
    name: "Cenário Assinatura Individual (250 Alunos)",
    description: "250 estudantes individuais a R$ 120,00 mensais.",
    parameters: {
      type: "B2C",
      billableStudents: 250,
      freeTeachers: 0,
      unitPriceBRL: 120.00,
      contractMonths: 12,
      fiscalScenario: "DOMESTIC_B2B",
      variableCostPerStudentBRL: 5.00,
      fixedOpexBRL: 14050.00,
      capexInvestmentBRL: 70000.00,
      capexDepreciationMonths: 36
    }
  },
  B2C_500_STUDENTS: {
    id: "b2c_500_students",
    name: "Cenário Assinatura Individual (500 Alunos)",
    description: "500 estudantes individuais a R$ 120,00 mensais.",
    parameters: {
      type: "B2C",
      billableStudents: 500,
      freeTeachers: 0,
      unitPriceBRL: 120.00,
      contractMonths: 12,
      fiscalScenario: "DOMESTIC_B2B",
      variableCostPerStudentBRL: 4.50,
      fixedOpexBRL: 14050.00,
      capexInvestmentBRL: 70000.00,
      capexDepreciationMonths: 36
    }
  },
  ALTERNATIVE_250_R100: {
    id: "alternative_250_r100",
    name: "Cenário Alternativo B2C (250 Alunos × R$ 100)",
    description: "250 estudantes individuais a R$ 100,00 mensais com plano de acesso estendido.",
    parameters: {
      type: "B2C",
      billableStudents: 250,
      freeTeachers: 0,
      unitPriceBRL: 100.00,
      contractMonths: 12,
      fiscalScenario: "DOMESTIC_B2B",
      variableCostPerStudentBRL: 5.00,
      fixedOpexBRL: 14050.00,
      capexInvestmentBRL: 70000.00,
      capexDepreciationMonths: 36
    }
  }
};

/**
 * Validates financial parameters to reject negative, null, or inconsistent values (FIN-03).
 */
export function validateFinancialParameters(params) {
  const errors = [];
  if (params == null || typeof params !== "object") {
    errors.push("Parâmetros financeiros devem ser fornecidos como objeto.");
    return { valid: false, errors };
  }

  const numericChecks = [
    { key: "billableStudents", label: "Estudantes pagantes" },
    { key: "freeTeachers", label: "Professores gratuitos" },
    { key: "unitPriceBRL", label: "Preço unitário BRL" },
    { key: "unitPriceUSD", label: "Preço unitário USD" },
    { key: "exchangeRateUSD", label: "Taxa de câmbio USD" },
    { key: "variableCostPerStudentBRL", label: "Custo variável por estudante" },
    { key: "fixedOpexBRL", label: "OPEX fixo mensal" },
    { key: "capexInvestmentBRL", label: "Investimento CAPEX" },
    { key: "capexDepreciationMonths", label: "Meses de depreciação CAPEX" },
    { key: "contractMonths", label: "Meses de vigência contratual" }
  ];

  for (const check of numericChecks) {
    if (params[check.key] != null) {
      const val = Number(params[check.key]);
      if (isNaN(val)) {
        errors.push(`${check.label} (${check.key}) deve ser um número válido.`);
      } else if (val < 0) {
        errors.push(`${check.label} (${check.key}) não pode ser negativo (recebido: ${val}).`);
      }
    }
  }

  if (params.contractMonths != null && Number(params.contractMonths) === 0) {
    errors.push("Meses de vigência contratual (contractMonths) não pode ser zero.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Single source of truth calculation for simulation, DRE, profitability and export (FIN-03 / FIN-04).
 * Reconciled results:
 * - UPE: R$ 17.587,26
 * - B2C 500: R$ 33.757,56
 * - B2C 250: R$ 8.756,56
 */
export function simulateFinancialScenario(params) {
  const validation = validateFinancialParameters(params);
  if (!validation.valid) {
    throw new Error(`[financial] Parâmetros inválidos: ${validation.errors.join("; ")}`);
  }

  const p = { ...PRESET_SCENARIOS.UPE_INSTITUTIONAL.parameters, ...params };

  const billableStudents = p.billableStudents ?? 0;
  const freeTeachers = p.freeTeachers ?? 0;
  const contractMonths = p.contractMonths ?? 12;

  // 1. Calculate Monthly Gross Revenue in BRL
  let monthlyGrossBRL = 0;
  if (params?.unitPriceBRL != null) {
    monthlyGrossBRL = billableStudents * params.unitPriceBRL;
  } else if (p.unitPriceUSD != null) {
    const exchange = p.exchangeRateUSD ?? 5.75;
    monthlyGrossBRL = billableStudents * p.unitPriceUSD * exchange;
  } else {
    monthlyGrossBRL = billableStudents * (p.unitPriceBRL ?? 0);
  }

  // MRR and ARR
  const mrrNormalized = Number(monthlyGrossBRL.toFixed(2));
  const arrAnnualized = Number((mrrNormalized * 12).toFixed(2));
  const contractPeriodTotalRevenue = Number((mrrNormalized * contractMonths).toFixed(2));

  // 2. Tax Deductions
  const taxInfo = calculateRevenueDeductions(mrrNormalized, p.fiscalScenario ?? "QUALIFIED_EXPORT_PARAGUAY");
  const monthlyNetRevenueBRL = taxInfo.netRevenueBRL;

  // 3. Costs (Total users = billable students + free teachers)
  const totalUsers = billableStudents + freeTeachers;
  const varCostPerStudent = p.variableCostPerStudentBRL ?? 4.50;
  const monthlyDirectCostsBRL = Number((totalUsers * varCostPerStudent).toFixed(2));
  const monthlyContributionMarginBRL = Number((monthlyNetRevenueBRL - monthlyDirectCostsBRL).toFixed(2));

  // 4. Fixed OPEX & Subcomponents (Ensures 100% alignment with DRE lines)
  let adminExpensesBRL = params?.adminExpensesBRL;
  let commercialExpensesBRL = params?.commercialExpensesBRL;
  let techExpensesBRL = params?.techExpensesBRL ?? 0.00;
  let proLaboreBRL = params?.proLaboreBRL;
  let monthlyFixedOpexBRL;

  if (params?.fixedOpexBRL != null) {
    monthlyFixedOpexBRL = Number(params.fixedOpexBRL);
    if (monthlyFixedOpexBRL === 0) {
      adminExpensesBRL = adminExpensesBRL ?? 0;
      commercialExpensesBRL = commercialExpensesBRL ?? 0;
      proLaboreBRL = proLaboreBRL ?? 0;
    } else {
      adminExpensesBRL = adminExpensesBRL ?? 350.00;
      commercialExpensesBRL = commercialExpensesBRL ?? 1200.00;
      proLaboreBRL = proLaboreBRL ?? Math.max(0, monthlyFixedOpexBRL - (adminExpensesBRL + commercialExpensesBRL + techExpensesBRL));
    }
  } else {
    adminExpensesBRL = adminExpensesBRL ?? 350.00;
    commercialExpensesBRL = commercialExpensesBRL ?? 1200.00;
    proLaboreBRL = proLaboreBRL ?? 12500.00;
    monthlyFixedOpexBRL = adminExpensesBRL + commercialExpensesBRL + techExpensesBRL + proLaboreBRL;
  }

  // Operating Result / EBITDA
  const monthlyOperatingResultBRL = Number((monthlyContributionMarginBRL - monthlyFixedOpexBRL).toFixed(2));

  // 5. CAPEX Depreciation (Planning Hypothesis: R$ 70k amortized over 36 months)
  const capex = p.capexInvestmentBRL ?? 0;
  const depMonths = p.capexDepreciationMonths ?? 36;
  const monthlyDepreciationBRL = depMonths > 0 ? Number((capex / depMonths).toFixed(2)) : 0;

  // 6. Net Profit (DRE Line 14)
  const monthlyNetResultBRL = Number((monthlyOperatingResultBRL - monthlyDepreciationBRL - taxInfo.incomeTaxesAmount).toFixed(2));
  const annualNetResultBRL = Number((monthlyNetResultBRL * 12).toFixed(2));
  const contractPeriodNetResultBRL = Number((monthlyNetResultBRL * contractMonths).toFixed(2));

  // 7. Cashflow: Before Tax vs After Tax (FIN-04)
  // Cashflow before tax = EBITDA (Operating Result without depreciation)
  const monthlyCashflowBeforeTax = monthlyOperatingResultBRL;
  // Cashflow after tax = Net Result + Depreciation (non-cash add-back)
  const monthlyCashflowAfterTax = Number((monthlyNetResultBRL + monthlyDepreciationBRL).toFixed(2));

  // 8. Break-even Point (Students needed to cover fixed costs and free teacher costs)
  const unitNetRevenue = billableStudents > 0 ? monthlyNetRevenueBRL / billableStudents : 0;
  const unitContribution = unitNetRevenue - varCostPerStudent;
  const freeTeachersOverhead = freeTeachers * varCostPerStudent;
  const totalFixedCommitments = monthlyFixedOpexBRL + freeTeachersOverhead;
  const breakEvenStudents = unitContribution > 0 ? Math.ceil(totalFixedCommitments / unitContribution) : null;

  // 9. Payback Period (Months to recover initial CAPEX - Before and After Tax)
  const paybackMonthsBeforeTax = (monthlyCashflowBeforeTax > 0 && capex > 0)
    ? Number((capex / monthlyCashflowBeforeTax).toFixed(1))
    : null;

  const paybackMonthsAfterTax = (monthlyCashflowAfterTax > 0 && capex > 0)
    ? Number((capex / monthlyCashflowAfterTax).toFixed(1))
    : null;

  // 10. Annual ROI on CAPEX
  const annualCashFlow = monthlyCashflowAfterTax * 12;
  const annualROI = capex > 0 ? Number(((annualCashFlow / capex) * 100).toFixed(1)) : null;

  // 11. Financial Runway (FIN-04: No 'INFINITE', explicit cash generation label)
  const initialCashReserve = p.initialCashReserve ?? 30000.00;
  let runway;
  if (monthlyCashflowAfterTax > 0) {
    runway = {
      isPositive: true,
      monthlyGeneration: monthlyCashflowAfterTax,
      label: `POSITIVO (Geração de Caixa: ${formatMoney(monthlyCashflowAfterTax)}/mês)`
    };
  } else if (monthlyCashflowAfterTax < 0) {
    const months = Number((initialCashReserve / Math.abs(monthlyCashflowAfterTax)).toFixed(1));
    runway = {
      isPositive: false,
      runwayMonths: months,
      label: `${months} meses`
    };
  } else {
    runway = {
      isPositive: false,
      runwayMonths: null,
      label: "ESTÁVEL (Resultado Zero)"
    };
  }

  // 12. DRE Generation (100% matched with simulation lines)
  const dre = buildManagerialDRE({
    grossRevenueBRL: mrrNormalized,
    directTaxesBRL: taxInfo.directTaxAmount,
    directCostsBRL: monthlyDirectCostsBRL,
    adminExpensesBRL,
    commercialExpensesBRL,
    techExpensesBRL,
    proLaboreBRL,
    depreciationBRL: monthlyDepreciationBRL,
    financialResultBRL: 0.00,
    incomeTaxesBRL: taxInfo.incomeTaxesAmount,
    isProjected: true
  });

  return {
    parameters: p,
    mrr: mrrNormalized,
    arr: arrAnnualized,
    mrrNormalized,
    arrAnnualized,
    contractPeriodTotalRevenue,
    contractPeriodNetResult: contractPeriodNetResultBRL,
    monthlyNetRevenue: Number(monthlyNetRevenueBRL.toFixed(2)),
    monthlyDirectCosts: monthlyDirectCostsBRL,
    monthlyContributionMargin: monthlyContributionMarginBRL,
    contributionMarginPercent: monthlyNetRevenueBRL > 0
      ? Number(((monthlyContributionMarginBRL / monthlyNetRevenueBRL) * 100).toFixed(1))
      : 0,
    monthlyFixedOpex: Number(monthlyFixedOpexBRL.toFixed(2)),
    monthlyOperatingResult: monthlyOperatingResultBRL,
    monthlyDepreciation: monthlyDepreciationBRL,
    monthlyNetResult: monthlyNetResultBRL,
    annualNetResult: annualNetResultBRL,
    monthlyCashflowBeforeTax,
    monthlyCashflowAfterTax,
    breakEvenStudents,
    paybackMonths: paybackMonthsBeforeTax, // Backwards-compatible alias
    paybackMonthsBeforeTax,
    paybackMonthsAfterTax,
    annualROI,
    runway,
    runwayMonths: runway.isPositive ? runway.label : runway.runwayMonths,
    dre
  };
}

// ============================================================================
// 10. REALIZED FINANCIAL METRICS ENGINE (ZERO FICTION - FIN-01 & FIN-06)
// ============================================================================

/**
 * Compiles realized and certified financial metrics from database and contracts.
 * - Server-side authorization check (FIN-06).
 * - Mandatory institutionId for institutional admins (no global fallback).
 * - Distinguishes EMPTY, NOT_CONFIGURED, UNAVAILABLE, and NOT_AUTHORIZED.
 * - Distinguishes documentary certified contracts vs uncertified active records (FIN-01).
 * - Never converts query failures into zeros.
 */
export async function getRealizedFinancialMetrics({ userRole, user, institutionId } = {}) {
  // 1. Server-side authorization check (FIN-06)
  const role = normalizeRole(user?.role || userRole);
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const isAdmin = role === ROLES.ADMIN;
  const isInstitutionAdmin = role === ROLES.INSTITUTION_ADMIN;

  if (!role || (!isSuperAdmin && !isAdmin && !isInstitutionAdmin)) {
    return {
      status: "NOT_AUTHORIZED",
      scope: "UNKNOWN",
      certified: false,
      statusNotice: "Acesso restrito. Visualização financeira restrita a administradores autorizados.",
      mrrContracted: null,
      arrContracted: null,
      mrrReceived: null,
      mrrOverdue: null,
      billedInCycle: null,
      receivedInCycle: null,
      accountsReceivable: null,
      arpu: null,
      totalBillableLicenses: null,
      activeContractsCount: 0,
      certifiedContractsCount: 0,
      uncertifiedContractsCount: 0,
      contracts: [],
      opex: [],
      capex: [],
      cashFlow: null,
      dre: null
    };
  }

  // 2. Prevent institutional query without institutionId (FIN-06 - No global fallback)
  if (!isSuperAdmin && !institutionId) {
    return {
      status: "NOT_CONFIGURED",
      scope: "INSTITUTIONAL",
      certified: false,
      statusNotice: "institutionId obrigatório para consulta institucional. Fallback global bloqueado por segurança.",
      mrrContracted: null,
      arrContracted: null,
      mrrReceived: null,
      mrrOverdue: null,
      billedInCycle: null,
      receivedInCycle: null,
      accountsReceivable: null,
      arpu: null,
      totalBillableLicenses: null,
      activeContractsCount: 0,
      certifiedContractsCount: 0,
      uncertifiedContractsCount: 0,
      contracts: [],
      opex: [],
      capex: [],
      cashFlow: { inflows: null, outflows: null, netBalance: null, status: "NOT_AUTHORIZED" },
      dre: null,
      dreNotice: "Demonstrativo contábil realizado indisponível para usuários não autorizados."
    };
  }

  // 2. Fallback global bloq: Admin Institucional sem institutionId deve ser bloqueado
  if (!isSuperAdmin && !institutionId) {
    return {
      status: "NOT_CONFIGURED",
      scope: "INSTITUTIONAL",
      certified: false,
      statusNotice: "Admin Institucional sem identificador institucional vinculado. Fallback global bloqueado por segurança.",
      mrrContracted: null,
      arrContracted: null,
      mrrReceived: null,
      mrrOverdue: null,
      billedInCycle: null,
      receivedInCycle: null,
      accountsReceivable: null,
      arpu: null,
      totalBillableLicenses: null,
      activeContractsCount: 0,
      certifiedContractsCount: 0,
      uncertifiedContractsCount: 0,
      contracts: [],
      opex: [],
      capex: [],
      cashFlow: { inflows: null, outflows: null, netBalance: null, status: "NOT_CONFIGURED" },
      dre: null,
      dreNotice: "Demonstrativo contábil realizado indisponível na ausência de instituição configurada."
    };
  }

  const scope = isSuperAdmin ? "GLOBAL" : "INSTITUTIONAL";

  // 3. Supabase configuration check
  if (!isSupabaseConfigured()) {
    return {
      status: "NOT_CONFIGURED",
      scope,
      certified: false,
      statusNotice: "Banco Supabase não conectado. Informações contratuais e financeiras indisponíveis.",
      mrrContracted: null,
      arrContracted: null,
      mrrReceived: null,
      mrrOverdue: null,
      billedInCycle: null,
      receivedInCycle: null,
      accountsReceivable: null,
      arpu: null,
      totalBillableLicenses: null,
      activeContractsCount: 0,
      certifiedContractsCount: 0,
      uncertifiedContractsCount: 0,
      contracts: [],
      opex: [],
      capex: [],
      cashFlow: { inflows: null, outflows: null, netBalance: null, status: "NOT_CONFIGURED" },
      dre: null,
      dreNotice: "Demonstrativo contábil realizado indisponível sem conexão ao banco."
    };
  }

  try {
    // 4. Query institutions table
    let query = supabase.from("institutions").select(
      "id, name, slug, contracted_capacity, billable_licenses, free_licenses, price_per_student, contract_status, contract_certified, contract_document_ref, currency, billing_cycle, contract_start_date, contract_end_date, active"
    );
    if (!isSuperAdmin && institutionId) {
      query = query.eq("id", institutionId);
    }

    const { data: institutions, error } = await query;
    if (error) {
      console.warn("[financial] Erro ao carregar status contratual das instituições:", error.message);
      // UNAVAILABLE: Never convert query failures to zero (FIN-06)
      return {
        status: "UNAVAILABLE",
        scope,
        certified: false,
        statusNotice: "Falha na consulta aos registros contratuais e financeiros. Dados indisponíveis.",
        mrrContracted: null,
        arrContracted: null,
        mrrReceived: null,
        mrrOverdue: null,
        billedInCycle: null,
        receivedInCycle: null,
        accountsReceivable: null,
        arpu: null,
        totalBillableLicenses: null,
        activeContractsCount: null,
        certifiedContractsCount: null,
        uncertifiedContractsCount: null,
        contracts: null,
        opex: null,
        capex: null,
        cashFlow: { inflows: null, outflows: null, netBalance: null, status: "UNAVAILABLE" },
        dre: null,
        dreNotice: "Demonstrativo contábil realizado indisponível devido a erro na consulta aos dados contratuais."
      };
    }

    let activeContracts = 0;
    let certifiedContracts = 0;
    let uncertifiedContracts = 0;
    let contractedMRR = 0;
    let billableLicenses = 0;
    const contractsList = [];

    (institutions || []).forEach(inst => {
      // Governança Contratual (P0.21-ADM.2.7-E):
      // 1. Não considerar uma instituição ativa como comprovação de contrato vigente. Exige contrato explícito ACTIVE.
      const hasActiveContract = inst.contract_status === "ACTIVE";

      // 2. Não utilizar capacidade institucional como fallback de licenças faturáveis.
      const capacity = Number(inst.contracted_capacity || 0);
      const billable = inst.billable_licenses != null ? Number(inst.billable_licenses) : 0;
      const free = Number(inst.free_licenses || 0);
      const unitPrice = Number(inst.price_per_student || 0);
      const currency = inst.currency || CURRENCY.BRL;

      // 3. Exigir evidência documental, vigência e ciclo de cobrança antes do cálculo de MRR certificado.
      const hasDocumentaryEvidence = Boolean(inst.contract_certified) && Boolean(inst.contract_document_ref);
      const hasValidTerm = Boolean(inst.contract_start_date) && (!inst.contract_end_date || new Date(inst.contract_end_date) >= new Date());
      const hasBillingCycle = Boolean(inst.billing_cycle);

      const isDocumentallyCertified = hasActiveContract && hasDocumentaryEvidence && hasValidTerm && hasBillingCycle;

      if (hasActiveContract) {
        activeContracts += 1;
        const contractItem = {
          id: inst.id,
          name: inst.name,
          contractNumber: inst.slug || inst.id,
          status: isDocumentallyCertified ? "ACTIVE" : (hasDocumentaryEvidence ? CONTRACT_STATUS.NOT_CERTIFIED : CONTRACT_STATUS.NOT_CONFIGURED),
          contractedCapacity: capacity,
          billableLicenses: billable,
          freeLicenses: free,
          unitPrice,
          currency,
          billingCycle: inst.billing_cycle || null,
          startDate: inst.contract_start_date || null,
          endDate: inst.contract_end_date || null,
          certified: isDocumentallyCertified,
          documentRef: inst.contract_document_ref || null
        };
        contractsList.push(contractItem);

        if (isDocumentallyCertified && billable > 0 && unitPrice > 0) {
          certifiedContracts += 1;
          const monthlyValBRL = convertCurrency(billable * unitPrice, currency, CURRENCY.BRL);
          contractedMRR += monthlyValBRL;
          billableLicenses += billable;
        } else {
          uncertifiedContracts += 1;
        }
      } else {
        // Instituição sem contrato ativo vigente: manter indicadores contratuais como NOT_CONFIGURED
        const contractItem = {
          id: inst.id,
          name: inst.name,
          contractNumber: inst.slug || inst.id,
          status: CONTRACT_STATUS.NOT_CONFIGURED,
          contractedCapacity: capacity,
          billableLicenses: billable,
          freeLicenses: free,
          unitPrice,
          currency,
          billingCycle: inst.billing_cycle || null,
          startDate: inst.contract_start_date || null,
          endDate: inst.contract_end_date || null,
          certified: false,
          documentRef: inst.contract_document_ref || null
        };
        contractsList.push(contractItem);
        uncertifiedContracts += 1;
      }
    });

    // 5. Build Status and Result Structure
    let status = "EMPTY";
    let statusNotice = "Nenhum contrato comercial B2B homologado ou faturamento emitido no período.";

    if (certifiedContracts > 0) {
      status = "CERTIFIED";
      statusNotice = `${certifiedContracts} contrato(s) ativo(s) documentado(s) e certificado(s).`;
    } else if (uncertifiedContracts > 0) {
      status = "NOT_CONFIGURED";
      statusNotice = `${uncertifiedContracts} instituição(ões) cadastradas sem contrato vigente com evidência documental homologada (NÃO CONFIGURADO).`;
    }

    const arpu = (certifiedContracts > 0 && billableLicenses > 0 && contractedMRR > 0)
      ? Number((contractedMRR / billableLicenses).toFixed(2))
      : null;

    return {
      status,
      scope,
      certified: certifiedContracts > 0,
      mrrContracted: certifiedContracts > 0 ? contractedMRR : (status === "EMPTY" ? 0 : null),
      arrContracted: certifiedContracts > 0 ? contractedMRR * 12 : (status === "EMPTY" ? 0 : null),
      mrrReceived: null,
      mrrOverdue: null,
      billedInCycle: null,
      receivedInCycle: null,
      accountsReceivable: null,
      arpu,
      totalBillableLicenses: billableLicenses,
      activeContractsCount: activeContracts,
      certifiedContractsCount: certifiedContracts,
      uncertifiedContractsCount: uncertifiedContracts,
      statusNotice,
      contracts: contractsList,
      opex: [],
      capex: [],
      cashFlow: {
        inflows: null,
        outflows: null,
        netBalance: null,
        status: "NOT_CONFIGURED"
      },
      dre: null,
      dreNotice: "Demonstrativo contábil realizado indisponível na ausência de ERP ou livro razão certificado."
    };
  } catch (err) {
    console.error("[financial] Falha inesperada ao consultar métricas financeiras:", err);
    return {
      status: "UNAVAILABLE",
      scope,
      certified: false,
      statusNotice: "Erro interno ao processar métricas financeiras. Informações indisponíveis.",
      mrrContracted: null,
      arrContracted: null,
      mrrReceived: null,
      mrrOverdue: null,
      billedInCycle: null,
      receivedInCycle: null,
      accountsReceivable: null,
      arpu: null,
      totalBillableLicenses: null,
      activeContractsCount: null,
      certifiedContractsCount: null,
      uncertifiedContractsCount: null,
      contracts: null,
      opex: null,
      capex: null,
      cashFlow: { inflows: null, outflows: null, netBalance: null, status: "UNAVAILABLE" },
      dre: null,
      dreNotice: "Demonstrativo contábil realizado indisponível devido a erro interno."
    };
  }
}
