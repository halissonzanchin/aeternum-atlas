export const agendaEvents = [
  {
    id: "evt-001",
    title: "Revisar coração superficial",
    description: "Rever faces do coração, vasos da base e annotations do modelo 3D.",
    date: "2026-05-05",
    startTime: "19:00",
    endTime: "19:40",
    type: "review",
    priority: "high",
    anatomicalSystem: "Cardiovascular",
    linkedModel: "Coração Humano — Modelo Superficial 3D",
    linkedModelRoute: "/viewer/coracao-humano-superficial",
    status: "pending",
    repeat: "none",
    reminder: "30min"
  },
  {
    id: "evt-002",
    title: "Estudar membro superior",
    description: "Focar em braço, antebraço e mão.",
    date: "2026-05-07",
    startTime: "18:30",
    endTime: "19:30",
    type: "study",
    priority: "medium",
    anatomicalSystem: "Membro Superior",
    linkedModel: null,
    linkedModelRoute: null,
    status: "pending",
    repeat: "none",
    reminder: "1h"
  },
  {
    id: "evt-003",
    title: "Quiz de crânio e mandíbula",
    description: "Revisar marcos ósseos e forames principais antes da aula prática.",
    date: "2026-05-09",
    startTime: "10:00",
    endTime: "10:35",
    type: "task",
    priority: "medium",
    anatomicalSystem: "Sistema esquelético",
    linkedModel: "Crânio Humano 3D",
    linkedModelRoute: "/viewer/cranio-humano-3d",
    status: "completed",
    repeat: "none",
    reminder: "10min"
  },
  {
    id: "evt-004",
    title: "Aula prática de anatomia topográfica",
    description: "Preparar dúvidas sobre relações torácicas e mediastino.",
    date: "2026-05-12",
    startTime: "14:00",
    endTime: "15:30",
    type: "class",
    priority: "high",
    anatomicalSystem: "Tórax",
    linkedModel: "Tórax Cadavérico 3D",
    linkedModelRoute: "/viewer/torax-cadaverico-3d",
    status: "pending",
    repeat: "weekly",
    reminder: "1day"
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
