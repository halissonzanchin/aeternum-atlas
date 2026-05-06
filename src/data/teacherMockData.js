export const teacherProfile = {
  id: "teacher-001",
  name: "Dr. Carlos Benítez",
  email: "carlos.benitez@upe.edu.py",
  role: "teacher",
  institution: "Universidad Privada del Este",
  campus: "Presidente Franco",
  department: "Anatomia Humana",
  specialties: ["Anatomia Cardiovascular", "Anatomia Topográfica"]
};

export const teacherDashboardStats = {
  classes: 4,
  students: 186,
  availableModels: 42,
  mostUsedModel: "Coração Humano — Modelo Superficial 3D",
  averageStudyTime: "38 min",
  activeStudentsThisWeek: 124,
  studyGuidesCreated: 7,
  pendingValidations: 3
};

export const teacherClasses = [
  {
    id: "class-001",
    name: "Medicina 1º Ano — Anatomia I",
    course: "Medicina",
    semester: "1º ano",
    students: 82,
    averageProgress: 64,
    totalStudyHours: 320,
    lastActivity: "Hoje às 18:40",
    recommendedModels: ["Coração Humano", "Crânio Humano"],
    performance: "Bom desempenho"
  },
  {
    id: "class-002",
    name: "Medicina 2º Ano — Anatomia Topográfica",
    course: "Medicina",
    semester: "2º ano",
    students: 58,
    averageProgress: 72,
    totalStudyHours: 286,
    lastActivity: "Hoje às 16:12",
    recommendedModels: ["Abdome Cadavérico", "Tórax Cadavérico"],
    performance: "Alto engajamento"
  },
  {
    id: "class-003",
    name: "Medicina 3º Ano — Correlações Clínicas",
    course: "Medicina",
    semester: "3º ano",
    students: 46,
    averageProgress: 58,
    totalStudyHours: 214,
    lastActivity: "Ontem às 21:05",
    recommendedModels: ["Mandíbula", "Crânio Humano"],
    performance: "Atenção em revisão"
  }
];

export const teacherStudents = [
  {
    id: "stu-001",
    name: "Ana Martínez",
    registration: "MED-2026-001",
    className: "Anatomia I",
    lastAccess: "Hoje às 18:42",
    totalStudyTime: "5h 20min",
    accessedModels: 8,
    progress: 82,
    status: "ativo"
  },
  {
    id: "stu-002",
    name: "Lucas Ferreira",
    registration: "MED-2026-002",
    className: "Anatomia I",
    lastAccess: "Hoje às 09:15",
    totalStudyTime: "3h 30min",
    accessedModels: 5,
    progress: 74,
    status: "ativo"
  },
  {
    id: "stu-003",
    name: "María González",
    registration: "MED-2026-003",
    className: "Anatomia Topográfica",
    lastAccess: "2026-04-29 11:20",
    totalStudyTime: "1h 24min",
    accessedModels: 2,
    progress: 41,
    status: "inativo"
  },
  {
    id: "stu-004",
    name: "Carlos Duarte",
    registration: "MED-2026-004",
    className: "Correlações Clínicas",
    lastAccess: "Hoje às 13:10",
    totalStudyTime: "6h 12min",
    accessedModels: 9,
    progress: 88,
    status: "ativo"
  },
  {
    id: "stu-005",
    name: "Sofía Rojas",
    registration: "MED-2026-005",
    className: "Anatomia Topográfica",
    lastAccess: "Ontem às 19:50",
    totalStudyTime: "2h 45min",
    accessedModels: 4,
    progress: 63,
    status: "pendente"
  }
];

export const teacherStudyGuides = [
  {
    id: "guide-001",
    title: "Revisão do Sistema Cardiovascular",
    description: "Estudo guiado do coração e grandes vasos.",
    className: "Medicina 1º Ano — Anatomia I",
    models: ["Coração Humano — Modelo Superficial 3D"],
    objectives: ["Identificar faces do coração", "Reconhecer vasos da base", "Relacionar anatomia superficial com função cardíaca"],
    dueDate: "2026-05-20",
    status: "ativo",
    completedStudents: 46
  },
  {
    id: "guide-002",
    title: "Topografia do Abdome",
    description: "Sequência para revisão de órgãos, peritônio e relações anatômicas.",
    className: "Medicina 2º Ano — Anatomia Topográfica",
    models: ["Abdome Cadavérico 3D"],
    objectives: ["Mapear vísceras abdominais", "Revisar relações peritoneais", "Correlacionar topografia e clínica"],
    dueDate: "2026-05-28",
    status: "rascunho",
    completedStudents: 18
  }
];

export const teacherLessonPlans = [
  {
    id: "lesson-001",
    title: "Aula prática — Anatomia superficial do coração",
    date: "2026-05-10",
    className: "Medicina 1º Ano — Anatomia I",
    models: ["Coração Humano — Modelo Superficial 3D"],
    keyStructures: ["Ápice cardíaco", "Base do coração", "Ventrículo esquerdo"],
    objectives: ["Localizar estruturas externas", "Compreender relações topográficas"],
    notes: "Iniciar pela vista anterior e orientar rotação gradual do modelo."
  },
  {
    id: "lesson-002",
    title: "Seminário guiado — Crânio e mandíbula",
    date: "2026-05-17",
    className: "Medicina 1º Ano — Anatomia I",
    models: ["Crânio Humano 3D", "Mandíbula"],
    keyStructures: ["Suturas cranianas", "Forame mentual", "Processo condilar"],
    objectives: ["Reconhecer marcos ósseos", "Relacionar anatomia com trauma facial"],
    notes: "Separar alunos em grupos para análise de acidentes anatômicos."
  }
];

export const teacherAnatomicalNotes = [
  {
    id: "note-001",
    model: "Coração Humano — Modelo Superficial 3D",
    structure: "Ápice cardíaco",
    type: "observação clínica",
    description: "Reforçar correlação com ausculta e orientação anatômica no tórax.",
    priority: "média",
    status: "em análise"
  },
  {
    id: "note-002",
    model: "Abdome Cadavérico 3D",
    structure: "Mesentério",
    type: "sugestão didática",
    description: "Adicionar annotation de relação peritoneal para alunos do segundo ano.",
    priority: "alta",
    status: "enviada ao admin"
  },
  {
    id: "note-003",
    model: "Crânio Humano 3D",
    structure: "Suturas cranianas",
    type: "melhoria de legenda",
    description: "Padronizar nomenclatura anatômica nas legendas do neurocrânio.",
    priority: "baixa",
    status: "privada"
  }
];

export const teacherReports = {
  classStudyTime: [
    { label: "Anatomia I", value: 320 },
    { label: "Topográfica", value: 286 },
    { label: "Clínicas", value: 214 }
  ],
  weeklyEvolution: [
    { label: "Sem 1", value: 52 },
    { label: "Sem 2", value: 66 },
    { label: "Sem 3", value: 74 },
    { label: "Sem 4", value: 81 }
  ],
  systemPerformance: [
    { label: "Cardio", value: 82 },
    { label: "Esquelético", value: 68 },
    { label: "Digestivo", value: 54 },
    { label: "Respiratório", value: 61 }
  ],
  modelRanking: [
    { model: "Coração Humano — Modelo Superficial 3D", accesses: 1322 },
    { model: "Crânio Humano 3D", accesses: 1840 },
    { model: "Mandíbula", accesses: 1628 },
    { model: "Abdome Cadavérico 3D", accesses: 987 }
  ]
};
