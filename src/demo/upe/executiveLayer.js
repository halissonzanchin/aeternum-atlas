// src/demo/upe/executiveLayer.js

import { getInstitutionalLayer } from "./institutionalLayer";
import { getAcademicLayer } from "./academicLayer";
import { getFinancialLayer } from "./financialLayer";

// Orquestrador de Visões baseadas em Funções (Role-Based Views)

export function getSuperAdminView() {
  const inst = getInstitutionalLayer();
  const acad = getAcademicLayer();
  const fin = getFinancialLayer();
  
  return {
    role: "Super Admin B2B",
    description: "Visão consolidada SaaS para gestão interna da Aeternum Atlas",
    saasKpis: fin.saas,
    platformHealth: acad.health,
    platformErrors: acad.platformErrors,
    globalUsage: {
      months12: acad.timeSeries.months12,
      studyHours: [
        { period: 'Jul', value: 8000 },
        { period: 'Ago', value: 8500 },
        { period: 'Set', value: 8742 }
      ],
      topModels: [
        { model: 'Sistema Nervoso', accesses: 12450 },
        { model: 'Sistema Esquelético', accesses: 9800 },
        { model: 'Coração', accesses: 8500 }
      ]
    },
    growthMetrics: {
      activeUniversities: 12,
      occupancyRate: 99,
      totalStudents: 2960
    },
    activeInstitutions: [inst.profile] // Em um cenário real, seria uma lista de várias instituições
  };
}

export function getRectorView() {
  const inst = getInstitutionalLayer();
  const acad = getAcademicLayer();
  const fin = getFinancialLayer();

  return {
    role: "Reitor",
    description: "Visão estratégica institucional e ROI",
    institution: inst.profile,
    hierarchy: inst.hierarchy,
    roi: fin.roi,
    revenueAllocation: fin.breakdown,
    academicPerformance: acad.performance.coursePerformance,
    adoptionRate: (inst.metrics.activeStudents / inst.metrics.registeredStudents) * 100
  };
}

export function getCoordinatorView() {
  const acad = getAcademicLayer();
  
  return {
    role: "Coordenador",
    description: "Visão tática acadêmica",
    performanceBySemester: acad.performance.semesterPerformance,
    performanceByCourse: acad.performance.coursePerformance,
    systemStudyTime: acad.systemStudyTime,
    retentionTrend: acad.timeSeries.months12.retentionRate
  };
}

export function getProfessorView() {
  // O foco do professor é puramente engajamento de turma e dificuldade de conteúdo
  return {
    role: "Professor",
    description: "Visão operacional de sala de aula",
    classEngagement: "Alto",
    mostDifficultModels: [
      { modelId: "neuro-123", model: "Neuroanatomia Completa", errorRate: 41.2 },
      { modelId: "osteo-123", model: "Osteologia Craniana", errorRate: 37.5 }
    ],
    mostErroredStructures: [
      { structure: "Plexo Braquial", errors: 1250, errorRate: 45.5 },
      { structure: "Base do Crânio", errors: 980, errorRate: 42.1 }
    ]
  };
}

export function getInvestorView() {
  const fin = getFinancialLayer();
  const inst = getInstitutionalLayer();

  return {
    role: "Investidor / Comercial",
    description: "Visão de Pitch e Unit Economics",
    unitEconomics: {
      cac: fin.saas.cacEstimated,
      ltv: fin.saas.ltvEstimated,
      ltvCacRatio: (fin.saas.ltvEstimated / fin.saas.cacEstimated).toFixed(1)
    },
    financials: {
      mrr: fin.saas.mrr,
      mrrGrowth: 15,
      arr: fin.saas.arr,
      cac: fin.saas.cacEstimated,
      ltv: fin.saas.ltvEstimated,
      churnRate: fin.saas.simulatedMonthlyChurnPercent
    },
    marketShare: {
      regions: [
        { region: 'Brasil', percentage: 65 },
        { region: 'México', percentage: 15 },
        { region: 'Colômbia', percentage: 10 },
        { region: 'Chile', percentage: 10 }
      ]
    },
    expansion: {
      pipelineValue: "R$ 4.5M",
      targetMarkets: ["Argentina", "Peru"],
      nextRevenueMilestone: "R$ 2M MRR"
    },
    arrPredict: fin.saas.arr,
    expansionOpportunities: inst.hierarchy.campuses.reduce((acc, curr) => acc + (curr.contractedCapacity - curr.activeStudents), 0) * 50, // Potential upsell
    churnRisk: fin.saas.simulatedMonthlyChurnPercent
  };
}

// Retorna todas as visões para debugging ou payload mestre
export function getExecutiveLayer() {
  return {
    superAdmin: getSuperAdminView(),
    rector: getRectorView(),
    coordinator: getCoordinatorView(),
    professor: getProfessorView(),
    investor: getInvestorView()
  };
}
