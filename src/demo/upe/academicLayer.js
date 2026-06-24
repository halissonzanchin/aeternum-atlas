// src/demo/upe/academicLayer.js

import { upeBaseMetrics } from "./institutionalLayer";

const today = new Date();
export function isoDate(daysAgo) {
  const date = new Date(today);
  date.setDate(today.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

// Gera série histórica baseada num baseline
function generateTimeSeries(months, baseline, variance, isGrowth) {
  return Array.from({ length: months }, (_, index) => {
    // index 0 = current month, index 1 = last month, etc.
    const monthOffset = months - 1 - index;
    const date = new Date(today);
    date.setMonth(date.getMonth() - monthOffset);
    
    // Simulate growth over time if requested
    const growthFactor = isGrowth ? (1 - (monthOffset * 0.02)) : 1; 
    const value = Math.max(0, Math.round(baseline * growthFactor + (Math.random() * variance * 2 - variance)));
    
    return {
      month: date.toISOString().slice(0, 7), // YYYY-MM
      value
    };
  });
}

export const academicSeries = {
  months12: {
    studyHours: generateTimeSeries(12, 4860, 400, true),
    viewerUsage: generateTimeSeries(12, 8742, 600, true),
    quizAttempts: generateTimeSeries(12, 15420, 1000, true),
    retentionRate: generateTimeSeries(12, 85, 3, false) // 85% average
  },
  months24: {
    studyHours: generateTimeSeries(24, 4200, 500, true),
    viewerUsage: generateTimeSeries(24, 7500, 800, true)
  },
  months36: {
    studyHours: generateTimeSeries(36, 3500, 600, true),
    viewerUsage: generateTimeSeries(36, 6000, 900, true)
  }
};

export const academicPerformance = {
  coursePerformance: [
    { course: "Medicina", avgScore: 82, completionRate: 65 },
    { course: "Odontologia", avgScore: 78, completionRate: 58 },
    { course: "Enfermagem", avgScore: 75, completionRate: 62 }
  ],
  semesterPerformance: [
    { semester: "1º Semestre", avgScore: 68 },
    { semester: "3º Semestre", avgScore: 75 },
    { semester: "5º Semestre", avgScore: 82 },
    { semester: "Internato", avgScore: 88 }
  ]
};

// Funções para Global Analytics e Overview
export const platformHealth = {
  status: "Online",
  uptimePercent: 99.9,
  incidentsThisMonth: 0,
  lastIncident: "-",
  downtimeMinutes: 0,
  uptime: "99.9%"
};

// Dados detalhados extraídos do mock original (para não quebrar compatibilidade)
export const activeSystemStudyTimeData = [
  { system: "Sistema Esquelético", hours: 1400 },
  { system: "Sistema Muscular", hours: 1250 },
  { system: "Sistema Nervoso", hours: 980 },
  { system: "Sistema Cardiovascular", hours: 850 },
  { system: "Sistema Respiratório", hours: 380 }
];

export const platformErrorsData = [
  { label: "Login", value: 5 },
  { label: "Carregamento 3D", value: 2 },
  { label: "Rotas", value: 4 },
  { label: "Exportação", value: 1 }
];

export function getAcademicLayer() {
  return {
    timeSeries: academicSeries,
    performance: academicPerformance,
    systemStudyTime: activeSystemStudyTimeData,
    platformErrors: platformErrorsData,
    health: platformHealth
  };
}
