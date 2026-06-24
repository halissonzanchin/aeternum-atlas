// src/demo/upe/financialLayer.js

import { upeBaseMetrics, upeHierarchy } from "./institutionalLayer";

const PRICE_PER_STUDENT = 50; // R$ 50

export const saasMetrics = {
  mrr: upeBaseMetrics.activeStudents * PRICE_PER_STUDENT, // 120500
  arr: upeBaseMetrics.activeStudents * PRICE_PER_STUDENT * 12, // 1446000
  cacEstimated: 12500, // Custo de Aquisição de Cliente corporativo estimado
  ltvEstimated: (upeBaseMetrics.activeStudents * PRICE_PER_STUDENT * 12) * 3, // 3 anos de contrato médio = 4.3M
  simulatedMonthlyChurnPercent: 0.8, // Churn rate < 1% (excelente para SaaS B2B)
  revenueByStudent: PRICE_PER_STUDENT
};

export const revenueBreakdown = {
  byCampus: upeHierarchy.campuses.map(c => ({
    campus: c.name,
    activeStudents: c.activeStudents,
    revenue: c.activeStudents * PRICE_PER_STUDENT
  })),
  byCourse: upeHierarchy.courses.map(c => ({
    course: c.name,
    activeStudents: c.activeStudents,
    revenue: c.activeStudents * PRICE_PER_STUDENT
  }))
};

export const institutionalRoi = {
  estimatedLabSavings: 250000, // Economia com laboratórios físicos (cadáveres, formalina, manutenção)
  operationalSavings: 85000,   // Economia de horas docentes em preparo
  roiMultiplier: 2.7,          // Retorno de 2.7x sobre o investimento anual na plataforma
  paybackMonths: 4.5
};

export function getFinancialLayer() {
  return {
    saas: saasMetrics,
    breakdown: revenueBreakdown,
    roi: institutionalRoi
  };
}
