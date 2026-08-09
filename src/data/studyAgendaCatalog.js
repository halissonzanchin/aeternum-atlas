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
  { label: "Coração Humano — Modelo Superficial 3D", route: "/viewer/coracao-humano-superficial" },
  { label: "Abdome Cadavérico 3D", route: "/viewer/abdome-cadaverico-3d" },
  { label: "Crânio Humano 3D", route: "/viewer/cranio-humano-3d" },
  { label: "Mandíbula", route: "/viewer/mandibula" },
  { label: "Membro Superior 3D", route: "/atlas/membro-superior" }
];
