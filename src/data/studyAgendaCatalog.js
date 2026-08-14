import { LOCAL_MODELS } from "./localModels";

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

// Dynamically mapped from real 3D models in LOCAL_MODELS to guarantee 100% real data
export const agendaModelOptions = LOCAL_MODELS.map(model => ({
  label: model.title,
  route: `/viewer/${model.slug}`,
  system: model.anatomical_system || model.system || "Geral"
}));
