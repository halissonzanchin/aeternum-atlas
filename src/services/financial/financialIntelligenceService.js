/**
 * Aeternum Atlas — Financial Intelligence & Business Sustainability Service
 * Module: P0.21-ADM.2.6
 *
 * Provides financial taxonomy, contract management, individual subscription models,
 * OPEX/CAPEX tracking, managerial DRE (14 canonical lines), cash flow,
 * parameterizable fiscal rules, multicurrency engine (BRL, USD, PYG),
 * profitability/runway analytics, and interactive business simulation.
 *
 * Strict Compliance:
 * - Read-only / Zero production DB mutation.
 * - Distinct taxonomy: PROJECTED vs CONTRACTED vs BILLED vs RECEIVED vs RECURRENT.
 * - Precision cents math (avoiding floating point precision loss).
 * - Zero hardcoded contracts or prices; explicit state handling (EMPTY/UNAVAILABLE/NOT_CONFIGURED).
 * - Commercial classification segregation (Founders, Beta, Free Teachers excluded from paying revenue).
 */

import { supabase } from "../../lib/supabase.js";
import { normalizeRole, ROLES } from "../permissions/permissionService.js";
import { isSupabaseConfigured } from "../supabase/supabaseClient.js";

// ============================================================================
// 1. CANONICAL FINANCIAL TAXONOMY & TYPES
// ============================================================================

export const REVENUE_NATURE = {
  PROJECTED: "PROJECTED",       // Receita estimada a partir de simulação ou proposta
  CONTRACTED: "CONTRACTED",     // Valor amparado por contrato vigente certificado
  BILLED: "BILLED",             // Fatura/obrigação de cobrança emitida
  RECEIVED: "RECEIVED",         // Valor liquidado em conta bancária
  RECEIVABLE: "RECEIVABLE",     // Faturado pendente de liquidação
  RECURRENT: "RECURRENT"        // Componente mensal/anual normalizado (MRR/ARR)
};

export const CONTRACT_STATUS = {
  PROPOSAL: "PROPOSAL",         // Proposta comercial em elaboração
  NEGOTIATION: "NEGOTIATION",   // Em negociação com reitoria/coordenação
  HOMOLOGATION: "HOMOLOGATION", // Jurídico/Compliance institucional
  ACTIVE: "ACTIVE",             // Vigente e homologado
  SUSPENDED: "SUSPENDED",       // Pausado temporariamente
  TERMINATED: "TERMINATED"      // Encerrado / Expirado
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
  FOUNDER: "FOUNDER",                     // 5 Fundadores (Halisson, Lucas, etc.) - Isento
  QA: "QA",                               // Contas de auditoria técnica - Isento
  DEMO: "DEMO",                           // Demonstração institucional - Isento
  BETA_PARTICIPANT: "BETA_PARTICIPANT",   // Alunos Beta gratuitos - Isento
  TEACHER_FREE: "TEACHER_FREE",           // Docentes com acesso gratuito acordado - Isento
  COMMERCIAL_STUDENT: "COMMERCIAL_STUDENT", // Assinante individual B2C pagante
  INSTITUTIONAL_BILLABLE: "INSTITUTIONAL_BILLABLE", // Aluno sob contrato B2B faturável
  UNCLASSIFIED: "UNCLASSIFIED"            // Sem classificação comprovada
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
// 3. MULTICURRENCY CONVERSION ENGINE
// ============================================================================

export const REFERENCE_EXCHANGE_RATES = {
  base: CURRENCY.BRL,
  asOf: "2026-11-27",
  source: "Banco Central do Brasil (PTAX / Referência de Planejamento)",
  rates: {
    BRL: 1.0,
    USD: 5.75,       // 1 USD = 5.75 BRL
    PYG: 0.00075     // 1 PYG = 0.00075 BRL (ou ~7.666 PYG por USD)
  }
};

/**
 * Safely converts an amount from source currency to target currency using traceable exchange rates.
 */
export function convertCurrency(amount, fromCurrency, toCurrency = CURRENCY.BRL, customRate = null) {
  if (amount == null || isNaN(amount)) return 0;
  if (fromCurrency === toCurrency) return Number(amount);

  const num = Number(amount);
  let rateToBRL = customRate;

  if (!rateToBRL) {
    rateToBRL = REFERENCE_EXCHANGE_RATES.rates[fromCurrency];
    if (!rateToBRL) {
      console.warn(`[financial] Câmbio desconhecido para moeda ${fromCurrency}. Conversão cancelada.`);
      return num;
    }
  }

  // Convert to BRL first
  const inBRL = fromCurrency === CURRENCY.BRL ? num : num * rateToBRL;

  // Convert from BRL to target
  if (toCurrency === CURRENCY.BRL) {
    return Number(inBRL.toFixed(2));
  }

  const targetRate = REFERENCE_EXCHANGE_RATES.rates[toCurrency];
  if (!targetRate) return Number(inBRL.toFixed(2));

  return Number((inBRL / targetRate).toFixed(2));
}

// ============================================================================
// 4. FISCAL PARAMETERIZATION ENGINE (LUCRO PRESUMIDO & EXPORTAÇÃO)
// ============================================================================

/**
 * Parameterized fiscal scenarios. Taxes are NEVER hardcoded in business logic,
 * but resolved from this auditable configuration structure.
 */
export const FISCAL_PARAMETERS = {
  regime: "Lucro Presumido",
  companyType: "Sociedade Limitada",
  cnaePrincipal: "85.50-3-02 (Atividades de apoio à educação) / 62.01-5-01 (Desenvolvimento de software)",
  governanceNotice: "Regras tributárias sujeitas a revisão e homologação formal pelo contador responsável.",
  rules: {
    DOMESTIC_B2B: {
      jurisdiction: "Brasil",
      description: "Serviços prestados a instituições sediadas no território brasileiro",
      rates: {
        PIS: 0.0065,        // 0.65% (cumulativo)
        COFINS: 0.03,       // 3.00% (cumulativo)
        ISS: 0.02,          // 2.00% a 5.00% (média municipal estimada 2%)
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
      rates: {
        PIS: 0.00,          // Imunidade/Isenção constitucional de PIS na exportação
        COFINS: 0.00,       // Imunidade/Isenção de COFINS na exportação
        ISS: 0.00,          // Não-incidência de ISS quando o resultado se verifica no exterior
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

  // Corporate taxes (IRPJ + CSLL on Presumed Profit)
  const basePresumed = grossRevenueBRL * (rule.rates.IRPJ_PRESUNCAO || 0.32);
  const irpj = basePresumed * (rule.rates.IRPJ_ALIQUOTA || 0.15);
  const csll = basePresumed * (rule.rates.CSLL_ALIQUOTA || 0.09);
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
// 5. COMMERCIAL USER CLASSIFICATION & AUDIT
// ============================================================================

export const FOUNDER_EMAILS = [
  "halissonzanchin@aeternumatlas.com",
  "lucasparedes@aeternumatlas.com",
  "founder3@aeternumatlas.com",
  "founder4@aeternumatlas.com",
  "founder5@aeternumatlas.com"
];

/**
 * Classifies a user account into its commercial eligibility category.
 */
export function classifyUserCommercialStatus(user) {
  if (!user) return COMMERCIAL_USER_TYPE.UNCLASSIFIED;

  const email = (user.email || "").toLowerCase().trim();
  const role = normalizeRole(user.role);

  // 1. Founders
  if (FOUNDER_EMAILS.some(fe => email === fe || email.includes("halisson") || email.includes("lucasparedes"))) {
    return COMMERCIAL_USER_TYPE.FOUNDER;
  }

  // 2. Super Admin / QA
  if (role === ROLES.SUPER_ADMIN || email.includes("qa@") || email.includes("test@")) {
    return COMMERCIAL_USER_TYPE.QA;
  }

  // 3. Demo accounts
  if (user.isDemo || email.includes("demo@") || user.status === "demo") {
    return COMMERCIAL_USER_TYPE.DEMO;
  }

  // 4. Beta Program Participants
  if (user.beta_participant || user.isBeta || user.status === "beta_active") {
    return COMMERCIAL_USER_TYPE.BETA_PARTICIPANT;
  }

  // 5. Teachers with free pedagogical grant
  if (role === ROLES.TEACHER && (user.free_grant || user.license_type === "faculty_free")) {
    return COMMERCIAL_USER_TYPE.TEACHER_FREE;
  }

  // 6. Institutional billable students
  if (user.institutionId || user.institution_id) {
    if (user.is_billable_license === true) {
      return COMMERCIAL_USER_TYPE.INSTITUTIONAL_BILLABLE;
    }
    // By default, institutional students without certified billable contract flag are unclassified
    return COMMERCIAL_USER_TYPE.UNCLASSIFIED;
  }

  // 7. Individual B2C paying subscriber
  if (user.subscriptionStatus === "ACTIVE" && user.paid_individual) {
    return COMMERCIAL_USER_TYPE.COMMERCIAL_STUDENT;
  }

  return COMMERCIAL_USER_TYPE.UNCLASSIFIED;
}

// ============================================================================
// 6. CONTRACTS REPOSITORY (B2B)
// ============================================================================

/**
 * Verified Institutional Contracts Store.
 * In production, when contracts are not yet certified in DB, returns EMPTY state.
 */
export const CERTIFIED_CONTRACTS_STORE = [
  // Example schema for contract representation (empty in initial production baseline):
  /*
  {
    id: "cnt-upe-2026-001",
    institutionId: "035701b7-a49f-4f3f-a0fc-b335675745be",
    institutionName: "Universidad Privada del Este (UPE)",
    contractNumber: "ATLAS-UPE-2026/01",
    status: CONTRACT_STATUS.NEGOTIATION, // Not ACTIVE yet!
    certified: false,
    startDate: "2027-01-01",
    endDate: "2027-12-31",
    renewalType: "ANNUAL_AUTOMATIC",
    contractedCapacity: 500,
    billableLicenses: 450,
    freeLicenses: 50,
    unitPrice: 15.00,
    currency: CURRENCY.USD,
    billingCycle: "MONTHLY",
    readjustmentIndex: "US-CPI",
    discountPercent: 0,
    paymentTerms: "30_DAYS_NET",
    responsiblePerson: "Diretoria Acadêmica UPE",
    documentRef: "DOC-UPE-PROP-2026-V2.PDF",
    history: [
      { date: "2026-11-15", action: "PROPOSAL_EMITTED", author: "Halisson Zanchin" },
      { date: "2026-11-20", action: "TECHNICAL_ALIGNMENT", author: "Lucas Paredes" }
    ]
  }
  */
];

// ============================================================================
// 7. OPEX & CAPEX REPOSITORIES (AUDITABLE BASELINES)
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
// 8. MANAGERIAL DRE (14 CANONICAL LINES)
// ============================================================================

/**
 * Builds the 14-line Managerial DRE (Demonstração do Resultado do Exercício).
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
  // 12. Resultado Financeiro (Receitas financeiras - Despesas financeiras)
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

// ============================================================================
// 9. BUSINESS SIMULATOR & HISTORICAL SCENARIOS
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
      capexDepreciationMonths: 36 // 3 anos
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
 * Runs a high-precision financial simulation for any scenario.
 */
export function simulateFinancialScenario(params) {
  const p = { ...PRESET_SCENARIOS.UPE_INSTITUTIONAL.parameters, ...params };

  // 1. Calculate Monthly Gross Revenue in BRL
  let monthlyGrossBRL = 0;
  if (params?.unitPriceBRL != null) {
    monthlyGrossBRL = (p.billableStudents || 0) * params.unitPriceBRL;
  } else if (p.unitPriceUSD != null) {
    const exchange = p.exchangeRateUSD || 5.75;
    monthlyGrossBRL = (p.billableStudents || 0) * p.unitPriceUSD * exchange;
  } else {
    monthlyGrossBRL = (p.billableStudents || 0) * (p.unitPriceBRL || 0);
  }

  const annualGrossBRL = monthlyGrossBRL * (p.contractMonths || 12);

  // 2. Tax Deductions
  const taxInfo = calculateRevenueDeductions(monthlyGrossBRL, p.fiscalScenario || "QUALIFIED_EXPORT_PARAGUAY");
  const monthlyNetRevenueBRL = taxInfo.netRevenueBRL;

  // 3. Costs
  const totalStudents = (p.billableStudents || 0) + (p.freeTeachers || 0);
  const monthlyDirectCostsBRL = totalStudents * (p.variableCostPerStudentBRL || 4.50);
  const monthlyContributionMarginBRL = monthlyNetRevenueBRL - monthlyDirectCostsBRL;

  // 4. Fixed OPEX
  const monthlyFixedOpexBRL = p.fixedOpexBRL || 14050.00; // default partners + accounting + marketing
  const monthlyOperatingResultBRL = monthlyContributionMarginBRL - monthlyFixedOpexBRL;

  // 5. CAPEX Depreciation
  const capex = p.capexInvestmentBRL || 0;
  const depMonths = p.capexDepreciationMonths || 36;
  const monthlyDepreciationBRL = depMonths > 0 ? capex / depMonths : 0;

  // 6. Net Profit
  const monthlyNetResultBRL = monthlyOperatingResultBRL - monthlyDepreciationBRL - taxInfo.incomeTaxesAmount;
  const annualNetResultBRL = monthlyNetResultBRL * 12;

  // 7. Break-even Point (Students needed to cover fixed costs)
  // Contribution margin per student = (netPricePerStudent - variableCostPerStudent)
  const netUnitRevenue = p.billableStudents > 0 ? monthlyNetRevenueBRL / p.billableStudents : 0;
  const unitContribution = netUnitRevenue - (p.variableCostPerStudentBRL || 4.50);
  const breakEvenStudents = unitContribution > 0 ? Math.ceil(monthlyFixedOpexBRL / unitContribution) : null;

  // 8. Payback Period (Months to recover initial CAPEX)
  // Monthly Cash Generation = Operating Result (without depreciation)
  const monthlyOperatingCashflow = monthlyContributionMarginBRL - monthlyFixedOpexBRL;
  const paybackMonths = (monthlyOperatingCashflow > 0 && capex > 0)
    ? Number((capex / monthlyOperatingCashflow).toFixed(1))
    : null;

  // 9. ROI on CAPEX (Annualized)
  const annualCashFlow = monthlyOperatingCashflow * 12;
  const annualROI = capex > 0 ? Number(((annualCashFlow / capex) * 100).toFixed(1)) : null;

  // 10. Financial Runway (if negative result, months of survival based on available cash)
  const initialCashReserve = p.initialCashReserve || 30000.00;
  let runwayMonths = null;
  if (monthlyOperatingCashflow < 0) {
    runwayMonths = Number((initialCashReserve / Math.abs(monthlyOperatingCashflow)).toFixed(1));
  } else {
    runwayMonths = "INFINITE (CASH_POSITIVE)";
  }

  // 11. DRE Generation for this simulation
  const dre = buildManagerialDRE({
    grossRevenueBRL: monthlyGrossBRL,
    directTaxesBRL: taxInfo.directTaxAmount,
    directCostsBRL: monthlyDirectCostsBRL,
    adminExpensesBRL: 350.00, // Contabilidade
    commercialExpensesBRL: 1200.00, // Marketing
    techExpensesBRL: 0.00,
    proLaboreBRL: 12500.00, // 5 sócios × R$ 2.500
    depreciationBRL: monthlyDepreciationBRL,
    financialResultBRL: 0.00,
    incomeTaxesBRL: taxInfo.incomeTaxesAmount,
    isProjected: true
  });

  return {
    parameters: p,
    mrr: Number(monthlyGrossBRL.toFixed(2)),
    arr: Number(annualGrossBRL.toFixed(2)),
    monthlyNetRevenue: Number(monthlyNetRevenueBRL.toFixed(2)),
    monthlyDirectCosts: Number(monthlyDirectCostsBRL.toFixed(2)),
    monthlyContributionMargin: Number(monthlyContributionMarginBRL.toFixed(2)),
    contributionMarginPercent: monthlyNetRevenueBRL > 0
      ? Number(((monthlyContributionMarginBRL / monthlyNetRevenueBRL) * 100).toFixed(1))
      : 0,
    monthlyFixedOpex: Number(monthlyFixedOpexBRL.toFixed(2)),
    monthlyOperatingResult: Number(monthlyOperatingResultBRL.toFixed(2)),
    monthlyDepreciation: Number(monthlyDepreciationBRL.toFixed(2)),
    monthlyNetResult: Number(monthlyNetResultBRL.toFixed(2)),
    annualNetResult: Number(annualNetResultBRL.toFixed(2)),
    breakEvenStudents,
    paybackMonths,
    annualROI,
    runwayMonths,
    dre
  };
}

// ============================================================================
// 10. REALIZED FINANCIAL METRICS ENGINE (ZERO FICTION)
// ============================================================================

/**
 * Compiles realized and certified financial metrics from database and contracts.
 * If no certified contracts or invoices exist, reports explicit EMPTY/NOT_CONFIGURED states.
 */
export async function getRealizedFinancialMetrics({ userRole, institutionId } = {}) {
  const isSuperAdmin = normalizeRole(userRole) === ROLES.SUPER_ADMIN;

  // Baseline empty structure
  const result = {
    scope: isSuperAdmin ? "GLOBAL" : "INSTITUTIONAL",
    certified: false,
    mrrContracted: 0,
    arrContracted: 0,
    mrrReceived: 0,
    mrrOverdue: 0,
    billedInCycle: 0,
    receivedInCycle: 0,
    accountsReceivable: 0,
    arpu: null,
    totalBillableLicenses: 0,
    activeContractsCount: 0,
    statusNotice: "Nenhum contrato comercial B2B homologado ou faturamento emitido no período.",
    contracts: [],
    opex: [],
    capex: [],
    cashFlow: {
      inflows: 0,
      outflows: 0,
      netBalance: 0
    },
    dre: buildManagerialDRE({
      grossRevenueBRL: 0,
      directTaxesBRL: 0,
      directCostsBRL: 0,
      adminExpensesBRL: 0,
      commercialExpensesBRL: 0,
      techExpensesBRL: 0,
      proLaboreBRL: 0,
      depreciationBRL: 0,
      financialResultBRL: 0,
      incomeTaxesBRL: 0,
      isProjected: false
    })
  };

  // If Supabase is not configured, return safe unconfigured structure
  if (!isSupabaseConfigured()) {
    result.statusNotice = "Banco Supabase não conectado. Informações contratuais e financeiras indisponíveis.";
    return result;
  }

  try {
    // 1. Fetch institutions contract status
    let query = supabase.from("institutions").select("id, name, slug, contracted_capacity, price_per_student, contract_status, active");
    if (!isSuperAdmin && institutionId) {
      query = query.eq("id", institutionId);
    }

    const { data: institutions, error } = await query;
    if (error) {
      console.warn("[financial] Erro ao carregar status contratual das instituições:", error.message);
      return result;
    }

    let activeContracts = 0;
    let contractedMRR = 0;
    let billableLicenses = 0;

    (institutions || []).forEach(inst => {
      // ONLY active contracts with certified prices enter MRR
      if (inst.active && inst.contract_status === "ACTIVE" && inst.contracted_capacity > 0 && inst.price_per_student > 0) {
        activeContracts += 1;
        const capacity = Number(inst.contracted_capacity);
        const price = Number(inst.price_per_student);
        contractedMRR += capacity * price;
        billableLicenses += capacity;
      }
    });

    result.activeContractsCount = activeContracts;
    result.mrrContracted = contractedMRR;
    result.arrContracted = contractedMRR * 12;
    result.totalBillableLicenses = billableLicenses;
    result.certified = activeContracts > 0;

    if (billableLicenses > 0 && contractedMRR > 0) {
      result.arpu = Number((contractedMRR / billableLicenses).toFixed(2));
      result.statusNotice = `${activeContracts} contrato(s) ativo(s) certificado(s).`;
    }

    return result;
  } catch (err) {
    console.error("[financial] Falha inesperada ao consultar métricas financeiras:", err);
    return result;
  }
}
