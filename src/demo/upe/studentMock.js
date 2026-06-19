// Mock Data Contract para Lucas Almeida (Fase 6.2F.3)

export const upeStudentProfile = {
  name: "Lucas Almeida",
  course: "Medicina",
  semester: "2º Semestre",
  currentProgress: 63,
  lastModelAccessed: "Base do Crânio",
  nextRecommendedAction: "Revisar Base do Crânio em 3D",
  lastActivityAt: "2 horas atrás"
};

export const upeStudentProgress = {
  totalStudyHours: 42,
  weeklyStudyHours: 6.5,
  completedQuizzes: 8,
  averageScore: 68,
  masteredStructures: 18,
  criticalStructures: 5,
  weeklyTrend: "+12%"
};

export const upeCriticalStructures = [
  { name: "Base do Crânio", score: 42 },
  { name: "Plexo Braquial", score: 45 },
  { name: "Sistema Ventricular", score: 52 },
  { name: "Osso Temporal", score: 58 },
  { name: "Tronco Encefálico", score: 62 }
];

export const upeRecommendedLibrary = [
  { id: "skull_base", name: "Base do Crânio", system: "Sistema Esquelético" },
  { id: "cns", name: "Sistema Nervoso Central", system: "Sistema Nervoso" },
  { id: "brachial", name: "Plexo Braquial", system: "Sistema Nervoso Periférico" },
  { id: "temporal", name: "Osso Temporal", system: "Sistema Esquelético" },
  { id: "neuro_applied", name: "Neuroanatomia Aplicada", system: "Anatomia Clínica" }
];

export const upePendingQuizzes = [
  { id: "q1", name: "Neuroanatomia — Revisão Direcionada", status: "Pendente" },
  { id: "q2", name: "Osteologia — Base do Crânio", status: "Pendente" },
  { id: "q3", name: "Plexo Braquial — Aplicação Clínica", status: "Pendente" }
];

export const upeStudyPathways = [
  { id: "p1", name: "Trilha Neuroanatomia Essencial", progress: 25 },
  { id: "p2", name: "Trilha Osteologia Crítica", progress: 10 },
  { id: "p3", name: "Trilha Recuperação Pré-Prova", progress: 0 }
];

export const upeAcademicMessages = [
  { 
    id: "m1", 
    sender: "Dr. Roberto Mendes", 
    message: "Lucas, revise Base do Crânio antes do próximo simulado. A plataforma identificou queda de desempenho nessa estrutura.",
    date: "Hoje"
  }
];

export const upeIntelligentNextStep = {
  error: "Base do Crânio",
  steps: [
    "Revisar modelo 3D Base do Crânio",
    "Fazer simulado direcionado",
    "Revisar erros",
    "Retomar trilha Neuroanatomia Essencial"
  ]
};
