export const agendaEvents = [
  {
    id: "evt-aug-01",
    title: "Revisar Anatomia do Coração Superficial",
    description: "Rever faces do coração, vasos da base e acidentes anatômicos no modelo 3D.",
    date: "2026-08-10",
    startTime: "09:00",
    endTime: "10:30",
    type: "review",
    priority: "high",
    anatomicalSystem: "Cardiovascular",
    linkedModel: "Coração Humano — Modelo Superficial 3D",
    linkedModelRoute: "/viewer/coracao-humano-superficial",
    status: "pending",
    createdByRole: "student",
    creatorName: "Halisson Zanchin",
    repeat: "none",
    reminder: "30min"
  },
  {
    id: "evt-aug-02",
    title: "👨‍🏫 Aula Prática: Dissecação do Plexo Braquial",
    description: "Seminário e demonstração prática de raízes, troncos e fascículos com o Latarjet Tomo 1 Cap. 39.",
    date: "2026-08-11",
    startTime: "11:00",
    endTime: "12:30",
    type: "class",
    priority: "urgent",
    anatomicalSystem: "Membro Superior",
    linkedModel: "Membro Superior 3D",
    linkedModelRoute: "/atlas/membro-superior",
    status: "pending",
    createdByRole: "teacher",
    creatorName: "Prof. Dr. Halisson Zanchin",
    creatorAvatar: "👨‍🏫",
    isShared: true,
    repeat: "weekly",
    reminder: "1day"
  },
  {
    id: "evt-aug-03",
    title: "🩺 Caso Clínico Socrático: Síndrome do Túnel do Carpo",
    description: "Discussão de caso real de parestesia no nervo mediano com diagnóstico pelo Moore Cap. 6.",
    date: "2026-08-12",
    startTime: "14:00",
    endTime: "15:00",
    type: "study",
    priority: "medium",
    anatomicalSystem: "Membro Superior",
    linkedModel: "Membro Superior 3D",
    linkedModelRoute: "/atlas/membro-superior",
    status: "pending",
    createdByRole: "ai_tutor",
    creatorName: "Atlas AI Tutor",
    creatorAvatar: "🤖",
    repeat: "none",
    reminder: "15min"
  },
  {
    id: "evt-aug-04",
    title: "📝 Simulado Geral: Neuroanatomia & Tronco Encefálico",
    description: "Avaliação institucional obrigatória de neuroanatomia clínica (Snell Cap. 4 e Fretes).",
    date: "2026-08-13",
    startTime: "10:00",
    endTime: "12:00",
    type: "exam",
    priority: "urgent",
    anatomicalSystem: "Sistema nervoso",
    linkedModel: "Crânio Humano 3D",
    linkedModelRoute: "/viewer/cranio-humano-3d",
    status: "pending",
    createdByRole: "institution",
    creatorName: "Coordenação de Medicina Aeternum",
    creatorAvatar: "🏛️",
    isShared: true,
    repeat: "none",
    reminder: "1day"
  },
  {
    id: "evt-aug-05",
    title: "👨‍🏫 Seminário: Vascularização Abdominal & Aorta",
    description: "Apresentação dos ramos viscerais e parietais da aorta abdominal.",
    date: "2026-08-14",
    startTime: "15:00",
    endTime: "16:30",
    type: "class",
    priority: "high",
    anatomicalSystem: "Abdome",
    linkedModel: "Abdome Cadavérico 3D",
    linkedModelRoute: "/viewer/abdome-cadaverico-3d",
    status: "pending",
    createdByRole: "teacher",
    creatorName: "Profª. Dra. Mariana Lima",
    creatorAvatar: "👩‍🏫",
    isShared: true,
    repeat: "none",
    reminder: "1h"
  },
  {
    id: "evt-aug-06",
    title: "Revisão Autônoma: Osteologia do Crânio e Mandíbula",
    description: "Mapeamento dos forames da base do crânio com o Atlas Yokochi 5ª Ed.",
    date: "2026-08-15",
    startTime: "09:30",
    endTime: "11:00",
    type: "study",
    priority: "medium",
    anatomicalSystem: "Cabeça e Pescoço",
    linkedModel: "Crânio Humano 3D",
    linkedModelRoute: "/viewer/cranio-humano-3d",
    status: "pending",
    createdByRole: "student",
    creatorName: "Halisson Zanchin",
    repeat: "none",
    reminder: "30min"
  }
];

export const agendaEventTypes = ["study", "review", "exam", "task", "class", "note"];
export const agendaPriorities = ["low", "medium", "high"];
export const agendaStatuses = ["pending", "completed", "missed"];
export const agendaRepeats = ["none", "daily", "weekly", "biweekly", "monthly"];
export const agendaReminders = ["none", "10min", "30min", "1h", "1day"];

export const agendaAnatomicalSystems = [
  "Cardiovascular",
  "Membro Superior",
  "Membro Inferior",
  "Tórax",
  "Abdome",
  "Cabeça e Pescoço",
  "Sistema esquelético",
  "Sistema digestivo",
  "Sistema nervoso"
];

export const agendaModelOptions = [
  {
    label: "Coração Humano — Modelo Superficial 3D",
    route: "/viewer/coracao-humano-superficial"
  },
  {
    label: "Abdome Cadavérico 3D",
    route: "/viewer/abdome-cadaverico-3d"
  },
  {
    label: "Crânio Humano 3D",
    route: "/viewer/cranio-humano-3d"
  },
  {
    label: "Mandíbula",
    route: "/viewer/mandibula"
  },
  {
    label: "Membro Superior 3D",
    route: "/atlas/membro-superior"
  }
];
