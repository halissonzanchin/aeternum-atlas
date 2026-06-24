const today = new Date();

function isoDate(daysAgo) {
  const date = new Date(today);
  date.setDate(today.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export const institutionProfile = {
  id: "upe-presidente-franco",
  name: "UPE Presidente Franco",
  country: "Paraguai",
  city: "Presidente Franco",
  contractType: "Licença acadêmica institucional",
  billingModel: "Aluno ativo mensal",
  pricePerRegisteredStudent: 35,
  pricePerStudent: 50,
  contractedCapacity: 3000,
  licenseStatus: "ativa",
  licenseStart: "2026-01-12T12:00:00.000Z",
  licenseEnd: "2027-01-12T12:00:00.000Z",
  registeredStudents: 2960,
  activeStudentsToday: 328,
  activeStudentsThisMonth: 2410,
  inactiveStudentsThisMonth: 550,
  accessesToday: 412,
  accessesLast7Days: 1840,
  accessesThisMonth: 12250,
  totalStudyHours: 4860,
  totalStudyHoursThisMonth: 4860,
  averageStudyMinutesPerStudent: 121,
  billableStudents: 2410,
  estimatedMonthlyTotal: 120500,
  estimatedMonthlyValue: 120500,
  currency: "BRL",
  referencePeriod: "Abril/2026",
  generatedAt: today.toISOString(),
  createdAt: "2026-01-12T12:00:00.000Z"
};

export const dailyAccessLast30Days = Array.from({ length: 30 }, (_, index) => {
  const daysAgo = 29 - index;
  const baseline = 280 + Math.round(Math.sin(index / 2.8) * 72);
  const academicPulse = index % 6 === 0 ? 96 : index % 5 === 0 ? 54 : 0;
  const accesses = baseline + academicPulse + index * 4;
  return {
    date: isoDate(daysAgo),
    accesses,
    activeStudents: Math.max(120, Math.round(accesses * 0.68)),
    studyMinutes: accesses * 14
  };
});

export const weeklyActiveStudents = [
  { week: "Semana 1", students: 1720 },
  { week: "Semana 2", students: 1985 },
  { week: "Semana 3", students: 2210 },
  { week: "Semana 4", students: 2410 }
];

export const topAccessedModels = [
  { id: "coracao-humano-superficial", title: "Coração Humano — Modelo Superficial 3D", accesses: 2840, studyHours: 247 },
  { id: "cranio-humano-3d", title: "Crânio Humano 3D", accesses: 2360, studyHours: 210 },
  { id: "mandibula", title: "Mandíbula", accesses: 2185, studyHours: 173 },
  { id: "abdome-cadaverico-3d", title: "Sistema Digestório", accesses: 1680, studyHours: 155 },
  { id: "torax-cadaverico-3d", title: "Tórax Cadavérico", accesses: 1520, studyHours: 149 }
];

export const courseDistribution = [
  { label: "Medicina · 1º ano", students: 680 },
  { label: "Medicina · 2º ano", students: 620 },
  { label: "Medicina · 3º ano", students: 540 },
  { label: "Medicina · Internato", students: 410 },
  { label: "Odontologia", students: 280 },
  { label: "Enfermagem", students: 210 }
];

export const averageStudyTimeByStudent = [
  { label: "0-15 min", students: 320 },
  { label: "15-30 min", students: 580 },
  { label: "30-60 min", students: 760 },
  { label: "1-2h", students: 520 },
  { label: "2h+", students: 230 }
];

export const registeredStudentsEvolution = [
  { month: "Nov", students: 1980 },
  { month: "Dez", students: 2140 },
  { month: "Jan", students: 2320 },
  { month: "Fev", students: 2590 },
  { month: "Mar", students: 2815 },
  { month: "Abr", students: 2960 }
];

export const registeredVsActiveStudents = [
  { label: "Alunos cadastrados", students: 2960 },
  { label: "Alunos ativos", students: 2410 },
  { label: "Alunos inativos", students: 550 }
];

export const mockInstitutionStudents = [
  {
    id: "stu-001",
    name: "Ana Martínez",
    email: "ana.martinez@upe.edu.py",
    registration: "MED-2026-001",
    course: "Medicina",
    semester: "2º ano",
    status: "ativo",
    createdAt: "2026-04-01T10:00:00.000Z",
    lastAccessAt: "2026-04-29 18:42",
    totalAccesses: 42,
    modelsStudied: 8,
    studyMinutes: 320
  },
  {
    id: "student-demo",
    name: "Estudante Demo",
    email: "demo@upe.edu.py",
    registration: "RA-2026-001",
    course: "Medicina",
    semester: "2º semestre",
    status: "ativo",
    createdAt: "2026-02-03T10:00:00.000Z",
    lastAccessAt: isoDate(0),
    totalAccesses: 42,
    modelsStudied: 7,
    studyMinutes: 385
  },
  {
    id: "ana-paula",
    name: "Ana Paula Martins",
    email: "ana.martins@upe.edu.py",
    registration: "RA-2026-104",
    course: "Medicina",
    semester: "4º semestre",
    status: "ativo",
    createdAt: "2026-01-18T11:20:00.000Z",
    lastAccessAt: isoDate(1),
    totalAccesses: 78,
    modelsStudied: 14,
    studyMinutes: 690
  },
  {
    id: "bruno-silva",
    name: "Bruno Silva",
    email: "bruno.silva@upe.edu.py",
    registration: "RA-2025-892",
    course: "Medicina",
    semester: "6º semestre",
    status: "ativo",
    createdAt: "2025-09-02T14:40:00.000Z",
    lastAccessAt: isoDate(3),
    totalAccesses: 119,
    modelsStudied: 21,
    studyMinutes: 1035
  },
  {
    id: "camila-rocha",
    name: "Camila Rocha",
    email: "camila.rocha@upe.edu.py",
    registration: "RA-2024-320",
    course: "Medicina",
    semester: "Internato",
    status: "inativo",
    createdAt: "2024-08-15T09:30:00.000Z",
    lastAccessAt: isoDate(18),
    totalAccesses: 64,
    modelsStudied: 10,
    studyMinutes: 520
  },
  {
    id: "diego-lima",
    name: "Diego Lima",
    email: "diego.lima@upe.edu.py",
    registration: "RA-2026-218",
    course: "Odontologia",
    semester: "1º semestre",
    status: "pendente",
    createdAt: "2026-04-12T16:05:00.000Z",
    lastAccessAt: null,
    totalAccesses: 0,
    modelsStudied: 0,
    studyMinutes: 0
  }
];

export const institutionalReports = [
  { id: "monthly-usage", name: "Relatório mensal de uso", status: "Disponível", period: "Abril/2026" },
  { id: "billing-estimate", name: "Estimativa de cobrança institucional", status: "Disponível", period: "Abril/2026" },
  { id: "student-engagement", name: "Engajamento por curso e semestre", status: "Em revisão", period: "Últimos 30 dias" }
];

export const mockInstitutions = [
  {
    id: institutionProfile.id,
    name: institutionProfile.name,
    status: "Ativa",
    licenseStatus: institutionProfile.licenseStatus,
    registeredStudents: institutionProfile.registeredStudents,
    activeStudentsThisMonth: institutionProfile.activeStudentsThisMonth,
    estimatedMonthlyTotal: institutionProfile.estimatedMonthlyTotal,
    usageGrowthPercent: 18
  },
  {
    id: "faculdade-demo",
    name: "Faculdade Demo de Medicina",
    status: "Em implantação",
    licenseStatus: "Em implantação",
    registeredStudents: 1180,
    activeStudentsThisMonth: 760,
    estimatedMonthlyTotal: 38000,
    usageGrowthPercent: 9
  }
];

export const usageEvents = [
  "login",
  "logout",
  "open_dashboard",
  "open_models_page",
  "open_model_detail",
  "open_model_viewer",
  "open_external_sketchfab",
  "favorite_model",
  "complete_model",
  "copy_model_link"
];
