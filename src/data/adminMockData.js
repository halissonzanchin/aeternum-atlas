export const upeInstitution = {
  id: "upe-presidente-franco",
  name: "Universidad Privada del Este",
  abbreviation: "UPE",
  campus: "Presidente Franco",
  city: "Presidente Franco",
  country: "Paraguay",
  type: "Instituição de ensino superior",
  course: "Medicina",
  contractedCapacity: 3000,
  registeredStudents: 2960,
  activeStudents: 2410,
  inactiveStudents: 550,
  pendingStudents: 28,
  blockedStudents: 7,
  noAccessLast30Days: 515,
  pricePerStudent: 50,
  currency: "BRL",
  licenseStatus: "Ativa",
  billingModel: "Aluno ativo mensal",
  licenseStart: "2026-04-01",
  nextRenewal: "2026-05-01",
  institutionalResponsible: "Dra. Verónica Benítez",
  administrativeEmail: "coord.med@upe.edu.py",
  contractNotes:
    "Licença acadêmica personalizada para acervo anatômico 3D privado da UPE Presidente Franco, com limite contratado de 3.000 alunos."
};

export const overviewMetrics = {
  accessesToday: 328,
  accessesThisMonth: 12250,
  totalStudyHoursThisMonth: 4860,
  mostAccessedContent: "Coração Humano — Modelo Superficial 3D",
  activeNow: 126,
  averageSessionMinutes: 18,
  returnRate: 72,
  peakHour: "20:00",
  peakDay: "Terça-feira",
  completionRate: 64
};

export const platformHealth = {
  status: "online",
  uptimePercent: 99.8,
  incidentsThisMonth: 2,
  totalDowntimeMinutes: 18,
  affectedUsers: 42,
  averageResponseTimeMs: 280,
  sketchfabLoadErrors: 3,
  loginErrors: 5,
  reportExportErrors: 1,
  routeErrors: 4,
  timeoutErrors: 6,
  futureApiErrors: 2,
  lastIncident: "2026-04-27 21:14"
};

export const mostAccessedModels = [
  { id: "coracao-humano-superficial", title: "Coração Humano — Modelo Superficial 3D", accesses: 2840, studyHours: 620, completionRate: 78 },
  { id: "cranio-humano-3d", title: "Crânio Humano 3D", accesses: 2360, studyHours: 540, completionRate: 69 },
  { id: "mandibula", title: "Mandíbula", accesses: 2185, studyHours: 470, completionRate: 73 },
  { id: "abdome-cadaverico-3d", title: "Sistema Digestório", accesses: 1680, studyHours: 410, completionRate: 56 },
  { id: "torax-cadaverico-3d", title: "Tórax Cadavérico", accesses: 1520, studyHours: 385, completionRate: 52 }
];

export const mockStudents = [
  {
    id: "stu-001",
    name: "Ana Martínez",
    email: "ana.martinez@upe.edu.py",
    registration: "MED-2026-001",
    course: "Medicina",
    semester: "2º ano",
    status: "ativo",
    createdAt: "2026-04-01",
    lastAccess: "2026-04-29 18:42",
    totalAccesses: 42,
    totalStudyMinutes: 320,
    mostAccessedContent: "Coração Humano — Modelo Superficial 3D",
    studiedModels: 8,
    performance: 82,
    sessions: 18,
    completedModels: 8,
    viewedContents: ["Coração Humano", "Mandíbula", "Crânio Humano 3D"]
  },
  {
    id: "stu-002",
    name: "Bruno Silva",
    email: "bruno.silva@upe.edu.py",
    registration: "MED-2025-892",
    course: "Medicina",
    semester: "6º semestre",
    status: "ativo",
    createdAt: "2025-09-02",
    lastAccess: "2026-04-30 09:15",
    totalAccesses: 119,
    totalStudyMinutes: 1035,
    mostAccessedContent: "Crânio Humano 3D",
    studiedModels: 21,
    performance: 91,
    sessions: 44,
    completedModels: 21,
    viewedContents: ["Crânio Humano 3D", "Tórax Cadavérico", "Coração Humano"]
  },
  {
    id: "stu-003",
    name: "Camila Rocha",
    email: "camila.rocha@upe.edu.py",
    registration: "MED-2024-320",
    course: "Medicina",
    semester: "Internato",
    status: "inativo",
    createdAt: "2024-08-15",
    lastAccess: "2026-04-12 11:04",
    totalAccesses: 64,
    totalStudyMinutes: 520,
    mostAccessedContent: "Tórax Cadavérico",
    studiedModels: 10,
    performance: 61,
    sessions: 23,
    completedModels: 10,
    viewedContents: ["Tórax Cadavérico", "Sistema Digestório"]
  },
  {
    id: "stu-004",
    name: "Diego Lima",
    email: "diego.lima@upe.edu.py",
    registration: "MED-2026-218",
    course: "Medicina",
    semester: "1º semestre",
    status: "pendente",
    createdAt: "2026-04-12",
    lastAccess: "",
    totalAccesses: 0,
    totalStudyMinutes: 0,
    mostAccessedContent: "-",
    studiedModels: 0,
    performance: 0,
    sessions: 0,
    completedModels: 0,
    viewedContents: []
  },
  {
    id: "stu-005",
    name: "Lucía Fernández",
    email: "lucia.fernandez@upe.edu.py",
    registration: "MED-2026-334",
    course: "Medicina",
    semester: "3º semestre",
    status: "ativo",
    createdAt: "2026-03-20",
    lastAccess: "2026-04-30 12:26",
    totalAccesses: 88,
    totalStudyMinutes: 760,
    mostAccessedContent: "Mandíbula",
    studiedModels: 15,
    performance: 86,
    sessions: 31,
    completedModels: 15,
    viewedContents: ["Mandíbula", "Crânio Humano 3D", "Coração Humano"]
  },
  {
    id: "stu-006",
    name: "Marcos Pereira",
    email: "marcos.pereira@upe.edu.py",
    registration: "MED-2025-441",
    course: "Medicina",
    semester: "5º semestre",
    status: "bloqueado",
    createdAt: "2025-11-02",
    lastAccess: "2026-03-28 16:10",
    totalAccesses: 22,
    totalStudyMinutes: 160,
    mostAccessedContent: "Sistema Digestório",
    studiedModels: 4,
    performance: 37,
    sessions: 9,
    completedModels: 4,
    viewedContents: ["Sistema Digestório"]
  }
];

export const studentRadarData = [
  { subject: "Frequência", value: 82 },
  { subject: "Tempo de estudo", value: 74 },
  { subject: "Modelos concluídos", value: 58 },
  { subject: "Diversidade", value: 66 },
  { subject: "Interação 3D", value: 91 },
  { subject: "Revisão", value: 49 },
  { subject: "Engajamento", value: 78 }
];

export const studentAccessHistory = [
  { date: "2026-04-30", time: "14:42", eventType: "visualização de annotation", model: "Coração Humano", duration: "06 min", action: "Annotation: Artéria Interventricular Anterior" },
  { date: "2026-04-30", time: "14:31", eventType: "abertura de modelo", model: "Coração Humano", duration: "18 min", action: "Viewer Sketchfab" },
  { date: "2026-04-29", time: "18:42", eventType: "marcou como estudado", model: "Mandíbula", duration: "12 min", action: "Conclusão" },
  { date: "2026-04-28", time: "20:10", eventType: "favoritou modelo", model: "Crânio Humano 3D", duration: "08 min", action: "Favorito" },
  { date: "2026-04-27", time: "19:02", eventType: "login", model: "-", duration: "-", action: "Acesso ao dashboard" }
];

export const studentGrowthData = [
  { period: "Jan", newStudents: 320, accumulated: 320, growthPercent: 0 },
  { period: "Fev", newStudents: 480, accumulated: 800, growthPercent: 50 },
  { period: "Mar", newStudents: 690, accumulated: 1490, growthPercent: 43.7 },
  { period: "Abr", newStudents: 1470, accumulated: 2960, growthPercent: 113 }
];

export const dailyAccessData = Array.from({ length: 30 }, (_, index) => ({
  period: `${String(index + 1).padStart(2, "0")}/04`,
  accesses: 260 + Math.round(Math.sin(index / 2.2) * 58) + index * 7 + (index % 7 === 0 ? 90 : 0),
  activeStudents: 150 + Math.round(Math.cos(index / 3) * 28) + index * 5,
  studyMinutes: 4100 + index * 160
}));

export const hourlyAccessData = [
  { period: "06h", accesses: 28 },
  { period: "08h", accesses: 92 },
  { period: "10h", accesses: 180 },
  { period: "12h", accesses: 224 },
  { period: "14h", accesses: 270 },
  { period: "16h", accesses: 310 },
  { period: "18h", accesses: 360 },
  { period: "20h", accesses: 410 },
  { period: "22h", accesses: 220 }
];

export const systemUsageData = [
  { label: "Cardiovascular", value: 1320 },
  { label: "Esquelético", value: 1180 },
  { label: "Digestório", value: 820 },
  { label: "Respiratório", value: 690 },
  { label: "Nervoso", value: 540 }
];

export const deviceSessions = [
  { label: "Desktop", value: 64 },
  { label: "Tablet", value: 22 },
  { label: "Mobile", value: 14 }
];

export const monthlyUsageEvolution = [
  { period: "Nov", accesses: 4200 },
  { period: "Dez", accesses: 5100 },
  { period: "Jan", accesses: 6900 },
  { period: "Fev", accesses: 8400 },
  { period: "Mar", accesses: 10300 },
  { period: "Abr", accesses: 12250 }
];

export const platformErrorData = [
  { label: "Login", value: platformHealth.loginErrors },
  { label: "Modelo 3D", value: platformHealth.sketchfabLoadErrors },
  { label: "Rota", value: platformHealth.routeErrors },
  { label: "Exportação", value: platformHealth.reportExportErrors },
  { label: "API futura", value: platformHealth.futureApiErrors },
  { label: "Timeout", value: platformHealth.timeoutErrors }
];

export const platformIncidents = [
  { date: "2026-04-27", time: "21:14", module: "Sketchfab Viewer", errorType: "timeout", duration: "11 min", affectedUsers: 24, status: "resolvido", note: "Latência externa no carregamento de modelos." },
  { date: "2026-04-18", time: "08:42", module: "Relatórios", errorType: "exportação", duration: "7 min", affectedUsers: 18, status: "resolvido", note: "Falha mockada na geração PDF." },
  { date: "2026-04-05", time: "19:05", module: "Login", errorType: "autenticação", duration: "0 min", affectedUsers: 5, status: "monitorado", note: "Tentativas inválidas de senha." }
];

export const billingScenarios = [
  { name: "Conservador", activeStudents: 2200, monthlyRevenue: 110000, annualRevenue: 1320000 },
  { name: "Realista", activeStudents: 2410, monthlyRevenue: 120500, annualRevenue: 1446000 },
  { name: "Otimista", activeStudents: 2960, monthlyRevenue: 148000, annualRevenue: 1776000 },
  { name: "Capacidade total", activeStudents: 3000, monthlyRevenue: 150000, annualRevenue: 1800000 }
];

export const billingProjectionData = [
  { period: "Mensal", conservative: 110000, realistic: 120500, optimistic: 148000, capacity: 150000 },
  { period: "Semestral", conservative: 660000, realistic: 723000, optimistic: 888000, capacity: 900000 },
  { period: "Anual", conservative: 1320000, realistic: 1446000, optimistic: 1776000, capacity: 1800000 }
];

export const executiveReportObservations = [
  "A licença opera com 98,6% da capacidade contratada.",
  "O modelo do coração lidera os acessos e demonstra valor pedagógico para anatomia cardiovascular.",
  "A plataforma mantém uptime estimado de 99,8% no mês, com incidentes resolvidos e baixo impacto.",
  "A diferença entre alunos ativos e cadastrados indica oportunidade de ativação acadêmica."
];
