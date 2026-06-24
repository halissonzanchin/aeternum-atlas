// src/demo/upe/dataset.js

import { getInstitutionalLayer, upeBaseMetrics, upeHierarchy } from "./institutionalLayer";
import { getAcademicLayer, isoDate } from "./academicLayer";
import { getFinancialLayer } from "./financialLayer";
import { getExecutiveLayer } from "./executiveLayer";
import { getHeatmapIntelligence } from "./heatmapIntelligenceLayer";

// We extract data from the layers to preserve the exact contracts
// previously validated in Phase 5.5.
const institutional = getInstitutionalLayer();
const academic = getAcademicLayer();
const financial = getFinancialLayer();
const executive = getExecutiveLayer();

// 1. DADOS BASE
export const UPE_BASE_METRICS = {
  ...upeBaseMetrics,
  accessesToday: 412,
  accessesThisMonth: 8742,
  estimatedMonthlyRevenue: financial.saas.mrr
};

// 2. ANALYTICS GLOBAIS
export const mockGlobalAnalytics = {
  snapshot: {
    activeUsersNow: 45,
    accessesToday: UPE_BASE_METRICS.accessesToday,
    accessesThisMonth: UPE_BASE_METRICS.accessesThisMonth,
    totalStudyHoursThisMonth: academic.timeSeries.months12.studyHours[0].value,
    averageSessionMinutes: 45,
    returningUserRate: academic.timeSeries.months12.retentionRate[0].value,
    modelCompletionRate: 60,
    platformStatus: academic.health.status,
    uptimePercent: academic.health.uptimePercent,
    errorsThisMonth: 12,
    blockedAccessAttempts: 5,
    affectedUsers: 3,
    totalDowntimeMinutes: academic.health.downtimeMinutes,
    lastIncident: null,
    averageResponseTimeMs: 120,
    sketchfabLoadErrors: 2,
    loginErrors: 5,
    reportExportErrors: 1,
    routeErrors: 4,
    lastUpdated: new Date().toISOString()
  },
  dailyAccessData: Array.from({ length: 30 }, (_, index) => {
    const daysAgo = 29 - index;
    const baseline = 280 + Math.round(Math.sin(index / 2.8) * 72);
    return { date: isoDate(daysAgo), accesses: baseline, activeStudents: Math.max(120, Math.round(baseline * 0.68)), studyMinutes: baseline * 14 };
  }),
  hourlyUsageData: Array.from({ length: 24 }, (_, i) => ({ hour: `${i.toString().padStart(2, '0')}:00`, accesses: i > 7 && i < 22 ? Math.round(Math.sin((i - 8) / 14 * Math.PI) * 100) + 20 : Math.round(Math.random() * 10) })),
  systemStudyTimeData: academic.systemStudyTime,
  mostAccessedModelsData: [
    { model: "Coração Humano — Superficial", accesses: 2840, studyHours: 247 },
    { model: "Crânio Humano 3D", accesses: 2360, studyHours: 210 },
    { model: "Mandíbula", accesses: 2185, studyHours: 173 },
    { model: "Sistema Digestório", accesses: 1680, studyHours: 155 },
    { model: "Tórax Cadavérico", accesses: 1520, studyHours: 149 }
  ],
  platformErrorsData: academic.platformErrors,
  downtimeData: [],
  responseTimeData: Array.from({ length: 30 }, (_, i) => ({ date: isoDate(29 - i), ms: 110 + Math.round(Math.random() * 30) })),
  platformIncidents: []
};

// 3. ANALYTICS ACADÊMICOS
export const mockAcademicAnalytics = {
  totalAttempts: academic.timeSeries.months12.quizAttempts[0].value,
  averageScore: academic.performance.coursePerformance[0].avgScore,
  averageTimeSeconds: 420,
  topModels: [
    { id: "coracao-123", model_name: "Coração Humano — Modelo Superficial 3D", attempts: 3200, avg_score: 82 },
    { id: "cranio-123", model_name: "Crânio Humano 3D", attempts: 2850, avg_score: 75 },
    { id: "mandibula-123", model_name: "Mandíbula", attempts: 2100, avg_score: 88 }
  ],
  difficultModels: [
    { id: "plexo-123", model_name: "Plexo Braquial", attempts: 850, avg_score: 45 },
    { id: "basecranio-123", model_name: "Base do Crânio", attempts: 1120, avg_score: 52 },
    { id: "ventricular-123", model_name: "Sistema Ventricular", attempts: 940, avg_score: 58 }
  ],
  kpiUsage: "Alto Engajamento",
  error: null,
  warning: null
};

// 4. MAPA DE CALOR
export const mockAnatomicalHeatmap = getHeatmapIntelligence();

// 5. ROI INSTITUCIONAL
export const mockInstitutionRoi = {
  totalViews: UPE_BASE_METRICS.accessesThisMonth,
  totalQuizzes: academic.timeSeries.months12.quizAttempts[0].value,
  totalStudySeconds: academic.timeSeries.months12.studyHours[0].value * 3600,
  activeClasses: 45,
  activeStudents: institutional.metrics.activeStudents,
  engagementLevel: "Alto",
  estimatedLabSavings: financial.roi.estimatedLabSavings,
  institutionalAdoption: 85,
  error: null,
  warning: null
};

// 6. INSTITUIÇÕES VINCULADAS
export const mockInstitutions = upeHierarchy.campuses.map(c => ({
  id: c.id,
  name: `UPE ${c.name}`,
  activeStudents: c.activeStudents,
  contractedCapacity: c.contractedCapacity,
  pricePerStudent: 50
}));

// Integration payload for `institutionDashboardService.js`
export function buildDatasetDemoUpePayload() {
  return {
    source: "demo_upe",
    institutions: mockInstitutions,
    institution: institutional.profile,
    stats: {
      contractedCapacity: institutional.metrics.contractedCapacity,
      registeredStudents: institutional.metrics.registeredStudents,
      activeStudents: institutional.metrics.activeStudents,
      inactiveStudents: institutional.metrics.registeredStudents - institutional.metrics.activeStudents,
      pendingStudents: institutional.profile.pendingStudents,
      blockedStudents: institutional.profile.blockedStudents,
      newStudentsThisMonth: 12,
      monthlyGrowthPercent: 2.5,
      occupancyRate: institutional.metrics.occupancyRate,
      estimatedRevenue: financial.saas.mrr,
      maxRevenue: institutional.metrics.contractedCapacity * 50,
      lostRevenue: (institutional.metrics.contractedCapacity - institutional.metrics.activeStudents) * 50
    },
    overviewMetrics: {
      activeNow: mockGlobalAnalytics.snapshot.activeUsersNow,
      accessesToday: UPE_BASE_METRICS.accessesToday,
      accessesThisMonth: UPE_BASE_METRICS.accessesThisMonth,
      totalStudyHoursThisMonth: mockGlobalAnalytics.snapshot.totalStudyHoursThisMonth,
      averageSessionMinutes: mockGlobalAnalytics.snapshot.averageSessionMinutes,
      returnRate: mockGlobalAnalytics.snapshot.returningUserRate,
      completionRate: mockGlobalAnalytics.snapshot.modelCompletionRate,
      mostAccessedContent: "Coração Humano — Superficial",
      peakHour: "14h",
      peakDay: "Qua"
    },
    usageData: mockGlobalAnalytics.dailyAccessData,
    mostAccessedModels: mockGlobalAnalytics.mostAccessedModelsData.map(item => ({ title: item.model, accesses: item.accesses, studyHours: item.studyHours })),
    platformHealth: academic.health,
    analytics: mockGlobalAnalytics,
    students: [
      { id: "1", name: "Carlos Eduardo Mendes", email: "carlos.mendes@upe.edu.py", status: "ativo", course: "Medicina", semester: "3º Semestre", lastAccess: isoDate(0) },
      { id: "2", name: "Ana Sofia Silva", email: "ana.silva@upe.edu.py", status: "ativo", course: "Medicina", semester: "5º Semestre", lastAccess: isoDate(1) },
      { id: "3", name: "Ricardo Rocha", email: "ricardo.rocha@upe.edu.py", status: "inativo", course: "Odontologia", semester: "1º Semestre", lastAccess: isoDate(15) },
      { id: "4", name: "Mariana Costa", email: "mariana.costa@upe.edu.py", status: "ativo", course: "Enfermagem", semester: "4º Semestre", lastAccess: isoDate(0) },
      { id: "5", name: "Lucas Almeida", email: "lucas.almeida@upe.edu.py", status: "pendente", course: "Medicina", semester: "1º Semestre", lastAccess: null },
      { id: "6", name: "Beatriz Nogueira", email: "beatriz.nogueira@upe.edu.py", status: "ativo", course: "Medicina", semester: "Internato", lastAccess: isoDate(2) }
    ],
    studentHistoryByUser: {},
    executiveViews: executive // We expose the executive views here so the app can consume it
  };
}
