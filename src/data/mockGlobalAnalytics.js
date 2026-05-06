export const globalAnalyticsSnapshot = {
  activeUsersNow: 186,
  accessesToday: 328,
  accessesThisMonth: 12250,
  totalStudyHoursThisMonth: 4860,
  averageSessionMinutes: 18.7,
  returningUserRate: 72,
  modelCompletionRate: 64,
  platformStatus: "online",
  uptimePercent: 99.8,
  errorsThisMonth: 11,
  blockedAccessAttempts: 6,
  affectedUsers: 42,
  totalDowntimeMinutes: 18,
  lastIncident: "2026-04-27 21:14",
  averageResponseTimeMs: 280,
  sketchfabLoadErrors: 3,
  loginErrors: 5,
  reportExportErrors: 1,
  routeErrors: 2
};

export const dailyAccessData = [
  { day: "01", accesses: 280, activeUsers: 190, studyMinutes: 4200 },
  { day: "02", accesses: 320, activeUsers: 210, studyMinutes: 5100 },
  { day: "03", accesses: 410, activeUsers: 260, studyMinutes: 6100 },
  { day: "04", accesses: 390, activeUsers: 248, studyMinutes: 5800 },
  { day: "05", accesses: 440, activeUsers: 280, studyMinutes: 6420 },
  { day: "06", accesses: 510, activeUsers: 318, studyMinutes: 7180 },
  { day: "07", accesses: 470, activeUsers: 302, studyMinutes: 6900 }
];

export const hourlyUsageData = [
  { hour: "07h", accesses: 24 },
  { hour: "08h", accesses: 42 },
  { hour: "09h", accesses: 78 },
  { hour: "10h", accesses: 96 },
  { hour: "11h", accesses: 88 },
  { hour: "14h", accesses: 120 },
  { hour: "19h", accesses: 146 },
  { hour: "21h", accesses: 132 }
];

export const systemStudyTimeData = [
  { system: "Cardiovascular", hours: 1240 },
  { system: "Esquelético", hours: 980 },
  { system: "Digestório", hours: 720 },
  { system: "Respiratório", hours: 640 },
  { system: "Nervoso", hours: 520 }
];

export const mostAccessedModelsData = [
  { model: "Coração Humano — Modelo Superficial 3D", accesses: 1840, studyMinutes: 11240, growthPercent: 18.4, completionRate: 72 },
  { model: "Crânio Humano 3D", accesses: 1320, studyMinutes: 8940, growthPercent: 12.8, completionRate: 68 },
  { model: "Mandíbula", accesses: 980, studyMinutes: 6220, growthPercent: 9.6, completionRate: 61 },
  { model: "Tórax Cadavérico 3D", accesses: 740, studyMinutes: 5100, growthPercent: 7.2, completionRate: 57 },
  { model: "Abdome Cadavérico 3D", accesses: 610, studyMinutes: 4400, growthPercent: 5.9, completionRate: 53 }
];

export const platformErrorsData = [
  { type: "Login", count: 5 },
  { type: "Sketchfab", count: 3 },
  { type: "Relatórios", count: 1 },
  { type: "Rotas", count: 2 },
  { type: "Timeout", count: 4 },
  { type: "Permissão", count: 2 }
];

export const downtimeData = [
  { date: "20/04", downtimeMinutes: 0 },
  { date: "21/04", downtimeMinutes: 4 },
  { date: "22/04", downtimeMinutes: 0 },
  { date: "23/04", downtimeMinutes: 8 },
  { date: "24/04", downtimeMinutes: 0 },
  { date: "25/04", downtimeMinutes: 6 }
];

export const responseTimeData = [
  { time: "08h", responseMs: 240 },
  { time: "10h", responseMs: 280 },
  { time: "12h", responseMs: 310 },
  { time: "14h", responseMs: 260 },
  { time: "16h", responseMs: 295 },
  { time: "18h", responseMs: 270 }
];

export const platformIncidents = [
  {
    id: "inc-001",
    date: "2026-04-27",
    time: "21:14",
    module: "Viewer 3D",
    errorType: "Falha de carregamento Sketchfab",
    durationMinutes: 8,
    affectedUsers: 18,
    status: "Resolvido",
    severity: "Média",
    note: "Instabilidade temporária no carregamento externo do modelo."
  },
  {
    id: "inc-002",
    date: "2026-04-25",
    time: "10:32",
    module: "Login",
    errorType: "Timeout de autenticação",
    durationMinutes: 10,
    affectedUsers: 24,
    status: "Resolvido",
    severity: "Alta",
    note: "Usuários tiveram atraso para acessar a plataforma."
  }
];

export const blockedAccessLogs = [
  {
    id: "blk-001",
    date: "2026-04-29",
    user: "Carlos Benítez",
    email: "carlos.benitez@upe.edu.py",
    reason: "Senha incorreta repetida",
    device: "Chrome / Windows",
    status: "Bloqueio temporário"
  },
  {
    id: "blk-002",
    date: "2026-04-28",
    user: "María López",
    email: "maria.lopez@upe.edu.py",
    reason: "Conta bloqueada pela instituição",
    device: "Safari / iPadOS",
    status: "Acesso negado"
  },
  {
    id: "blk-003",
    date: "2026-04-26",
    user: "Usuário externo",
    email: "externo@email.com",
    reason: "Domínio acadêmico não autorizado",
    device: "Firefox / Linux",
    status: "Permissão recusada"
  }
];

export const developmentMetrics = {
  appVersion: "1.0.0",
  environment: "staging",
  lastDeploy: "2026-04-30 01:42",
  buildStatus: "stable",
  averageViewerLoadTimeSeconds: 2.8,
  frontendErrorRate: 0.4,
  routeErrorRate: 0.2,
  sketchfabFailureRate: 0.3,
  exportFailureRate: 0.1,
  averageMemoryUsageMb: 420
};
